import { Component, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DatePipe } from '@angular/common';
import { HydroService } from './core/hydro.service';
@Component({selector:'app-root',imports:[RouterOutlet,RouterLink,RouterLinkActive,DatePipe],templateUrl:'./app.component.html',styleUrl:'./app.component.scss'})
export class AppComponent {
  readonly menuOpen=signal(false);readonly clock=signal(new Date());readonly activeAlerts=computed(()=>this.hydro.activeAlerts().length);
  readonly nav=[{path:'/dashboard',icon:'⌁',label:'Centro de control'},{path:'/mapa',icon:'⌖',label:'Mapa geoespacial'},{path:'/lluvia',icon:'☔',label:'Mapa de lluvia'},{path:'/escenarios',icon:'⚡',label:'Escenarios'},{path:'/mission-control',icon:'🚨',label:'Mission Control'},{path:'/sensores',icon:'◉',label:'Sensores IoT'},{path:'/diagnosticos',icon:'◇',label:'Diagnosticos'},{path:'/infraestructura-verde',icon:'♧',label:'Infraestructura verde'},{path:'/alertas',icon:'!',label:'Alertas'},{path:'/informes',icon:'¤',label:'Informes'}];
  constructor(public hydro:HydroService){setInterval(()=>this.clock.set(new Date()),30000)}
}
