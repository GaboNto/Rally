import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HydroService } from '../core/hydro.service';
import { GreenIntervention } from '../core/models';

@Component({
  selector: 'app-green-infrastructure',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe, FormsModule, RouterLink],
  template: `
    <section class="page-head">
      <div><div class="eyebrow">Diseño de solución</div><h1>Plan de intervención</h1><p>Convierte una zona de riesgo detectada en una intervención lista para evaluar y aprobar.</p></div>
      <span class="badge green">Zona recibida desde el mapa</span>
    </section>

    <section class="handoff card">
      <div class="handoff-step done"><span>1</span><p><small>MAPA DE DECISIÓN</small><b>Riesgo identificado</b></p></div><i>→</i>
      <div class="handoff-step active"><span>2</span><p><small>PLAN DE INTERVENCIÓN</small><b>Diseño y evaluación</b></p></div><i>→</i>
      <div class="handoff-step"><span>3</span><p><small>INFORME INSTITUCIONAL</small><b>Aprobación y ejecución</b></p></div>
      <a routerLink="/mapa" class="btn ghost">← Volver al mapa</a>
    </section>

    <section class="workspace">
      <div class="design-column">
        <article class="card zone-brief">
          <div class="zone-title"><div><small>ZONA PRIORIZADA</small><h2>{{selectedZone().name}}</h2><p>La selección conserva el contexto del pronóstico y del análisis territorial.</p></div><span class="risk-pill" [class.medium]="selectedZone().risk==='medio'" [class.low]="selectedZone().risk==='bajo'">{{riskLabel()}}</span></div>
          <div class="evidence-grid">
            <div><small>LLUVIA PREVISTA</small><b>{{rainfall()}} mm</b><span>{{rainfall() >= 30 ? 'Evento intenso' : 'Evento moderado'}}</span></div>
            <div><small>ESCORRENTÍA</small><b>{{selectedZone().runoff}}%</b><span>Concentración superficial</span></div>
            <div><small>CAPACIDAD DE DRENAJE</small><b>{{drainageRiskScore()}}/100</b><span>Condición del tramo</span></div>
            <div><small>RIESGO INTEGRADO</small><b>{{integratedRiskScore()}}/100</b><span>Topografía + lluvia + drenaje</span></div>
          </div>
          <div class="problem-statement"><span>!</span><div><small>PROBLEMA A RESOLVER</small><b>{{problemStatement()}}</b><p>{{objectiveStatement()}}</p></div></div>
        </article>

        <article class="card solution-view">
          <div class="solution-heading"><div><small>COMPARACIÓN DEL ESCENARIO</small><h2>Qué cambia al incorporar el parque</h2><p>La misma lluvia y condición territorial, comparadas antes y después de la intervención.</p></div><div class="reduction-badge"><b>−{{waterReduction()}}%</b><span>agua acumulada</span></div></div>
          <div class="scenario-comparison">
            <section class="scenario-panel current">
              <header><div><small>01 · SITUACIÓN ACTUAL</small><h3>El agua llega directamente al punto bajo</h3></div><span class="status danger">Riesgo {{priority().toLowerCase()}}</span></header>
              <div class="scenario-canvas">
                <div class="rain-source"><span>☁</span><b>{{rainfall()}} mm</b><small>Lluvia prevista</small></div>
                <div class="slope-line"></div><div class="runoff-arrow a1">→</div><div class="runoff-arrow a2">→</div>
                <div class="water-body"><span></span><b>{{currentWater()}} m³</b><small>agua acumulada</small></div>
              </div>
              <div class="scenario-summary"><div><small>CAUDAL MÁXIMO</small><b>{{currentPeak() | number:'1.2-2'}} m³/s</b></div><div><small>TIEMPO DE DRENAJE</small><b>{{currentDrainHours() | number:'1.1-1'}} h</b></div><p>La escorrentía se concentra sin una superficie intermedia de retención.</p></div>
            </section>

            <div class="change-arrow"><span>→</span><b>INTERVENCIÓN</b><small>{{type()}} · {{area()}} m²</small></div>

            <section class="scenario-panel improved">
              <header><div><small>02 · CON INTERVENCIÓN</small><h3>El parque intercepta y libera el agua gradualmente</h3></div><span class="status success">Menor presión</span></header>
              <div class="scenario-canvas">
                <div class="rain-source"><span>☁</span><b>{{rainfall()}} mm</b><small>Lluvia prevista</small></div>
                <div class="slope-line"></div><div class="runoff-arrow a1">→</div>
                <div class="absorption-park"><span>♧</span><b>{{type()}}</b><small>captura {{captureCapacity()}} m³</small><i></i></div>
                <div class="water-body reduced"><span></span><b>{{projectedWater()}} m³</b><small>agua remanente</small></div>
              </div>
              <div class="scenario-summary"><div><small>CAUDAL MÁXIMO</small><b>{{projectedPeak() | number:'1.2-2'}} m³/s</b></div><div><small>TIEMPO DE DRENAJE</small><b>{{projectedDrainHours() | number:'1.1-1'}} h</b></div><p>La modelación territorial permite comparar la reducción esperada y ajustar el diseño del parque.</p></div>
            </section>
          </div>
          <div class="process-strip"><div><span>1</span><p><b>Predecir</b><small>Pronóstico de lluvia</small></p></div><i></i><div><span>2</span><p><b>Modelar</b><small>Altura y escorrentía</small></p></div><i></i><div><span>3</span><p><b>Captar</b><small>Parque de absorción</small></p></div><i></i><div><span>4</span><p><b>Comparar</b><small>Impacto proyectado</small></p></div></div>
        </article>

        <article class="card impact-card">
          <div class="impact-heading"><div><small>RESULTADO DEL DISEÑO</small><h2>Impacto previsto para la zona</h2></div><span>{{estimatedScore()}}/100 factibilidad</span></div>
          <div class="impact-comparison">
            <div class="labels"><span>INDICADOR</span><b>Actual</b><strong>Con parque</strong></div>
            <div><span>Agua acumulada</span><b>{{currentWater()}} m³</b><strong>{{projectedWater()}} m³ <em>−{{waterReduction()}}%</em></strong></div>
            <div><span>Caudal máximo</span><b>{{currentPeak() | number:'1.2-2'}} m³/s</b><strong>{{projectedPeak() | number:'1.2-2'}} m³/s</strong></div>
            <div><span>Tiempo de drenaje</span><b>{{currentDrainHours() | number:'1.1-1'}} h</b><strong>{{projectedDrainHours() | number:'1.1-1'}} h</strong></div>
          </div>
        </article>
      </div>

      <aside class="card configurator">
        <div class="config-head"><small>CONFIGURADOR TÉCNICO</small><h2>Dimensionar intervención</h2><p>Ajusta la solución y observa el impacto inmediatamente.</p></div>
        <label class="field">ZONA DE INTERVENCIÓN<select class="form-control" [ngModel]="zoneId()" (ngModelChange)="changeZone($event)">@for(zone of hydro.zones();track zone.id){<option [value]="zone.id">{{zone.name}}</option>}</select></label>
        <label class="field">TIPO DE SOLUCIÓN<select class="form-control" [ngModel]="type()" (ngModelChange)="type.set($event);markChanged()"><option>Jardín de lluvia</option><option>Biozanja vegetada</option><option>Área de biorretención</option><option>Reservorio de retención temporal</option></select></label>
        <label class="range-field"><span><b>Superficie de captación</b><strong>{{area()}} m²</strong></span><input type="range" min="200" max="1200" step="20" [ngModel]="area()" (ngModelChange)="area.set(+$event);markChanged()"><small>Área disponible destinada a captar e infiltrar escorrentía.</small></label>
        <label class="range-field"><span><b>Presupuesto disponible</b><strong>{{budget()}} MM$</strong></span><input type="range" min="8" max="60" step="1" [ngModel]="budget()" (ngModelChange)="budget.set(+$event);markChanged()"><small>Marco presupuestario definido para esta intervención.</small></label>
        <div class="design-output"><div><small>CAPACIDAD DE CAPTACIÓN</small><b>{{captureCapacity()}} m³</b></div><div><small>REDUCCIÓN DE ESCORRENTÍA</small><b>{{waterReduction()}}%</b></div><div><small>COSTO ESTIMADO</small><b>{{estimatedCost() | currency:'CLP':'symbol-narrow':'1.0-0'}}</b></div><div><small>PLAZO DE IMPLEMENTACIÓN</small><b>{{implementationWeeks()}} semanas</b></div></div>
        <div class="score"><span><small>FACTIBILIDAD TÉCNICA</small><b>{{estimatedScore()}}/100</b></span><div><i [style.width.%]="estimatedScore()"></i></div><p>{{scoreMessage()}}</p></div>
        <button class="btn primary evaluate" (click)="evaluate()">{{evaluated() ? '✓ Diseño evaluado' : 'Evaluar diseño'}}</button>
      </aside>
    </section>

    <section class="alternatives-head"><div><div class="eyebrow">Alternativas disponibles</div><h2>Selecciona una base de diseño</h2></div><span>La alternativa elegida carga sus parámetros en el configurador.</span></section>
    <section class="candidate-grid">
      @for(item of hydro.interventions();track item.id){
        <button class="card candidate" [class.selected]="selectedInterventionId()===item.id" (click)="selectAlternative(item)">
          <div class="candidate-top"><span>{{item.type}}</span><b>{{item.score}}/100</b></div><h3>{{item.name}}</h3><p>{{item.zone}}</p>
          <div><span><small>SUPERFICIE</small><b>{{item.area}} m²</b></span><span><small>REDUCCIÓN</small><b>{{item.runoffReduction}}%</b></span><span><small>INVERSIÓN</small><b>{{item.cost | currency:'CLP':'symbol-narrow':'1.0-0'}}</b></span></div>
          <strong>{{selectedInterventionId()===item.id ? 'Alternativa seleccionada ✓' : 'Usar como base →'}}</strong>
        </button>
      }
    </section>

    @if(evaluated()){
      <section class="approval card"><div class="approval-icon">✓</div><div><small>DISEÑO PRELIMINAR COMPLETADO</small><h2>{{type()}} para {{selectedZone().name}}</h2><p>La propuesta reduce aproximadamente {{waterReduction()}}% del agua acumulada, con una capacidad de {{captureCapacity()}} m³ y una inversión estimada de {{estimatedCost() | currency:'CLP':'symbol-narrow':'1.0-0'}}.</p></div><div class="approval-actions"><button class="btn ghost" (click)="savePlan()">{{saved() ? '✓ Plan guardado' : 'Guardar plan local'}}</button><a routerLink="/informes" class="btn primary">Incorporar al informe →</a></div></section>
    }
  `,
  styles: [`
    .handoff{display:flex;align-items:center;gap:14px;padding:13px 16px;margin-bottom:14px}.handoff-step{display:flex;align-items:center;gap:8px;min-width:170px;color:#627d87}.handoff-step>span{width:27px;height:27px;border-radius:50%;display:grid;place-items:center;background:#102a35;border:1px solid #24424e;font-size:9px;font-weight:800}.handoff-step p,.handoff-step b,.handoff-step small{display:block;margin:0}.handoff-step small{font-size:6px;letter-spacing:.8px}.handoff-step b{font-size:9px;margin-top:2px}.handoff-step.done,.handoff-step.active{color:#c7dcdf}.handoff-step.done>span{background:#12372f;color:#55daa8;border-color:#246d58}.handoff-step.active>span{background:#123d43;color:#5ce0d7;border-color:#2d918c}.handoff>i{font-style:normal;color:#31505b}.handoff>.btn{margin-left:auto}.workspace{display:grid;grid-template-columns:minmax(0,1fr) 365px;gap:14px}.design-column{display:grid;gap:14px}.zone-brief,.solution-view,.impact-card,.configurator{padding:18px}.zone-title{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:15px;border-bottom:1px solid var(--line)}.zone-title small,.config-head small,.impact-heading small{font-size:7px;letter-spacing:1.1px;color:var(--cyan)}.zone-title h2{font-size:20px;margin:4px 0}.zone-title p,.config-head p{font-size:8px;color:#6e8992;margin:0}.risk-pill{font-size:8px;padding:7px 10px;border-radius:20px;color:#ff8981;background:#3a2023}.risk-pill.medium{color:#f5c568;background:#372c1b}.risk-pill.low{color:#5bdfb2;background:#12332c}.evidence-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:14px 0}.evidence-grid>div{padding:12px;background:#0c2832;border:1px solid #173945;border-radius:8px}.evidence-grid small,.evidence-grid b,.evidence-grid span{display:block}.evidence-grid small{font-size:6px;color:#64808b;letter-spacing:.7px}.evidence-grid b{font-size:17px;margin:5px 0 2px}.evidence-grid span{font-size:7px;color:#6c8790}.telemetry-brief{padding:13px;margin-bottom:11px;background:#091f2a;border:1px solid #193d48;border-radius:9px}.telemetry-title{display:flex;justify-content:space-between;align-items:center;margin-bottom:9px}.telemetry-title small{font-size:6px;letter-spacing:1px;color:#54d8cd}.telemetry-title h3{font-size:10px;margin:3px 0 0}.telemetry-title>span{font-size:7px;color:#5edcab;background:#12372f;padding:5px 7px;border-radius:14px}.sensor-list{display:grid;gap:5px}.sensor-row{display:grid;grid-template-columns:auto 1.5fr .7fr .8fr auto;align-items:center;gap:8px;padding:8px;background:#0d2a34;border-radius:7px}.sensor-row.offline{opacity:.55}.sensor-dot{width:8px;height:8px;border-radius:50%;background:#41d4a6;box-shadow:0 0 0 3px #41d4a620}.sensor-row.offline .sensor-dot{background:#ef766d}.sensor-row b,.sensor-row small{display:block}.sensor-row b{font-size:8px}.sensor-row small{font-size:6px;color:#68848d}.sensor-row>strong{font-size:10px}.sensor-row>strong i{font-style:normal;font-size:6px;color:#6c8790}.sensor-row>em{font-style:normal;font-size:7px;color:#56d8ce}.sensor-row mark{font-size:6px;color:#62dcae;background:#153b32;padding:4px 6px;border-radius:10px}.sensor-conclusion,.coverage-gap{display:flex;gap:8px;align-items:center;padding-top:9px;margin-top:8px;border-top:1px solid #16333e}.sensor-conclusion>span,.coverage-gap>span{width:23px;height:23px;border-radius:50%;display:grid;place-items:center;background:#164438;color:#55dca8;font-size:9px}.sensor-conclusion p,.sensor-conclusion b,.sensor-conclusion small,.coverage-gap p,.coverage-gap b,.coverage-gap small{display:block;margin:0}.sensor-conclusion b,.coverage-gap b{font-size:8px}.sensor-conclusion small,.coverage-gap small{font-size:7px;color:#6d8992;line-height:1.35;margin-top:2px}.problem-statement{display:flex;gap:11px;padding:12px;background:#2b2320;border:1px solid #51402a;border-radius:9px}.problem-statement>span{width:25px;height:25px;border-radius:7px;display:grid;place-items:center;background:#efb84c;color:#261d0c;font-weight:900}.problem-statement small,.problem-statement b{display:block}.problem-statement small{font-size:6px;color:#d8a946}.problem-statement b{font-size:10px;margin:3px 0}.problem-statement p{font-size:8px;color:#9a9284;margin:0}.card-head{padding:0 0 14px}.card-head h2{font-size:14px}.view-toggle{display:flex;padding:3px;background:#071923;border:1px solid #1b3945;border-radius:8px}.view-toggle button{border:0;background:transparent;color:#6d8791;font-size:8px;padding:6px 9px;border-radius:5px}.view-toggle button.active{background:#17414b;color:#65e0d7}.process-diagram{height:220px;border-radius:11px;background:linear-gradient(#0a2634 0 42%,#173430 42% 48%,#25353b 48%);overflow:hidden;position:relative}.cloud{position:absolute;left:8%;top:20px;text-align:center}.cloud span{font-size:43px;color:#8ec5dc}.cloud b,.cloud small{display:block}.cloud b{font-size:13px;color:#8ed5f2}.cloud small{font-size:7px;color:#6d8d99}.terrain{position:absolute;inset:0}.terrain:before{content:'';position:absolute;left:24%;right:0;bottom:38px;height:105px;background:linear-gradient(155deg,transparent 0 30%,#466455 31% 36%,#294942 37% 100%);clip-path:polygon(0 0,100% 48%,100% 100%,0 100%)}.drop{position:absolute;width:3px;height:15px;border-radius:50%;background:#5bb9e5;transform:rotate(18deg)}.d1{left:27%;top:52px}.d2{left:32%;top:71px}.d3{left:38%;top:86px}.flow{position:absolute;height:3px;background:#4eb8e7;transform:rotate(15deg);border-radius:4px;box-shadow:0 0 7px #44bced}.f1{left:34%;top:112px;width:31%}.f2{left:49%;top:145px;width:27%}.street{position:absolute;left:0;right:0;bottom:17px;text-align:center;font-size:7px;letter-spacing:2px;color:#71898e}.sensor-station{position:absolute;right:27%;top:43px;text-align:center;z-index:2}.sensor-station>i{display:block;width:11px;height:35px;margin:auto;border-radius:6px 6px 2px 2px;background:#192d35;border:2px solid #63ddd4;box-shadow:0 0 0 4px #39d4ca1c}.sensor-station b,.sensor-station small{display:block}.sensor-station b{font-size:7px;color:#74e2da;margin-top:3px}.sensor-station small{font-size:6px;color:#759099}.park{position:absolute;left:53%;bottom:39px;width:155px;height:78px;border:2px dashed #37d3a1;border-radius:35% 35% 14px 14px;background:#174b3cdd;text-align:center;padding-top:9px;opacity:.28;transform:scale(.86)}.after .park{opacity:1;transform:scale(1);box-shadow:0 0 25px #25d49b33}.park span,.park b,.park small{display:block}.park span{font-size:17px;color:#5ae0af}.park b{font-size:9px}.park small{font-size:7px;color:#82aa9e}.pool{position:absolute;right:5%;bottom:37px;width:125px;height:48px;border-radius:50% 50% 15px 15px;background:#176b9bba;border:1px solid #65c9f2;text-align:center;padding-top:9px}.after .pool{width:78px;background:#175c75aa}.pool b,.pool small{display:block}.pool b{font-size:11px}.pool small{font-size:7px;color:#a1d8ec}.drain{position:absolute;right:4%;top:19px;color:#80969d}.drain span,.drain b{display:block;text-align:center}.drain span{font-size:20px;color:#54d6cd}.drain b{font-size:7px}.process-steps{display:grid;grid-template-columns:auto 1fr auto 1fr auto 1fr auto;align-items:center;margin-top:13px}.process-steps>div{display:flex;gap:8px;align-items:center}.process-steps>div>span{width:25px;height:25px;border-radius:7px;display:grid;place-items:center;background:#11333c;color:#57d9d0;font-size:8px;font-weight:800}.process-steps p,.process-steps b,.process-steps small{display:block;margin:0}.process-steps b{font-size:9px}.process-steps small{font-size:7px;color:#69848e;max-width:130px}.process-steps>i{height:1px;background:#24414b;margin:0 10px}.impact-heading{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:12px}.impact-heading h2{font-size:14px;margin:4px 0 0}.impact-heading>span{font-size:8px;color:#55d9cd;background:#10333c;padding:6px 9px;border-radius:20px}.impact-comparison{display:grid;grid-template-columns:1.15fr repeat(3,1fr);border:1px solid var(--line);border-radius:9px;overflow:hidden}.impact-comparison>div{display:grid;grid-template-rows:repeat(3,auto);padding:11px;border-left:1px solid var(--line)}.impact-comparison>div:first-child{border-left:0;background:#0c2933}.impact-comparison span{font-size:7px;color:#6b8690;text-transform:uppercase}.impact-comparison b{font-size:10px;margin:6px 0}.impact-comparison strong{font-size:11px;color:#56d7cc}.impact-comparison em{font-style:normal;font-size:7px;color:#54d5a3}.configurator{height:max-content;position:sticky;top:88px}.config-head{padding-bottom:15px;border-bottom:1px solid var(--line);margin-bottom:14px}.config-head h2{font-size:16px;margin:4px 0}.configurator .field{margin-bottom:13px}.range-field{display:block;margin:16px 0}.range-field>span{display:flex;justify-content:space-between;align-items:center}.range-field b{font-size:9px}.range-field strong{font-size:11px;color:#5edbd3}.range-field input{width:100%;accent-color:#33d1c8;margin:10px 0 4px}.range-field>small{display:block;font-size:7px;color:#627d87}.design-output{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:14px 0}.design-output>div{padding:10px;background:#0c2832;border-radius:7px}.design-output small,.design-output b{display:block}.design-output small{font-size:6px;color:#607b86}.design-output b{font-size:10px;margin-top:4px}.score{padding:13px;background:#0d302f;border:1px solid #1b5b56;border-radius:9px}.score>span{display:flex;justify-content:space-between;align-items:center}.score small{font-size:7px;color:#74a49f}.score b{font-size:18px;color:#5ce0d6}.score>div{height:5px;background:#173d40;border-radius:8px;overflow:hidden;margin:8px 0}.score i{display:block;height:100%;background:#35d2c8}.score p{font-size:7px;color:#71908f;margin:0}.evaluate{width:100%;margin-top:12px}.alternatives-head{display:flex;justify-content:space-between;align-items:flex-end;margin:22px 0 10px}.alternatives-head h2{font-size:16px;margin:0}.alternatives-head>span{font-size:8px;color:#68838d}.candidate-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.candidate{text-align:left;padding:15px;color:#c9dce0;cursor:pointer}.candidate:hover,.candidate.selected{border-color:#36bdb4;background:#0c2932}.candidate-top{display:flex;justify-content:space-between}.candidate-top span{font-size:7px;color:#57d9cf}.candidate-top b{font-size:9px}.candidate h3{font-size:12px;margin:11px 0 3px}.candidate>p{font-size:8px;color:#66818b;margin:0 0 12px}.candidate>div:nth-of-type(2){display:grid;grid-template-columns:repeat(3,1fr);gap:5px}.candidate>div:nth-of-type(2)>span{padding:8px;background:#0b252f;border-radius:6px}.candidate small,.candidate span b{display:block}.candidate small{font-size:6px;color:#5f7a85}.candidate span b{font-size:8px;margin-top:3px}.candidate>strong{display:block;font-size:8px;color:#55d8ce;margin-top:11px}.approval{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:14px;padding:18px;margin-top:14px;border-color:#26766d;background:linear-gradient(90deg,#0c292e,#0a222c)}.approval-icon{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:#164d3d;color:#5de0ad;font-weight:900}.approval small{font-size:7px;letter-spacing:1px;color:#59d7ad}.approval h2{font-size:13px;margin:4px 0}.approval p{font-size:8px;color:#718b93;margin:0}.approval-actions{display:flex;gap:8px}
    .solution-heading{display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:14px;border-bottom:1px solid var(--line)}.solution-heading small{font-size:7px;letter-spacing:1px;color:#54d8ce}.solution-heading h2{font-size:15px;margin:4px 0}.solution-heading p{font-size:8px;color:#6d8791;margin:0}.reduction-badge{text-align:right;padding:8px 11px;background:#12372f;border:1px solid #28604e;border-radius:9px}.reduction-badge b,.reduction-badge span{display:block}.reduction-badge b{font-size:20px;color:#5de0ad}.reduction-badge span{font-size:6px;color:#7fa397;text-transform:uppercase}.scenario-comparison{display:grid;grid-template-columns:1fr 86px 1fr;align-items:stretch;gap:10px;margin-top:14px}.scenario-panel{border:1px solid #1b3b46;border-radius:10px;overflow:hidden;background:#0a222c}.scenario-panel>header{min-height:67px;display:flex;justify-content:space-between;align-items:flex-start;gap:8px;padding:12px;border-bottom:1px solid #17343f}.scenario-panel header small{font-size:6px;letter-spacing:.8px;color:#66828c}.scenario-panel header h3{font-size:10px;line-height:1.35;margin:4px 0 0}.status{white-space:nowrap;font-size:6px;padding:5px 7px;border-radius:15px}.status.danger{color:#ff9189;background:#402226}.status.success{color:#5de0ad;background:#153d32}.scenario-canvas{height:205px;position:relative;overflow:hidden;background:linear-gradient(#0a2a37 0 43%,#183932 43% 49%,#263a3d 49%)}.scenario-canvas:after{content:'SUPERFICIE URBANA';position:absolute;left:0;right:0;bottom:9px;text-align:center;font-size:5px;letter-spacing:1.7px;color:#647e85}.rain-source{position:absolute;left:7%;top:22px;text-align:center;z-index:2}.rain-source span,.rain-source b,.rain-source small{display:block}.rain-source span{font-size:30px;color:#92cee5}.rain-source b{font-size:11px;color:#8ed7f4}.rain-source small{font-size:6px;color:#6d8994}.slope-line{position:absolute;left:26%;right:-10%;top:86px;height:76px;background:linear-gradient(160deg,transparent 0 30%,#446451 31% 38%,#294b41 39% 100%);clip-path:polygon(0 0,100% 54%,100% 100%,0 100%)}.runoff-arrow{position:absolute;color:#58c9f3;font-size:27px;transform:rotate(18deg);text-shadow:0 0 8px #55c8ef}.runoff-arrow.a1{left:34%;top:80px}.runoff-arrow.a2{left:53%;top:112px}.monitor-point{position:absolute;right:28%;top:43px;text-align:center;z-index:3}.monitor-point>i{display:block;width:10px;height:30px;margin:auto;border:2px solid #5de0d7;border-radius:5px 5px 2px 2px;box-shadow:0 0 0 4px #46d6cc18}.monitor-point b,.monitor-point small{display:block}.monitor-point b{font-size:7px;color:#67ded5;margin-top:3px}.monitor-point small{font-size:6px;color:#728d95}.water-body{position:absolute;right:5%;bottom:29px;width:115px;height:54px;border-radius:55% 55% 12px 12px;background:#176d9d;border:1px solid #74d1f3;text-align:center;padding-top:10px;z-index:2;box-shadow:0 0 18px #168fd04d}.water-body.reduced{width:76px;height:42px;background:#17627d;padding-top:7px}.water-body b,.water-body small{display:block}.water-body b{font-size:11px}.water-body small{font-size:6px;color:#acdcec}.absorption-park{position:absolute;left:47%;bottom:28px;width:130px;height:80px;border:2px solid #45d7a4;border-radius:38% 38% 10px 10px;background:#174d3ddd;text-align:center;padding-top:9px;z-index:2;box-shadow:0 0 20px #3bd8a12b}.absorption-park span,.absorption-park b,.absorption-park small{display:block}.absorption-park span{font-size:16px;color:#65e2b2}.absorption-park b{font-size:8px}.absorption-park small{font-size:6px;color:#83aa9d}.absorption-park>i{display:block;width:70%;height:5px;margin:8px auto 0;border-bottom:2px dotted #5bcfba}.scenario-summary{display:grid;grid-template-columns:1fr 1fr;gap:7px;padding:11px}.scenario-summary>div{padding:8px;background:#0d2a34;border-radius:6px}.scenario-summary small,.scenario-summary b{display:block}.scenario-summary small{font-size:5px;color:#607b85}.scenario-summary b{font-size:9px;margin-top:3px}.scenario-summary p{grid-column:1/-1;font-size:7px;line-height:1.4;color:#718a92;margin:2px 0 0}.change-arrow{display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center;color:#5ddbd2}.change-arrow>span{width:35px;height:35px;border-radius:50%;display:grid;place-items:center;background:#123d43;border:1px solid #2b7774;font-size:18px}.change-arrow b{font-size:6px;letter-spacing:.8px;margin-top:6px}.change-arrow small{font-size:6px;color:#6d8992;margin-top:2px}.process-strip{display:grid;grid-template-columns:auto 1fr auto 1fr auto 1fr auto;align-items:center;padding:12px;margin-top:12px;background:#091f29;border-radius:9px}.process-strip>div{display:flex;align-items:center;gap:7px}.process-strip>div>span{width:24px;height:24px;border-radius:7px;display:grid;place-items:center;background:#12363e;color:#59d9cf;font-size:8px;font-weight:800}.process-strip p,.process-strip b,.process-strip small{display:block;margin:0}.process-strip b{font-size:8px}.process-strip small{font-size:6px;color:#68838d}.process-strip>i{height:1px;background:#24424c;margin:0 9px}
    @media(max-width:1350px){.scenario-comparison{grid-template-columns:1fr}.change-arrow{flex-direction:row;gap:7px;padding:3px}.change-arrow>span{transform:rotate(90deg)}}@media(max-width:1150px){.workspace{grid-template-columns:1fr}.configurator{position:static}.candidate-grid{grid-template-columns:1fr 1fr}.handoff-step{min-width:0}.handoff>i{display:none}.scenario-comparison{grid-template-columns:1fr 86px 1fr}.change-arrow{flex-direction:column}.change-arrow>span{transform:none}}@media(max-width:850px){.scenario-comparison{grid-template-columns:1fr}.change-arrow{flex-direction:row}.change-arrow>span{transform:rotate(90deg)}}@media(max-width:720px){.handoff{align-items:stretch;flex-direction:column}.handoff>.btn{margin-left:0}.evidence-grid,.impact-comparison{grid-template-columns:1fr 1fr}.sensor-row{grid-template-columns:auto 1fr auto}.sensor-row>em,.sensor-row>mark{display:none}.process-strip{grid-template-columns:1fr 1fr;gap:9px}.process-strip>i{display:none}.approval{grid-template-columns:1fr}.approval-actions{flex-direction:column}.candidate-grid{grid-template-columns:1fr}.solution-heading{align-items:flex-start;gap:10px}.scenario-canvas{height:225px}}@media(max-width:480px){.evidence-grid,.impact-comparison{grid-template-columns:1fr}.impact-comparison>div{border-left:0;border-top:1px solid var(--line)}.solution-heading{flex-direction:column}.monitor-point{right:22%}.absorption-park{left:36%}}
  `],
})
export class GreenInfrastructureComponent {
  readonly zoneId = signal('Z-01');
  readonly rainfall = signal(38);
  readonly selectedInterventionId = signal('IV-01');
  readonly type = signal('Jardín de lluvia');
  readonly area = signal(420);
  readonly budget = signal(20);
  readonly viewMode = signal<'before' | 'after'>('after');
  readonly evaluated = signal(false);
  readonly saved = signal(false);

