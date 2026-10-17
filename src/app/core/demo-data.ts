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
  lastReading: new Date(now - (status === 'desconectado' ? 48 : 2) * 60_000).toISOString(), readings: readings(level - trend * 17, trend, rain), assetType: 'rejilla_drenaje',
});

export const DEMO_SENSORS: Sensor[] = [
  sensor('HG-001', 'Canal Norte · Entrada', 'Norte', 'TR-01', 'aguas arriba', -18.4547, -70.3025, 'activo', 42, 90, 1.2, .35, 2),
  sensor('HG-002', 'Canal Norte · Salida', 'Norte', 'TR-01', 'aguas abajo', -18.4568, -70.3002, 'activo', 24, 90, .2, .05, 2),
  sensor('HG-003', 'Colector Centro · Entrada', 'Centro', 'TR-02', 'aguas arriba', -18.4750, -70.3110, 'activo', 78, 85, 4.8, 1.65, 8),
  sensor('HG-004', 'Colector Centro · Salida', 'Centro', 'TR-02', 'aguas abajo', -18.4780, -70.3082, 'activo', 31, 85, .4, .12, 8),
  sensor('HG-005', 'Rejilla Costera · Entrada', 'Costero', 'TR-03', 'aguas arriba', -18.4820, -70.3160, 'activo', 71, 80, 3.9, 1.2, 10),
  sensor('HG-006', 'Rejilla Costera · Salida', 'Costero', 'TR-03', 'aguas abajo', -18.4845, -70.3130, 'activo', 68, 80, 3.5, 1.1, 10),
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
  { id: 'TR-03', name: 'Drenaje Costero', sector: 'Costero', capacity: .92, sensorIds: ['HG-005','HG-006'], coordinates: [[-18.482,-70.316],[-18.4845,-70.313]], condition: 'sobrecarga', confidence: 81, evidence: 'Ambos niveles aumentan con caudal estimado sobre capacidad.', suggestedAction: 'Activar protocolo preventivo y monitoreo continuo.' },
  { id: 'TR-04', name: 'Quebrada Este', sector: 'Este', capacity: 1.4, sensorIds: ['HG-007','HG-008'], coordinates: [[-18.467,-70.284],[-18.469,-70.288]], condition: 'normal', confidence: 92, evidence: 'Descenso coordinado y sin lluvia relevante.', suggestedAction: 'Sin acción inmediata.' },
  { id: 'TR-05', name: 'Bypass Industrial', sector: 'Norte', capacity: .8, sensorIds: [], coordinates: [[-18.4455,-70.295],[-18.449,-70.297]], condition: 'no_concluyente', confidence: 28, evidence: 'Inspección de capacidad pendiente; no existe evidencia suficiente.', suggestedAction: 'Completar inspección hidráulica antes de emitir diagnóstico.' },
  { id: 'TR-06', name: 'Enlace Reservorio', sector: 'Centro', capacity: 1.1, sensorIds: ['HG-010'], coordinates: [[-18.47,-70.318],[-18.474,-70.315]], condition: 'no_concluyente', confidence: 45, evidence: 'Solo una medición disponible en el tramo.', suggestedAction: 'Complementar con inspección o segundo sensor.' },
  { id: 'TR-07', name: 'Colector Mercado', sector: 'Centro', capacity: .75, sensorIds: [], coordinates: [[-18.478,-70.316],[-18.481,-70.314]], condition: 'no_concluyente', confidence: 20, evidence: 'Levantamiento hidráulico pendiente.', suggestedAction: 'Completar inspección y validar la capacidad del tramo.' },
  { id: 'TR-08', name: 'Descarga Sur', sector: 'Costero', capacity: 1.2, sensorIds: ['HG-012'], coordinates: [[-18.493,-70.315],[-18.496,-70.317]], condition: 'normal', confidence: 69, evidence: 'Nivel bajo y estable; evidencia parcial.', suggestedAction: 'Mantener observación.' },
];

