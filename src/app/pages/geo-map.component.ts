import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HydroService } from '../core/hydro.service';
import { ExternalMapLayer, HydroMapComponent } from '../shared/hydro-map.component';

@Component({
  selector: 'app-geo-map-page',
  standalone: true,
  imports: [FormsModule, HydroMapComponent],
  template: `
    <section class="page-head">
      <div>
        <div class="eyebrow">Análisis territorial</div>
        <h1>Modelo digital de elevación</h1>
        <p>Integración DEM simulada con relieve térmico y susceptibilidad derivada para la demostración.</p>
      </div>
      <div class="source-switch">
        <button [class.active]="source()==='demo'" (click)="setSource('demo')">Demostración</button>
        <button [class.active]="source()==='external'" (click)="setSource('external')">Fuente externa</button>
      </div>
    </section>

    <div class="notice">
      <b>Mapa estático para el concurso.</b> La topografía se carga desde un archivo PNG local y no requiere una API;
      las cotas y la susceptibilidad representadas no corresponden a datos oficiales de Arica.
    </div>

    @if (source() === 'demo') {
      <div class="mode-bar">
        <div><small>PRODUCTO VISUALIZADO</small><b>Imagen topográfica · {{hydro.demoArea()==='arica'?'Arica':'Quibdó'}}</b></div>
        <span class="badge green">Archivo local</span>
      </div>
    }

    @if (source() === 'external') {
      <section class="card connector">
        <div class="connector-copy">
          <span class="badge blue">Adaptador geoespacial</span>
          <h2>Conectar una capa validada</h2>
          <p>Compatible con servicios WMS, mosaicos XYZ y archivos GeoJSON públicos con CORS habilitado.</p>
        </div>
        <label class="field">FORMATO
          <select class="form-control" [(ngModel)]="layerType">
            <option value="wms">WMS</option><option value="xyz">XYZ / tiles</option><option value="geojson">GeoJSON</option>
          </select>
        </label>
        <label class="field url">URL DEL SERVICIO
          <input class="form-control" [(ngModel)]="layerUrl" placeholder="https://servidor.cl/geoserver/wms">
        </label>
        @if (layerType === 'wms') {
          <label class="field">NOMBRE DE CAPA
            <input class="form-control" [(ngModel)]="layerName" placeholder="workspace:inundabilidad">
          </label>
        }
        <button class="btn primary" [disabled]="!layerUrl.trim() || (layerType==='wms' && !layerName.trim())" (click)="applyExternalLayer()">
          Cargar capa
        </button>
        @if (layerStatus() === 'loading') { <span class="connection loading">Cargando servicio…</span> }
        @if (layerStatus() === 'ready') { <span class="connection ready">✓ Capa conectada</span> }
        @if (layerStatus() === 'error') { <span class="connection error">No fue posible cargarla. Revisa la URL, capa y permisos CORS.</span> }
      </section>
    }

    <section class="map-layout">
      <article class="card map-card">
        @if (source() === 'demo') {
          @if (mapMode() === 'elevation') {
            <app-hydro-map
              [sensors]="hydro.demoArea()==='arica'?hydro.sensors():[]" [segments]="hydro.demoArea()==='arica'?hydro.segments():[]" [zones]="hydro.demoArea()==='arica'?hydro.zones():[]"
              [reservoirs]="hydro.demoArea()==='arica'?hydro.reservoirs():[]" [interventions]="hydro.demoArea()==='arica'?hydro.interventions():[]" [showRiskSurface]="true"
              surfaceMode="elevation" [demoArea]="hydro.demoArea()" (sensorSelected)="hydro.selectSensor($event)" />
          } @else {
            <app-hydro-map
              [sensors]="hydro.demoArea()==='arica'?hydro.sensors():[]" [segments]="hydro.demoArea()==='arica'?hydro.segments():[]" [zones]="hydro.demoArea()==='arica'?hydro.zones():[]"
              [reservoirs]="hydro.demoArea()==='arica'?hydro.reservoirs():[]" [interventions]="hydro.demoArea()==='arica'?hydro.interventions():[]" [showRiskSurface]="true"
              surfaceMode="susceptibility" [demoArea]="hydro.demoArea()" (sensorSelected)="hydro.selectSensor($event)" />
          }
        } @else {
          <app-hydro-map
            [sensors]="hydro.sensors()" [segments]="hydro.segments()" [zones]="[]"
            [reservoirs]="hydro.reservoirs()" [interventions]="hydro.interventions()" [externalLayer]="externalLayer()"
            (externalLayerStatus)="layerStatus.set($event)" (sensorSelected)="hydro.selectSensor($event)" />
        }
        <div class="scale" aria-label="Leyenda del mapa">
          <div class="scale-title"><b>{{mapMode()==='elevation'?'Elevación estimada':'Susceptibilidad'}}</b><small>{{source()==='demo'?'Modelo simulado':'Fuente externa'}}</small></div>
          <div class="gradient"></div>
          <div class="labels"><span>{{mapMode()==='elevation'?'0 m · costa':'Baja'}}</span><span>{{mapMode()==='elevation'?'150 m':'Media'}}</span><span>{{mapMode()==='elevation'?'300+ m':'Alta'}}</span></div>
        </div>
        <div class="map-stamp"><span></span>{{source()==='demo'?(mapMode()==='elevation'?'ARCHIVO PNG · ALTITUD SIMULADA':'ARCHIVO PNG · RIESGO SIMULADO'):'CAPA EXTERNA'}}</div>
      </article>

      <aside class="side-panel">
        <article class="card explanation">
          <div class="card-head"><h2>{{mapMode()==='elevation'?'Interpretación de cotas':'Lectura del riesgo'}}</h2></div>
          <div class="card-body">
            @if (mapMode() === 'elevation') {
              <div class="risk high"><i></i><div><b>Cotas altas</b><p>Laderas y elevaciones simuladas sobre 250 m.</p></div></div>
              <div class="risk medium"><i></i><div><b>Cotas intermedias</b><p>Transición topográfica entre valle y ladera.</p></div></div>
              <div class="risk low"><i></i><div><b>Cotas bajas</b><p>Planicie costera y zonas de menor elevación.</p></div></div>
            } @else {
              <div class="risk high"><i></i><div><b>Alta susceptibilidad</b><p>Zonas bajas con mayor acumulación estimada.</p></div></div>
              <div class="risk medium"><i></i><div><b>Susceptibilidad media</b><p>Áreas de transición que requieren observación.</p></div></div>
              <div class="risk low"><i></i><div><b>Baja susceptibilidad</b><p>No equivale a una garantía de seguridad.</p></div></div>
            }
          </div>
        </article>
        <article class="card layers">
          <div class="card-head"><h2>Capas combinadas</h2></div>
          <div class="card-body">
            <div><span class="swatch surface"></span><p><b>{{mapMode()==='elevation'?'Topografía local':'Superficie de riesgo local'}}</b><small>Archivo raster incluido en el proyecto</small></p></div>
            <div><span class="swatch sensor"></span><p><b>Sensores IoT</b><small>Telemetría simulada en tiempo real</small></p></div>
            <div><span class="swatch drain"></span><p><b>Red de drenaje</b><small>Tramos y diagnósticos</small></p></div>
            <div><span class="swatch reservoir"></span><p><b>Reservorios</b><small>Capacidad y nivel de llenado</small></p></div>
          </div>
        </article>
        <article class="source-card">
          <small>FUENTE ACTIVA</small>
          <b>{{source()==='demo'?'Archivo topográfico local':activeSourceLabel()}}</b>
          <span>{{source()==='demo'?'PNG georreferenciado · sin conexión externa':'Sujeta a disponibilidad del proveedor'}}</span>
        </article>
      </aside>
    </section>

    <section class="separation">
      <article class="card active"><i>1</i><div><b>Modelo de elevación</b><span>Cotas y relieve térmico simulado</span></div></article>
      <article class="card"><i>2</i><div><b>Datos medidos</b><span>Nivel y conectividad de sensores</span></div></article>
      <article class="card disabled"><i>3</i><div><b>Resultado hidráulico</b><span>Disponible al conectar SWMM o HEC-RAS</span></div></article>
    </section>
  `,
  styles: [`
    .source-switch{display:flex;background:#091a24;border:1px solid var(--line);padding:4px;border-radius:9px}.source-switch button{border:0;background:transparent;color:#6f8893;padding:8px 13px;border-radius:6px;font-size:10px}.source-switch button.active{background:#153440;color:#71ddd7}.notice{margin-bottom:12px}.notice b{color:#f0cd77}.mode-bar{display:flex;align-items:center;gap:7px;padding:9px 12px;background:#0a202a;border:1px solid var(--line);border-radius:11px;margin-bottom:14px}.mode-bar>div{margin-right:auto}.mode-bar small,.mode-bar b{display:block}.mode-bar small{font-size:7px;letter-spacing:1px;color:#607d88}.mode-bar b{font-size:10px;margin-top:2px}.mode-bar button{border:1px solid #1d414b;background:#0a1b24;color:#75909b;border-radius:7px;padding:8px 11px;font-size:9px}.mode-bar button.active{border-color:#2c817c;background:#10343a;color:#63ded6}.connector{display:grid;grid-template-columns:1.1fr 130px 1.5fr 1fr auto;gap:12px;align-items:end;padding:15px;margin-bottom:14px}.connector-copy h2{font-size:13px;margin:8px 0 4px}.connector-copy p{font-size:9px;color:#6b8590;margin:0}.connector .btn:disabled{opacity:.4;cursor:not-allowed}.connection{grid-column:2/-1;font-size:9px}.connection.loading{color:#70b9e8}.connection.ready{color:#55d6aa}.connection.error{color:#ff7a72}.map-layout{display:grid;grid-template-columns:minmax(0,1fr) 285px;gap:14px}.map-card{height:650px;padding:10px;position:relative;overflow:hidden}.scale{position:absolute;z-index:500;left:26px;bottom:32px;width:240px;background:#071923e8;border:1px solid #294550;border-radius:10px;padding:11px;backdrop-filter:blur(8px);box-shadow:0 8px 25px #0008}.scale-title{display:flex;justify-content:space-between;margin-bottom:7px}.scale-title b{font-size:9px}.scale-title small{font-size:8px;color:#708a95}.gradient{height:8px;border-radius:5px;background:linear-gradient(90deg,#13b8a6 0%,#40d45a 25%,#d9e326 47%,#facc15 62%,#f97316 82%,#dc2626 100%)}.labels{display:flex;justify-content:space-between;color:#76909a;font-size:8px;margin-top:5px}.map-stamp{position:absolute;z-index:500;top:24px;left:26px;background:#071923dc;border:1px solid #294550;padding:7px 10px;border-radius:7px;font-size:8px;letter-spacing:1px;color:#a5bbc4}.map-stamp span{display:inline-block;width:6px;height:6px;border-radius:50%;background:#42d49c;box-shadow:0 0 0 3px #42d49c22;margin-right:6px}.side-panel{display:flex;flex-direction:column;gap:12px}.risk{display:flex;gap:11px;padding:10px 0;border-bottom:1px solid var(--line)}.risk i{width:8px;height:42px;border-radius:5px;flex:none}.risk.high i{background:#ef4444}.risk.medium i{background:#facc15}.risk.low i{background:#22c55e}.risk b{font-size:10px}.risk p{font-size:9px;color:#66808b;line-height:1.45;margin:4px 0}.layers .card-body>div{display:flex;gap:10px;align-items:center;padding:9px 0;border-bottom:1px solid var(--line)}.swatch{display:block;width:22px;height:22px;border-radius:6px}.swatch.surface{background:linear-gradient(135deg,#13b8a6,#facc15,#dc2626)}.swatch.sensor{background:#28d4b0;border:5px solid #123a3d}.swatch.drain{height:4px;background:#38bdf8;border-radius:2px}.swatch.reservoir{border-radius:50%;background:#8b7cf666;border:2px solid #8b7cf6}.layers p{margin:0}.layers b,.layers small{display:block}.layers b{font-size:10px}.layers small{font-size:8px;color:#66808b;margin-top:2px}.source-card{margin-top:auto;border:1px solid #20404b;background:#0a202b;border-radius:12px;padding:15px}.source-card small,.source-card b,.source-card span{display:block}.source-card small{font-size:8px;color:#63808b;letter-spacing:1px}.source-card b{font-size:10px;margin:5px 0}.source-card span{font-size:8px;color:#67818b}.separation{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:14px}.separation article{padding:14px;display:flex;gap:11px;align-items:center}.separation i{width:27px;height:27px;border-radius:8px;display:grid;place-content:center;background:#12323d;color:#55d8d1;font-style:normal;font-weight:700}.separation b,.separation span{display:block}.separation b{font-size:10px}.separation span{font-size:8px;color:#65808b;margin-top:3px}.separation .active{border-color:#2b6867}.separation .disabled{opacity:.55}@media(max-width:1100px){.connector{grid-template-columns:1fr 1fr}.connector-copy{grid-column:1/-1}.map-layout{grid-template-columns:1fr}.side-panel{display:grid;grid-template-columns:1fr 1fr}.source-card{margin:0}.map-card{height:580px}}@media(max-width:650px){.source-switch{width:100%}.mode-bar{align-items:stretch;flex-wrap:wrap}.mode-bar>div{width:100%}.connector{grid-template-columns:1fr}.connector-copy,.connection{grid-column:auto}.side-panel,.separation{grid-template-columns:1fr}.map-card{height:520px}.scale{width:210px;left:18px;bottom:24px}}
  `],
})
export class GeoMapPageComponent {
  readonly source = signal<'demo' | 'external'>('demo');
  readonly mapMode = signal<'elevation' | 'susceptibility'>('elevation');
  readonly externalLayer = signal<ExternalMapLayer | undefined>(undefined);
  readonly layerStatus = signal<'idle' | 'loading' | 'ready' | 'error'>('idle');
  layerType: ExternalMapLayer['type'] = 'wms';
  layerUrl = '';
  layerName = '';

  constructor(public hydro: HydroService) {}

  setSource(source: 'demo' | 'external') {
    this.source.set(source);
    this.layerStatus.set(this.externalLayer() ? 'ready' : 'idle');
  }

  applyExternalLayer() {
    this.externalLayer.set({
      type: this.layerType,
      url: this.layerUrl.trim(),
      layers: this.layerName.trim(),
      opacity: 0.72,
      attribution: 'Fuente geoespacial externa',
    });
  }

  activeSourceLabel() {
    if (!this.externalLayer()) return 'Sin capa conectada';
    try { return new URL(this.externalLayer()!.url).hostname; }
    catch { return 'Servicio externo'; }
  }
}