  readonly selectedZone = computed(() => this.hydro.zones().find(zone => zone.id === this.zoneId()) ?? this.hydro.zones()[0]);
  readonly drainageRiskScore = computed(() => {
    const segment = this.hydro.segments().find(item => item.sector === this.zoneSector());
    return segment ? ({ normal: 22, no_concluyente: 48, posible_obstruccion: 88, sobrecarga: 96 } as const)[segment.condition] : 45;
  });
  readonly integratedRiskScore = computed(() => {
    const topography = ({ bajo: 25, medio: 58, alto: 86 } as const)[this.selectedZone().risk];
    const rain = Math.min(100, this.rainfall() / 45 * 100);
    return Math.round(topography * .45 + rain * .35 + this.drainageRiskScore() * .20);
  });
  readonly priority = computed(() => this.integratedRiskScore() >= 68 ? 'Alta' : this.integratedRiskScore() >= 42 ? 'Media' : 'Preventiva');
  readonly captureCapacity = computed(() => Math.round(this.area() * 0.16 + this.rainfall() * 4.2));
  readonly waterReduction = computed(() => Math.min(48, Math.round(7 + this.area() / 35 + this.selectedZone().runoff / 11)));
  readonly currentWater = computed(() => Math.round(this.rainfall() * (8 + this.selectedZone().runoff / 6) * (1 + Math.max(0, this.drainageRiskScore() - 50) / 360)));
  readonly projectedWater = computed(() => Math.round(this.currentWater() * (1 - this.waterReduction() / 100)));
  readonly currentPeak = computed(() => +(0.9 + this.rainfall() / 20 + this.selectedZone().runoff / 100).toFixed(2));
  readonly projectedPeak = computed(() => +(this.currentPeak() * (1 - this.waterReduction() / 115)).toFixed(2));
  readonly currentDrainHours = computed(() => +(2.1 + this.rainfall() / 9).toFixed(1));
  readonly projectedDrainHours = computed(() => +(this.currentDrainHours() * (1 - this.waterReduction() / 110)).toFixed(1));
  readonly estimatedCost = computed(() => Math.round((this.area() * 37_500 + this.budget() * 120_000) / 100_000) * 100_000);
  readonly estimatedScore = computed(() => Math.min(96, Math.max(42, Math.round(52 + this.area() / 32 - Math.abs(this.estimatedCost() / 1_000_000 - this.budget()) * 1.4))));
  readonly implementationWeeks = computed(() => Math.max(6, Math.round(5 + this.area() / 95)));

