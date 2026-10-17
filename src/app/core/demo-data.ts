import { CommunityReport, DrainageSegment, GreenIntervention, HydroAlert, Reservoir, RiskZone, ScenarioResult, Sensor } from './models';

const now = Date.now();
const readings = (base: number, trend = 0, rain = 0) => Array.from({ length: 18 }, (_, i) => ({
  timestamp: new Date(now - (17 - i) * 10 * 60_000).toISOString(),
  level: Math.max(4, +(base + Math.sin(i / 2.5) * 2 + trend * i).toFixed(1)),
  flow: +(0.18 + base / 115 + trend * i / 20).toFixed(2),
  rainfall: Math.max(0, +(rain + Math.sin(i / 3) * 1.2).toFixed(1)),
}));

const sensor = (id: string, name: string, sector: string, segmentId: string, position: Sensor['position'], lat: number, lng: number, status: Sensor['status'], level: number, capacity: number, variation: number, trend = 0, rain = 0): Sensor => ({
  id, name, sector, segmentId, position, lat, lng, status, level, capacity, variation,
  lastReading: new Date(now - (status === 'desconectado' ? 48 : 2) * 60_000).toISOString(), readings: readings(level - trend * 17, trend, rain),
});

export const DEMO_SENSORS: Sensor[] = [
  sensor('HG-001', 'Canal Norte · Entrada', 'Norte', 'TR-01', 'aguas arriba', -18.4547, -70.3025, 'activo', 42, 90, 1.2, .35, 2),
  sensor('HG-002', 'Canal Norte · Salida', 'Norte', 'TR-01', 'aguas abajo', -18.4568, -70.3002, 'activo', 24, 90, .2, .05, 2),
  sensor('HG-003', 'Colector Centro · Entrada', 'Centro', 'TR-02', 'aguas arriba', -18.4750, -70.3110, 'activo', 78, 85, 4.8, 1.65, 8),
  sensor('HG-004', 'Colector Centro · Salida', 'Centro', 'TR-02', 'aguas abajo', -18.4780, -70.3082, 'activo', 31, 85, .4, .12, 8),
  sensor('HG-005', 'Descarga Costera · Entrada', 'Costero', 'TR-03', 'aguas arriba', -18.4820, -70.3210, 'activo', 71, 80, 3.9, 1.2, 10),
  sensor('HG-006', 'Descarga Costera · Salida', 'Costero', 'TR-03', 'aguas abajo', -18.4845, -70.3240, 'activo', 68, 80, 3.5, 1.1, 10),
  sensor('HG-007', 'Quebrada Este · Entrada', 'Este', 'TR-04', 'aguas arriba', -18.4670, -70.2840, 'activo', 35, 100, -.3, -.08, 0),
  sensor('HG-008', 'Quebrada Este · Salida', 'Este', 'TR-04', 'aguas abajo', -18.4690, -70.2880, 'activo', 29, 100, -.4, -.09, 0),
  sensor('HG-009', 'Bypass Industrial', 'Norte', 'TR-05', 'aguas arriba', -18.4455, -70.2950, 'desconectado', 0, 75, 0),
  sensor('HG-010', 'Reservorio Centro', 'Centro', 'TR-06', 'aguas abajo', -18.4700, -70.3180, 'activo', 51, 95, .6, .12, 3),
  sensor('HG-011', 'Colector Mercado', 'Centro', 'TR-07', 'aguas arriba', -18.4780, -70.3160, 'mantenimiento', 18, 70, 0),
  sensor('HG-012', 'Descarga Sur', 'Costero', 'TR-08', 'aguas abajo', -18.4930, -70.3150, 'activo', 27, 85, -.1, -.03, 0),
];

