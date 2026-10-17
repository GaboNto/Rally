import { Component, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DatePipe } from '@angular/common';
import { DemoArea, HydroService } from './core/hydro.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, DatePipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  styles: [`.location select{display:block;margin-top:2px;min-width:160px;border:0;background:transparent;color:#d6e5ea;font:700 12px 'Manrope',sans-serif;cursor:pointer;outline:none}.location select option{background:#0b202b;color:#d6e5ea}`]
})
export class AppComponent {
  readonly menuOpen=signal(false);readonly clock=signal(new Date());readonly activeAlerts=computed(()=>this.hydro.activeAlerts().length);
  readonly nav=[
    {path:'/dashboard',icon:'⌁',label:'Centro de control'},
    {path:'/mapa',icon:'⌖',label:'Mapa de decisión'},
    {path:'/infraestructura-verde',icon:'♧',label:'Plan de intervención'},
    {path:'/informes',icon:'¤',label:'Informes'},
  ];
  constructor(public hydro:HydroService){setInterval(()=>this.clock.set(new Date()),30000)}
  changeDemoArea(event: Event) { this.hydro.setDemoArea((event.target as HTMLSelectElement).value as DemoArea); }
}