  constructor(public hydro: HydroService, route: ActivatedRoute) {
    route.queryParamMap.subscribe(params => {
      const requestedZone = params.get('zone');
      const requestedIntervention = params.get('intervention');
      const rain = Number(params.get('rain'));
      if (requestedZone && this.hydro.zones().some(zone => zone.id === requestedZone)) this.zoneId.set(requestedZone);
      if (Number.isFinite(rain) && rain > 0) this.rainfall.set(rain);
      const alternative = this.hydro.interventions().find(item => item.id === requestedIntervention) ?? this.hydro.interventions().find(item => item.zone === this.selectedZone().name);
      if (alternative) this.selectAlternative(alternative);
    });
  }

  changeZone(id: string) {
    this.zoneId.set(id);
    const alternative = this.hydro.interventions().find(item => item.zone === this.selectedZone().name);
    if (alternative) this.selectAlternative(alternative);
    this.markChanged();
  }
  selectAlternative(item: GreenIntervention) {
    this.selectedInterventionId.set(item.id);
    this.zoneId.set(this.hydro.zones().find(zone => zone.name === item.zone)?.id ?? this.zoneId());
    this.type.set(item.type);
    this.area.set(item.area);
    this.budget.set(Math.round(item.cost / 1_000_000));
    this.evaluated.set(false);
    this.saved.set(false);
  }
  markChanged() { this.evaluated.set(false); this.saved.set(false); }
  evaluate() { this.evaluated.set(true); this.viewMode.set('after'); this.saved.set(false); }
  savePlan() {
    localStorage.setItem('pomerape-intervention-plan', JSON.stringify({ zoneId: this.zoneId(), rainfall: this.rainfall(), type: this.type(), area: this.area(), budget: this.budget(), captureCapacity: this.captureCapacity(), reduction: this.waterReduction(), estimatedCost: this.estimatedCost(), integratedRisk: this.integratedRiskScore(), savedAt: new Date().toISOString() }));
    this.saved.set(true);
  }
  riskLabel() { return this.selectedZone().risk === 'alto' ? 'Riesgo alto' : this.selectedZone().risk === 'medio' ? 'Riesgo medio' : 'Riesgo bajo'; }
  problemStatement() { return 'La topografía y el pronóstico indican aumento de escorrentía con capacidad limitada de infiltración local.'; }
  objectiveStatement() { return 'Captar parte del volumen antes de que alcance el punto crítico y reducir la profundidad y el tiempo de permanencia del agua.'; }
  scoreMessage() { return this.estimatedScore() >= 80 ? 'Alternativa prioritaria para avanzar a validación técnica.' : this.estimatedScore() >= 65 ? 'Alternativa viable con ajustes de superficie o presupuesto.' : 'Se recomienda revisar dimensiones y disponibilidad del terreno.'; }
  private zoneSector() { return this.selectedZone().name.replace('Sector ', '').replace(' Sur', ''); }
}
