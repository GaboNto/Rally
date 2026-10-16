import { Routes } from '@angular/router';
export const routes: Routes = [
  {path:'dashboard',loadComponent:()=>import('./pages/dashboard.component').then(m=>m.DashboardComponent),title:'Centro de control | HydroGuard'},
  {path:'mapa',loadComponent:()=>import('./pages/geo-map.component').then(m=>m.GeoMapPageComponent),title:'Mapa | HydroGuard'},
  {path:'sensores',loadComponent:()=>import('./pages/sensors.component').then(m=>m.SensorsComponent),title:'Sensores | HydroGuard'},
  {path:'diagnosticos',loadComponent:()=>import('./pages/diagnostics.component').then(m=>m.DiagnosticsComponent),title:'Diagnosticos | HydroGuard'},
  {path:'infraestructura-verde',loadComponent:()=>import('./pages/green-infrastructure.component').then(m=>m.GreenInfrastructureComponent),title:'Infraestructura verde | HydroGuard'},
  {path:'simulaciones',loadComponent:()=>import('./pages/simulations.component').then(m=>m.SimulationsComponent),title:'Simulaciones | HydroGuard'},
  {path:'alertas',loadComponent:()=>import('./pages/alerts.component').then(m=>m.AlertsComponent),title:'Alertas | HydroGuard'},
  {path:'lluvia',loadComponent:()=>import('./pages/rain.component').then(m=>m.RainComponent),title:'Mapa de lluvia | HydroGuard'},
  {path:'escenarios',loadComponent:()=>import('./pages/scenarios.component').then(m=>m.ScenariosComponent),title:'Escenarios | HydroGuard'},
  {path:'informes',loadComponent:()=>import('./pages/reports.component').then(m=>m.ReportsComponent),title:'Informes | HydroGuard'},
  {path:'',pathMatch:'full',redirectTo:'dashboard'},{path:'**',redirectTo:'dashboard'}
];
