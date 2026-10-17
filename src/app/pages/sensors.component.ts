import { Component, computed, signal } from '@angular/core';
import { HydroService } from '../core/hydro.service';

@Component({
  selector:'app-sensors', standalone:true,
  template:`
    <section class="page-head"><div><div class="eyebrow">Arquitectura del sistema</div><h1>Red de monitoreo</h1><p>Lecturas de entrada y salida para verificar funcionamiento, obstrucción, saturación y reflujo.</p></div><span class="badge green">LoRaWAN · AU915</span></section>
    @if(hydro.demoArea()==='belem'){
      <section class="architecture card">
        <div><span>1</span><p><small>CAMPO</small><b>6 sensores de corredor</b><em>3 ultrasónicos de entrada + 3 sumergibles de salida</em></p></div><i>→</i>
        <div><span>2</span><p><small>CONTEXTO</small><b>Lluvia y marea</b><em>Pluviómetro 0,2 mm/pulso + radar 0–8 m</em></p></div><i>→</i>
        <div><span>3</span><p><small>COMUNICACIÓN</small><b>Gateway LoRaWAN</b><em>Banda AU915 y enlace de salida 4G</em></p></div><i>→</i>
        <div><span>4</span><p><small>PLATAFORMA</small><b>Panel y alertas</b><em>Cada 5 min; cada 1 min cuando llueve</em></p></div>
      </section>
      <div class="validation-note"><b>Diseño conceptual.</b> Las coordenadas exactas, cobertura LoRa/4G y puntos de instalación deben verificarse en terreno.</div>
    }
    <div class="filters"><button [class.active]="filter()==='todos'" (click)="filter.set('todos')">Todos · {{hydro.sensors().length}}</button><button [class.active]="filter()==='activo'" (click)="filter.set('activo')">Activos · {{statusCount('activo')}}</button><button [class.active]="filter()==='desconectado'" (click)="filter.set('desconectado')">Desconectados · {{statusCount('desconectado')}}</button><button [class.active]="filter()==='mantenimiento'" (click)="filter.set('mantenimiento')">Mantenimiento · {{statusCount('mantenimiento')}}</button></div>
    <section class="layout"><article class="card table-wrap"><table><thead><tr><th>Instrumento</th><th>Función</th><th>Ubicación referencial</th><th>Estado</th><th>Lectura</th></tr></thead><tbody>@for(s of filtered();track s.id){<tr (click)="hydro.selectSensor(s.id)" [class.selected]="hydro.selectedSensorId()===s.id"><td><b>{{s.id}}</b><small>{{s.name}}</small></td><td><b>{{instrumentType(s.id)}}</b><small>{{s.position}}</small></td><td><b>{{s.sector}}</b><small>{{s.lat.toFixed(4)}}, {{s.lng.toFixed(4)}} · por validar</small></td><td><span class="badge" [class.green]="s.status==='activo'" [class.red]="s.status==='desconectado'">{{s.status}}</span></td><td><b>{{readingLabel(s.id,s.level)}}</b><small>{{s.lastReading}}</small></td></tr>}</tbody></table></article></section>
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
    .architecture{display:grid;grid-template-columns:auto 1fr auto 1fr auto 1fr auto;align-items:center;padding:16px;margin-bottom:12px}.architecture>div{display:flex;align-items:center;gap:10px}.architecture>div>span{width:32px;height:32px;display:grid;place-items:center;border-radius:9px;background:#123b3d;color:#5de0d5;font-size:10px;font-weight:800}.architecture p,.architecture small,.architecture b,.architecture em{display:block;margin:0}.architecture small{font-size:6px;letter-spacing:1px;color:#59d8ce}.architecture b{font-size:10px;margin:3px 0}.architecture em{max-width:190px;font-size:7px;color:#6e8992;font-style:normal}.architecture>i{margin:0 13px;color:#39616b;font-style:normal}.validation-note{margin-bottom:13px;padding:10px 13px;border:1px solid #5b4826;border-radius:8px;background:#2b2519;color:#b8a77e;font-size:8px}.validation-note b{color:#f1bd55}.filters{display:flex;gap:7px;margin-bottom:13px;overflow:auto}.filters button{white-space:nowrap;background:#0b202b;color:#718a95;border:1px solid var(--line);border-radius:20px;padding:7px 12px;font-size:10px}.filters button.active{color:#5cddd5;border-color:#236059;background:#0c2d30}.layout{display:grid;grid-template-columns:1fr;gap:16px}td b,td small{display:block}td b{color:#d3e3e8;font-size:10px}td small{color:#627e8a;font-size:8px;margin-top:3px}tr{cursor:pointer}tr.selected td{background:#0e2b34;border-color:#1c4a53}.diagnostic-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:14px}.diagnostic-grid article{padding:14px}.diagnostic-grid small{font-size:6px;color:#56d8ce;letter-spacing:.7px}.diagnostic-grid h3{font-size:10px;margin:7px 0 4px}.diagnostic-grid p{font-size:8px;line-height:1.4;color:#6e8992;margin:0}@media(max-width:1000px){.architecture{grid-template-columns:1fr 1fr;gap:13px}.architecture>i{display:none}.diagnostic-grid{grid-template-columns:1fr 1fr}}@media(max-width:650px){.architecture,.diagnostic-grid{grid-template-columns:1fr}}
  `]
})
export class SensorsComponent{
  readonly filter=signal('todos');
  readonly filtered=computed(()=>this.filter()==='todos'?this.hydro.sensors():this.hydro.sensors().filter(s=>s.status===this.filter()));
  constructor(public hydro:HydroService){}
  statusCount(status:string){return this.hydro.sensors().filter(sensor=>sensor.status===status).length;}
  instrumentType(id:string){return id==='BL-RAIN'?'Pluviómetro de balancín':id==='BL-TIDE'?'Radar de marea':id.endsWith('-IN')?'Ultrasónico IP68':'Sumergible IP68';}
  readingLabel(id:string,level:number){return id==='BL-RAIN'?`${level.toFixed(1)} mm`:id==='BL-TIDE'?`${(level/20).toFixed(2)} m`:`${level} cm`;}
}
