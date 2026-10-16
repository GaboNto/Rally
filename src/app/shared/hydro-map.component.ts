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
  template: '<div #map class="map" role="application" aria-label="Mapa interactivo de HydroGuard"></div>',
  styles: [':host{display:block;height:100%;min-height:360px}.map{height:100%;min-height:360px;border-radius:18px;background:#081b29}'],
})
export class HydroMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('map', { static: true }) mapElement!: ElementRef<HTMLElement>;
  @Input() sensors: Sensor[] = [];
  @Input() segments: DrainageSegment[] = [];
  @Input() zones: RiskZone[] = [];
  @Input() reservoirs: Reservoir[] = [];
  @Input() interventions: GreenIntervention[] = [];
  @Input() selectedSegmentId = '';
  @Input() showInterventions = true;
  @Input() showRiskSurface = false;
  @Input() surfaceMode: SurfaceMode = 'susceptibility';
  @Input() demoArea: DemoArea = 'arica';
  @Input() externalLayer?: ExternalMapLayer;
  @Output() sensorSelected = new EventEmitter<string>();
  @Output() segmentSelected = new EventEmitter<string>();
  @Output() externalLayerStatus = new EventEmitter<'loading' | 'ready' | 'error'>();

  private map?: L.Map;
  private layerControl?: L.Control.Layers;
  private externalOverlay?: L.Layer;

  ngAfterViewInit() {
    const localMapBounds = this.topographicBounds();
    this.map = L.map(this.mapElement.nativeElement, {
      zoomControl: false,
      minZoom: this.showRiskSurface ? 9 : 11,
      maxBounds: this.showRiskSurface ? localMapBounds : undefined,
      maxBoundsViscosity: this.showRiskSurface ? 1 : 0,
    });
    if (this.showRiskSurface) this.map.fitBounds(localMapBounds, { padding: [0, 0] });
    else this.map.setView([-18.476, -70.305], 13);
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
    if (!this.showRiskSurface) {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors · Datos HydroGuard: demostración',
      }).addTo(this.map);
    }

    const riskLayer = L.layerGroup();
    const drainageLayer = L.layerGroup();
    const sensorLayer = L.layerGroup();
    const reservoirLayer = L.layerGroup();
    const greenLayer = L.layerGroup();
    const overlays: Record<string, L.Layer> = {};
    const riskColors: Record<RiskLevel, string> = { bajo: '#34d399', medio: '#facc15', alto: '#ef4444' };

    if (this.showRiskSurface) {
      const surfaceGroup = this.createTerrainSurface();
      surfaceGroup.addTo(this.map);
      overlays[`Mapa topográfico · ${this.demoArea === 'arica' ? 'Arica' : 'Quibdó'}`] = surfaceGroup;
    }

    this.zones.forEach(zone => {
      L.polygon(zone.polygon, {
        color: riskColors[zone.risk],
        fillColor: riskColors[zone.risk],
        fillOpacity: this.showRiskSurface ? 0.06 : 0.18,
        weight: 1.5,
      })
        .bindTooltip(`<strong>${zone.name}</strong><br>Susceptibilidad ${zone.risk}<br><small>Datos ficticios</small>`)
        .addTo(riskLayer);
    });

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
      L.circleMarker([item.lat, item.lng], { radius: 9, color: '#06251e', weight: 3, fillColor: '#41e5a2', fillOpacity: 1 })
        .bindTooltip(`<strong>${item.name}</strong><br>Puntaje multicriterio ${item.score}/100`)
        .addTo(greenLayer);
    });

    riskLayer.addTo(this.map);
    drainageLayer.addTo(this.map);
    sensorLayer.addTo(this.map);
    reservoirLayer.addTo(this.map);
    if (this.showInterventions) greenLayer.addTo(this.map);
    if (this.zones.length) overlays['Zonas vectoriales'] = riskLayer;
    if (this.segments.length) overlays['Red de drenaje'] = drainageLayer;
    if (this.sensors.length) overlays['Sensores IoT'] = sensorLayer;
    if (this.reservoirs.length) overlays['Reservorios'] = reservoirLayer;
    if (this.interventions.length) overlays['Propuestas verdes'] = greenLayer;
    this.layerControl = L.control.layers({}, overlays, { collapsed: false, position: 'topright' }).addTo(this.map);
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
    }
  }

  private createTerrainSurface(): L.LayerGroup {
    const bounds = this.topographicBounds();
    const file = this.demoArea === 'arica'
      ? 'assets/mapa-topografico-arica.png'
      : 'assets/mapa-topografico-quibdo.png';
    return L.layerGroup([L.imageOverlay(file, bounds, { opacity: 1, interactive: false })]);
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
