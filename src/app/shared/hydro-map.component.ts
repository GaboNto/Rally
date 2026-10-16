import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import { DrainageSegment, GreenIntervention, Reservoir, RiskZone, Sensor } from '../core/models';

@Component({
  selector: 'app-hydro-map', standalone: true,
  template: '<div #map class="map" role="application" aria-label="Mapa interactivo de demostración de HydroGuard"></div>',
  styles: [':host{display:block;height:100%;min-height:360px}.map{height:100%;min-height:360px;border-radius:18px;background:#081b29}']
})
export class HydroMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('map', { static: true }) mapElement!: ElementRef<HTMLElement>;
  @Input() sensors: Sensor[] = []; @Input() segments: DrainageSegment[] = []; @Input() zones: RiskZone[] = [];
  @Input() reservoirs: Reservoir[] = []; @Input() interventions: GreenIntervention[] = [];
  @Input() selectedSegmentId = ''; @Input() showInterventions = true;
  @Output() sensorSelected = new EventEmitter<string>(); @Output() segmentSelected = new EventEmitter<string>();
  private map?: L.Map;
  ngAfterViewInit() {
    this.map = L.map(this.mapElement.nativeElement, { zoomControl: false, minZoom: 11 }).setView([-18.476, -70.305], 13);
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors · Datos HydroGuard: demostración' }).addTo(this.map);
    const riskLayer=L.layerGroup(), drainageLayer=L.layerGroup(), sensorLayer=L.layerGroup(), reservoirLayer=L.layerGroup(), greenLayer=L.layerGroup();
    const riskColors={ bajo:'#27d3b2', medio:'#f7bd4f', alto:'#ff6b62' };
    this.zones.forEach(z=>L.polygon(z.polygon,{color:riskColors[z.risk],fillColor:riskColors[z.risk],fillOpacity:.18,weight:1.5}).bindTooltip(`<strong>${z.name}</strong><br>Susceptibilidad ${z.risk}<br><small>Datos ficticios</small>`).addTo(riskLayer));
    this.segments.forEach(s=>{const color=s.condition==='posible_obstruccion'?'#ff6b62':s.condition==='sobrecarga'?'#f7bd4f':s.condition==='no_concluyente'?'#8899a6':'#37b9ff';L.polyline(s.coordinates,{color,weight:this.selectedSegmentId===s.id?7:4,opacity:.9,dashArray:s.condition==='no_concluyente'?'7 7':undefined}).bindTooltip(`<strong>${s.name}</strong><br>${s.condition.replaceAll('_',' ')} · ${s.confidence}% evidencia`).on('click',()=>this.segmentSelected.emit(s.id)).addTo(drainageLayer)});
    this.sensors.forEach(s=>{const color=s.status==='desconectado'?'#81909b':s.level/s.capacity>.8?'#ff6b62':s.level/s.capacity>.6?'#f7bd4f':'#27d3b2';L.circleMarker([s.lat,s.lng],{radius:8,color:'#06151f',weight:3,fillColor:color,fillOpacity:1}).bindTooltip(`<strong>${s.id}</strong> · ${s.name}<br>${s.status} · ${s.level} cm`).on('click',()=>this.sensorSelected.emit(s.id)).addTo(sensorLayer)});
    this.reservoirs.forEach(r=>L.circle([r.lat,r.lng],{radius:130,color:'#8b7cf6',fillColor:'#8b7cf6',fillOpacity:.28}).bindTooltip(`<strong>${r.name}</strong><br>Llenado ${r.fill}% · ${r.capacity.toLocaleString('es-CL')} m³`).addTo(reservoirLayer));
    this.interventions.forEach(i=>L.circleMarker([i.lat,i.lng],{radius:9,color:'#06251e',weight:3,fillColor:'#41e5a2',fillOpacity:1}).bindTooltip(`<strong>${i.name}</strong><br>Puntaje multicriterio ${i.score}/100`).addTo(greenLayer));
    riskLayer.addTo(this.map);drainageLayer.addTo(this.map);sensorLayer.addTo(this.map);reservoirLayer.addTo(this.map);if(this.showInterventions)greenLayer.addTo(this.map);
    L.control.layers({}, {'Susceptibilidad':riskLayer,'Red de drenaje':drainageLayer,'Sensores IoT':sensorLayer,'Reservorios':reservoirLayer,'Propuestas verdes':greenLayer},{collapsed:false,position:'topright'}).addTo(this.map);
    setTimeout(()=>this.map?.invalidateSize(),100);
  }
  ngOnDestroy(){this.map?.remove()}
}