export const DEMO_ZONES: RiskZone[] = [
  { id:'Z-01', name:'Sector Centro', risk:'alto', runoff:82, polygon:[[-18.471,-70.317],[-18.471,-70.305],[-18.482,-70.304],[-18.484,-70.316]] },
  { id:'Z-02', name:'Sector Norte', risk:'medio', runoff:57, polygon:[[-18.442,-70.306],[-18.444,-70.292],[-18.458,-70.294],[-18.459,-70.306]] },
  { id:'Z-03', name:'Sector Costero Sur', risk:'bajo', runoff:31, polygon:[[-18.484,-70.318],[-18.485,-70.307],[-18.498,-70.308],[-18.499,-70.316]] },
];

export const DEMO_RESERVOIRS: Reservoir[] = [
  { id:'RP-01', name:'Reservorio Centro', lat:-18.4705, lng:-70.3135, fill:54, capacity:3200 },
  { id:'RP-02', name:'Reservorio Norte', lat:-18.4470, lng:-70.3040, fill:32, capacity:2100 },
];

export const DEMO_ALERTS: HydroAlert[] = [
  { id:'AL-1042', type:'Posible obstrucción', severity:'critica', location:'Colector Centro', relatedId:'TR-02', timestamp:new Date(now-18*60_000).toISOString(), status:'nueva', action:'Inspeccionar rejilla y conducto antes de 2 horas.' },
  { id:'AL-1041', type:'Posible sobrecarga', severity:'alta', location:'Descarga Costera', relatedId:'TR-03', timestamp:new Date(now-31*60_000).toISOString(), status:'confirmada', action:'Activar monitoreo continuo.', assignee:'Equipo hidráulico' },
  { id:'AL-1040', type:'Inspección hidráulica pendiente', severity:'media', location:'Bypass Industrial', relatedId:'TR-05', timestamp:new Date(now-48*60_000).toISOString(), status:'asignada', action:'Verificar capacidad y estado del tramo.', assignee:'Cuadrilla Norte' },
  { id:'AL-1039', type:'Inspección pendiente', severity:'informativa', location:'Colector Mercado', relatedId:'HG-011', timestamp:new Date(now-95*60_000).toISOString(), status:'confirmada', action:'Completar pauta de mantenimiento.' },
];

export const DEMO_INTERVENTIONS: GreenIntervention[] = [
  { id:'IV-01', name:'Bioesponja Centro', type:'Bioesponja modular', zone:'Sector Centro', score:87, cost:9600000, area:60, runoffReduction:18, feasibility:82, lat:-18.477, lng:-70.312, saved:true },
  { id:'IV-02', name:'Bioesponja Norte', type:'Bioesponja modular', zone:'Sector Norte', score:79, cost:12400000, area:80, runoffReduction:23, feasibility:74, lat:-18.451, lng:-70.299, saved:false },
  { id:'IV-03', name:'Bioesponja Costera', type:'Bioesponja modular', zone:'Sector Costero Sur', score:68, cost:6800000, area:40, runoffReduction:15, feasibility:61, lat:-18.49, lng:-70.317, saved:false },
];

export const DEMO_SCENARIOS: ScenarioResult[] = [
  { id:'A', name:'Infraestructura actual', description:'Línea base sin intervenciones.', peakFlow:2.82, runoff:4280, overflow:640, timeToPeak:38, cost:0, area:0, color:'#ff7a59' },
  { id:'B', name:'Bioesponja · 3 celdas', description:'Configuración compacta de 60 m² en Sector Centro.', peakFlow:2.39, runoff:3560, overflow:410, timeToPeak:44, cost:9600000, area:60, color:'#27d3b2' },
  { id:'C', name:'Bioesponja · 4 celdas', description:'Misma solución ampliada a 80 m².', peakFlow:2.27, runoff:3340, overflow:350, timeToPeak:47, cost:12400000, area:80, color:'#48a7ff' },
  { id:'D', name:'Bioesponja · 5 celdas', description:'Misma sección constructiva con mayor capacidad.', peakFlow:1.96, runoff:2910, overflow:205, timeToPeak:52, cost:15200000, area:100, color:'#a78bfa' },
];

