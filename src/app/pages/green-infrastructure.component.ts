import { DecimalPipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HydroService } from '../core/hydro.service';

@Component({
  selector: 'app-green-infrastructure',
  standalone: true,
  imports: [DecimalPipe, FormsModule, RouterLink],
  template: `
    <section class="page-head">
      <div><div class="eyebrow">Diseño de solución</div><h1>Plan de intervención</h1><p>Convierte una zona de riesgo detectada en una intervención lista para evaluar y aprobar.</p></div>
      <span class="badge green">Zona recibida desde el mapa</span>
    </section>

    <section class="handoff card">
      <div class="handoff-step done"><span>1</span><p><small>MAPA DE DECISIÓN</small><b>Riesgo identificado</b></p></div><i>→</i>
      <div class="handoff-step active"><span>2</span><p><small>PLAN DE INTERVENCIÓN</small><b>Diseño y evaluación</b></p></div><i>→</i>
      <div class="handoff-step" [class.done]="evaluated()"><span>3</span><p><small>MODELO OPERATIVO</small><b>Simulación dinámica</b></p></div><i>→</i>
      <div class="handoff-step"><span>4</span><p><small>INFORME INSTITUCIONAL</small><b>Documentación final</b></p></div>
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
          <div class="solution-heading"><div><small>COMPARACIÓN DEL ESCENARIO</small><h2>Qué cambia al incorporar la bioesponja</h2><p>Mismo evento de {{rainfall()}} mm en el corredor atendido, antes y después de la intervención.</p></div><div class="headline-stats"><div><small>VOLUMEN GESTIONADO</small><b>{{managedWater()}} m³</b></div><div class="reduction-badge"><b>−{{waterReduction()}}%</b><span>escorrentía local</span></div></div></div>
          <div class="scenario-comparison">
            <section class="scenario-panel current">
              <header><span class="scenario-number">01</span><div><small>SITUACIÓN ACTUAL</small><h3>El agua llega directamente al punto bajo</h3></div><span class="status danger">Riesgo {{priority().toLowerCase()}}</span></header>
              <div class="scenario-canvas flow-diagram">
                <div class="flow-node rain-node"><span class="node-icon">☁</span><small>EVENTO DE LLUVIA</small><strong>{{rainfall()}} mm</strong><em>Precipitación sobre la zona</em></div>
                <div class="diagram-link uncontrolled"><span></span><b>Escorrentía directa</b><small>La superficie no retiene el agua</small></div>
                <div class="flow-node accumulation-node danger-node"><span class="node-icon">≈</span><small>PUNTO BAJO</small><strong>{{currentWater()}} m³</strong><em>100% del volumen se concentra</em></div>
                <div class="diagram-conclusion danger-conclusion"><i>!</i><p><b>Resultado</b><span>El agua llega sin regulación y aumenta la presión sobre el drenaje.</span></p></div>
              </div>
              <div class="scenario-summary"><div><small>CAUDAL DE ENTRADA CALCULADO</small><b>{{currentPeak() | number:'1.2-2'}} L/s</b><em>A 63 mm/h</em></div><div><small>ALMACENAMIENTO EN ORIGEN</small><b>0 m³</b><em>Sin intervención</em></div></div>
            </section>

            <div class="change-arrow"><small>INCORPORAR</small><span>→</span><b>{{cellCount()}} celdas</b><em>{{area()}} m²</em></div>

            <section class="scenario-panel improved">
              <header><span class="scenario-number success-number">02</span><div><small>CON INTERVENCIÓN</small><h3>La bioesponja capta, filtra y libera gradualmente</h3></div><span class="status success">Menor presión</span></header>
              <div class="scenario-canvas flow-diagram improved-flow">
                <div class="flow-node rain-node"><span class="node-icon">☁</span><small>EVENTO DE LLUVIA</small><strong>{{rainfall()}} mm</strong><em>Misma precipitación</em></div>
                <div class="diagram-link controlled-link"><span></span><b>Captación</b><small>La bioesponja intercepta el flujo</small></div>
                <div class="flow-node park-node"><span class="node-icon">♧</span><small>BIOESPONJA MODULAR</small><strong>{{cellCount()}} celdas</strong><em>{{managedWater()}} m³ captados en este evento</em><div><span>Retiene</span><span>Filtra</span><span>Regula</span></div></div>
                <div class="diagram-link outlet-link"><span></span><b>Salida regulada</b><small>Menor caudal hacia el punto bajo</small></div>
                <div class="flow-node accumulation-node safe-node"><span class="node-icon">≈</span><small>AGUA REMANENTE</small><strong>{{projectedWater()}} m³</strong><em>{{100-waterReduction()}}% del volumen inicial</em></div>
                <div class="diagram-conclusion success-conclusion"><i>✓</i><p><b>Resultado</b><span>La intervención reduce {{waterReduction()}}% la acumulación y descarga el excedente gradualmente.</span></p></div>
              </div>
              <div class="scenario-summary"><div><small>CAPACIDAD DE ENTRADA</small><b>{{inletCapacity() | number:'1.1-1'}} L/s</b><em class="positive">{{inletSafetyFactor()}}× el caudal</em></div><div><small>VACIADO DE LA LÁMINA</small><b>≈ 1,5 h</b><em class="positive">objetivo &lt; 12 h</em></div></div>
            </section>
          </div>
          <div class="result-strip"><div><span>1</span><p><b>Intercepta</b><small>Antes del punto bajo</small></p></div><i></i><div><span>2</span><p><b>Retiene</b><small>{{captureCapacity()}} m³ temporalmente</small></p></div><i></i><div><span>3</span><p><b>Infiltra</b><small>Reduce el caudal punta</small></p></div><i></i><div><span>4</span><p><b>Libera</b><small>Descarga gradual</small></p></div></div>
        </article>

        <article class="card impact-card">
          <div class="impact-heading"><div><small>RESULTADO DEL DISEÑO</small><h2>Impacto previsto para la zona</h2></div><span>{{estimatedScore()}}/100 factibilidad</span></div>
          <div class="impact-comparison">
            <div class="labels"><span>INDICADOR</span><b>Actual</b><strong>Con bioesponja</strong></div>
            <div><span>Agua acumulada</span><b>{{currentWater()}} m³</b><strong>{{projectedWater()}} m³ <em>−{{waterReduction()}}%</em></strong></div>
            <div><span>Caudal de entrada</span><b>{{currentPeak() | number:'1.2-2'}} L/s</b><strong>{{inletCapacity() | number:'1.1-1'}} L/s de capacidad</strong></div>
            <div><span>Vaciado superficial</span><b>Sin control</b><strong>≈ 1,5 h</strong></div>
          </div>
        </article>
      </div>

      <aside class="card configurator">
        <div class="config-head"><small>SOLUCIÓN ÚNICA · CONFIGURABLE</small><h2>Bioesponja modular urbana</h2><p>Dimensiona el mismo sistema compacto para la zona inundable seleccionada.</p></div>
        <label class="field">ZONA DE INTERVENCIÓN<select class="form-control" [ngModel]="zoneId()" (ngModelChange)="changeZone($event)">@for(zone of hydro.zones();track zone.id){<option [value]="zone.id">{{zone.name}}</option>}</select></label>
        <label class="field">MÓDULO SEGÚN ANCHO DE VÍA<select class="form-control" [ngModel]="moduleType()" (ngModelChange)="changeModule($event)"><option value="A">Módulo A · 10 × 2 m · calle ≥ 5 m</option><option value="B">Módulo B · 10 × 1,2 m · pasaje de 3 a 5 m</option></select></label>
        <div class="solution-lock"><span>◫</span><div><small>TIPO DE INTERVENCIÓN</small><b>Celda de biorretención compacta</b><p>Vegetación nativa, lámina superficial, medio filtrante, arena, grava y drenaje regulado.</p></div></div>
        <label class="range-field"><span><b>Cantidad de celdas</b><strong>{{cellCount()}} módulos</strong></span><input type="range" min="1" max="8" step="1" [ngModel]="cellCount()" (ngModelChange)="cellCount.set(+$event);markChanged()"><small>Cada celda mide 10 × {{cellWidth()}} m. El corredor de diseño mantiene 60 m² de celdas por 300 m² de calle.</small></label>
        <div class="module-summary"><div><small>CORREDOR TOTAL</small><b>{{corridorLength()}} m</b></div><div><small>HUELLA VERDE</small><b>{{area()}} m²</b></div><div><small>ÁREA ATENDIDA</small><b>{{treatedArea()}} m²</b></div></div>
        <div class="design-output"><div><small>ALMACENAMIENTO TEMPORAL</small><b>{{captureCapacity()}} m³</b></div><div><small>RETENCIÓN ESTÁTICA</small><b>{{waterReduction()}}%</b></div><div><small>PROFUNDIDAD TOTAL</small><b>1,10 m</b></div><div><small>PERMEABILIDAD OBJETIVO</small><b>≥ 100 mm/h</b></div></div>
        <div class="score"><span><small>FACTIBILIDAD TÉCNICA</small><b>{{estimatedScore()}}/100</b></span><div><i [style.width.%]="estimatedScore()"></i></div><p>{{scoreMessage()}}</p></div>
        <button class="btn primary evaluate" (click)="evaluate()">{{evaluated() ? '✓ Actualizar evaluación' : 'Evaluar diseño'}}</button>
        @if(evaluated()){
          <a routerLink="/modelo-bioesponja" class="btn simulate-link">Continuar al simulador →</a>
          <small class="transfer-note">Se transferirán {{cellCount()}} celdas módulo {{moduleType()}}, {{rainfall()}} mm y {{captureCapacity()}} m³ de capacidad.</small>
        }
      </aside>
    </section>

    <section class="alternatives-head"><div><div class="eyebrow">Sistema constructivo</div><h2>Una solución, dimensionada por módulos</h2></div><span>La composición permanece igual; solo cambia el número de celdas según el riesgo y el espacio.</span></section>
    <section class="card bioassembly">
      <div class="assembly-intro"><span>10 × {{cellWidth()}} m</span><div><small>MÓDULO {{moduleType()}}</small><h3>Bioesponja urbana de pequeña escala</h3><p>Incluye 10 cm de revancha y se instala antes del punto bajo. El ancho definitivo, la napa y las cotas de salida deben validarse en terreno.</p></div></div>
      <div class="assembly-layers">
        <div><span class="layer vegetation"></span><b>Vegetación nativa</b><small>Protege el suelo y favorece evapotranspiración.</small></div>
        <div><span class="layer pond"></span><b>15 cm de lámina</b><small>Reserva superficial para el evento de lluvia.</small></div>
        <div><span class="layer filter"></span><b>40 cm de medio filtrante</b><small>70% arena, 20% compost/tierra vegetal y 10% biocarbón de açaí.</small></div>
        <div><span class="layer sand"></span><b>10 cm de arena</b><small>Transición y filtración fina.</small></div>
        <div><span class="layer gravel"></span><b>30 cm de grava</b><small>Almacenamiento subsuperficial y drenaje.</small></div>
        <div><span class="layer pipe"></span><b>Subdrén HDPE Ø160</b><small>Perforado, geotextil 200 g/m², pendiente 0,5% y válvula de clapeta.</small></div>
      </div>
    </section>
    <section class="technical-conditions">
      <article class="card"><small>PRETRATAMIENTO</small><b>Reja a 45° + bio-gavión de 0,30 m</b><p>Retiene basura y sedimento antes del medio filtrante.</p></article>
      <article class="card"><small>ACCESIBILIDAD</small><b>Franja peatonal libre ≥ 1,20 m</b><p>Vados de 1,5 a 2,0 m entre celdas, conforme al criterio NBR 9050.</p></article>
      <article class="card"><small>CONTROL DE MAREA</small><b>Válvula de clapeta Ø160 mm</b><p>Evita el reflujo y permite descarga por gravedad cuando baja la marea.</p></article>
      <article class="card"><small>VEGETACIÓN PROPUESTA</small><b>Heliconia, Costus y grama-são-carlos</b><p>Paleta de anteproyecto; la selección definitiva se valida con especialistas locales.</p></article>
    </section>

    @if(evaluated()){
      <section class="approval card"><div class="approval-icon">✓</div><div><small>ANTEPROYECTO TÉCNICO EVALUADO</small><h2>Configuración lista para verificar su desempeño</h2><p>{{cellCount()}} celdas módulo {{moduleType()}} atienden {{treatedArea()}} m² y aportan {{captureCapacity()}} m³. El siguiente paso reproduce dinámicamente la entrada, almacenamiento, infiltración, descarga y posible rebalse.</p></div><div class="approval-actions"><button class="btn ghost" (click)="savePlan()">{{saved() ? '✓ Plan guardado' : 'Guardar plan'}}</button><a routerLink="/modelo-bioesponja" class="btn primary">Abrir simulación →</a><a routerLink="/informes" class="btn ghost">Ir al informe</a></div></section>
    }
  `,
  styles: [`
    .handoff{display:flex;align-items:center;gap:14px;padding:13px 16px;margin-bottom:14px}.handoff-step{display:flex;align-items:center;gap:8px;min-width:170px;color:#627d87}.handoff-step>span{width:27px;height:27px;border-radius:50%;display:grid;place-items:center;background:#102a35;border:1px solid #24424e;font-size:9px;font-weight:800}.handoff-step p,.handoff-step b,.handoff-step small{display:block;margin:0}.handoff-step small{font-size:6px;letter-spacing:.8px}.handoff-step b{font-size:9px;margin-top:2px}.handoff-step.done,.handoff-step.active{color:#c7dcdf}.handoff-step.done>span{background:#12372f;color:#55daa8;border-color:#246d58}.handoff-step.active>span{background:#123d43;color:#5ce0d7;border-color:#2d918c}.handoff>i{font-style:normal;color:#31505b}.handoff>.btn{margin-left:auto}.workspace{display:grid;grid-template-columns:minmax(0,1fr) 365px;gap:14px}.design-column{display:grid;gap:14px}.zone-brief,.solution-view,.impact-card,.configurator{padding:18px}.zone-title{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:15px;border-bottom:1px solid var(--line)}.zone-title small,.config-head small,.impact-heading small{font-size:7px;letter-spacing:1.1px;color:var(--cyan)}.zone-title h2{font-size:20px;margin:4px 0}.zone-title p,.config-head p{font-size:8px;color:#6e8992;margin:0}.risk-pill{font-size:8px;padding:7px 10px;border-radius:20px;color:#ff8981;background:#3a2023}.risk-pill.medium{color:#f5c568;background:#372c1b}.risk-pill.low{color:#5bdfb2;background:#12332c}.evidence-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:14px 0}.evidence-grid>div{padding:12px;background:#0c2832;border:1px solid #173945;border-radius:8px}.evidence-grid small,.evidence-grid b,.evidence-grid span{display:block}.evidence-grid small{font-size:6px;color:#64808b;letter-spacing:.7px}.evidence-grid b{font-size:17px;margin:5px 0 2px}.evidence-grid span{font-size:7px;color:#6c8790}.telemetry-brief{padding:13px;margin-bottom:11px;background:#091f2a;border:1px solid #193d48;border-radius:9px}.telemetry-title{display:flex;justify-content:space-between;align-items:center;margin-bottom:9px}.telemetry-title small{font-size:6px;letter-spacing:1px;color:#54d8cd}.telemetry-title h3{font-size:10px;margin:3px 0 0}.telemetry-title>span{font-size:7px;color:#5edcab;background:#12372f;padding:5px 7px;border-radius:14px}.sensor-list{display:grid;gap:5px}.sensor-row{display:grid;grid-template-columns:auto 1.5fr .7fr .8fr auto;align-items:center;gap:8px;padding:8px;background:#0d2a34;border-radius:7px}.sensor-row.offline{opacity:.55}.sensor-dot{width:8px;height:8px;border-radius:50%;background:#41d4a6;box-shadow:0 0 0 3px #41d4a620}.sensor-row.offline .sensor-dot{background:#ef766d}.sensor-row b,.sensor-row small{display:block}.sensor-row b{font-size:8px}.sensor-row small{font-size:6px;color:#68848d}.sensor-row>strong{font-size:10px}.sensor-row>strong i{font-style:normal;font-size:6px;color:#6c8790}.sensor-row>em{font-style:normal;font-size:7px;color:#56d8ce}.sensor-row mark{font-size:6px;color:#62dcae;background:#153b32;padding:4px 6px;border-radius:10px}.sensor-conclusion,.coverage-gap{display:flex;gap:8px;align-items:center;padding-top:9px;margin-top:8px;border-top:1px solid #16333e}.sensor-conclusion>span,.coverage-gap>span{width:23px;height:23px;border-radius:50%;display:grid;place-items:center;background:#164438;color:#55dca8;font-size:9px}.sensor-conclusion p,.sensor-conclusion b,.sensor-conclusion small,.coverage-gap p,.coverage-gap b,.coverage-gap small{display:block;margin:0}.sensor-conclusion b,.coverage-gap b{font-size:8px}.sensor-conclusion small,.coverage-gap small{font-size:7px;color:#6d8992;line-height:1.35;margin-top:2px}.problem-statement{display:flex;gap:11px;padding:12px;background:#2b2320;border:1px solid #51402a;border-radius:9px}.problem-statement>span{width:25px;height:25px;border-radius:7px;display:grid;place-items:center;background:#efb84c;color:#261d0c;font-weight:900}.problem-statement small,.problem-statement b{display:block}.problem-statement small{font-size:6px;color:#d8a946}.problem-statement b{font-size:10px;margin:3px 0}.problem-statement p{font-size:8px;color:#9a9284;margin:0}.card-head{padding:0 0 14px}.card-head h2{font-size:14px}.view-toggle{display:flex;padding:3px;background:#071923;border:1px solid #1b3945;border-radius:8px}.view-toggle button{border:0;background:transparent;color:#6d8791;font-size:8px;padding:6px 9px;border-radius:5px}.view-toggle button.active{background:#17414b;color:#65e0d7}.process-diagram{height:220px;border-radius:11px;background:linear-gradient(#0a2634 0 42%,#173430 42% 48%,#25353b 48%);overflow:hidden;position:relative}.cloud{position:absolute;left:8%;top:20px;text-align:center}.cloud span{font-size:43px;color:#8ec5dc}.cloud b,.cloud small{display:block}.cloud b{font-size:13px;color:#8ed5f2}.cloud small{font-size:7px;color:#6d8d99}.terrain{position:absolute;inset:0}.terrain:before{content:'';position:absolute;left:24%;right:0;bottom:38px;height:105px;background:linear-gradient(155deg,transparent 0 30%,#466455 31% 36%,#294942 37% 100%);clip-path:polygon(0 0,100% 48%,100% 100%,0 100%)}.drop{position:absolute;width:3px;height:15px;border-radius:50%;background:#5bb9e5;transform:rotate(18deg)}.d1{left:27%;top:52px}.d2{left:32%;top:71px}.d3{left:38%;top:86px}.flow{position:absolute;height:3px;background:#4eb8e7;transform:rotate(15deg);border-radius:4px;box-shadow:0 0 7px #44bced}.f1{left:34%;top:112px;width:31%}.f2{left:49%;top:145px;width:27%}.street{position:absolute;left:0;right:0;bottom:17px;text-align:center;font-size:7px;letter-spacing:2px;color:#71898e}.sensor-station{position:absolute;right:27%;top:43px;text-align:center;z-index:2}.sensor-station>i{display:block;width:11px;height:35px;margin:auto;border-radius:6px 6px 2px 2px;background:#192d35;border:2px solid #63ddd4;box-shadow:0 0 0 4px #39d4ca1c}.sensor-station b,.sensor-station small{display:block}.sensor-station b{font-size:7px;color:#74e2da;margin-top:3px}.sensor-station small{font-size:6px;color:#759099}.park{position:absolute;left:53%;bottom:39px;width:155px;height:78px;border:2px dashed #37d3a1;border-radius:35% 35% 14px 14px;background:#174b3cdd;text-align:center;padding-top:9px;opacity:.28;transform:scale(.86)}.after .park{opacity:1;transform:scale(1);box-shadow:0 0 25px #25d49b33}.park span,.park b,.park small{display:block}.park span{font-size:17px;color:#5ae0af}.park b{font-size:9px}.park small{font-size:7px;color:#82aa9e}.pool{position:absolute;right:5%;bottom:37px;width:125px;height:48px;border-radius:50% 50% 15px 15px;background:#176b9bba;border:1px solid #65c9f2;text-align:center;padding-top:9px}.after .pool{width:78px;background:#175c75aa}.pool b,.pool small{display:block}.pool b{font-size:11px}.pool small{font-size:7px;color:#a1d8ec}.drain{position:absolute;right:4%;top:19px;color:#80969d}.drain span,.drain b{display:block;text-align:center}.drain span{font-size:20px;color:#54d6cd}.drain b{font-size:7px}.process-steps{display:grid;grid-template-columns:auto 1fr auto 1fr auto 1fr auto;align-items:center;margin-top:13px}.process-steps>div{display:flex;gap:8px;align-items:center}.process-steps>div>span{width:25px;height:25px;border-radius:7px;display:grid;place-items:center;background:#11333c;color:#57d9d0;font-size:8px;font-weight:800}.process-steps p,.process-steps b,.process-steps small{display:block;margin:0}.process-steps b{font-size:9px}.process-steps small{font-size:7px;color:#69848e;max-width:130px}.process-steps>i{height:1px;background:#24414b;margin:0 10px}.impact-heading{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:12px}.impact-heading h2{font-size:14px;margin:4px 0 0}.impact-heading>span{font-size:8px;color:#55d9cd;background:#10333c;padding:6px 9px;border-radius:20px}.impact-comparison{display:grid;grid-template-columns:1.15fr repeat(3,1fr);border:1px solid var(--line);border-radius:9px;overflow:hidden}.impact-comparison>div{display:grid;grid-template-rows:repeat(3,auto);padding:11px;border-left:1px solid var(--line)}.impact-comparison>div:first-child{border-left:0;background:#0c2933}.impact-comparison span{font-size:7px;color:#6b8690;text-transform:uppercase}.impact-comparison b{font-size:10px;margin:6px 0}.impact-comparison strong{font-size:11px;color:#56d7cc}.impact-comparison em{font-style:normal;font-size:7px;color:#54d5a3}.configurator{height:max-content;position:sticky;top:88px}.config-head{padding-bottom:15px;border-bottom:1px solid var(--line);margin-bottom:14px}.config-head h2{font-size:16px;margin:4px 0}.configurator .field{margin-bottom:13px}.range-field{display:block;margin:16px 0}.range-field>span{display:flex;justify-content:space-between;align-items:center}.range-field b{font-size:9px}.range-field strong{font-size:11px;color:#5edbd3}.range-field input{width:100%;accent-color:#33d1c8;margin:10px 0 4px}.range-field>small{display:block;font-size:7px;color:#627d87}.design-output{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:14px 0}.design-output>div{padding:10px;background:#0c2832;border-radius:7px}.design-output small,.design-output b{display:block}.design-output small{font-size:6px;color:#607b86}.design-output b{font-size:10px;margin-top:4px}.score{padding:13px;background:#0d302f;border:1px solid #1b5b56;border-radius:9px}.score>span{display:flex;justify-content:space-between;align-items:center}.score small{font-size:7px;color:#74a49f}.score b{font-size:18px;color:#5ce0d6}.score>div{height:5px;background:#173d40;border-radius:8px;overflow:hidden;margin:8px 0}.score i{display:block;height:100%;background:#35d2c8}.score p{font-size:7px;color:#71908f;margin:0}.evaluate{width:100%;margin-top:12px}.alternatives-head{display:flex;justify-content:space-between;align-items:flex-end;margin:22px 0 10px}.alternatives-head h2{font-size:16px;margin:0}.alternatives-head>span{font-size:8px;color:#68838d}.candidate-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.candidate{text-align:left;padding:15px;color:#c9dce0;cursor:pointer}.candidate:hover,.candidate.selected{border-color:#36bdb4;background:#0c2932}.candidate-top{display:flex;justify-content:space-between}.candidate-top span{font-size:7px;color:#57d9cf}.candidate-top b{font-size:9px}.candidate h3{font-size:12px;margin:11px 0 3px}.candidate>p{font-size:8px;color:#66818b;margin:0 0 12px}.candidate>div:nth-of-type(2){display:grid;grid-template-columns:repeat(3,1fr);gap:5px}.candidate>div:nth-of-type(2)>span{padding:8px;background:#0b252f;border-radius:6px}.candidate small,.candidate span b{display:block}.candidate small{font-size:6px;color:#5f7a85}.candidate span b{font-size:8px;margin-top:3px}.candidate>strong{display:block;font-size:8px;color:#55d8ce;margin-top:11px}.approval{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:14px;padding:18px;margin-top:14px;border-color:#26766d;background:linear-gradient(90deg,#0c292e,#0a222c)}.approval-icon{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:#164d3d;color:#5de0ad;font-weight:900}.approval small{font-size:7px;letter-spacing:1px;color:#59d7ad}.approval h2{font-size:13px;margin:4px 0}.approval p{font-size:8px;color:#718b93;margin:0}.approval-actions{display:flex;gap:8px}
    .solution-view{padding:22px;background:linear-gradient(150deg,#0a202a,#0a1d27)}.solution-heading{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;padding-bottom:18px;border-bottom:1px solid #1a3c47}.solution-heading>div:first-child>small{font-size:8px;letter-spacing:1.2px;color:#54d8ce}.solution-heading h2{font-size:20px;margin:5px 0}.solution-heading p{font-size:10px;color:#78919a;margin:0}.headline-stats{display:flex;align-items:stretch;gap:9px}.headline-stats>div:first-child{min-width:125px;padding:11px 14px;border:1px solid #21434c;border-radius:11px;background:#0c2832}.headline-stats small,.headline-stats b{display:block}.headline-stats small{font-size:7px;color:#65838d}.headline-stats b{font-size:17px;color:#d9e9ec;margin-top:4px}.reduction-badge{min-width:105px;text-align:right;padding:9px 13px;background:linear-gradient(145deg,#123c31,#102f2a);border:1px solid #28604e;border-radius:11px}.reduction-badge b,.reduction-badge span{display:block}.reduction-badge b{font-size:24px;color:#5de0ad}.reduction-badge span{font-size:7px;color:#86aa9d;text-transform:uppercase}.scenario-comparison{display:grid;grid-template-columns:1fr;align-items:stretch;gap:10px;margin-top:18px}.scenario-panel{border:1px solid #1c414c;border-radius:13px;overflow:hidden;background:#0a222c;box-shadow:0 10px 28px #020b1047}.scenario-panel.improved{border-color:#277467;box-shadow:0 12px 34px #06302955}.scenario-panel>header{min-height:72px;display:grid;grid-template-columns:38px 1fr auto;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid #17343f;background:#0b2530}.scenario-panel.improved>header{background:#0d2b2d}.scenario-number{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:#352429;color:#ff8a82;font-size:10px;font-weight:800}.success-number{background:#143b31;color:#5de0ad}.scenario-panel header small{font-size:8px;letter-spacing:1px;color:#66828c}.scenario-panel header h3{font-size:13px;line-height:1.35;margin:4px 0 0}.status{white-space:nowrap;font-size:8px;padding:6px 9px;border-radius:15px}.status.danger{color:#ff9189;background:#402226}.status.success{color:#5de0ad;background:#153d32}.scenario-canvas{height:270px;position:relative;overflow:hidden;background:linear-gradient(180deg,#0a2c3a 0 42%,#173b35 42% 48%,#273b3e 48% 100%)}.scenario-canvas:after{content:'SUPERFICIE URBANA';position:absolute;left:0;right:0;bottom:10px;text-align:center;font-size:7px;letter-spacing:2px;color:#6b858c}.rain-source{position:absolute;left:7%;top:24px;text-align:center;z-index:4}.rain-source span,.rain-source b,.rain-source small{display:block}.rain-source span{font-size:38px;color:#92cee5}.rain-source b{font-size:15px;color:#8ed7f4}.rain-source small{font-size:8px;color:#78959f}.terrain-label{position:absolute;z-index:3;font-size:7px;letter-spacing:1.2px;color:#829aa1}.terrain-label.high{left:27%;top:108px}.terrain-label.low{right:7%;top:156px}.slope-line{position:absolute;left:22%;right:-8%;top:98px;height:125px;background:linear-gradient(160deg,transparent 0 30%,#4b6957 31% 37%,#2a4a42 38% 100%);clip-path:polygon(0 0,100% 48%,100% 100%,0 100%)}.flow-track{position:absolute;z-index:2;left:29%;top:125px;width:52%;height:5px;border-radius:6px;background:linear-gradient(90deg,#65cef7,#2ba7dc);transform:rotate(15deg);box-shadow:0 0 11px #54c9f1}.flow-track.controlled{width:29%}.runoff-arrow{position:absolute;z-index:3;color:#9be3ff;font-size:31px;transform:rotate(15deg);text-shadow:0 0 8px #55c8ef}.runoff-arrow.a1{left:38%;top:106px}.runoff-arrow.a2{left:59%;top:143px}.flow-caption{position:absolute;z-index:4;left:28%;top:177px;padding:9px 11px;border-radius:8px;background:#0a2029e8;border:1px solid #245161}.flow-caption b,.flow-caption small{display:block}.flow-caption b{font-size:9px;color:#9ddcf2}.flow-caption small{font-size:7px;color:#78949e;margin-top:3px}.water-body{position:absolute;right:5%;bottom:32px;width:150px;height:76px;border-radius:55% 55% 14px 14px;background:linear-gradient(180deg,#1e88bd,#176a95);border:2px solid #72d2f7;text-align:center;padding-top:9px;z-index:5;box-shadow:0 0 26px #168fd05c}.water-body.reduced{width:105px;height:60px;background:linear-gradient(180deg,#227c9d,#175b75);padding-top:7px}.water-body span{display:inline-block;padding:2px 7px;border-radius:9px;background:#092b3bbd;font-size:7px;color:#a8e4fa}.water-body b,.water-body small{display:block}.water-body b{font-size:16px;margin-top:3px}.water-body small{font-size:8px;color:#acdcec}.absorption-park{position:absolute;left:44%;bottom:32px;width:190px;height:116px;border:2px solid #45d7a4;border-radius:38% 38% 12px 12px;background:linear-gradient(180deg,#1a5b46f0,#16483bf0);text-align:center;padding-top:11px;z-index:5;box-shadow:0 0 28px #3bd8a145}.absorption-park span,.absorption-park b,.absorption-park small,.absorption-park em{display:block}.absorption-park span{font-size:21px;color:#65e2b2}.absorption-park b{font-size:10px}.absorption-park small{font-size:8px;color:#a0c9bb;margin-top:3px}.absorption-park>i{display:block;width:70%;height:6px;margin:8px auto 5px;border-bottom:2px dotted #5bcfba}.absorption-park em{font-size:7px;color:#83b2a4;font-style:normal}.scenario-summary{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:13px 15px;background:#091f29}.scenario-summary>div{position:relative;padding:12px 13px;background:#0d2a34;border:1px solid #153844;border-radius:8px}.scenario-summary small,.scenario-summary b,.scenario-summary em{display:block}.scenario-summary small{font-size:7px;color:#607b85}.scenario-summary b{font-size:13px;margin-top:5px}.scenario-summary em{position:absolute;right:12px;bottom:13px;font-size:8px;color:#718a92;font-style:normal}.scenario-summary em.positive{color:#5bdba9}.change-arrow{display:flex;align-items:center;justify-content:center;flex-direction:row;gap:11px;padding:4px 0;text-align:center;color:#5ddbd2}.change-arrow>small{font-size:7px;letter-spacing:1px;color:#6f8c95}.change-arrow>span{width:42px;height:42px;margin:0;border-radius:50%;display:grid;place-items:center;background:linear-gradient(145deg,#164b4c,#11353d);border:1px solid #318c86;font-size:21px;box-shadow:0 0 0 5px #2dd4bf0d;transform:rotate(90deg)}.change-arrow b{font-size:10px}.change-arrow em{font-size:8px;color:#738e97;font-style:normal}.result-strip{display:grid;grid-template-columns:auto 1fr auto 1fr auto 1fr auto;align-items:center;padding:15px 16px;margin-top:15px;background:#091f29;border:1px solid #173640;border-radius:10px}.result-strip>div{display:flex;align-items:center;gap:9px}.result-strip>div>span{width:29px;height:29px;border-radius:8px;display:grid;place-items:center;background:#123b3c;color:#5adbd0;font-size:9px;font-weight:800}.result-strip p,.result-strip b,.result-strip small{display:block;margin:0}.result-strip b{font-size:10px}.result-strip small{font-size:8px;color:#6d8791}.result-strip>i{height:1px;background:linear-gradient(90deg,#2b8a82,#24424c);margin:0 12px}
    .flow-diagram{height:auto;min-height:250px;position:relative;display:grid;grid-template-columns:180px minmax(150px,1fr) 220px;grid-template-rows:1fr auto;align-items:center;gap:18px;padding:24px;background:radial-gradient(circle at 15% 25%,#123b4938,transparent 30%),#081f29}.flow-diagram:after{display:none}.improved-flow{grid-template-columns:155px minmax(95px,1fr) 230px minmax(95px,1fr) 175px;background:radial-gradient(circle at 50% 45%,#1b6a4a30,transparent 34%),#081f29}.flow-node{min-height:138px;display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center;padding:15px;border:1px solid #28505c;border-radius:14px;background:linear-gradient(155deg,#0e303b,#0b2731);box-shadow:0 10px 22px #020d124f}.flow-node .node-icon{font-size:31px;line-height:1;color:#90d5ee;margin-bottom:9px}.flow-node small,.flow-node strong,.flow-node em{display:block}.flow-node small{font-size:7px;letter-spacing:1px;color:#72909a}.flow-node strong{font-size:24px;color:#dff2f5;margin:5px 0}.flow-node em{font-size:8px;line-height:1.35;color:#7f9aa3;font-style:normal}.diagram-link{display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center;min-width:0}.diagram-link>span{position:relative;width:100%;height:4px;margin-bottom:11px;border-radius:5px;background:#52bfee;box-shadow:0 0 10px #4cbfe8}.diagram-link>span:after{content:'›';position:absolute;right:-3px;top:50%;transform:translateY(-53%);font-size:29px;line-height:1;color:#8ee0ff}.diagram-link b{font-size:10px;color:#b9dbe4}.diagram-link small{font-size:8px;color:#6f8c95;margin-top:3px;line-height:1.35}.danger-node{border-color:#4b7790;background:linear-gradient(155deg,#12394a,#0d2c39)}.danger-node .node-icon{color:#70cdf4}.danger-node strong{color:#87dcff}.park-node{min-height:165px;border:2px solid #3fd6a1;background:linear-gradient(155deg,#174c3c,#10372f);box-shadow:0 12px 28px #0a3f2c66}.park-node .node-icon,.park-node strong{color:#62e3b1}.park-node>div{display:flex;gap:5px;margin-top:10px}.park-node>div span{padding:4px 6px;border-radius:10px;background:#0d2e28;color:#8dd9bd;font-size:6px}.controlled-link>span,.outlet-link>span{background:#45d3a3;box-shadow:0 0 10px #3bd19c}.controlled-link>span:after,.outlet-link>span:after{color:#6de5b8}.safe-node{border-color:#337c6a;background:linear-gradient(155deg,#123e39,#0d302f)}.safe-node .node-icon,.safe-node strong{color:#65dfb0}.diagram-conclusion{grid-column:1/-1;display:flex;align-items:center;gap:11px;padding:11px 13px;border-radius:9px}.diagram-conclusion>i{width:28px;height:28px;display:grid;place-items:center;border-radius:8px;font-size:13px;font-style:normal;font-weight:900}.diagram-conclusion p,.diagram-conclusion b,.diagram-conclusion span{display:block;margin:0}.diagram-conclusion b{font-size:9px}.diagram-conclusion span{font-size:8px;margin-top:2px}.danger-conclusion{border:1px solid #54333a;background:#2b1f25;color:#cfa4a8}.danger-conclusion>i{background:#47252c;color:#ff8b83}.success-conclusion{border:1px solid #245e50;background:#102f2a;color:#99c9b7}.success-conclusion>i{background:#174438;color:#60e0ad}
    @media(max-width:1150px){.workspace{grid-template-columns:1fr}.configurator{position:static}.candidate-grid{grid-template-columns:1fr 1fr}.handoff-step{min-width:0}.handoff>i{display:none}}@media(max-width:720px){.handoff{align-items:stretch;flex-direction:column}.handoff>.btn{margin-left:0}.evidence-grid,.impact-comparison{grid-template-columns:1fr 1fr}.sensor-row{grid-template-columns:auto 1fr auto}.sensor-row>em,.sensor-row>mark{display:none}.result-strip{grid-template-columns:1fr 1fr;gap:10px}.result-strip>i{display:none}.approval{grid-template-columns:1fr}.approval-actions{flex-direction:column}.candidate-grid{grid-template-columns:1fr}.solution-heading{align-items:flex-start;gap:12px;flex-direction:column}.headline-stats{width:100%;justify-content:flex-end}.flow-diagram,.improved-flow{grid-template-columns:1fr;grid-template-rows:auto;padding:16px}.diagram-link>span{width:4px;height:42px;margin:0 0 8px}.diagram-link>span:after{right:auto;left:50%;top:auto;bottom:-13px;transform:translateX(-50%) rotate(90deg)}.diagram-conclusion{grid-column:1}.flow-node{width:100%;min-height:125px}}@media(max-width:480px){.evidence-grid,.impact-comparison{grid-template-columns:1fr}.impact-comparison>div{border-left:0;border-top:1px solid var(--line)}.headline-stats{justify-content:stretch}.headline-stats>div{flex:1}.scenario-panel>header{grid-template-columns:34px 1fr}.scenario-panel header .status{grid-column:2;width:max-content}}
  `, `
    .solution-lock{display:flex;gap:10px;align-items:flex-start;padding:12px;margin:4px 0 14px;border:1px solid #24635f;border-radius:9px;background:#0d302f}.solution-lock>span{width:30px;height:30px;flex:0 0 auto;display:grid;place-items:center;border-radius:8px;background:#164940;color:#5de0ad;font-size:16px}.solution-lock small,.solution-lock b,.solution-lock p{display:block;margin:0}.solution-lock small{font-size:6px;letter-spacing:.8px;color:#61cfc6}.solution-lock b{font-size:10px;margin:3px 0}.solution-lock p{font-size:7px;line-height:1.4;color:#78928f}
    .module-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:10px 0 13px}.module-summary>div{padding:9px;background:#091f29;border:1px solid #163a44;border-radius:7px}.module-summary small,.module-summary b{display:block}.module-summary small{font-size:5.5px;color:#607d87}.module-summary b{font-size:10px;margin-top:4px;color:#d9eaed}
    .bioassembly{display:grid;grid-template-columns:310px 1fr;gap:22px;padding:20px}.assembly-intro{display:flex;gap:13px;align-items:flex-start;padding-right:20px;border-right:1px solid var(--line)}.assembly-intro>span{min-width:68px;height:68px;display:grid;place-items:center;border-radius:14px;background:#16483b;border:1px solid #2d8a70;color:#61e0ad;font-size:13px;font-weight:800}.assembly-intro small{font-size:7px;color:#57d8ce;letter-spacing:1px}.assembly-intro h3{font-size:14px;margin:5px 0}.assembly-intro p{font-size:8px;line-height:1.5;color:#718b94;margin:0}.assembly-layers{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.assembly-layers>div{padding:11px;background:#0b2731;border:1px solid #173a45;border-radius:9px}.assembly-layers b,.assembly-layers small{display:block}.assembly-layers b{font-size:9px;margin:8px 0 3px}.assembly-layers small{font-size:7px;line-height:1.4;color:#6f8992}.layer{display:block;width:100%;height:7px;border-radius:6px}.vegetation{background:#48d49d}.pond{background:#50bceb}.filter{background:#7b5b38}.sand{background:#d0b46b}.gravel{background:repeating-linear-gradient(90deg,#77858b 0 7px,#44535a 7px 11px)}.pipe{background:linear-gradient(90deg,#4f6570 0 35%,#5ee0d5 35% 65%,#4f6570 65%)}
    .technical-conditions{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:10px}.technical-conditions article{padding:14px}.technical-conditions small,.technical-conditions b{display:block}.technical-conditions small{font-size:6px;letter-spacing:.8px;color:#55d8ce}.technical-conditions b{font-size:9px;margin:6px 0}.technical-conditions p{font-size:7px;line-height:1.45;color:#6f8992;margin:0}
    @media(max-width:1150px){.bioassembly{grid-template-columns:1fr}.assembly-intro{border-right:0;border-bottom:1px solid var(--line);padding:0 0 16px}.technical-conditions{grid-template-columns:1fr 1fr}}@media(max-width:720px){.assembly-layers{grid-template-columns:1fr 1fr}}@media(max-width:480px){.assembly-layers,.module-summary,.technical-conditions{grid-template-columns:1fr}}
  `, `
    .simulate-link{display:flex;align-items:center;justify-content:center;width:100%;min-height:38px;margin-top:8px;color:#062329;background:linear-gradient(90deg,#64dfb2,#45d4ca);border:0;font-weight:800;box-shadow:0 8px 22px #39d0b526}
    .simulate-link:hover{filter:brightness(1.06);transform:translateY(-1px)}
    .transfer-note{display:block;padding:8px 10px;margin-top:7px;border-radius:7px;background:#0a252d;color:#6f9095;font-size:7px;line-height:1.45;text-align:center}
    .handoff{display:grid;grid-template-columns:auto 20px auto 20px auto 20px auto;justify-content:start}
    .handoff-step{min-width:150px}.handoff-step.active+ i{color:#4bcfc5}
    @media(max-width:1250px){.handoff{grid-template-columns:1fr auto 1fr auto 1fr auto 1fr}.handoff-step{min-width:0}}
  `],
})
export class GreenInfrastructureComponent {
  readonly zoneId = signal('Z-01');
  readonly rainfall = signal(38);
  readonly cellCount = signal(3);
  readonly moduleType = signal<'A' | 'B'>('A');
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
  readonly cellWidth = computed(() => this.moduleType() === 'A' ? 2 : 1.2);
  readonly area = computed(() => +(this.cellCount() * 10 * this.cellWidth()).toFixed(1));
  readonly treatedArea = computed(() => +(this.area() * 5).toFixed(1));
  readonly corridorLength = computed(() => +(this.cellCount() * 10 + Math.max(0, this.cellCount() - 1) * 1.75).toFixed(1));
  readonly captureCapacity = computed(() => +(this.area() * .275).toFixed(1));
  readonly currentWater = computed(() => +(this.rainfall() / 1000 * (this.treatedArea() * .90 + this.area())).toFixed(1));
  readonly managedWater = computed(() => +(Math.min(this.currentWater(), this.captureCapacity()).toFixed(1)));
  readonly projectedWater = computed(() => +(Math.max(0, this.currentWater() - this.managedWater()).toFixed(1)));
  readonly waterReduction = computed(() => this.currentWater() ? Math.round(this.managedWater() / this.currentWater() * 100) : 0);
  readonly currentPeak = computed(() => +(this.cellCount() * .95).toFixed(2));
  readonly inletCapacity = computed(() => +(this.cellCount() * 4.4).toFixed(1));
  readonly inletSafetyFactor = computed(() => +(this.inletCapacity() / this.currentPeak()).toFixed(1));
  readonly estimatedScore = computed(() => Math.min(95, Math.max(52, Math.round(58 + this.waterReduction() * .3 + this.cellCount() * 2 - Math.max(0, this.integratedRiskScore() - 75) * .15))));

