import { DecimalPipe } from '@angular/common';
import { Component, OnDestroy, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-bio-sponge-model',
  standalone: true,
  imports: [DecimalPipe, FormsModule, RouterLink],
  template: `
    <section class="page-head">
      <div><div class="eyebrow">Modelo operativo</div><h1>Simulador de bioesponja</h1><p>Observa cómo la solución recibe, almacena, filtra y libera el agua durante un evento de lluvia.</p></div>
      <span class="badge green">Modelo local · sin backend</span>
    </section>

    <section class="model-overview" aria-label="Resumen del diseño">
      <div class="overview-lead"><span>01</span><p><small>CONFIGURACIÓN ACTIVA</small><b>Red Bioesponja · módulo {{moduleType()}}</b></p></div>
      <div><small>SUPERFICIE INSTALADA</small><b>{{cellArea()}} m²</b><em>{{cellCount()}} celdas conectadas</em></div>
      <div><small>ÁREA URBANA ATENDIDA</small><b>{{treatedArea()}} m²</b><em>Relación de aporte 5:1</em></div>
      <div><small>ALMACENAMIENTO</small><b>{{storageCapacity()}} m³</b><em>0,275 m³ por m²</em></div>
      <div><small>EVENTO ANALIZADO</small><b>{{eventRain()}} mm</b><em>{{duration() | number:'1.0-0'}} min equivalentes</em></div>
    </section>

    <section class="model-layout">
      <article class="card stage-card">
        <div class="stage-head">
          <div><small>SECCIÓN LONGITUDINAL INTERACTIVA</small><h2>{{cellCount()}} celdas módulo {{moduleType()}} · corredor de {{corridorLength()}} m</h2><p>Recorrido del agua desde la calzada hasta la infiltración y descarga controlada.</p></div>
          <div class="stage-status" [class.running]="running()"><i></i>{{running() ? 'Simulación en curso' : progress() === 100 ? 'Evento completado' : 'Preparado'}}</div>
        </div>

        <div class="model-stage" [class.is-raining]="running()">
          <div class="stage-reference"><span>EVENTO</span><b>{{eventRain()}} mm/24 h</b><small>Intensidad de control {{rainIntensity()}} mm/h</small></div>
          <div class="sky">
            <div class="cloud">☁<span>{{rainIntensity()}} mm/h</span></div>
            @for(drop of rainDrops; track $index){<i class="drop" [style.left.%]="drop.x" [style.animation-delay.ms]="drop.delay"></i>}
          </div>
          <div class="inlet-callout"><span>01</span><p><b>Entrada lateral</b><small>Reja a 45° + sedimentador</small></p></div>
          <div class="flow-callout"><span>02</span><p><b>Escorrentía captada</b><small>Desde {{treatedArea()}} m² de superficie</small></p></div>
          <div class="street"><span>SUPERFICIE URBANA · {{treatedArea()}} m² ATENDIDOS</span><i class="runoff"></i></div>
          <div class="cells" [style.--cells]="cellCount()">
            @for(cell of cellsArray(); track cell){
              <div class="bio-cell" [class.has-percolation]="progress() > 2">
                <b class="cell-id">CELDA {{cell + 1}}</b>
                <div class="vegetation" [class.vegetation-alt]="cell % 2 === 1" aria-hidden="true">
                  <span class="tree tree-main"><i></i></span>
                  <span class="tree tree-young"><i></i></span>
                  <span class="shrub shrub-left"></span>
                  <span class="shrub shrub-right"></span>
                  <span class="grass"><i></i><i></i><i></i><i></i><i></i></span>
                </div>
                <div class="planting-surface"><span>Mulch + suelo vegetal</span></div>
                <div class="surface-water" [style.height.%]="surfaceFill()"><span>{{surfaceFill() | number:'1.0-0'}}%</span></div>
                <div class="soil filter"><i class="wetting-front" [style.height.%]="filterWetness()"></i><span>Suelo arenoso filtrante · 40 cm</span><i class="roots"></i><i class="water-drop d1"></i><i class="water-drop d2"></i></div>
                <div class="soil sand"><i class="wetting-front" [style.height.%]="sandWetness()"></i><span>Arena lavada · 10 cm</span><i class="water-drop d3"></i></div>
                <div class="soil gravel"><i class="wetting-front" [style.height.%]="gravelWetness()"></i><span>Grava graduada · 30 cm</span><i class="pipe" [class.pipe-active]="drainActive()"></i><i class="water-drop d4"></i></div>
              </div>
            }
          </div>
          <div class="depth-scale"><b>1,10 m</b><i></i><span>perfil total</span></div>
          <div class="layer-legend"><strong>AVANCE DEL AGUA</strong><span><i class="vegetal"></i>Vegetación nativa</span><span><i class="pond"></i>Lámina superficial <b>{{surfaceFill() | number:'1.0-0'}}%</b></span><span><i class="media"></i>Suelo filtrante <b>{{filterWetness() | number:'1.0-0'}}%</b></span><span><i class="transition"></i>Arena lavada <b>{{sandWetness() | number:'1.0-0'}}%</b></span><span><i class="aggregate"></i>Grava y dren <b>{{gravelWetness() | number:'1.0-0'}}%</b></span></div>
          <div class="groundwater" [style.opacity]=".18 + subsoilFill()/125"><span>Humedad del perfil {{profileWetness() | number:'1.0-0'}}% · almacenamiento subsuperficial {{subsoilFill() | number:'1.0-0'}}%</span></div>
          <div class="outlet" [class.closed]="!valveOpen()"><span>→</span><b>Salida regulada</b><small>{{valveOpen() ? (tide()==='alta' ? 'Caudal restringido por marea alta' : 'Descarga disponible') : 'Válvula cerrada'}}</small></div>
        </div>

        <div class="timeline-head"><span>AVANCE DEL EVENTO</span><b>{{progress()}}%</b></div>
        <div class="timeline"><i [style.width.%]="progress()"></i><span [style.left.%]="progress()">{{elapsedMinutes() | number:'1.0-0'}} min</span></div>
        <div class="balance-grid">
          <div><small>APORTE ACUMULADO</small><b>{{inflow() | number:'1.1-1'}} m³</b><span>Desde {{treatedArea()}} m² de calle</span></div>
          <div class="cyan"><small>AGUA ALMACENADA</small><b>{{stored() | number:'1.1-1'}} m³</b><span>Capacidad {{storageCapacity()}} m³</span></div>
          <div class="green"><small>INFILTRADA</small><b>{{infiltrated() | number:'1.1-1'}} m³</b><span>Transferida al suelo</span></div>
          <div><small>DESCARGA REGULADA</small><b>{{discharged() | number:'1.1-1'}} m³</b><span>Hacia la red pluvial</span></div>
          <div [class.alert]="overflow() > 0"><small>REBALSE</small><b>{{overflow() | number:'1.1-1'}} m³</b><span>{{overflow() > 0 ? 'Se supera la capacidad' : 'Sin rebalse'}}</span></div>
        </div>
      </article>

      <aside class="card controls">
        <div class="control-head"><small>PANEL DE OPERACIÓN</small><h2>Configurar escenario</h2><p>Ajusta el evento y observa el balance hidráulico en tiempo real.</p></div>
        <div class="control-section-title"><span>01</span><div><b>Geometría del sistema</b><small>Dimensiones del corredor</small></div></div>
        <label class="field">TIPO DE MÓDULO<select class="form-control" [ngModel]="moduleType()" (ngModelChange)="changeModule($event)"><option value="A">A · 10 × 2 m · vía ≥ 5 m</option><option value="B">B · 10 × 1,2 m · vía de 3 a 5 m</option></select></label>
        <label class="range-field"><span><b>Cantidad de celdas</b><strong>{{cellCount()}}</strong></span><input type="range" min="1" max="8" step="1" [ngModel]="cellCount()" (ngModelChange)="cellCount.set(+$event);reset()"><small>{{corridorLength()}} m de corredor · {{cellArea()}} m² instalados</small></label>
        <div class="control-section-title"><span>02</span><div><b>Evento hidrológico</b><small>Lluvia de diseño y entrada</small></div></div>
        <label class="range-field"><span><b>Lluvia acumulada del evento</b><strong>{{eventRain()}} mm</strong></span><input type="range" min="5" max="150" step="5" [ngModel]="eventRain()" (ngModelChange)="eventRain.set(+$event);reset()"></label>
        <label class="range-field"><span><b>Intensidad para verificar entrada</b><strong>{{rainIntensity()}} mm/h</strong></span><input type="range" min="5" max="150" step="1" [ngModel]="rainIntensity()" (ngModelChange)="rainIntensity.set(+$event);reset()"></label>
        <div class="control-section-title"><span>03</span><div><b>Condición de descarga</b><small>Marea y seguridad hidráulica</small></div></div>
        <label class="field">CONDICIÓN DE MAREA<select class="form-control" [ngModel]="tide()" (ngModelChange)="tide.set($event);reset()"><option value="baja">Marea baja</option><option value="media">Marea media</option><option value="alta">Marea alta</option></select></label>
        <label class="switch"><input type="checkbox" [ngModel]="valveOpen()" (ngModelChange)="valveOpen.set($event);reset()"><span></span><p><b>Válvula de descarga abierta</b><small>Evita el retorno del agua cuando la marea sube.</small></p></label>
        <div class="event-summary"><div><small>DURACIÓN EQUIVALENTE</small><b>{{duration() | number:'1.0-0'}} min</b></div><div><small>VOLUMEN RECIBIDO</small><b>{{expectedInflow() | number:'1.1-1'}} m³</b></div><div><small>CAPACIDAD ESTÁTICA</small><b>{{storageCapacity()}} m³</b></div><div><small>RETENCIÓN ESTÁTICA</small><b>{{retention()}}%</b></div></div>
        <p class="model-note">El balance de diseño es estático y no descuenta la descarga durante la lluvia. La animación operativa sí representa infiltración y salida regulada.</p>
        <button class="btn primary run" (click)="toggle()">{{running() ? 'Pausar simulación' : progress() ? 'Continuar simulación' : 'Iniciar simulación'}}</button>
        <button class="btn ghost reset" (click)="reset()">Reiniciar</button>
        <a class="back" routerLink="/infraestructura-verde">← Volver al dimensionamiento</a>
      </aside>
    </section>

    <section class="card explanation">
      <div><span>1</span><p><b>Recibe</b><small>La escorrentía de la calle entra por una abertura lateral.</small></p></div><i></i><div><span>2</span><p><b>Almacena</b><small>La lámina superficial y la grava amortiguan el caudal punta.</small></p></div><i></i><div><span>3</span><p><b>Filtra e infiltra</b><small>El sustrato retiene sedimentos y entrega agua al suelo.</small></p></div><i></i><div><span>4</span><p><b>Libera</b><small>El drenaje entrega solo el excedente de manera gradual.</small></p></div>
    </section>
  `,
  styles: [`
    .model-layout{display:grid;grid-template-columns:minmax(0,1fr) 350px;gap:14px}.stage-card,.controls{padding:18px}.stage-head{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px}.stage-head small,.control-head small{font-size:7px;letter-spacing:1px;color:var(--cyan)}.stage-head h2,.control-head h2{font-size:17px;margin:4px 0}.stage-head p,.control-head p{font-size:8px;color:#718b94;margin:0}.stage-status{display:flex;align-items:center;gap:7px;padding:7px 10px;border-radius:20px;background:#102b35;color:#79939b;font-size:8px}.stage-status i{width:7px;height:7px;border-radius:50%;background:#6b8189}.stage-status.running{color:#65e0d6}.stage-status.running i{background:#51d8ce;box-shadow:0 0 0 4px #51d8ce20;animation:pulse 1s infinite}.model-stage{height:510px;position:relative;overflow:hidden;border:1px solid #19414d;border-radius:14px;background:linear-gradient(#0a2937 0 28%,#263b3d 28% 42%,#172c2d 42% 100%);perspective:900px}.sky{position:absolute;inset:0 0 72%;background:radial-gradient(circle at 20% 30%,#174457,transparent 30%)}.cloud{position:absolute;left:8%;top:24px;font-size:48px;color:#9bd5e9;text-align:center}.cloud span{display:block;font-size:12px;color:#83cce7}.drop{display:none;position:absolute;top:80px;width:2px;height:18px;background:#65c9ee;transform:rotate(14deg);animation:rain .8s linear infinite}.is-raining .drop{display:block}.street{position:absolute;left:0;right:0;top:28%;height:70px;background:linear-gradient(165deg,#354a4b,#243739);clip-path:polygon(0 0,100% 34%,100% 100%,0 70%)}.street>span{position:absolute;left:20px;bottom:7px;font-size:6px;letter-spacing:1.4px;color:#82979b}.runoff{position:absolute;left:12%;right:10%;top:32px;height:4px;background:linear-gradient(90deg,#57c8ef,#38a8d4);transform:rotate(2deg);box-shadow:0 0 12px #42bce9}.runoff:after{content:'›';position:absolute;right:-4px;top:-14px;font-size:30px;color:#85ddfa}.cells{--cells:3;position:absolute;left:8%;right:18%;top:43%;bottom:52px;display:grid;grid-template-columns:repeat(var(--cells),minmax(55px,1fr));gap:7px;transform:rotateX(4deg) rotateY(-5deg)}.bio-cell{position:relative;display:grid;grid-template-rows:24% 43% 11% 22%;border:2px solid #42d6a2;border-radius:13px 13px 5px 5px;overflow:hidden;background:#132f2d;box-shadow:0 12px 24px #020d1166}.plants{position:absolute;left:0;right:0;top:2px;height:34px;display:flex;justify-content:space-around;z-index:4}.plants i{width:3px;height:27px;background:#51d89f;transform-origin:bottom;transform:rotate(-10deg);border-radius:100% 0}.plants i:nth-child(even){transform:rotate(13deg);height:22px}.surface-water{align-self:end;grid-row:1;min-height:2px;max-height:100%;background:#3ab8e6aa;transition:height .2s;position:relative}.surface-water span{position:absolute;right:3px;bottom:2px;font-size:6px;color:#d6f3ff}.soil{display:flex;align-items:center;justify-content:center;font-size:6px;color:#d3ded8}.filter{background:repeating-linear-gradient(135deg,#705837,#705837 6px,#604b31 6px,#604b31 12px)}.sand{background:#bca66d;color:#25302b}.gravel{position:relative;background:radial-gradient(circle,#718188 2px,transparent 3px) 0 0/12px 10px,#3b4c52}.pipe{position:absolute;left:8%;right:-7px;bottom:12px;height:7px;border-radius:5px;background:#55d7ce;border:2px solid #18343b}.groundwater{position:absolute;left:0;right:0;bottom:0;height:52px;background:linear-gradient(#2d8db366,#236e8d);transition:opacity .2s}.groundwater span{position:absolute;right:14px;bottom:10px;font-size:7px;color:#b9e7f5}.outlet{position:absolute;right:14px;top:52%;width:135px;padding:10px;border-radius:9px;background:#0b2630e8;border:1px solid #278d86}.outlet>span{float:left;margin-right:8px;font-size:23px;color:#5ce0d6}.outlet b,.outlet small{display:block}.outlet b{font-size:8px}.outlet small{font-size:6px;color:#789399;margin-top:2px}.outlet.closed{border-color:#75504c}.outlet.closed>span{color:#ef766d}.timeline{height:8px;position:relative;margin:17px 0 23px;background:#102d37;border-radius:8px}.timeline>i{display:block;height:100%;border-radius:8px;background:linear-gradient(90deg,#47bce7,#41d4a4)}.timeline>span{position:absolute;top:13px;transform:translateX(-50%);font-size:7px;color:#78949d}.balance-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:7px}.balance-grid>div{padding:11px;border-radius:8px;background:#0c2832;border:1px solid #173a45}.balance-grid small,.balance-grid b,.balance-grid span{display:block}.balance-grid small{font-size:6px;color:#69848e}.balance-grid b{font-size:14px;margin:5px 0}.balance-grid span{font-size:6px;color:#718b94}.balance-grid .cyan b{color:#68d8f4}.balance-grid .green b{color:#5adca9}.balance-grid .alert{border-color:#9d4c45;background:#302024}.balance-grid .alert b{color:#ff8981}.controls{height:max-content;position:sticky;top:88px}.control-head{padding-bottom:14px;border-bottom:1px solid var(--line);margin-bottom:15px}.range-field{display:block;margin:17px 0}.range-field>span{display:flex;justify-content:space-between}.range-field b{font-size:9px}.range-field strong{font-size:10px;color:#5edbd3}.range-field input{width:100%;margin-top:9px;accent-color:#37d2c8}.switch{display:flex;align-items:center;gap:10px;margin:16px 0;cursor:pointer}.switch input{display:none}.switch>span{width:32px;height:18px;padding:2px;border-radius:12px;background:#233c44}.switch>span:after{content:'';display:block;width:14px;height:14px;border-radius:50%;background:#768b91;transition:.2s}.switch input:checked+span{background:#174b43}.switch input:checked+span:after{transform:translateX(14px);background:#50dbc8}.switch p,.switch b,.switch small{display:block;margin:0}.switch b{font-size:8px}.switch small{font-size:6px;color:#6d8891;margin-top:2px}.event-summary{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:15px 0}.event-summary>div{padding:10px;background:#0b2731;border-radius:7px}.event-summary small,.event-summary b{display:block}.event-summary small{font-size:6px;color:#617d87}.event-summary b{font-size:11px;margin-top:4px}.run,.reset{width:100%;margin-top:7px}.back{display:block;text-align:center;margin-top:14px;color:#61d9d0;font-size:8px}.explanation{display:grid;grid-template-columns:auto 1fr auto 1fr auto 1fr auto;align-items:center;margin-top:14px;padding:16px 18px}.explanation>div{display:flex;align-items:center;gap:9px}.explanation>div>span{width:29px;height:29px;display:grid;place-items:center;border-radius:8px;background:#123b3c;color:#59ddd1;font-size:9px;font-weight:800}.explanation p,.explanation b,.explanation small{display:block;margin:0}.explanation b{font-size:9px}.explanation small{max-width:165px;font-size:7px;color:#6d8891;line-height:1.35}.explanation>i{height:1px;background:#28505a;margin:0 13px}@keyframes rain{from{transform:translateY(-20px) rotate(14deg)}to{transform:translateY(320px) rotate(14deg)}}@keyframes percolate{0%{top:-9px;opacity:0}18%{opacity:1}82%{opacity:1}100%{top:calc(100% - 4px);opacity:0}}@keyframes pipe-flow{to{background-position:38px 0}}@keyframes pulse{50%{opacity:.45}}@media(max-width:1100px){.model-layout{grid-template-columns:1fr}.controls{position:static}.model-stage{height:460px}}@media(max-width:720px){.balance-grid{grid-template-columns:1fr 1fr}.cells{left:3%;right:3%;overflow-x:auto}.outlet{display:none}.explanation{grid-template-columns:1fr 1fr;gap:12px}.explanation>i{display:none}}@media(max-width:480px){.stage-head{flex-direction:column;gap:10px}.model-stage{height:420px}.balance-grid,.event-summary{grid-template-columns:1fr}.explanation{grid-template-columns:1fr}}
  `, `.model-note{font-size:7px;line-height:1.45;color:#7f938f;background:#292719;border:1px solid #514a29;border-radius:7px;padding:9px;margin:9px 0}`,
  `
    .model-overview{display:grid;grid-template-columns:1.35fr repeat(4,1fr);margin-bottom:14px;border:1px solid #1a3b47;border-radius:13px;background:linear-gradient(115deg,#0b2530,#091e29);overflow:hidden;box-shadow:0 14px 34px #020b1026}
    .model-overview>div{min-height:74px;padding:14px 16px;border-left:1px solid #183640;display:flex;flex-direction:column;justify-content:center}
    .model-overview>div:first-child{border-left:0}.model-overview small,.model-overview b,.model-overview em{display:block}.model-overview small{font-size:6px;letter-spacing:1px;color:#63828d}.model-overview b{font-size:15px;margin:4px 0 2px;color:#dcecef}.model-overview em{font-size:7px;color:#6f8a94;font-style:normal}
    .model-overview .overview-lead{display:grid;grid-template-columns:38px 1fr;align-items:center;gap:11px;background:linear-gradient(120deg,#0e333b,#0b252f)}.overview-lead>span{width:38px;height:38px;border-radius:10px;background:#155159;color:#63e3d9;display:grid;place-items:center;font-size:10px;font-weight:800}.overview-lead p{margin:0}.overview-lead b{font-size:12px}
    .stage-card{background:linear-gradient(145deg,#0a202a,#081b25);border-color:#1c414d;box-shadow:0 18px 45px #020a0f33}.stage-head{padding:2px 2px 13px;border-bottom:1px solid #163540}.stage-head h2{font-size:19px}.stage-head p{font-size:9px;margin-top:5px}.stage-status{border:1px solid #1e4650;background:#0b2832;padding:8px 12px}
    .model-stage{height:550px;margin-top:15px;border-color:#25505d;background:linear-gradient(#092c3b 0 28%,#304a4b 28% 39%,#16312f 39% 100%);box-shadow:inset 0 0 50px #020c1266,0 14px 30px #02090e55}
    .model-stage:before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,#ffffff06 1px,transparent 1px),linear-gradient(#ffffff05 1px,transparent 1px);background-size:42px 42px;pointer-events:none;z-index:1}
    .stage-reference{position:absolute;z-index:8;left:18px;top:17px;padding:10px 12px;border-radius:9px;background:#071c27d9;border:1px solid #28515d;backdrop-filter:blur(7px)}.stage-reference span,.stage-reference b,.stage-reference small{display:block}.stage-reference span{font-size:6px;letter-spacing:1.1px;color:#66dcd3}.stage-reference b{font-size:12px;margin:4px 0}.stage-reference small{font-size:7px;color:#78939d}
    .cloud{left:auto;right:8%;top:28px}.street{top:28%;height:78px}.runoff{left:13%;right:10%;height:5px}.cells{left:10%;right:17%;top:42%;bottom:58px;gap:10px}.bio-cell{overflow:visible;border-color:#43d7a5;box-shadow:0 14px 30px #020c1166,0 0 0 1px #53e1b52b}.cell-id{position:absolute;top:7px;left:8px;z-index:12;padding:3px 5px;border-radius:4px;background:#0a2727e8;color:#9af1cf;font-size:6px;letter-spacing:.7px}.plants{top:6px}
    .bio-cell>.surface-water,.bio-cell>.soil{overflow:hidden}.planting-surface{position:absolute;z-index:7;left:2px;right:2px;top:22%;height:13px;background:linear-gradient(#5d4028,#382719);border-top:3px solid #253c2c;box-shadow:0 -3px 0 #7c5c37 inset}.planting-surface:before{content:'';position:absolute;inset:2px 4px;background:radial-gradient(ellipse,#b38b56 0 16%,transparent 18%) 0 0/11px 7px;opacity:.75}.planting-surface span{position:absolute;right:4px;bottom:1px;color:#e4ca92;font-size:5px;text-shadow:0 1px 2px #000;white-space:nowrap}
    .vegetation{position:absolute;z-index:10;left:3%;right:3%;bottom:77%;height:84px;pointer-events:none;filter:drop-shadow(0 8px 5px #020b0a88)}.tree{position:absolute;bottom:0;display:block}.tree>i{position:absolute;left:50%;bottom:0;width:5px;height:45px;transform:translateX(-50%);border-radius:3px 3px 0 0;background:linear-gradient(90deg,#69452b,#a87542 46%,#50321f);box-shadow:1px 0 #c18d55 inset}.tree:before,.tree:after{content:'';position:absolute;z-index:2;border-radius:52% 48% 48% 52%;background:radial-gradient(circle at 35% 25%,#78c66f 0 8%,transparent 9%),radial-gradient(circle at 68% 35%,#4d9d58 0 15%,transparent 16%),radial-gradient(circle at 48% 60%,#2f7747 0 32%,#235f3b 58%,#19452f 100%);box-shadow:inset -6px -7px 12px #113f2e99,0 5px 9px #06110d77}.tree-main{left:42%;width:50px;height:80px}.tree-main:before{left:0;top:0;width:50px;height:43px}.tree-main:after{left:8px;top:22px;width:38px;height:33px;transform:rotate(-9deg)}.tree-main>i:before,.tree-main>i:after{content:'';position:absolute;top:12px;width:3px;height:25px;background:#785033;transform-origin:bottom}.tree-main>i:before{left:-8px;transform:rotate(-34deg)}.tree-main>i:after{right:-8px;transform:rotate(34deg)}.tree-young{right:10%;width:29px;height:58px}.tree-young>i{height:34px;width:4px}.tree-young:before{left:0;top:2px;width:29px;height:30px}.tree-young:after{left:7px;top:18px;width:23px;height:22px}.vegetation-alt .tree-main{left:49%;transform:scale(.9)}.vegetation-alt .tree-young{right:auto;left:8%}.shrub{position:absolute;bottom:-1px;width:30px;height:22px;border-radius:55% 55% 22% 22%;background:radial-gradient(circle at 30% 40%,#82be5a 0 10%,transparent 11%),radial-gradient(circle at 66% 35%,#5b9e4f 0 16%,transparent 17%),linear-gradient(#387b47,#20583b);box-shadow:inset -4px -4px 7px #153e2d}.shrub-left{left:3%}.shrub-right{right:28%}.grass{position:absolute;left:25%;bottom:0;width:28px;height:27px;display:flex;align-items:flex-end;justify-content:center;gap:1px}.grass i{display:block;width:3px;height:23px;border-radius:100% 0;background:linear-gradient(#75c774,#33835b);transform-origin:bottom;transform:rotate(-24deg)}.grass i:nth-child(2){height:27px;transform:rotate(-10deg)}.grass i:nth-child(3){height:20px;transform:rotate(3deg)}.grass i:nth-child(4){height:26px;transform:rotate(15deg)}.grass i:nth-child(5){height:19px;transform:rotate(27deg)}
    .filter{position:relative;background:linear-gradient(180deg,#765a38,#63482d 48%,#59432f),repeating-linear-gradient(135deg,#ffffff08 0 5px,transparent 5px 11px)}.filter:after{content:'';position:absolute;inset:0;background:radial-gradient(circle,#9b7b50 0 1px,transparent 1.5px) 0 0/9px 8px;opacity:.45}.filter span,.sand span,.gravel span{position:relative;z-index:4;padding:3px 5px;border-radius:4px;background:#12251f88;text-shadow:0 1px 2px #000}.roots{position:absolute;z-index:3;left:42%;top:0;width:26%;height:88%;opacity:.7;background:linear-gradient(73deg,transparent 46%,#cfb37b 47% 50%,transparent 51%),linear-gradient(105deg,transparent 46%,#b79866 47% 50%,transparent 51%);clip-path:polygon(42% 0,58% 0,100% 100%,0 100%)}.sand{position:relative;background:linear-gradient(#d6be7e,#b99d5d),radial-gradient(circle,#8e743f 1px,transparent 1.5px) 0 0/7px 6px;color:#1d2925}.gravel{position:relative;background-color:#45565c;background-image:radial-gradient(ellipse at 25% 35%,#8c9a9b 0 3px,transparent 3.5px),radial-gradient(ellipse at 70% 65%,#697c80 0 4px,transparent 4.5px),radial-gradient(ellipse at 48% 20%,#a0aaaa 0 2px,transparent 2.5px);background-size:18px 14px,21px 17px,13px 12px}.pipe{z-index:6;background:repeating-linear-gradient(90deg,#55d7ce 0 9px,#16343a 9px 11px);box-shadow:0 0 0 2px #9bebdf44}
    .wetting-front{position:absolute;z-index:2;left:0;right:0;top:0;display:block;min-height:0;background:linear-gradient(180deg,#26bde873,#138cbf55 70%,#65d9f4a8);border-bottom:2px solid #85e8ff;box-shadow:0 5px 12px #1eb8e466;transition:height .22s ease-out}.sand .wetting-front{background:linear-gradient(#48c4e66b,#178cb75c);border-bottom-color:#8be8fa}.gravel .wetting-front{background:linear-gradient(#2aaed06b,#126b966e);border-bottom-color:#67d6ed}.water-drop{display:none;position:absolute;z-index:7;top:-8px;width:3px;height:9px;border-radius:60% 60% 70% 70%;background:#9eeaff;box-shadow:0 0 7px #4ac8f5}.has-percolation .water-drop{display:block;animation:percolate 1.35s linear infinite}.water-drop.d1{left:32%;animation-delay:-.2s}.water-drop.d2{left:68%;animation-delay:-.8s}.water-drop.d3{left:48%;animation-delay:-.45s}.water-drop.d4{left:72%;animation-delay:-1.05s}.pipe.pipe-active{background:repeating-linear-gradient(90deg,#bdf7ff 0 8px,#22bde2 8px 16px,#123b47 16px 19px);background-size:38px 100%;box-shadow:0 0 0 2px #a5f3fc77,0 0 14px #22d3ee;animation:pipe-flow .8s linear infinite}
    .inlet-callout,.flow-callout{position:absolute;z-index:9;display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;background:#071d27e8;border:1px solid #2a5360;box-shadow:0 8px 20px #02090e66}.inlet-callout{left:8%;top:34%}.flow-callout{left:37%;top:31%}.inlet-callout>span,.flow-callout>span{width:23px;height:23px;border-radius:6px;background:#13404a;color:#61ded4;display:grid;place-items:center;font-size:7px;font-weight:800}.inlet-callout p,.flow-callout p{margin:0}.inlet-callout b,.inlet-callout small,.flow-callout b,.flow-callout small{display:block}.inlet-callout b,.flow-callout b{font-size:8px}.inlet-callout small,.flow-callout small{font-size:6px;color:#76909a;margin-top:2px}
    .depth-scale{position:absolute;z-index:7;left:3.2%;top:44%;bottom:13%;width:48px;color:#8ba4ac;text-align:center}.depth-scale i{display:block;position:absolute;right:0;top:5px;bottom:16px;width:8px;border-top:1px solid #66d8cf;border-bottom:1px solid #66d8cf;border-left:1px solid #66d8cf}.depth-scale b{font-size:8px;color:#62ddd3}.depth-scale span{position:absolute;left:-2px;bottom:0;font-size:6px}.layer-legend{position:absolute;z-index:13;right:14px;bottom:65px;width:155px;padding:10px 11px;border:1px solid #274955;border-radius:8px;background:#071b25ed;box-shadow:0 8px 22px #0007}.layer-legend>strong{display:block;margin-bottom:5px;font-size:6px;letter-spacing:1px;color:#6fded6}.layer-legend span{display:flex;align-items:center;gap:6px;font-size:6px;color:#91a7ae;padding:3px 0}.layer-legend span b{margin-left:auto;color:#83def5;font-size:7px}.layer-legend i{width:9px;height:9px;border-radius:2px}.layer-legend .vegetal{background:linear-gradient(135deg,#79c86f,#235f3b)}.layer-legend .pond{background:#3ab8e6}.layer-legend .media{background:#705837}.layer-legend .transition{background:#bca66d}.layer-legend .aggregate{background:#61747c}
    .outlet{z-index:9;right:13px;top:48%;width:145px;padding:12px;border-color:#30a29a;box-shadow:0 10px 24px #020a0f66}.groundwater{height:58px}.timeline-head{display:flex;justify-content:space-between;margin:16px 1px 7px;color:#708b95;font-size:7px;letter-spacing:.8px}.timeline-head b{color:#5edbd1}.timeline{margin:0 0 23px;height:7px;border:1px solid #173d48;background:#071b25}.timeline>i{box-shadow:0 0 12px #38d0b877}
    .balance-grid>div{position:relative;min-height:70px;padding:12px 13px;background:linear-gradient(145deg,#0d2b35,#0a222c);border-color:#1b414c}.balance-grid>div:before{content:'';position:absolute;left:0;top:10px;bottom:10px;width:2px;background:#3baacb}.balance-grid .green:before{background:#4bd5a1}.balance-grid .alert:before{background:#ef766d}.balance-grid b{font-size:16px}.balance-grid span{font-size:7px}
    .controls{padding:20px;background:linear-gradient(155deg,#0b2530,#081c26);border-color:#1d414c;box-shadow:0 18px 45px #020a0f35}.control-head h2{font-size:19px}.control-head p{font-size:8px;line-height:1.45}.control-section-title{display:flex;align-items:center;gap:9px;margin:17px 0 10px;padding-top:14px;border-top:1px solid #163640}.control-section-title:first-of-type{border-top:0;padding-top:0}.control-section-title>span{width:27px;height:27px;border-radius:7px;background:#123c45;color:#5cddd3;display:grid;place-items:center;font-size:7px;font-weight:800}.control-section-title b,.control-section-title small{display:block}.control-section-title b{font-size:9px}.control-section-title small{font-size:6px;color:#657f89;margin-top:2px}.range-field{margin:13px 0;padding:10px 11px;background:#0a222c;border:1px solid #163a45;border-radius:8px}.range-field>small{display:block;font-size:6px;color:#647f89;margin-top:6px}.range-field input{height:5px}.field{font-size:7px}.form-control{margin-top:6px;background:#071d27;border-color:#21434e}.switch{padding:10px 11px;border:1px solid #173b45;border-radius:8px;background:#0a222c}.event-summary>div{border:1px solid #183c47;background:linear-gradient(145deg,#0d2c36,#0a232d)}.event-summary b{font-size:13px;color:#d7e8ea}.run{min-height:39px;box-shadow:0 8px 20px #24c7bd22}.reset{min-height:34px}.explanation{background:linear-gradient(100deg,#0b2731,#081d27);border-color:#1a3c47}.explanation>div>span{box-shadow:0 0 0 4px #36d4ca0b}
    @media(max-width:1350px){.model-overview{grid-template-columns:1.2fr repeat(2,1fr)}.model-overview>div:nth-child(4){border-left:0;border-top:1px solid #183640}.model-overview>div:nth-child(n+4){border-top:1px solid #183640}.model-layout{grid-template-columns:minmax(0,1fr) 320px}.layer-legend{display:none}}
    @media(max-width:800px){.model-overview{grid-template-columns:1fr 1fr}.model-overview .overview-lead{grid-column:1/-1}.model-overview>div:nth-child(odd){border-left:0}.model-stage{height:500px}.inlet-callout,.flow-callout,.depth-scale{display:none}.cells{left:4%;right:4%}}
  `]
})
export class BioSpongeModelComponent implements OnDestroy {
  readonly rainIntensity = signal(63);
  readonly eventRain = signal(50);
  readonly cellCount = signal(3);
  readonly moduleType = signal<'A'|'B'>('A');
  readonly tide = signal<'baja'|'media'|'alta'>('media');
  readonly valveOpen = signal(true);
  readonly running = signal(false);
  readonly progress = signal(0);
  readonly inflow = signal(0);
  readonly stored = signal(0);
  readonly infiltrated = signal(0);
  readonly discharged = signal(0);
  readonly overflow = signal(0);
  private timer?: ReturnType<typeof setInterval>;