export const DEMO_REPORTS: CommunityReport[] = [
  { id:'RC-028', category:'Sumidero obstruido', location:'Av. 18 de Septiembre 1240, Sector Centro', description:'Acumulación visible junto a rejilla.', reporter:'Vecino verificado', status:'inspeccion', createdAt:new Date(now-110*60_000).toISOString(), assignee:'Cuadrilla Centro' },
  { id:'RC-027', category:'Acumulación de agua', location:'Pasaje Piloto, Sector Norte', description:'Agua permanece luego de la lluvia.', reporter:'Reporte ciudadano', status:'validado', createdAt:new Date(now-210*60_000).toISOString() },
  { id:'RC-026', category:'Sumidero obstruido', location:'Calle Referencia, Sector Costero', description:'Residuos en acceso al sumidero.', reporter:'Reporte ciudadano', status:'resuelto', createdAt:new Date(now-1500*60_000).toISOString(), assignee:'Cuadrilla Costera' },
];

export const TALCAHUANO_SENSORS: Sensor[] = [
  sensor('TH-001', 'Canal El Morro · Entrada', 'Centro', 'TH-TR-01', 'aguas arriba', -36.7240, -73.1195, 'activo', 82, 95, 4.1, 1.35, 12),
  sensor('TH-002', 'Canal El Morro · Salida', 'Centro', 'TH-TR-01', 'aguas abajo', -36.7270, -73.1220, 'activo', 39, 95, .8, .2, 12),
  sensor('TH-003', 'Colector Gaete · Entrada', 'Gaete', 'TH-TR-02', 'aguas arriba', -36.7380, -73.1140, 'activo', 69, 85, 3.2, 1, 11),
  sensor('TH-004', 'Colector Gaete · Salida', 'Gaete', 'TH-TR-02', 'aguas abajo', -36.7410, -73.1170, 'activo', 48, 85, 1.1, .35, 11),
  sensor('TH-005', 'Canal Perales · Entrada', 'Vegas de Perales', 'TH-TR-03', 'aguas arriba', -36.7580, -73.1030, 'activo', 74, 90, 3.7, 1.15, 13),
  sensor('TH-006', 'Canal Perales · Salida', 'Vegas de Perales', 'TH-TR-03', 'aguas abajo', -36.7620, -73.1070, 'activo', 61, 90, 2.4, .75, 13),
  sensor('TH-007', 'Sumidero Centro', 'Centro', 'TH-TR-04', 'aguas arriba', -36.7205, -73.1150, 'mantenimiento', 26, 70, 0),
  sensor('TH-008', 'Descarga a la bahía', 'Gaete', 'TH-TR-05', 'aguas abajo', -36.7345, -73.1260, 'desconectado', 0, 80, 0),
];