  constructor(public hydro: HydroService, route: ActivatedRoute) {
    route.queryParamMap.subscribe(params => {
      const requestedZone = params.get('zone');
      const rain = Number(params.get('rain'));
      if (requestedZone && this.hydro.zones().some(zone => zone.id === requestedZone)) this.zoneId.set(requestedZone);
      if (Number.isFinite(rain) && rain > 0) this.rainfall.set(rain);
      else if (this.hydro.demoArea() === 'belem') this.rainfall.set(50);
      this.applyRecommendedCells();
    });
  }

  changeZone(id: string) {
    this.zoneId.set(id);
    this.applyRecommendedCells();
    this.markChanged();
  }
  changeModule(type: 'A' | 'B') { this.moduleType.set(type); this.cellCount.set(type === 'A' ? 3 : 5); this.markChanged(); }
  markChanged() { this.evaluated.set(false); this.saved.set(false); }
  evaluate() {
    this.evaluated.set(true);
    this.viewMode.set('after');
    this.saved.set(false);
    this.persistPlan('evaluated');
  }
  savePlan() {
    this.persistPlan('saved');
    this.saved.set(true);
  }
  riskLabel() { return this.selectedZone().risk === 'alto' ? 'Riesgo alto' : this.selectedZone().risk === 'medio' ? 'Riesgo medio' : 'Riesgo bajo'; }
  problemStatement() { return 'La topografía y el pronóstico indican aumento de escorrentía con capacidad limitada de infiltración local.'; }
  objectiveStatement() { return 'Captar parte del volumen antes de que alcance el punto crítico y reducir la profundidad y el tiempo de permanencia del agua.'; }
  scoreMessage() { return this.estimatedScore() >= 80 ? 'Configuración prioritaria para avanzar a validación técnica.' : this.estimatedScore() >= 65 ? 'Configuración viable; ajusta la cantidad de celdas al espacio disponible.' : 'Se recomienda aumentar módulos o revisar la ubicación.'; }
  private applyRecommendedCells() {
    const intervention = this.hydro.interventions().find(item => item.zone === this.selectedZone().name);
    this.moduleType.set(intervention?.moduleType ?? 'A');
    this.cellCount.set(intervention?.cells ?? (this.moduleType() === 'A' ? 3 : 5));
  }
  private persistPlan(status: 'evaluated' | 'saved') {
    localStorage.setItem('pomerape-intervention-plan', JSON.stringify({
      status,
      zoneId: this.zoneId(),
      zoneName: this.selectedZone().name,
      rainfall: this.rainfall(),
      verificationIntensity: 63,
      solution: 'Bioesponja modular urbana',
      moduleType: this.moduleType(),
      cells: this.cellCount(),
      cellDimensions: `10 x ${this.cellWidth()} m`,
      area: this.area(),
      treatedArea: this.treatedArea(),
      corridorLength: this.corridorLength(),
      captureCapacity: this.captureCapacity(),
      reduction: this.waterReduction(),
      integratedRisk: this.integratedRiskScore(),
      validation: 'Anteproyecto técnico; requiere topografía de detalle, napa, permeabilidad, ancho de vía y punto de conexión',
      updatedAt: new Date().toISOString(),
    }));
  }
  private zoneSector() { return this.selectedZone().name.replace('Sector ', '').replace('Corredor ', '').replace(' Sur', ''); }
}