  readonly rainDrops = Array.from({length:24},(_,i)=>({x:4+(i*17)%94,delay:(i*83)%700}));
  readonly cellsArray = computed(() => Array.from({length:this.cellCount()},(_,i)=>i));
  readonly cellWidth = computed(() => this.moduleType()==='A'?2:1.2);
  readonly cellArea = computed(() => this.cellCount()*10*this.cellWidth());
  readonly treatedArea = computed(() => this.cellArea()*5);
  readonly corridorLength = computed(() => +(this.cellCount()*10+Math.max(0,this.cellCount()-1)*1.75).toFixed(1));
  readonly storageCapacity = computed(() => +(this.cellArea()*.275).toFixed(1));
  readonly duration = computed(() => this.eventRain()/this.rainIntensity()*60);
  readonly expectedInflow = computed(() => +(this.eventRain()/1000*(this.treatedArea()*.9+this.cellArea())).toFixed(1));
  readonly expectedFill = computed(() => Math.min(100,Math.round(this.expectedInflow()/this.storageCapacity()*100)));
  readonly retention = computed(() => this.expectedInflow()?Math.min(100,Math.round(this.storageCapacity()/this.expectedInflow()*100)):0);
  readonly surfaceStorage = computed(() => this.cellArea()*.15);
  readonly subsoilStorage = computed(() => this.cellArea()*.125);
  readonly surfaceFill = computed(() => Math.min(100,this.stored()/this.surfaceStorage()*100));
  readonly subsoilFill = computed(() => Math.min(100,Math.max(0,this.stored()-this.surfaceStorage())/this.subsoilStorage()*100));
  readonly profileWetness = computed(() => Math.min(100,
    this.progress() * 1.08 + this.infiltrated() / Math.max(1, this.cellArea()) * 55
  ));
  readonly filterWetness = computed(() => Math.min(100, this.profileWetness() * 1.45));
  readonly sandWetness = computed(() => Math.min(100, Math.max(0, this.profileWetness() - 16) * 1.45));
  readonly gravelWetness = computed(() => Math.min(100, Math.max(0, this.profileWetness() - 34) * 1.52));
  readonly drainActive = computed(() => this.gravelWetness() > 24 && this.valveOpen());
  readonly elapsedMinutes = computed(() => this.duration()*this.progress()/100);