export const TALCAHUANO_SEGMENTS: DrainageSegment[] = [
  { id:'TH-TR-01', name:'Canal El Morro', sector:'Centro', capacity:1.1, sensorIds:['TH-001','TH-002'], coordinates:[[-36.7240,-73.1195],[-36.7270,-73.1220]], condition:'posible_obstruccion', confidence:89, evidence:'El nivel aguas arriba crece con mayor rapidez que la descarga del tramo.', suggestedAction:'Inspeccionar rejillas y retirar material antes del próximo frente de lluvia.' },
  { id:'TH-TR-02', name:'Colector Gaete', sector:'Gaete', capacity:.95, sensorIds:['TH-003','TH-004'], coordinates:[[-36.7380,-73.1140],[-36.7410,-73.1170]], condition:'sobrecarga', confidence:84, evidence:'Ambos sensores registran ocupación elevada y aumento sostenido.', suggestedAction:'Mantener monitoreo continuo y habilitar almacenamiento temporal.' },
  { id:'TH-TR-03', name:'Canal Vegas de Perales', sector:'Vegas de Perales', capacity:1.05, sensorIds:['TH-005','TH-006'], coordinates:[[-36.7580,-73.1030],[-36.7620,-73.1070]], condition:'sobrecarga', confidence:86, evidence:'La capacidad utilizada supera el 80 % en la entrada del tramo.', suggestedAction:'Priorizar una solución de retención e infiltración en el sector.' },
  { id:'TH-TR-04', name:'Drenaje urbano Centro', sector:'Centro', capacity:.72, sensorIds:[], coordinates:[[-36.7205,-73.1150],[-36.7240,-73.1170]], condition:'no_concluyente', confidence:32, evidence:'Inspección hidráulica pendiente.', suggestedAction:'Completar una inspección en terreno.' },
  { id:'TH-TR-05', name:'Descarga a la bahía', sector:'Gaete', capacity:1.25, sensorIds:[], coordinates:[[-36.7345,-73.1260],[-36.7360,-73.1300]], condition:'no_concluyente', confidence:25, evidence:'No existe una validación reciente del punto de descarga.', suggestedAction:'Inspeccionar y validar la capacidad disponible.' },
];

export const TALCAHUANO_ZONES: RiskZone[] = [
  { id:'Z-01', name:'Sector Centro', risk:'alto', runoff:86, polygon:[[-36.718,-73.126],[-36.717,-73.111],[-36.730,-73.109],[-36.732,-73.124]] },
  { id:'Z-02', name:'Sector Gaete', risk:'alto', runoff:79, polygon:[[-36.733,-73.122],[-36.732,-73.108],[-36.746,-73.105],[-36.747,-73.120]] },
  { id:'Z-03', name:'Sector Vegas de Perales', risk:'medio', runoff:68, polygon:[[-36.751,-73.112],[-36.750,-73.096],[-36.765,-73.092],[-36.767,-73.108]] },
];

export const TALCAHUANO_RESERVOIRS: Reservoir[] = [
  { id:'TH-RP-01', name:'Estanque regulador Centro', lat:-36.7275, lng:-73.1180, fill:67, capacity:2800 },
  { id:'TH-RP-02', name:'Estanque regulador Perales', lat:-36.7595, lng:-73.1015, fill:43, capacity:3600 },
];

export const TALCAHUANO_ALERTS: HydroAlert[] = [
  { id:'TH-AL-201', type:'Posible obstrucción', severity:'critica', location:'Canal El Morro', relatedId:'TH-TR-01', timestamp:new Date(now-14*60_000).toISOString(), status:'nueva', action:'Inspeccionar rejillas y conducto antes del próximo frente de lluvia.' },
  { id:'TH-AL-200', type:'Capacidad elevada', severity:'alta', location:'Canal Vegas de Perales', relatedId:'TH-TR-03', timestamp:new Date(now-26*60_000).toISOString(), status:'confirmada', action:'Activar seguimiento continuo y preparar retención temporal.', assignee:'Equipo hidráulico' },
  { id:'TH-AL-199', type:'Inspección de descarga pendiente', severity:'media', location:'Descarga a la bahía', relatedId:'TH-TR-05', timestamp:new Date(now-52*60_000).toISOString(), status:'asignada', action:'Verificar condición y capacidad de descarga.', assignee:'Cuadrilla Talcahuano' },
];

