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
  styles: [':host{display:block;height:100%;min-height:360px}.map{height:100%;min-height:360px;border-radius:18px;background:#081b29}:host ::ng-deep .decision-risk-label{background:transparent;border:0}:host ::ng-deep .risk-label{min-width:82px;transform:translate(-36px,-22px);padding:5px 7px;border-radius:7px;background:#061923e8;border:1px solid #ffffff33;color:#e9f6f8;text-align:center;box-shadow:0 5px 16px #0008;backdrop-filter:blur(5px)}:host ::ng-deep .risk-label b,:host ::ng-deep .risk-label small{display:block}:host ::ng-deep .risk-label b{font-size:10px}:host ::ng-deep .risk-label small{font-size:7px;color:#9eb2b9;margin-top:2px}:host ::ng-deep .flow-arrow{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:#0b2433dd;border:1px solid #67c8ff;color:#67c8ff;font-size:15px;font-weight:800;box-shadow:0 0 0 5px #38bdf822}:host ::ng-deep .park-map-label{min-width:92px;transform:translate(-38px,10px);padding:5px 7px;border-radius:7px;background:#09251fe8;border:1px solid #42e0a5;color:#dffbf1;font-size:7px;text-align:center;box-shadow:0 5px 16px #0007}'],
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
      if (this.decisionMode) this.map.setZoom(this.map.getZoom() + 0.75);
    }
    else this.map.setView([-18.476, -70.305], 13);
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
      overlays[`Mapa topográfico · ${this.demoArea === 'arica' ? 'Arica' : 'Quibdó'}`] = surfaceGroup;
    }

    this.zones.forEach(zone => {
      const zoneShape = L.polygon(zone.polygon, {
        color: riskColors[zone.risk],
        fillColor: riskColors[zone.risk],
        fillOpacity: this.selectedZoneId === zone.id ? Math.min(this.riskOpacity + 0.14, 0.55) : this.riskOpacity,
        weight: this.selectedZoneId === zone.id ? 4 : 2,
      })
        .bindTooltip(`<strong>${zone.name}</strong><br>Susceptibilidad ${zone.risk}<br><small>Monitoreo territorial</small>`)
        .on('click', () => this.zoneSelected.emit(zone.id))
        .addTo(riskLayer);
      if (this.decisionMode) {
        const center = zoneShape.getBounds().getCenter();
        const parkReduction = this.comparisonMode === 'after'
          ? this.interventions.filter(item => item.zone === zone.name && this.selectedInterventionIds.includes(item.id)).reduce((sum, item) => sum + item.runoffReduction, 0)
          : 0;
        const volume = Math.max(0, Math.round(this.rainfall * (8 + zone.runoff / 6) * (1 - parkReduction / 100)));
        const poolRadius = Math.min(720, Math.max(160, 150 + volume * 0.55));
        L.circle(center, { radius: poolRadius, color: '#7dd3fc', weight: 3, dashArray: '6 6', fillColor: '#168ad0', fillOpacity: zone.risk === 'alto' ? 0.44 : zone.risk === 'medio' ? 0.34 : 0.24 })
          .bindTooltip(`<strong>Acumulación estimada</strong><br>${volume} m³ · escenario ${this.comparisonMode === 'after' ? 'intervenido' : 'actual'}`)
          .on('click', () => this.zoneSelected.emit(zone.id))
          .addTo(decisionLayer);
        L.circle(center, { radius: poolRadius * 0.56, color: '#bae6fd', weight: 1, fillColor: '#38bdf8', fillOpacity: 0.36, interactive: false }).addTo(decisionLayer);
        const label = L.divIcon({ className: 'decision-risk-label', html: `<div class="risk-label ${zone.risk}"><span>${zone.risk === 'alto' ? 'RIESGO ALTO' : zone.risk === 'medio' ? 'RIESGO MEDIO' : 'RIESGO BAJO'}</span><b>${zone.name}</b><strong>${volume} m³</strong><small>agua acumulada prevista</small></div>`, iconSize: [1, 1] });
        L.marker(center, { icon: label, interactive: false }).addTo(decisionLayer);
      }
    });

    if (this.decisionMode) {
      const flowPaths: [number, number][][] = this.demoArea === 'arica'
        ? [
          [[-18.451,-70.255],[-18.456,-70.278],[-18.463,-70.296],[-18.475,-70.311]],
          [[-18.467,-70.265],[-18.474,-70.287],[-18.482,-70.305],[-18.487,-70.321]],
          [[-18.492,-70.274],[-18.491,-70.294],[-18.493,-70.315]],
        ]
        : [
          [[5.704,-76.635],[5.700,-76.650],[5.691,-76.659],[5.681,-76.668]],
          [[5.686,-76.641],[5.682,-76.653],[5.674,-76.669]],
        ];
      flowPaths.forEach(path => {
        L.polyline(path, { color: '#6bc7f5', weight: 3, opacity: 0.9, dashArray: '8 9' }).addTo(decisionLayer);
        const arrow = L.divIcon({ className: 'decision-risk-label', html: '<div class="flow-arrow">←</div>', iconSize: [24, 24], iconAnchor: [12, 12] });
        L.marker(path[Math.max(1, path.length - 2)], { icon: arrow, interactive: false }).addTo(decisionLayer);
      });
      const highPoint: [number, number] = this.demoArea === 'arica' ? [-18.447, -70.255] : [5.704, -76.638];
      const lowPoint: [number, number] = this.demoArea === 'arica' ? [-18.480, -70.328] : [5.674, -76.681];
      const rainIcon = L.divIcon({ className: 'decision-risk-label', html: `<div class="rain-source"><span>☔</span><div><small>PRONÓSTICO</small><b>${this.rainfall} mm de lluvia</b><em>El agua baja por la pendiente</em></div></div>`, iconSize: [1, 1] });
      const lowIcon = L.divIcon({ className: 'decision-risk-label', html: '<div class="terrain-callout"><small>ZONA BAJA</small><b>El agua converge y se acumula</b></div>', iconSize: [1, 1] });
      L.marker(highPoint, { icon: rainIcon, interactive: false }).addTo(decisionLayer);
      L.marker(lowPoint, { icon: lowIcon, interactive: false }).addTo(decisionLayer);
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
      L.circleMarker([sensor.lat, sensor.lng], {
        radius: 8, color: '#06151f', weight: 3, fillColor: color, fillOpacity: 1,
      })
        .bindTooltip(`<strong>${sensor.id}</strong> · ${sensor.name}<br>${sensor.status} · ${sensor.level} cm`)
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
    if (this.decisionMode) overlays['Acumulación y escurrimiento'] = decisionLayer;
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
    const file = this.demoArea === 'arica'
      ? 'assets/mapa-topografico-arica.png'
      : 'assets/mapa-topografico-quibdo.png';
    return L.layerGroup([L.imageOverlay(file, bounds, { opacity: this.decisionMode ? 0.78 : 1, interactive: false, className: this.decisionMode ? 'decision-terrain' : '' })]);
  }

  private topographicBounds(): L.LatLngBounds {
    return this.demoArea === 'arica'
      ? L.latLngBounds([[-18.565, -70.405], [-18.405, -70.195]])
      : L.latLngBounds([[5.645, -76.715], [5.725, -76.615]]);
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
