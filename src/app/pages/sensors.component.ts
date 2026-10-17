import { Component, computed, signal } from '@angular/core';
import { HydroService } from '../core/hydro.service';

@Component({
  selector:'app-sensors', standalone:true,
  template:`
    <section class="page-head"><div><div class="eyebrow">Arquitectura del sistema</div><h1>Red de monitoreo</h1><p>Instrumentación definida para verificar funcionamiento, obstrucción, saturación y reflujo.</p></div><span class="badge green">LoRaWAN · AU915</span></section>
    @if(hydro.demoArea()==='belem'){
      <section class="architecture card">
        <div><span>1</span><p><small>CAMPO</small><b>6 sensores de corredor</b><em>3 ultrasónicos de entrada + 3 sumergibles de salida</em></p></div><i>→</i>
        <div><span>2</span><p><small>CONTEXTO</small><b>Lluvia y marea</b><em>Pluviómetro 0,2 mm/pulso + radar 0–8 m</em></p></div><i>→</i>
        <div><span>3</span><p><small>COMUNICACIÓN</small><b>Gateway LoRaWAN</b><em>Banda AU915 y enlace de salida 4G</em></p></div><i>→</i>
        <div><span>4</span><p><small>PLATAFORMA</small><b>Panel y alertas</b><em>Cada 5 min; cada 1 min cuando llueve</em></p></div>
      </section>
      <div class="validation-note"><b>Estado de ingeniería.</b> La arquitectura y los rangos están definidos; el replanteo final y la cobertura LoRa/4G se confirman durante la instalación.</div>
    }
    <div class="filters"><button [class.active]="filter()==='todos'" (click)="filter.set('todos')">Todos · {{hydro.sensors().length}}</button><button [class.active]="filter()==='activo'" (click)="filter.set('activo')">Integrados · {{statusCount('activo')}}</button><button [class.active]="filter()==='desconectado'" (click)="filter.set('desconectado')">Sin enlace · {{statusCount('desconectado')}}</button><button [class.active]="filter()==='mantenimiento'" (click)="filter.set('mantenimiento')">Revisión · {{statusCount('mantenimiento')}}</button></div>
    <section class="layout"><article class="card table-wrap"><table><thead><tr><th>Instrumento</th><th>Función</th><th>Ubicación de diseño</th><th>Integración</th><th>Especificación</th></tr></thead><tbody>@for(s of filtered();track s.id){<tr (click)="hydro.selectSensor(s.id)" [class.selected]="hydro.selectedSensorId()===s.id"><td><b>{{s.id}}</b><small>{{s.name}}</small></td><td><b>{{instrumentType(s.id)}}</b><small>{{s.position}}</small></td><td><b>{{s.sector}}</b><small>{{s.lat.toFixed(4)}}, {{s.lng.toFixed(4)}} · WGS84</small></td><td><span class="badge" [class.green]="s.status==='activo'" [class.red]="s.status==='desconectado'">{{statusLabel(s.status)}}</span></td><td><b>{{instrumentRange(s.id)}}</b><small>{{samplingInterval(s.id)}}</small></td></tr>}</tbody></table></article><aside class="card sensor-detail">@if(hydro.selectedSensor(); as sensor){<small>PUNTO SELECCIONADO</small><h2>{{sensor.id}}</h2><h3>{{instrumentType(sensor.id)}}</h3><dl><div><dt>Corredor</dt><dd>{{sensor.sector}}</dd></div><div><dt>Posición</dt><dd>{{sensor.position}}</dd></div><div><dt>Rango</dt><dd>{{instrumentRange(sensor.id)}}</dd></div><div><dt>Comunicación</dt><dd>LoRaWAN AU915</dd></div><div><dt>Coordenadas</dt><dd>{{sensor.lat.toFixed(5)}}, {{sensor.lng.toFixed(5)}}</dd></div></dl><p>La posición corresponde al trazado de ingeniería sobre el eje vial OSM. La cota y el punto constructivo se fijan mediante replanteo topográfico.</p>}</aside></section>
    @if(hydro.demoArea()==='belem'){
      <section class="diagnostic-grid">
        <article class="card"><small>ENTRADA ALTA · SALIDA BAJA</small><h3>Entrada o medio filtrante obstruido</h3><p>Limpiar reja, sedimentador y superficie.</p></article>
        <article class="card"><small>ENTRADA ALTA · SALIDA ALTA · MAREA ALTA</small><h3>Salida bloqueada por la marea</h3><p>La celda almacena; esperar bajamar y avisar a líderes.</p></article>
        <article class="card"><small>ENTRADA BAJA · SALIDA ALTA</small><h3>Reflujo desde el colector</h3><p>Revisar la válvula de clapeta Ø160 mm.</p></article>
        <article class="card"><small>LÁMINA &gt; 0 DESPUÉS DE 12 H</small><h3>Vaciado lento</h3><p>Inspeccionar el medio filtrante y prevenir criaderos.</p></article>
      </section>
    }
  `,
  styles:[`
    .architecture{display:grid;grid-template-columns:auto 1fr auto 1fr auto 1fr auto;align-items:center;padding:16px;margin-bottom:12px}.architecture>div{display:flex;align-items:center;gap:10px}.architecture>div>span{width:32px;height:32px;display:grid;place-items:center;border-radius:9px;background:#123b3d;color:#5de0d5;font-size:10px;font-weight:800}.architecture p,.architecture small,.architecture b,.architecture em{display:block;margin:0}.architecture small{font-size:6px;letter-spacing:1px;color:#59d8ce}.architecture b{font-size:10px;margin:3px 0}.architecture em{max-width:190px;font-size:7px;color:#6e8992;font-style:normal}.architecture>i{margin:0 13px;color:#39616b;font-style:normal}.validation-note{margin-bottom:13px;padding:10px 13px;border:1px solid #31505b;border-radius:8px;background:#0d2933;color:#91a8af;font-size:8px}.validation-note b{color:#62ddd3}.filters{display:flex;gap:7px;margin-bottom:13px;overflow:auto}.filters button{white-space:nowrap;background:#0b202b;color:#718a95;border:1px solid var(--line);border-radius:20px;padding:7px 12px;font-size:10px}.filters button.active{color:#5cddd5;border-color:#236059;background:#0c2d30}.layout{display:grid;grid-template-columns:minmax(0,1fr) 290px;gap:16px}td b,td small{display:block}td b{color:#d3e3e8;font-size:10px}td small{color:#627e8a;font-size:8px;margin-top:3px}tr{cursor:pointer}tr.selected td{background:#0e2b34;border-color:#1c4a53}.sensor-detail{padding:18px;height:max-content}.sensor-detail>small{font-size:7px;letter-spacing:1px;color:#59d8ce}.sensor-detail h2{font-size:22px;margin:6px 0 2px}.sensor-detail h3{font-size:11px;color:#9cb2b9;margin:0 0 16px}.sensor-detail dl{margin:0}.sensor-detail dl>div{display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-top:1px solid var(--line)}.sensor-detail dt,.sensor-detail dd{font-size:8px;margin:0}.sensor-detail dt{color:#66818b}.sensor-detail dd{text-align:right;color:#c6d8dc}.sensor-detail p{font-size:8px;line-height:1.55;color:#718b94;margin:14px 0 0}.diagnostic-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:14px}.diagnostic-grid article{padding:14px}.diagnostic-grid small{font-size:6px;color:#56d8ce;letter-spacing:.7px}.diagnostic-grid h3{font-size:10px;margin:7px 0 4px}.diagnostic-grid p{font-size:8px;line-height:1.4;color:#6e8992;margin:0}@media(max-width:1000px){.architecture{grid-template-columns:1fr 1fr;gap:13px}.architecture>i{display:none}.layout{grid-template-columns:1fr}.diagnostic-grid{grid-template-columns:1fr 1fr}}@media(max-width:650px){.architecture,.diagnostic-grid{grid-template-columns:1fr}}
  `]
})
export class SensorsComponent{
  readonly filter=signal('todos');
  readonly filtered=computed(()=>this.filter()==='todos'?this.hydro.sensors():this.hydro.sensors().filter(s=>s.status===this.filter()));
  constructor(public hydro:HydroService){}
  statusCount(status:string){return this.hydro.sensors().filter(sensor=>sensor.status===status).length;}
  instrumentType(id:string){return id==='BL-RAIN'?'Pluviómetro de balancín':id==='BL-TIDE'?'Radar de marea':id.endsWith('-IN')?'Ultrasónico IP68':'Sumergible IP68';}
  statusLabel(status:string){return status==='activo'?'Integrado':status==='desconectado'?'Sin enlace':'En revisión';}
  instrumentRange(id:string){return id==='BL-RAIN'?'0,2 mm/pulso':id==='BL-TIDE'?'0–8 m':id.endsWith('-IN')?'0–150 cm':'0–200 cm';}
  samplingInterval(id:string){return id==='BL-RAIN'?'Resolución pluviométrica':id==='BL-TIDE'?'Resolución ≤ 5 mm':'Muestreo 5 min · 1 min con lluvia';}
}