export const TALCAHUANO_INTERVENTIONS: GreenIntervention[] = [
  { id:'IV-01', name:'Bioesponja El Morro', type:'Bioesponja modular', zone:'Sector Centro', score:91, cost:12400000, area:80, runoffReduction:24, feasibility:87, lat:-36.7260, lng:-73.1165, saved:true },
  { id:'IV-02', name:'Bioesponja Gaete', type:'Bioesponja modular', zone:'Sector Gaete', score:84, cost:9600000, area:60, runoffReduction:22, feasibility:79, lat:-36.7400, lng:-73.1115, saved:false },
  { id:'IV-03', name:'Bioesponja Perales', type:'Bioesponja modular', zone:'Sector Vegas de Perales', score:88, cost:15200000, area:100, runoffReduction:31, feasibility:82, lat:-36.7590, lng:-73.1000, saved:false },
];

export const TALCAHUANO_SCENARIOS: ScenarioResult[] = [
  { id:'A', name:'Infraestructura actual', description:'Comportamiento esperado sin nuevas intervenciones.', peakFlow:3.16, runoff:4920, overflow:780, timeToPeak:34, cost:0, area:0, color:'#ff7a59' },
  { id:'B', name:'Bioesponja · 4 celdas', description:'Configuración modular en Sector Centro.', peakFlow:2.54, runoff:3740, overflow:465, timeToPeak:43, cost:12400000, area:80, color:'#27d3b2' },
  { id:'C', name:'Bioesponja · 3 celdas', description:'Misma solución ajustada al sector Gaete.', peakFlow:2.61, runoff:3890, overflow:490, timeToPeak:41, cost:9600000, area:60, color:'#48a7ff' },
  { id:'D', name:'Bioesponja · 5 celdas', description:'Misma sección con mayor capacidad en Perales.', peakFlow:1.92, runoff:2780, overflow:190, timeToPeak:52, cost:15200000, area:100, color:'#a78bfa' },
];

export const TALCAHUANO_REPORTS: CommunityReport[] = [
  { id:'TH-RC-03', category:'Acumulación de agua', location:'Sector Centro, Talcahuano', description:'Persistencia de agua junto a la red de sumideros.', reporter:'Equipo territorial', status:'inspeccion', createdAt:new Date(now-75*60_000).toISOString(), assignee:'Cuadrilla Talcahuano' },
  { id:'TH-RC-02', category:'Canal con residuos', location:'Canal El Morro, Talcahuano', description:'Material visible en la entrada del canal.', reporter:'Inspección municipal', status:'validado', createdAt:new Date(now-160*60_000).toISOString() },
];

export const BELEM_SENSORS: Sensor[] = [
  sensor('BL-RQ-IN', 'Rua Quatro · nivel de entrada', 'Rua Quatro', 'BL-TR-01', 'aguas arriba', -1.3669597, -48.4607986, 'activo', 41, 150, 1.2, .32, 12),
  sensor('BL-RQ-OUT', 'Rua Quatro · cámara de salida', 'Rua Quatro', 'BL-TR-01', 'aguas abajo', -1.3689057, -48.4607144, 'activo', 18, 200, .4, .12, 12),
  sensor('BL-SB-IN', 'Passagem São Benedito · nivel de entrada', 'São Benedito', 'BL-TR-02', 'aguas arriba', -1.3759362, -48.4636917, 'activo', 46, 150, 1.5, .38, 12),
  sensor('BL-SB-OUT', 'Passagem São Benedito · cámara de salida', 'São Benedito', 'BL-TR-02', 'aguas abajo', -1.3783967, -48.4635109, 'activo', 21, 200, .5, .15, 12),
  sensor('BL-AI-IN', 'Alameda Isabel · nivel de entrada', 'Alameda Isabel', 'BL-TR-03', 'aguas arriba', -1.3620184, -48.4650320, 'activo', 38, 150, 1.1, .29, 12),
  sensor('BL-AI-OUT', 'Alameda Isabel · cámara de salida', 'Alameda Isabel', 'BL-TR-03', 'aguas abajo', -1.3612158, -48.4644360, 'activo', 16, 200, .3, .1, 12),
  sensor('BL-RAIN', 'Pluviómetro de balancín · emplazamiento por validar', 'Pratinha', 'BL-TR-01', 'aguas arriba', -1.3698, -48.4622, 'activo', 0, 100, 0, 0, 0),
  sensor('BL-TIDE', 'Radar de nivel de marea · emplazamiento por validar', 'Mata Fome', 'BL-TR-03', 'aguas abajo', -1.3800, -48.4680, 'activo', 74, 100, .8, .2, 0),
];