export const DEMO_SEGMENTS: DrainageSegment[] = [
  { id: 'TR-01', name: 'Tramo Canal Norte', sector: 'Norte', capacity: 1.25, sensorIds: ['HG-001','HG-002'], coordinates: [[-18.4547,-70.3025],[-18.4568,-70.3002]], condition: 'normal', confidence: 88, evidence: 'Niveles y caudal dentro del patrón esperado.', suggestedAction: 'Continuar monitoreo programado.' },
  { id: 'TR-02', name: 'Colector Centro', sector: 'Centro', capacity: 1.05, sensorIds: ['HG-003','HG-004'], coordinates: [[-18.475,-70.311],[-18.478,-70.3082]], condition: 'posible_obstruccion', confidence: 86, evidence: 'Ascenso sostenido aguas arriba, descarga estable y precipitación moderada.', suggestedAction: 'Inspeccionar rejilla y conducto en menos de 2 horas.' },
  { id: 'TR-03', name: 'Descarga Costera', sector: 'Costero', capacity: .92, sensorIds: ['HG-005','HG-006'], coordinates: [[-18.482,-70.321],[-18.4845,-70.324]], condition: 'sobrecarga', confidence: 81, evidence: 'Ambos niveles aumentan con caudal estimado sobre capacidad.', suggestedAction: 'Activar protocolo preventivo y monitoreo continuo.' },
  { id: 'TR-04', name: 'Quebrada Este', sector: 'Este', capacity: 1.4, sensorIds: ['HG-007','HG-008'], coordinates: [[-18.467,-70.284],[-18.469,-70.288]], condition: 'normal', confidence: 92, evidence: 'Descenso coordinado y sin lluvia relevante.', suggestedAction: 'Sin acción inmediata.' },
  { id: 'TR-05', name: 'Bypass Industrial', sector: 'Norte', capacity: .8, sensorIds: ['HG-009'], coordinates: [[-18.4455,-70.295],[-18.449,-70.297]], condition: 'no_concluyente', confidence: 28, evidence: 'Sensor desconectado; no existe evidencia suficiente.', suggestedAction: 'Revisar conectividad antes de emitir diagnóstico.' },
  { id: 'TR-06', name: 'Enlace Reservorio', sector: 'Centro', capacity: 1.1, sensorIds: ['HG-010'], coordinates: [[-18.47,-70.318],[-18.474,-70.315]], condition: 'no_concluyente', confidence: 45, evidence: 'Solo una medición disponible en el tramo.', suggestedAction: 'Complementar con inspección o segundo sensor.' },
  { id: 'TR-07', name: 'Colector Mercado', sector: 'Centro', capacity: .75, sensorIds: ['HG-011'], coordinates: [[-18.478,-70.316],[-18.481,-70.314]], condition: 'no_concluyente', confidence: 20, evidence: 'Sensor en mantenimiento.', suggestedAction: 'Finalizar mantenimiento y validar lectura.' },
  { id: 'TR-08', name: 'Descarga Sur', sector: 'Costero', capacity: 1.2, sensorIds: ['HG-012'], coordinates: [[-18.493,-70.315],[-18.496,-70.317]], condition: 'normal', confidence: 69, evidence: 'Nivel bajo y estable; evidencia parcial.', suggestedAction: 'Mantener observación.' },
];

export const DEMO_ZONES: RiskZone[] = [
  { id:'Z-01', name:'Sector Centro', risk:'alto', runoff:82, polygon:[[-18.471,-70.317],[-18.471,-70.305],[-18.482,-70.304],[-18.484,-70.316]] },
  { id:'Z-02', name:'Sector Norte', risk:'medio', runoff:57, polygon:[[-18.442,-70.306],[-18.444,-70.292],[-18.458,-70.294],[-18.459,-70.306]] },
  { id:'Z-03', name:'Sector Costero Sur', risk:'bajo', runoff:31, polygon:[[-18.484,-70.324],[-18.485,-70.309],[-18.498,-70.31],[-18.499,-70.322]] },
];

export const DEMO_RESERVOIRS: Reservoir[] = [
  { id:'RP-01', name:'Reservorio Centro', lat:-18.4705, lng:-70.3185, fill:54, capacity:3200 },
  { id:'RP-02', name:'Reservorio Norte', lat:-18.4470, lng:-70.3040, fill:32, capacity:2100 },
];

