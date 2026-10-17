import { Routes } from '@angular/router';
export const routes: Routes = [
  {path:'dashboard',loadComponent:()=>import('./pages/dashboard.component').then(m=>m.DashboardComponent),title:'Centro de control | Pomerape'},
  {path:'mapa',loadComponent:()=>import('./pages/geo-map.component').then(m=>m.GeoMapPageComponent),title:'Mapa de decisión | Pomerape'},
  {path:'red-monitoreo',loadComponent:()=>import('./pages/sensors.component').then(m=>m.SensorsComponent),title:'Red de monitoreo | Pomerape'},
  {path:'diagnosticos',loadComponent:()=>import('./pages/diagnostics.component').then(m=>m.DiagnosticsComponent),title:'Diagnosticos | Pomerape'},
  {path:'infraestructura-verde',loadComponent:()=>import('./pages/green-infrastructure.component').then(m=>m.GreenInfrastructureComponent),title:'Infraestructura verde | Pomerape'},
  {path:'modelo-bioesponja',loadComponent:()=>import('./pages/bio-sponge-model.component').then(m=>m.BioSpongeModelComponent),title:'Modelo de bioesponja | Pomerape'},
  {path:'alertas',loadComponent:()=>import('./pages/alerts.component').then(m=>m.AlertsComponent),title:'Alertas | Pomerape'},
  {path:'lluvia',loadComponent:()=>import('./pages/rain.component').then(m=>m.RainComponent),title:'Mapa de lluvia | Pomerape'},
  {path:'mission-control',loadComponent:()=>import('./pages/mission-control.component').then(m=>m.MissionControlComponent),title:'Mission Control | Pomerape'},
  {path:'informes',loadComponent:()=>import('./pages/reports.component').then(m=>m.ReportsComponent),title:'Informes | Pomerape'},
  {path:'',pathMatch:'full',redirectTo:'dashboard'},{path:'**',redirectTo:'dashboard'}
];