export const BELEM_SEGMENTS: DrainageSegment[] = [
  { id:'BL-TR-01', name:'Corredor Rua Quatro', sector:'Rua Quatro', capacity:.95, sensorIds:['BL-RQ-IN','BL-RQ-OUT'], coordinates:[[-1.3689057,-48.4607144],[-1.3683964,-48.4607457],[-1.3683140,-48.4607562],[-1.3675076,-48.4607842],[-1.3669597,-48.4607986]], condition:'normal', confidence:60, evidence:'Eje vial OSM way 40751463; instrumentación y cotas finas pendientes de levantamiento.', suggestedAction:'Confirmar ancho ≥ 5 m, cotas y punto de conexión al PROMMAF.' },
  { id:'BL-TR-02', name:'Corredor Passagem São Benedito', sector:'São Benedito', capacity:.95, sensorIds:['BL-SB-IN','BL-SB-OUT'], coordinates:[[-1.3759362,-48.4636917],[-1.3764815,-48.4636756],[-1.3771126,-48.4636137],[-1.3778680,-48.4635686],[-1.3780022,-48.4635419],[-1.3781229,-48.4635258],[-1.3783967,-48.4635109]], condition:'normal', confidence:55, evidence:'Eje vial OSM way 40751536; ancho, napa y cotas finas pendientes.', suggestedAction:'Medir ancho real, napa y cota de descarga antes del diseño ejecutivo.' },
  { id:'BL-TR-03', name:'Corredor Alameda Isabel', sector:'Alameda Isabel', capacity:.95, sensorIds:['BL-AI-IN','BL-AI-OUT'], coordinates:[[-1.3620184,-48.4650320],[-1.3619946,-48.4645965],[-1.3619864,-48.4645226],[-1.3619730,-48.4644931],[-1.3619247,-48.4644623],[-1.3618255,-48.4644489],[-1.3612158,-48.4644360]], condition:'normal', confidence:55, evidence:'Eje vial OSM way 40760084; topografía detallada y conexión pendientes.', suggestedAction:'Validar topografía, ancho, permeabilidad y conexión al colector.' },
];

export const BELEM_ZONES: RiskZone[] = [
  // Envolventes conceptuales centradas en Pratinha; sus límites requieren levantamiento topográfico.
  { id:'Z-01', name:'Corredor Rua Quatro', risk:'medio', runoff:90, polygon:[[-1.36908,-48.46098],[-1.36678,-48.46102],[-1.36678,-48.46054],[-1.36908,-48.46050]] },
  { id:'Z-02', name:'Corredor Passagem São Benedito', risk:'alto', runoff:90, polygon:[[-1.37858,-48.46382],[-1.37576,-48.46396],[-1.37576,-48.46342],[-1.37858,-48.46324]] },
  { id:'Z-03', name:'Corredor Alameda Isabel', risk:'alto', runoff:90, polygon:[[-1.36220,-48.46520],[-1.36220,-48.46420],[-1.36104,-48.46420],[-1.36104,-48.46520]] },
];

export const BELEM_RESERVOIRS: Reservoir[] = [];

