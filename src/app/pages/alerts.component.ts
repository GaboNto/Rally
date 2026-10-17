import { Component, computed, HostListener, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HydroService } from '../core/hydro.service';
import { AlertStatus } from '../core/models';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [DatePipe],
  template: `
    <section class="page-head">
      <div>
        <div class="eyebrow">Gestión operacional</div>
        <h1>Alertas e incidencias</h1>
        <p>Confirmación, asignación y cierre con trazabilidad.</p>
      </div>
      <span class="badge red">{{hydro.activeAlerts().length}} alertas activas</span>
    </section>

    <div class="filters">
      @for (f of filters; track f.key) {
        <button [class.active]="filter() === f.key" (click)="filter.set(f.key)">{{f.label}}</button>
      }
    </div>

    <section class="alert-list">
      @for (a of visible(); track a.id) {
        <article class="card alert">
          <div class="severity s-{{a.severity}}"></div>
          <div class="icon">!</div>
          <div class="info">
            <div><span>{{a.id}}</span><em>{{a.severity}}</em></div>
            <h3>{{a.type}}</h3>
            <p>{{a.location}} · {{a.relatedId}}</p>
            <small>{{a.timestamp | date:'dd MMM, HH:mm'}} · {{a.action}}</small>
          </div>
          <div class="status">
            <small>ESTADO</small><b>{{a.status}}</b>
            @if (a.assignee) { <span>{{a.assignee}}</span> }
          </div>
          <div class="actions">
            @if (a.status === 'nueva') { <button class="btn primary" (click)="update(a.id, 'confirmada')">Confirmar</button> }
            @if (a.status === 'confirmada') { <button class="btn primary" (click)="update(a.id, 'asignada')">Asignar</button> }
            @if (a.status === 'asignada') { <button class="btn primary" (click)="update(a.id, 'cerrada')">Cerrar</button> }
            @if (a.status === 'cerrada') { <span class="badge green">Resuelta</span> }
            <button class="btn ghost" [attr.aria-label]="'Ver detalle de ' + a.type" (click)="selectedId.set(a.id)">Ver detalle</button>
          </div>
        </article>
      } @empty {
        <div class="card empty">No hay alertas para este filtro.</div>
      }
    </section>

    @if (detail(); as alert) {
      <div class="detail-backdrop" role="presentation" (click)="closeDetail()">
        <article class="detail-panel" role="dialog" aria-modal="true" aria-labelledby="alert-detail-title" (click)="$event.stopPropagation()">
          <header>
            <div>
              <span class="detail-code">{{alert.id}} · {{alert.severity}}</span>
              <h2 id="alert-detail-title">{{alert.type}}</h2>
            </div>
            <button class="close" aria-label="Cerrar detalle" (click)="closeDetail()">×</button>
          </header>

          <div class="detail-body">
            <div class="detail-grid">
              <div><small>UBICACIÓN</small><b>{{alert.location}}</b></div>
              <div><small>ELEMENTO RELACIONADO</small><b>{{alert.relatedId}}</b></div>
              <div><small>FECHA Y HORA</small><b>{{alert.timestamp | date:'dd MMM yyyy, HH:mm'}}</b></div>
              <div><small>RESPONSABLE</small><b>{{alert.assignee || 'Sin asignar'}}</b></div>
            </div>

            <section class="recommendation">
              <small>ACCIÓN RECOMENDADA</small>
              <p>{{alert.action}}</p>
            </section>

            <section class="trace">
              <small>TRAZABILIDAD</small>
              <div class="steps">
                @for (step of statusSteps; track step.key) {
                  <div [class.done]="statusIndex(alert.status) >= statusIndex(step.key)">
                    <i></i><span>{{step.label}}</span>
                  </div>
                }
              </div>
            </section>
          </div>

          <footer>
            <span class="current-status">Estado actual: <b>{{alert.status}}</b></span>
            <button class="btn" (click)="closeDetail()">Cerrar detalle</button>
          </footer>
        </article>
      </div>
    }
  `,
  styles: [`
    .filters{display:flex;gap:7px;margin-bottom:15px}.filters button{background:#0b202b;border:1px solid var(--line);color:#76909b;border-radius:18px;padding:7px 13px;font-size:10px}.filters button.active{border-color:#31827e;color:#59d8d0}.alert-list{display:grid;gap:9px}.alert{display:grid;grid-template-columns:5px 38px 1fr 150px 190px;align-items:center;gap:15px;padding:13px;overflow:hidden}.severity{height:48px;border-radius:4px}.icon{width:34px;height:34px;display:grid;place-content:center;background:#332029;border-radius:9px;color:#ff7870;font-weight:800}.info>div{display:flex;gap:8px}.info span,.info em{font-size:8px;color:#69838e;font-style:normal}.info em{text-transform:uppercase;color:#e4a19d}.info h3{font-size:12px;margin:4px 0}.info p,.info small{font-size:9px;color:#6e8893;margin:0}.status small,.status b,.status span{display:block}.status small{font-size:8px;color:#607b87}.status b{font-size:10px;text-transform:capitalize;margin:3px 0}.status span{font-size:8px;color:#7c949e}.actions{display:flex;gap:6px;justify-content:flex-end}.actions .btn{padding:7px 9px}
    .detail-backdrop{position:fixed;inset:0;z-index:2000;display:flex;justify-content:flex-end;background:#020b11b8;backdrop-filter:blur(3px)}.detail-panel{width:min(500px,100%);height:100%;background:#091d27;border-left:1px solid #21414d;box-shadow:-18px 0 50px #0008;display:flex;flex-direction:column;animation:slide-in .2s ease-out}.detail-panel header{display:flex;align-items:flex-start;justify-content:space-between;padding:24px;border-bottom:1px solid var(--line)}.detail-code{font-size:9px;color:#52d7cf;text-transform:uppercase;letter-spacing:.8px}.detail-panel h2{font-size:21px;margin:6px 0 0}.close{width:34px;height:34px;border:1px solid #294954;border-radius:9px;background:#102b36;color:#b7cbd2;font-size:22px;line-height:1;cursor:pointer}.detail-body{padding:22px;overflow:auto}.detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.detail-grid>div,.recommendation,.trace,.telemetry-evidence{border:1px solid var(--line);background:#0b2530;border-radius:10px;padding:13px}.detail-grid small,.recommendation small,.trace>small{display:block;font-size:8px;color:#64818c;letter-spacing:.8px}.detail-grid b{display:block;font-size:11px;margin-top:6px;text-transform:capitalize}.recommendation,.trace,.telemetry-evidence{margin-top:14px}.recommendation p{font-size:11px;line-height:1.55;color:#c1d2d8;margin:7px 0 0}.telemetry-head{display:flex;justify-content:space-between;align-items:center;padding-bottom:10px;border-bottom:1px solid #183642}.telemetry-head small,.telemetry-head b{display:block}.telemetry-head small{font-size:7px;letter-spacing:.8px;color:#53d7cd}.telemetry-head b{font-size:10px;margin-top:3px}.telemetry-head>span{font-size:7px;color:#65dcb0;background:#14382f;padding:5px 7px;border-radius:14px}.telemetry-reading{display:grid;grid-template-columns:auto 1fr auto auto;align-items:center;gap:9px;padding:10px 0;border-bottom:1px solid #15323d}.telemetry-reading:last-child{border-bottom:0;padding-bottom:0}.telemetry-reading>i{width:8px;height:8px;border-radius:50%;background:#42d4a5;box-shadow:0 0 0 3px #42d4a520}.telemetry-reading>i.offline{background:#ef7168}.telemetry-reading b,.telemetry-reading small{display:block}.telemetry-reading b{font-size:9px}.telemetry-reading small{font-size:7px;color:#69858e;margin-top:2px}.telemetry-reading>strong{font-size:12px}.telemetry-reading>strong em{font-size:7px;color:#6b8790;font-style:normal}.telemetry-reading>span{font-size:7px;color:#7f989f}.telemetry-reading>span.rising{color:#f0b758}.steps{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-top:13px}.steps div{position:relative;text-align:center;color:#536f7a;font-size:8px}.steps div:before{content:'';position:absolute;top:4px;left:-50%;width:100%;height:2px;background:#1b3944}.steps div:first-child:before{display:none}.steps i{position:relative;z-index:1;display:block;width:10px;height:10px;margin:0 auto 7px;border-radius:50%;background:#1d3b46;border:2px solid #47616b}.steps .done{color:#70dcd4}.steps .done:before,.steps .done i{background:#39cfc5;border-color:#39cfc5}.detail-panel footer{margin-top:auto;padding:16px 22px;border-top:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:12px}.current-status{font-size:9px;color:#718c96;text-transform:capitalize}.current-status b{color:#d5e5e9}.detail-panel footer .btn{flex:none}@keyframes slide-in{from{transform:translateX(35px);opacity:0}to{transform:translateX(0);opacity:1}}
    @media(max-width:850px){.alert{grid-template-columns:5px 35px 1fr}.status,.actions{grid-column:3}.actions{justify-content:flex-start}}@media(max-width:520px){.detail-grid{grid-template-columns:1fr}.detail-panel header{padding:18px}.detail-body{padding:16px}.steps span{font-size:7px}}
  `],
})
export class AlertsComponent {
  readonly filter = signal('activas');
  readonly selectedId = signal<string | null>(null);
  readonly filters = [
    { key: 'activas', label: 'Activas' },
    { key: 'todas', label: 'Todas' },
    { key: 'critica', label: 'Críticas' },
    { key: 'cerrada', label: 'Cerradas' },
  ];
  readonly statusSteps: { key: AlertStatus; label: string }[] = [
    { key: 'nueva', label: 'Nueva' },
    { key: 'confirmada', label: 'Confirmada' },
    { key: 'asignada', label: 'Asignada' },
    { key: 'cerrada', label: 'Cerrada' },
  ];
  readonly visible = computed(() => this.hydro.alerts().filter(a =>
    this.filter() === 'todas' ||
    this.filter() === 'activas' && a.status !== 'cerrada' ||
    a.severity === this.filter() ||
    a.status === this.filter()
  ));
  readonly detail = computed(() => this.hydro.alerts().find(a => a.id === this.selectedId()) ?? null);
  constructor(public hydro: HydroService) {}

  update(id: string, status: AlertStatus) {
    this.hydro.updateAlert(id, status);
  }

  closeDetail() {
    this.selectedId.set(null);
  }

  statusIndex(status: AlertStatus) {
    return this.statusSteps.findIndex(step => step.key === status);
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.closeDetail();
  }
}
