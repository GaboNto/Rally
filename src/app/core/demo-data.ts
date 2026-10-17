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
  { id:'IV-01', name:'Parque de lluvia El Morro', type:'Parque de absorción', zone:'Sector Centro', score:91, cost:31800000, area:620, runoffReduction:24, feasibility:87, lat:-36.7260, lng:-73.1165, saved:true },
  { id:'IV-02', name:'Biozanja urbana Gaete', type:'Biozanja vegetada', zone:'Sector Gaete', score:84, cost:27400000, area:740, runoffReduction:22, feasibility:79, lat:-36.7400, lng:-73.1115, saved:false },
  { id:'IV-03', name:'Humedal urbano Perales', type:'Área de biorretención', zone:'Sector Vegas de Perales', score:88, cost:39600000, area:1150, runoffReduction:31, feasibility:82, lat:-36.7590, lng:-73.1000, saved:false },
];

export const TALCAHUANO_SCENARIOS: ScenarioResult[] = [
  { id:'A', name:'Infraestructura actual', description:'Comportamiento esperado sin nuevas intervenciones.', peakFlow:3.16, runoff:4920, overflow:780, timeToPeak:34, cost:0, area:0, color:'#ff7a59' },
  { id:'B', name:'Parque El Morro', description:'Captación e infiltración en Sector Centro.', peakFlow:2.54, runoff:3740, overflow:465, timeToPeak:43, cost:31800000, area:620, color:'#27d3b2' },
  { id:'C', name:'Biozanja Gaete', description:'Conducción verde y retención distribuida en Gaete.', peakFlow:2.61, runoff:3890, overflow:490, timeToPeak:41, cost:27400000, area:740, color:'#48a7ff' },
  { id:'D', name:'Red integral', description:'Parque El Morro, biozanja Gaete y humedal Perales.', peakFlow:1.92, runoff:2780, overflow:190, timeToPeak:52, cost:98800000, area:2510, color:'#a78bfa' },
];

export const TALCAHUANO_REPORTS: CommunityReport[] = [
  { id:'TH-RC-03', category:'Acumulación de agua', location:'Sector Centro, Talcahuano', description:'Persistencia de agua junto a la red de sumideros.', reporter:'Equipo territorial', status:'inspeccion', createdAt:new Date(now-75*60_000).toISOString(), assignee:'Cuadrilla Talcahuano' },
  { id:'TH-RC-02', category:'Canal con residuos', location:'Canal El Morro, Talcahuano', description:'Material visible en la entrada del canal.', reporter:'Inspección municipal', status:'validado', createdAt:new Date(now-160*60_000).toISOString() },
];

export const BELEM_SENSORS: Sensor[] = [
  sensor('BL-001', 'Canal da Estrada Nova · Entrada', 'Cidade Velha', 'BL-TR-01', 'aguas arriba', -1.4670, -48.5000, 'activo', 88, 100, 4.6, 1.45, 18),
  sensor('BL-002', 'Canal da Estrada Nova · Saída', 'Cidade Velha', 'BL-TR-01', 'aguas abajo', -1.4690, -48.5030, 'activo', 57, 100, 1.4, .4, 18),
  sensor('BL-003', 'Canal do Tucunduba · Entrada', 'Terra Firme', 'BL-TR-02', 'aguas arriba', -1.4610, -48.4560, 'activo', 81, 95, 4.1, 1.25, 21),
  sensor('BL-004', 'Canal do Tucunduba · Saída', 'Terra Firme', 'BL-TR-02', 'aguas abajo', -1.4660, -48.4640, 'activo', 63, 95, 2.2, .65, 21),
  sensor('BL-005', 'Canal do Una · Entrada', 'Marco', 'BL-TR-03', 'aguas arriba', -1.4370, -48.4690, 'activo', 73, 90, 3.3, 1.05, 16),
  sensor('BL-006', 'Canal do Una · Saída', 'Marco', 'BL-TR-03', 'aguas abajo', -1.4490, -48.4830, 'activo', 59, 90, 1.8, .55, 16),
  sensor('BL-007', 'Microdrenagem Jurunas', 'Cidade Velha', 'BL-TR-04', 'aguas arriba', -1.4660, -48.4890, 'mantenimiento', 34, 75, 0),
  sensor('BL-008', 'Descarga Guamá', 'Terra Firme', 'BL-TR-05', 'aguas abajo', -1.4710, -48.4620, 'desconectado', 0, 90, 0),
];

export const BELEM_SEGMENTS: DrainageSegment[] = [
  { id:'BL-TR-01', name:'Canal da Estrada Nova', sector:'Cidade Velha', capacity:1.15, sensorIds:['BL-001','BL-002'], coordinates:[[-1.4670,-48.5000],[-1.4690,-48.5030]], condition:'posible_obstruccion', confidence:91, evidence:'La entrada aumenta con mayor rapidez que la salida durante la precipitación.', suggestedAction:'Inspeccionar rejillas, residuos y sección hidráulica del canal.' },
  { id:'BL-TR-02', name:'Canal do Tucunduba', sector:'Terra Firme', capacity:1.05, sensorIds:['BL-003','BL-004'], coordinates:[[-1.4610,-48.4560],[-1.4660,-48.4640]], condition:'sobrecarga', confidence:88, evidence:'Ocupación elevada en ambos puntos y tendencia ascendente sostenida.', suggestedAction:'Activar seguimiento continuo y preparar almacenamiento temporal.' },
  { id:'BL-TR-03', name:'Canal do Una', sector:'Marco', capacity:1.2, sensorIds:['BL-005','BL-006'], coordinates:[[-1.4370,-48.4690],[-1.4490,-48.4830]], condition:'sobrecarga', confidence:82, evidence:'El nivel de entrada supera el 80 % de la capacidad de referencia.', suggestedAction:'Priorizar retención distribuida antes del ingreso al canal.' },
  { id:'BL-TR-04', name:'Microdrenagem Jurunas', sector:'Cidade Velha', capacity:.76, sensorIds:['BL-007'], coordinates:[[-1.4660,-48.4890],[-1.4690,-48.4930]], condition:'no_concluyente', confidence:34, evidence:'El punto de control está en mantenimiento.', suggestedAction:'Restablecer la lectura y realizar inspección en terreno.' },
  { id:'BL-TR-05', name:'Descarga Guamá', sector:'Terra Firme', capacity:1.3, sensorIds:[], coordinates:[[-1.4710,-48.4620],[-1.4730,-48.4660]], condition:'no_concluyente', confidence:26, evidence:'No se dispone de una validación hidráulica reciente.', suggestedAction:'Inspeccionar y validar el nivel de descarga.' },
];

