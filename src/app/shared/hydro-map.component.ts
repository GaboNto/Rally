import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import * as L from 'leaflet';
import { DrainageSegment, GreenIntervention, Reservoir, RiskLevel, RiskZone, Sensor } from '../core/models';
import { DemoArea } from '../core/hydro.service';
import { BELEM_ELEVATION_GRID, BELEM_TERRAIN_METADATA } from '../core/belem-terrain';

export interface ExternalMapLayer {
  type: 'wms' | 'xyz' | 'geojson';
  url: string;
  layers?: string;
  attribution?: string;
  opacity?: number;
}

export type SurfaceMode = 'susceptibility' | 'elevation';

@Component({
  selector: 'app-hydro-map',
  standalone: true,
  template: '<div #map class="map" role="application" aria-label="Mapa interactivo de Pomerape"></div>',
  styles: [':host{display:block;height:100%;min-height:360px}.map{height:100%;min-height:360px;border-radius:18px;background:#081b29}:host ::ng-deep .decision-risk-label{background:transparent;border:0}:host ::ng-deep .risk-label{min-width:82px;transform:translate(-36px,-22px);padding:5px 7px;border-radius:7px;background:#061923e8;border:1px solid #ffffff33;color:#e9f6f8;text-align:center;box-shadow:0 5px 16px #0008;backdrop-filter:blur(5px)}:host ::ng-deep .risk-label b,:host ::ng-deep .risk-label small{display:block}:host ::ng-deep .risk-label b{font-size:10px}:host ::ng-deep .risk-label small{font-size:7px;color:#9eb2b9;margin-top:2px}:host ::ng-deep .flow-arrow{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:#0b2433dd;border:1px solid #67c8ff;color:#67c8ff;font-size:15px;font-weight:800;box-shadow:0 0 0 5px #38bdf822}:host ::ng-deep .park-map-label{min-width:92px;transform:translate(-38px,10px);padding:5px 7px;border-radius:7px;background:#09251fe8;border:1px solid #42e0a5;color:#dffbf1;font-size:7px;text-align:center;box-shadow:0 5px 16px #0007}:host ::ng-deep .elevation-legend{padding:9px 11px;border:1px solid #36515a;border-radius:9px;background:#061923e8;color:#d9e8eb;box-shadow:0 7px 20px #0007;backdrop-filter:blur(6px)}:host ::ng-deep .elevation-legend b,:host ::ng-deep .elevation-legend small{display:block}:host ::ng-deep .elevation-legend b{font-size:9px;margin-bottom:6px}:host ::ng-deep .elevation-legend small{font-size:6px;color:#90a8af;margin-top:5px}:host ::ng-deep .elevation-scale{display:flex;align-items:center;gap:5px;font-size:7px}:host ::ng-deep .elevation-scale i{width:16px;height:8px;border-radius:2px;display:inline-block}'],
})
export class HydroMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('map', { static: true }) mapElement!: ElementRef<HTMLElement>;
  @Input() sensors: Sensor[] = [];
  @Input() segments: DrainageSegment[] = [];
  @Input() zones: RiskZone[] = [];
  @Input() reservoirs: Reservoir[] = [];
  @Input() interventions: GreenIntervention[] = [];
  @Input() selectedSegmentId = '';
  @Input() selectedZoneId = '';
  @Input() selectedInterventionIds: string[] = [];
  @Input() showInterventions = true;
  @Input() showRiskSurface = false;
  @Input() riskOpacity = 0.18;
  @Input() decisionMode = false;
  @Input() rainfall = 0;
  @Input() comparisonMode: 'before' | 'after' = 'before';
  @Input() surfaceMode: SurfaceMode = 'susceptibility';
  @Input() demoArea: DemoArea = 'arica';
  @Input() externalLayer?: ExternalMapLayer;
  @Output() sensorSelected = new EventEmitter<string>();
  @Output() segmentSelected = new EventEmitter<string>();
  @Output() zoneSelected = new EventEmitter<string>();
  @Output() interventionSelected = new EventEmitter<string>();
  @Output() externalLayerStatus = new EventEmitter<'loading' | 'ready' | 'error'>();

  private map?: L.Map;
  private layerControl?: L.Control.Layers;
  private externalOverlay?: L.Layer;

  ngAfterViewInit() {
    const localMapBounds = this.topographicBounds();
    this.map = L.map(this.mapElement.nativeElement, {
      zoomControl: false,
      minZoom: this.showRiskSurface ? 9 : 11,
      zoomSnap: this.decisionMode ? 0.25 : 1,
      zoomDelta: this.decisionMode ? 0.5 : 1,
      maxBounds: this.showRiskSurface ? localMapBounds : undefined,
      maxBoundsViscosity: this.showRiskSurface ? 1 : 0,
    });
    if (this.showRiskSurface) {
      this.map.fitBounds(localMapBounds, { padding: [0, 0] });
      if (this.decisionMode && this.demoArea !== 'belem') this.map.setZoom(this.map.getZoom() + 0.75);
    }
    else if (this.sensors.length || this.zones.length) {
      const points: [number, number][] = [
        ...this.sensors.map(sensor => [sensor.lat, sensor.lng] as [number, number]),
        ...this.zones.flatMap(zone => zone.polygon),
      ];
      this.map.fitBounds(L.latLngBounds(points), { padding: [35, 35], maxZoom: 14 });
    } else this.map.setView(this.areaCenter(), 13);
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
    if (!this.showRiskSurface) {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors · Datos Pomerape',
      }).addTo(this.map);
    }

    const riskLayer = L.layerGroup();
    const drainageLayer = L.layerGroup();
    const sensorLayer = L.layerGroup();
    const reservoirLayer = L.layerGroup();
    const greenLayer = L.layerGroup();
    const decisionLayer = L.layerGroup();
    const overlays: Record<string, L.Layer> = {};
    const riskColors: Record<RiskLevel, string> = { bajo: '#34d399', medio: '#facc15', alto: '#ef4444' };

    if (this.showRiskSurface) {
      const surfaceGroup = this.createTerrainSurface();
      surfaceGroup.addTo(this.map);
      overlays[`Mapa territorial · ${this.areaName()}`] = surfaceGroup;
      if (this.demoArea === 'belem') this.addBelemElevationLegend();
    }

    this.zones.forEach(zone => {
      const zoneShape = L.polygon(zone.polygon, {
        color: riskColors[zone.risk],
        fillColor: riskColors[zone.risk],
        fillOpacity: this.selectedZoneId === zone.id ? Math.min(this.riskOpacity + 0.14, 0.55) : this.riskOpacity,
        weight: this.selectedZoneId === zone.id ? 4 : 2,
      })
        .bindTooltip(this.demoArea === 'belem'
          ? `<strong>${zone.name}</strong><br>Prioridad preliminar ${zone.risk}<br><small>Eje vial real · delimitación hidráulica por validar</small>`
          : `<strong>${zone.name}</strong><br>Susceptibilidad ${zone.risk}<br><small>Monitoreo territorial</small>`)
        .on('click', () => this.zoneSelected.emit(zone.id))
        .addTo(riskLayer);
      if (this.decisionMode) {
        const center = this.projectionPoint(zone, zoneShape.getBounds().getCenter());
        const parkReduction = this.comparisonMode === 'after'
          ? this.interventions.filter(item => item.zone === zone.name && this.selectedInterventionIds.includes(item.id)).reduce((sum, item) => sum + item.runoffReduction, 0)
          : 0;
        const volume = this.demoArea === 'belem'
          ? +(this.rainfall / 1000 * (300 * .9 + 60) * (1 - parkReduction / 100)).toFixed(1)
          : Math.max(0, Math.round(this.rainfall * (8 + zone.runoff / 6) * (1 - parkReduction / 100)));
        const depth = this.projectedDepth(zone, parkReduction);
        const elevation = this.nearestBelemElevation(center);
        const poolRadius = this.demoArea === 'belem' ? 78 : Math.min(240, Math.max(85, 80 + depth * 5));
        L.circle(center, { radius: poolRadius, color: '#7dd3fc', weight: 3, dashArray: '6 6', fillColor: '#168ad0', fillOpacity: zone.risk === 'alto' ? 0.44 : zone.risk === 'medio' ? 0.34 : 0.24 })
          .bindTooltip(this.demoArea === 'belem'
            ? `<strong>Cota DEM aproximada</strong><br>${elevation} m · ${volume} m³ de aporte de diseño<br><small>DEM 90 m; requiere topografía de detalle</small>`
            : `<strong>Profundidad proyectada</strong><br>${depth} cm · ${volume} m³ estimados<br>Escenario ${this.comparisonMode === 'after' ? 'intervenido' : 'actual'}`)
          .on('click', () => this.zoneSelected.emit(zone.id))
          .addTo(decisionLayer);
        L.circle(center, { radius: poolRadius * 0.56, color: '#bae6fd', weight: 1, fillColor: '#38bdf8', fillOpacity: 0.36, interactive: false }).addTo(decisionLayer);
        const labelPoint = this.demoArea === 'belem' ? this.belemLabelPoint(zone.id, center) : center;
        if (this.demoArea === 'belem') {
          L.polyline([center, labelPoint], { color: riskColors[zone.risk], weight: 1.5, opacity: .9, dashArray: '4 5', interactive: false }).addTo(decisionLayer);
          L.circleMarker(center, { radius: 5, color: '#e8f6f7', weight: 2, fillColor: riskColors[zone.risk], fillOpacity: 1, interactive: false }).addTo(decisionLayer);
        }
        const label = L.divIcon({ className: 'decision-risk-label', html: this.demoArea === 'belem'
          ? `<div class="risk-label ${zone.risk}"><span>PRIORIDAD ${zone.risk.toUpperCase()}</span><b>${zone.name}</b><strong>Cota ${elevation} m</strong><small>DEM 90 m · eje OSM confirmado</small></div>`
          : `<div class="risk-label ${zone.risk}"><span>${zone.risk === 'alto' ? 'RIESGO ALTO' : zone.risk === 'medio' ? 'RIESGO MEDIO' : 'RIESGO BAJO'}</span><b>${zone.name}</b><strong>${depth} cm</strong><small>profundidad máxima proyectada</small></div>`, iconSize: [1, 1] });
        L.marker(labelPoint, { icon: label, interactive: false }).addTo(decisionLayer);
      }
    });

    if (this.decisionMode) {
      const flowPaths: [number, number][][] = this.demoArea === 'arica' ? [
          [[-18.451,-70.255],[-18.456,-70.278],[-18.463,-70.296],[-18.475,-70.311]],
          [[-18.467,-70.265],[-18.474,-70.287],[-18.482,-70.305],[-18.487,-70.316]],
          [[-18.492,-70.274],[-18.491,-70.294],[-18.493,-70.315]],
        ] : this.demoArea === 'talcahuano' ? [
          [[-36.704,-73.084],[-36.713,-73.099],[-36.724,-73.115],[-36.727,-73.122]],
          [[-36.721,-73.087],[-36.731,-73.101],[-36.740,-73.114],[-36.743,-73.123]],
          [[-36.746,-73.083],[-36.754,-73.096],[-36.762,-73.107]],
        ] : this.demoArea === 'belem' ? [
          // No se dibujan rutas de flujo en Belém sin una modelación hidráulica 2D validada.
        ] : [
          [[5.704,-76.635],[5.700,-76.650],[5.691,-76.659],[5.681,-76.668]],
          [[5.686,-76.641],[5.682,-76.653],[5.674,-76.669]],
        ];
      flowPaths.forEach(path => {
        L.polyline(path, { color: '#6bc7f5', weight: 3, opacity: 0.9, dashArray: '8 9' }).addTo(decisionLayer);
        const arrow = L.divIcon({ className: 'decision-risk-label', html: '<div class="flow-arrow">←</div>', iconSize: [24, 24], iconAnchor: [12, 12] });
        L.marker(path[Math.max(1, path.length - 2)], { icon: arrow, interactive: false }).addTo(decisionLayer);
      });
      const highPoint: [number, number] = this.demoArea === 'arica' ? [-18.447, -70.255] : this.demoArea === 'talcahuano' ? [-36.704, -73.084] : this.demoArea === 'belem' ? [-1.394, -48.36] : [5.704, -76.638];
      const lowPoint: [number, number] = this.demoArea === 'arica' ? [-18.480, -70.318] : this.demoArea === 'talcahuano' ? [-36.743, -73.124] : this.demoArea === 'belem' ? [-1.35346, -48.47577] : [5.674, -76.681];
      const rainIcon = L.divIcon({ className: 'decision-risk-label', html: this.demoArea === 'belem'
        ? '<div class="rain-source"><span>▲</span><div><small>COTA DEM</small><b>39 m</b><em>Punto alto de la malla analizada</em></div></div>'
        : `<div class="rain-source"><span>☔</span><div><small>PRONÓSTICO</small><b>${this.rainfall} mm de lluvia</b><em>El agua baja por la pendiente</em></div></div>`, iconSize: [1, 1] });
      const lowIcon = L.divIcon({ className: 'decision-risk-label', html: this.demoArea === 'belem'
        ? '<div class="terrain-callout"><small>COTA DEM BAJA</small><b>4 m · susceptibilidad preliminar</b></div>'
        : '<div class="terrain-callout"><small>ZONA BAJA</small><b>El agua converge y se acumula</b></div>', iconSize: [1, 1] });
      if (this.demoArea !== 'belem') {
        L.marker(highPoint, { icon: rainIcon, interactive: false }).addTo(decisionLayer);
        L.marker(lowPoint, { icon: lowIcon, interactive: false }).addTo(decisionLayer);
      }
    }

    this.segments.forEach(segment => {
      const color = segment.condition === 'posible_obstruccion' ? '#ff6b62'
        : segment.condition === 'sobrecarga' ? '#f7bd4f'
        : segment.condition === 'no_concluyente' ? '#8899a6' : '#37b9ff';
      L.polyline(segment.coordinates, {
        color,
        weight: this.selectedSegmentId === segment.id ? 7 : 4,
        opacity: 0.9,
        dashArray: segment.condition === 'no_concluyente' ? '7 7' : undefined,
      })
        .bindTooltip(`<strong>${segment.name}</strong><br>${segment.condition.replaceAll('_', ' ')} · ${segment.confidence}% evidencia`)
        .on('click', () => this.segmentSelected.emit(segment.id))
        .addTo(drainageLayer);
    });

    this.sensors.forEach(sensor => {
      const color = sensor.status === 'desconectado' ? '#81909b'
        : sensor.level / sensor.capacity > 0.8 ? '#ff6b62'
        : sensor.level / sensor.capacity > 0.6 ? '#f7bd4f' : '#27d3b2';
      const pointLabel = this.decisionMode ? `<span style="position:absolute;top:26px;left:50%;transform:translateX(-50%);padding:2px 5px;border-radius:4px;background:#061923e8;border:1px solid ${color};color:#e9f6f8;font-size:7px;white-space:nowrap">${sensor.id}</span>` : '';
      const grateIcon = L.divIcon({
        className: 'decision-risk-label',
        html: `<div style="position:relative;width:27px;height:27px;border-radius:7px;display:grid;place-items:center;background:#071923;border:3px solid ${color};color:${color};font-size:16px;font-weight:900;box-shadow:0 3px 12px #0009">▦${pointLabel}</div>`,
        iconSize: [27, 27], iconAnchor: [13, 13],
      });
      L.marker([sensor.lat, sensor.lng], { icon: grateIcon })
        .bindTooltip(`<strong>Rejilla monitoreada · ${sensor.id}</strong><br>${sensor.name}<br>${sensor.status} · lámina ${sensor.level} cm`)
        .on('click', () => this.sensorSelected.emit(sensor.id))
        .addTo(sensorLayer);
    });

    this.reservoirs.forEach(item => {
      L.circle([item.lat, item.lng], { radius: 130, color: '#8b7cf6', fillColor: '#8b7cf6', fillOpacity: 0.28 })
        .bindTooltip(`<strong>${item.name}</strong><br>Llenado ${item.fill}% · ${item.capacity.toLocaleString('es-CL')} m³`)
        .addTo(reservoirLayer);
    });

    this.interventions.forEach(item => {
      const selected = this.selectedInterventionIds.includes(item.id);
      if (this.decisionMode && selected) {
        L.circle([item.lat, item.lng], { radius: 360, color: '#4ade80', weight: 2, dashArray: '7 7', fillColor: '#22c55e', fillOpacity: 0.16 })
          .bindTooltip(`<strong>Área de captación propuesta</strong><br>${item.name} · reducción ${item.runoffReduction}%`)
          .addTo(greenLayer);
      }
      L.circleMarker([item.lat, item.lng], { radius: selected ? 12 : 9, color: selected ? '#ffffff' : '#06251e', weight: selected ? 4 : 3, fillColor: selected ? '#35d4cc' : '#41e5a2', fillOpacity: 1 })
        .bindTooltip(`<strong>${item.name}</strong><br>${selected ? 'Incluido en el plan' : 'Propuesta disponible'} · Puntaje ${item.score}/100`)
        .on('click', () => this.interventionSelected.emit(item.id))
        .addTo(greenLayer);
      if (this.decisionMode && selected) {
        const parkLabel = L.divIcon({ className: 'decision-risk-label', html: `<div class="park-map-label">PARQUE ACTIVO<br><b>−${item.runoffReduction}%</b></div>`, iconSize: [1, 1] });
        L.marker([item.lat, item.lng], { icon: parkLabel, interactive: false }).addTo(greenLayer);
      }
    });

    riskLayer.addTo(this.map);
    if (this.decisionMode) decisionLayer.addTo(this.map);
    drainageLayer.addTo(this.map);
    sensorLayer.addTo(this.map);
    reservoirLayer.addTo(this.map);
    if (this.showInterventions) greenLayer.addTo(this.map);
    if (this.zones.length) overlays['Zonas vectoriales'] = riskLayer;
    if (this.segments.length) overlays['Red de drenaje'] = drainageLayer;
    if (this.sensors.length) overlays['Sensores IoT'] = sensorLayer;
    if (this.reservoirs.length) overlays['Reservorios'] = reservoirLayer;
    if (this.interventions.length) overlays['Propuestas verdes'] = greenLayer;
    if (this.decisionMode) overlays['Proyección de profundidad'] = decisionLayer;
    if (!this.decisionMode) this.layerControl = L.control.layers({}, overlays, { collapsed: false, position: 'topright' }).addTo(this.map);
    if (this.externalLayer) void this.loadExternalLayer(this.externalLayer);
    setTimeout(() => this.map?.invalidateSize(), 100);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['demoArea'] && !changes['demoArea'].firstChange && this.map) {
      this.map.remove();
      this.map = undefined;
      queueMicrotask(() => this.ngAfterViewInit());
      return;
    }
    if (changes['externalLayer'] && !changes['externalLayer'].firstChange && this.map && this.externalLayer) {
      void this.loadExternalLayer(this.externalLayer);
      return;
    }
    const redrawInputs = ['sensors', 'segments', 'zones', 'reservoirs', 'interventions', 'selectedSegmentId', 'selectedZoneId', 'selectedInterventionIds', 'showInterventions', 'surfaceMode', 'riskOpacity', 'decisionMode', 'rainfall', 'comparisonMode'];
    if (this.map && redrawInputs.some(key => changes[key] && !changes[key].firstChange)) {
      this.map.remove();
      this.map = undefined;
      queueMicrotask(() => this.ngAfterViewInit());
    }
  }

  private createTerrainSurface(): L.LayerGroup {
    const bounds = this.topographicBounds();
    if (this.demoArea === 'talcahuano' || this.demoArea === 'belem') {
      const layers: L.Layer[] = [L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: this.demoArea === 'belem'
          ? '&copy; OpenStreetMap contributors · Elevación Open-Meteo DEM 90 m'
          : '&copy; OpenStreetMap contributors · Datos Pomerape',
      })];
      if (this.demoArea === 'belem') {
        const halfLat = BELEM_TERRAIN_METADATA.latitudeStep / 2;
        const halfLng = BELEM_TERRAIN_METADATA.longitudeStep / 2;
        BELEM_ELEVATION_GRID.forEach(point => {
          const color = this.elevationColor(point.elevation);
          layers.push(L.rectangle([
            [point.lat - halfLat, point.lng - halfLng],
            [point.lat + halfLat, point.lng + halfLng],
          ], {
            color,
            weight: .35,
            opacity: .72,
            fillColor: color,
            fillOpacity: this.surfaceMode === 'elevation' ? .54 : .36,
            interactive: true,
          }).bindTooltip(`<strong>Cota ${point.elevation} m</strong><br>DEM ${BELEM_TERRAIN_METADATA.resolution} · ${BELEM_TERRAIN_METADATA.crs}<br><small>Análisis preliminar; no es cota de proyecto</small>`));
        });
      }
      return L.layerGroup(layers);
    }
    const file = this.demoArea === 'arica'
      ? 'assets/mapa-topografico-arica.png'
      : 'assets/mapa-topografico-quibdo.png';
    return L.layerGroup([L.imageOverlay(file, bounds, { opacity: this.decisionMode ? 0.78 : 1, interactive: false, className: this.decisionMode ? 'decision-terrain' : '' })]);
  }

  private topographicBounds(): L.LatLngBounds {
    if (this.demoArea === 'arica') return L.latLngBounds([[-18.565, -70.420], [-18.405, -70.210]]);
    if (this.demoArea === 'talcahuano') return L.latLngBounds([[-36.79, -73.18], [-36.68, -73.05]]);
    if (this.demoArea === 'belem') return L.latLngBounds([
      [BELEM_TERRAIN_METADATA.south - BELEM_TERRAIN_METADATA.latitudeStep / 2, BELEM_TERRAIN_METADATA.west - BELEM_TERRAIN_METADATA.longitudeStep / 2],
      [BELEM_TERRAIN_METADATA.north + BELEM_TERRAIN_METADATA.latitudeStep / 2, BELEM_TERRAIN_METADATA.east + BELEM_TERRAIN_METADATA.longitudeStep / 2],
    ]);
    return L.latLngBounds([[5.645, -76.715], [5.725, -76.615]]);
  }

  private areaCenter(): [number, number] {
    if (this.demoArea === 'talcahuano') return [-36.7249, -73.1168];
    if (this.demoArea === 'belem') return [-1.3685, -48.4635];
    if (this.demoArea === 'quibdo') return [5.6906, -76.6583];
    return [-18.476, -70.305];
  }

  private areaName() {
    return this.demoArea === 'talcahuano' ? 'Talcahuano' : this.demoArea === 'belem' ? 'Belém' : this.demoArea === 'quibdo' ? 'Quibdó' : 'Arica';
  }

  private projectionPoint(zone: RiskZone, fallback: L.LatLng): L.LatLng {
    if (this.demoArea !== 'belem') return fallback;
    const points: Record<string, [number, number]> = {
      'Z-01': [-1.36793, -48.46076],
      'Z-02': [-1.37717, -48.46361],
      'Z-03': [-1.36172, -48.46457],
    };
    return L.latLng(points[zone.id] ?? [fallback.lat, fallback.lng]);
  }

  private belemLabelPoint(zoneId: string, fallback: L.LatLng): L.LatLng {
    const points: Record<string, [number, number]> = {
      'Z-01': [-1.3650, -48.4450],
      'Z-02': [-1.3920, -48.4920],
      'Z-03': [-1.3445, -48.4980],
    };
    return L.latLng(points[zoneId] ?? [fallback.lat, fallback.lng]);
  }

  private projectedDepth(zone: RiskZone, parkReduction: number) {
    const sector = zone.name.replace('Sector ', '').replace('Corredor ', '').replace('Passagem ', '').replace(' Sur', '');
    const sensors = this.sensors.filter(sensor => sensor.sector === sector && sensor.status === 'activo');
    const sensorPressure = sensors.length
      ? Math.max(...sensors.map(sensor => sensor.level / sensor.capacity + Math.max(0, sensor.variation) / 20))
      : .45;
    const segment = this.segments.find(item => item.sector === sector);
    const drainagePressure = segment?.condition === 'sobrecarga' ? .24 : segment?.condition === 'posible_obstruccion' ? .2 : segment?.condition === 'no_concluyente' ? .1 : 0;
    const depth = this.rainfall * (zone.runoff / 100) * .52 * (1 + Math.max(0, sensorPressure - .55) + drainagePressure);
    return Math.max(0, Math.round(depth * (1 - parkReduction / 100)));
  }

  private elevationColor(elevation: number) {
    if (elevation <= 4) return '#2b9fe8';
    if (elevation <= 9) return '#37c8c4';
    if (elevation <= 18) return '#72cf72';
    if (elevation <= 28) return '#e0b84f';
    return '#e47b4f';
  }

  private nearestBelemElevation(point: L.LatLng) {
    if (this.demoArea !== 'belem') return 0;
    return BELEM_ELEVATION_GRID.reduce((nearest, candidate) => {
      const candidateDistance = (candidate.lat - point.lat) ** 2 + (candidate.lng - point.lng) ** 2;
      const nearestDistance = (nearest.lat - point.lat) ** 2 + (nearest.lng - point.lng) ** 2;
      return candidateDistance < nearestDistance ? candidate : nearest;
    }).elevation;
  }

  private addBelemElevationLegend() {
    if (!this.map) return;
    const legend = new L.Control({ position: 'bottomleft' });
    legend.onAdd = () => {
      const element = L.DomUtil.create('div', 'elevation-legend');
      element.innerHTML = `<b>Elevación del terreno</b><div class="elevation-scale"><i style="background:#2b9fe8"></i>0–4 m <i style="background:#37c8c4"></i>5–9 m <i style="background:#72cf72"></i>10–18 m <i style="background:#e0b84f"></i>19–28 m <i style="background:#e47b4f"></i>29–39 m</div><small>${BELEM_TERRAIN_METADATA.source} · ${BELEM_TERRAIN_METADATA.resolution} · WGS84</small>`;
      L.DomEvent.disableClickPropagation(element);
      return element;
    };
    legend.addTo(this.map);
  }

  private async loadExternalLayer(config: ExternalMapLayer) {
    if (!this.map || !config.url) return;
    this.externalLayerStatus.emit('loading');
    if (this.externalOverlay) {
      this.map.removeLayer(this.externalOverlay);
      this.layerControl?.removeLayer(this.externalOverlay);
    }
    try {
      if (config.type === 'wms') {
        this.externalOverlay = L.tileLayer.wms(config.url, {
          layers: config.layers || '', format: 'image/png', transparent: true,
          opacity: config.opacity ?? 0.7, attribution: config.attribution || 'Fuente geoespacial externa',
        });
      } else if (config.type === 'xyz') {
        this.externalOverlay = L.tileLayer(config.url, {
          opacity: config.opacity ?? 0.7, attribution: config.attribution || 'Fuente geoespacial externa',
        });
      } else {
        const response = await fetch(config.url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const geojson = await response.json();
        this.externalOverlay = L.geoJSON(geojson, {
          style: feature => {
            const risk = String(feature?.properties?.['risk'] ?? feature?.properties?.['riesgo'] ?? '').toLowerCase();
            const fillColor = risk.includes('alt') ? '#ef4444' : risk.includes('med') ? '#facc15' : '#22c55e';
            return { color: fillColor, fillColor, fillOpacity: 0.55, weight: 1.2 };
          },
          onEachFeature: (feature, layer) => layer.bindTooltip(String(feature.properties?.['name'] ?? feature.properties?.['nombre'] ?? 'Zona externa')),
        });
      }
      this.externalOverlay.addTo(this.map);
      this.layerControl?.addOverlay(this.externalOverlay, 'Fuente externa');
      this.externalLayerStatus.emit('ready');
    } catch {
      this.externalLayerStatus.emit('error');
    }
  }

  ngOnDestroy() { this.map?.remove(); }
}
