import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { HydroService } from '../core/hydro.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [DatePipe],
  template: `
    <section class="page-head">
      <div>
        <div class="eyebrow">Resumen de demostración</div>
        <h1>Informe operativo</h1>
        <p>Estado general de la plataforma y sus principales hallazgos.</p>
      </div>
    </section>

    <article class="card preview">
      <div class="report-header">
        <div><span>HydroGuard</span><h2>Resumen ejecutivo</h2></div>
        <small>Actualizado {{hydro.lastUpdated()|date:'dd/MM/yyyy HH:mm'}}</small>
      </div>

      <div class="summary">
        <div><small>ACTIVOS</small><b>{{hydro.metrics().active}}</b></div>
        <div><small>ALERTAS</small><b>{{hydro.activeAlerts().length}}</b></div>
        <div><small>TRAMOS CRÍTICOS</small><b>2</b></div>
        <div><small>PROPUESTAS</small><b>3</b></div>
      </div>

      <div class="finding"><b>Atención prioritaria</b><span>TR-02 presenta una posible obstrucción y requiere inspección física.</span></div>
      <button class="btn primary" (click)="printReport()">Descargar resumen en PDF</button>
      <p class="disclaimer">Información ficticia para fines de demostración.</p>
    </article>
  `,
  styles: [`
    .preview{padding:25px;max-width:880px}.report-header{display:flex;justify-content:space-between;border-bottom:1px solid var(--line);padding-bottom:15px}.report-header span{color:var(--cyan);font-weight:800}.report-header h2{font-size:17px;margin:5px 0}.report-header small{font-size:9px;color:#708a95}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:18px 0}.summary div{padding:13px;background:#0e2631;border-radius:8px}.summary small,.summary b{display:block}.summary small{font-size:8px;color:#6c8590}.summary b{font:700 21px 'Manrope';margin-top:5px}.finding{display:flex;flex-direction:column;gap:4px;padding:13px;background:#292217;border:1px solid #4f3d25;border-radius:8px;margin-bottom:16px}.finding b{font-size:10px;color:#f4c468}.finding span{font-size:9px;color:#a89572}.disclaimer{font-size:8px;color:#637d88;margin:10px 0 0}@media(max-width:700px){.summary{grid-template-columns:repeat(2,1fr)}.report-header{gap:15px}}@media print{.page-head,.preview .btn{display:none}.preview{border:0;background:white;color:#111}.summary div{background:#eee}}
  `],
})
export class ReportsComponent {
  constructor(public hydro: HydroService) {}
  printReport() { window.print(); }
}