export const BELEM_ZONES: RiskZone[] = [
  { id:'Z-01', name:'Sector Cidade Velha', risk:'alto', runoff:91, polygon:[[-1.455,-48.510],[-1.454,-48.496],[-1.468,-48.493],[-1.471,-48.507]] },
  { id:'Z-02', name:'Sector Terra Firme', risk:'alto', runoff:88, polygon:[[-1.450,-48.469],[-1.448,-48.452],[-1.466,-48.450],[-1.469,-48.467]] },
  { id:'Z-03', name:'Sector Marco', risk:'medio', runoff:72, polygon:[[-1.427,-48.482],[-1.426,-48.466],[-1.445,-48.463],[-1.447,-48.479]] },
];

export const BELEM_RESERVOIRS: Reservoir[] = [
  { id:'BL-RP-01', name:'Reservatório Estrada Nova', lat:-1.4640, lng:-48.4970, fill:71, capacity:4200 },
  { id:'BL-RP-02', name:'Reservatório Tucunduba', lat:-1.4635, lng:-48.4590, fill:63, capacity:5100 },
];

export const BELEM_ALERTS: HydroAlert[] = [
  { id:'BL-AL-301', type:'Posible obstrucción', severity:'critica', location:'Canal da Estrada Nova', relatedId:'BL-TR-01', timestamp:new Date(now-12*60_000).toISOString(), status:'nueva', action:'Inspeccionar la entrada y liberar la sección de paso.' },
  { id:'BL-AL-300', type:'Canal con capacidad elevada', severity:'alta', location:'Canal do Tucunduba', relatedId:'BL-TR-02', timestamp:new Date(now-22*60_000).toISOString(), status:'confirmada', action:'Mantener monitoreo continuo y preparar respuesta territorial.', assignee:'Equipe hidráulica' },
  { id:'BL-AL-299', type:'Inspección de descarga pendiente', severity:'media', location:'Descarga Guamá', relatedId:'BL-TR-05', timestamp:new Date(now-49*60_000).toISOString(), status:'asignada', action:'Verificar condición y capacidad de descarga.', assignee:'Equipe Belém' },
];

export const BELEM_INTERVENTIONS: GreenIntervention[] = [
  { id:'IV-01', name:'Parque de chuva Estrada Nova', type:'Parque de absorción', zone:'Sector Cidade Velha', score:93, cost:42000000, area:850, runoffReduction:28, feasibility:88, lat:-1.4630, lng:-48.5000, saved:true },
  { id:'IV-02', name:'Corredor filtrante Tucunduba', type:'Biozanja vegetada', zone:'Sector Terra Firme', score:90, cost:37600000, area:980, runoffReduction:27, feasibility:85, lat:-1.4630, lng:-48.4600, saved:false },
  { id:'IV-03', name:'Jardim de retenção Una', type:'Área de biorretención', zone:'Sector Marco', score:84, cost:33500000, area:760, runoffReduction:23, feasibility:80, lat:-1.4400, lng:-48.4710, saved:false },
];

export const BELEM_SCENARIOS: ScenarioResult[] = [
  { id:'A', name:'Infraestructura actual', description:'Comportamiento esperado sin nuevas intervenciones.', peakFlow:3.72, runoff:5680, overflow:960, timeToPeak:29, cost:0, area:0, color:'#ff7a59' },
  { id:'B', name:'Parque Estrada Nova', description:'Captación e infiltración en Cidade Velha.', peakFlow:2.81, runoff:4090, overflow:570, timeToPeak:40, cost:42000000, area:850, color:'#27d3b2' },
  { id:'C', name:'Corredor Tucunduba', description:'Retención lineal y conducción controlada.', peakFlow:2.76, runoff:4140, overflow:545, timeToPeak:42, cost:37600000, area:980, color:'#48a7ff' },
  { id:'D', name:'Red integral Belém', description:'Aplicación coordinada de las tres intervenciones.', peakFlow:1.98, runoff:2860, overflow:215, timeToPeak:54, cost:113100000, area:2590, color:'#a78bfa' },
];

export const BELEM_REPORTS: CommunityReport[] = [
  { id:'BL-RC-03', category:'Acumulación de agua', location:'Cidade Velha, Belém', description:'Agua acumulada junto a un acceso de microdrenaje.', reporter:'Equipo territorial', status:'inspeccion', createdAt:new Date(now-68*60_000).toISOString(), assignee:'Equipe Belém' },
  { id:'BL-RC-02', category:'Canal con residuos', location:'Canal da Estrada Nova, Belém', description:'Material visible en la entrada del canal.', reporter:'Inspección municipal', status:'validado', createdAt:new Date(now-145*60_000).toISOString() },
];