export const DEMO_ALERTS: HydroAlert[] = [
  { id:'AL-1042', type:'Posible obstrucción', severity:'critica', location:'Colector Centro', relatedId:'TR-02', timestamp:new Date(now-18*60_000).toISOString(), status:'nueva', action:'Inspeccionar rejilla y conducto antes de 2 horas.' },
  { id:'AL-1041', type:'Posible sobrecarga', severity:'alta', location:'Descarga Costera', relatedId:'TR-03', timestamp:new Date(now-31*60_000).toISOString(), status:'confirmada', action:'Activar monitoreo continuo.', assignee:'Equipo hidráulico' },
  { id:'AL-1040', type:'Sensor desconectado', severity:'media', location:'Bypass Industrial', relatedId:'HG-009', timestamp:new Date(now-48*60_000).toISOString(), status:'asignada', action:'Verificar alimentación y enlace.', assignee:'Cuadrilla Norte' },
  { id:'AL-1039', type:'Inspección pendiente', severity:'informativa', location:'Colector Mercado', relatedId:'HG-011', timestamp:new Date(now-95*60_000).toISOString(), status:'confirmada', action:'Completar pauta de mantenimiento.' },
];

export const DEMO_INTERVENTIONS: GreenIntervention[] = [
  { id:'IV-01', name:'Jardín de lluvia Centro', type:'Jardín de lluvia', zone:'Sector Centro', score:87, cost:18500000, area:420, runoffReduction:18, feasibility:82, lat:-18.477, lng:-70.312, saved:true },
  { id:'IV-02', name:'Biozanja eje Norte', type:'Biozanja vegetada', zone:'Sector Norte', score:79, cost:24600000, area:680, runoffReduction:23, feasibility:74, lat:-18.451, lng:-70.299, saved:false },
  { id:'IV-03', name:'Biorretención Costera', type:'Área de biorretención', zone:'Sector Costero Sur', score:68, cost:31200000, area:890, runoffReduction:27, feasibility:61, lat:-18.49, lng:-70.317, saved:false },
];

export const DEMO_SCENARIOS: ScenarioResult[] = [
  { id:'A', name:'Infraestructura actual', description:'Línea base sin intervenciones.', peakFlow:2.82, runoff:4280, overflow:640, timeToPeak:38, cost:0, area:0, color:'#ff7a59' },
  { id:'B', name:'Jardín de lluvia', description:'Implementación IV-01 en Sector Centro.', peakFlow:2.39, runoff:3560, overflow:410, timeToPeak:44, cost:18500000, area:420, color:'#27d3b2' },
  { id:'C', name:'Biozanjas', description:'Implementación IV-02 en eje Norte.', peakFlow:2.27, runoff:3340, overflow:350, timeToPeak:47, cost:24600000, area:680, color:'#48a7ff' },
  { id:'D', name:'Combinación definida', description:'IV-01 + IV-02 evaluadas como escenario conjunto.', peakFlow:1.96, runoff:2910, overflow:205, timeToPeak:52, cost:43100000, area:1100, color:'#a78bfa' },
];

export const DEMO_REPORTS: CommunityReport[] = [
  { id:'RC-028', category:'Sumidero obstruido', location:'Av. 18 de Septiembre 1240, Sector Centro', description:'Acumulación visible junto a rejilla.', reporter:'Vecino verificado', status:'inspeccion', createdAt:new Date(now-110*60_000).toISOString(), assignee:'Cuadrilla Centro' },
  { id:'RC-027', category:'Acumulación de agua', location:'Pasaje Piloto, Sector Norte', description:'Agua permanece luego de la lluvia.', reporter:'Reporte ciudadano', status:'validado', createdAt:new Date(now-210*60_000).toISOString() },
  { id:'RC-026', category:'Sumidero obstruido', location:'Calle Referencia, Sector Costero', description:'Residuos en acceso al sumidero.', reporter:'Reporte ciudadano', status:'resuelto', createdAt:new Date(now-1500*60_000).toISOString(), assignee:'Cuadrilla Costera' },
];