  constructor(){
    try {
      const plan=JSON.parse(localStorage.getItem('pomerape-intervention-plan')||'{}');
      if(plan.moduleType==='A'||plan.moduleType==='B') this.moduleType.set(plan.moduleType);
      if(plan.cells) this.cellCount.set(Math.min(8,Math.max(1,+plan.cells)));
      if(Number.isFinite(+plan.rainfall) && +plan.rainfall > 0) this.eventRain.set(Math.min(150, Math.max(5, +plan.rainfall)));
      if(Number.isFinite(+plan.verificationIntensity) && +plan.verificationIntensity > 0) this.rainIntensity.set(Math.min(150, Math.max(5, +plan.verificationIntensity)));
    } catch {}
  }
  toggle(){ this.running()?this.pause():this.start(); }
  changeModule(type:'A'|'B'){this.moduleType.set(type);this.cellCount.set(type==='A'?3:5);this.reset();}
  start(){
    if(this.progress()>=100) this.reset();
    this.running.set(true);
    this.timer=setInterval(()=>this.step(),120);
  }
  pause(){ this.running.set(false); if(this.timer) clearInterval(this.timer); }
  reset(){ this.pause();this.progress.set(0);this.inflow.set(0);this.stored.set(0);this.infiltrated.set(0);this.discharged.set(0);this.overflow.set(0); }
  private step(){
    const next=Math.min(100,this.progress()+1);
    const incoming=this.expectedInflow()/100;
    const infiltration=this.cellCount()*2.16*(this.duration()/60)/100;
    const tideFactor=this.tide()==='alta'?.25:this.tide()==='media'?.65:1;
    const outlet=this.valveOpen()?36*tideFactor*(this.duration()/60)/100:0;
    const available=this.stored()+incoming;
    const infiltrated=Math.min(available,infiltration);
    const afterInfiltration=available-infiltrated;
    const discharged=Math.min(afterInfiltration,outlet);
    const afterOutlet=afterInfiltration-discharged;
    const excess=Math.max(0,afterOutlet-this.storageCapacity());
    this.inflow.update(v=>v+incoming);
    this.infiltrated.update(v=>v+infiltrated);
    this.discharged.update(v=>v+discharged);
    this.overflow.update(v=>v+excess);
    this.stored.set(Math.min(this.storageCapacity(),afterOutlet));
    this.progress.set(next);
    if(next>=100) this.pause();
  }
  ngOnDestroy(){ this.pause(); }
}