export const BELEM_ALERTS: HydroAlert[] = [
  { id:'BL-AL-301', type:'Prealerta por lluvia de diseño', severity:'alta', location:'Red Pratinha', relatedId:'BL-RAIN', timestamp:new Date(now-12*60_000).toISOString(), status:'nueva', action:'Con lluvia ≥ 30 mm, limpiar rejas y sedimentadores antes del evento.' },
  { id:'BL-AL-300', type:'Coincidencia lluvia y pleamar', severity:'alta', location:'Canal Mata Fome', relatedId:'BL-TIDE', timestamp:new Date(now-22*60_000).toISOString(), status:'confirmada', action:'Revisar válvulas de clapeta y avisar a los líderes barriales.', assignee:'Guardiões do Igarapé' },
  { id:'BL-AL-299', type:'Validación topográfica pendiente', severity:'media', location:'Tres corredores de Pratinha', relatedId:'BL-TR-01', timestamp:new Date(now-49*60_000).toISOString(), status:'asignada', action:'Confirmar ancho de vías, cotas de descarga y profundidad de napa.', assignee:'Equipo técnico SESAN' },
];

export const BELEM_INTERVENTIONS: GreenIntervention[] = [
  { id:'IV-01', name:'Bioesponja Rua Quatro', type:'Módulo A · 10 × 2 m', zone:'Corredor Rua Quatro', score:78, cost:0, area:60, runoffReduction:100, feasibility:65, lat:-1.36793, lng:-48.46076, saved:true, moduleType:'A', cells:3, storage:16.5, corridorLength:33.5, validationStatus:'Eje vial confirmado; ancho, cotas y conexión por validar' },
  { id:'IV-02', name:'Bioesponja Passagem São Benedito', type:'Módulo B · 10 × 1,2 m', zone:'Corredor Passagem São Benedito', score:74, cost:0, area:60, runoffReduction:100, feasibility:60, lat:-1.37717, lng:-48.46361, saved:false, moduleType:'B', cells:5, storage:16.5, corridorLength:57, validationStatus:'Eje vial confirmado; ancho, napa y conexión por validar' },
  { id:'IV-03', name:'Bioesponja Alameda Isabel', type:'Módulo B · 10 × 1,2 m', zone:'Corredor Alameda Isabel', score:74, cost:0, area:60, runoffReduction:100, feasibility:60, lat:-1.36172, lng:-48.46457, saved:false, moduleType:'B', cells:5, storage:16.5, corridorLength:57, validationStatus:'Eje vial confirmado; topografía detallada y conexión por validar' },
];

export const BELEM_SCENARIOS: ScenarioResult[] = [
  { id:'A', name:'15 mm · un corredor', description:'Lluvia frecuente; retención estática completa.', peakFlow:.95, runoff:4.95, overflow:0, timeToPeak:90, cost:0, area:60, color:'#27d3b2' },
  { id:'B', name:'50 mm · lluvia de diseño', description:'16,5 m³ recibidos y almacenados por corredor.', peakFlow:.95, runoff:16.5, overflow:0, timeToPeak:90, cost:0, area:60, color:'#27d3b2' },
  { id:'C', name:'100 mm · evento superior', description:'50 % retenido; 16,5 m³ excedentes al colector.', peakFlow:.95, runoff:33, overflow:16.5, timeToPeak:90, cost:0, area:60, color:'#48a7ff' },
  { id:'D', name:'150 mm · evento extremo', description:'33 % retenido; 33 m³ excedentes al colector.', peakFlow:.95, runoff:49.5, overflow:33, timeToPeak:90, cost:0, area:60, color:'#a78bfa' },
];

export const BELEM_REPORTS: CommunityReport[] = [
  { id:'BL-RC-03', category:'Acumulación de agua', location:'Rua Quatro, Pratinha', description:'Antecedente de anegamiento; requiere verificación topográfica y delimitación del aporte.', reporter:'Equipo territorial', status:'inspeccion', createdAt:new Date(now-68*60_000).toISOString(), assignee:'Equipo técnico SESAN' },
  { id:'BL-RC-02', category:'Sedimento y residuos', location:'Canal Mata Fome, Belém', description:'La solución incorpora reja deflectora y bio-gavión para proteger los colectores.', reporter:'Inspección municipal', status:'validado', createdAt:new Date(now-145*60_000).toISOString() },
];

