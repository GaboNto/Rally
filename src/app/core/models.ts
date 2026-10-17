export type RiskLevel = 'bajo' | 'medio' | 'alto';
export type SensorStatus = 'activo' | 'desconectado' | 'mantenimiento';
export type AlertSeverity = 'informativa' | 'media' | 'alta' | 'critica';
export type AlertStatus = 'nueva' | 'confirmada' | 'asignada' | 'cerrada';
export type SimulationMode = 'normal' | 'obstruccion' | 'sobrecarga' | 'lluvia' | 'recuperacion';

export interface Reading {
  timestamp: string;
  level: number;
  flow: number;
  rainfall: number;
}

export interface Sensor {
  id: string;
  name: string;
  sector: string;
  segmentId: string;
  position: 'aguas arriba' | 'aguas abajo';
  lat: number;
  lng: number;
  status: SensorStatus;
  level: number;
  capacity: number;
  variation: number;
  lastReading: string;
  readings: Reading[];
  assetType?: 'rejilla_drenaje';
}

export interface DrainageSegment {
  id: string;
  name: string;
  sector: string;
  capacity: number;
  sensorIds: string[];
  coordinates: [number, number][];
  condition: 'normal' | 'posible_obstruccion' | 'sobrecarga' | 'no_concluyente';
  confidence: number;
  evidence: string;
  suggestedAction: string;
}

export interface RiskZone {
  id: string;
  name: string;
  risk: RiskLevel;
  runoff: number;
  polygon: [number, number][];
}

export interface Reservoir {
  id: string;
  name: string;
  lat: number;
  lng: number;
  fill: number;
  capacity: number;
}

export interface HydroAlert {
  id: string;
  type: string;
  severity: AlertSeverity;
  location: string;
  relatedId: string;
  timestamp: string;
  status: AlertStatus;
  action: string;
  assignee?: string;
}

export interface GreenIntervention {
  id: string;
  name: string;
  type: string;
  zone: string;
  score: number;
  cost: number;
  area: number;
  runoffReduction: number;
  feasibility: number;
  lat: number;
  lng: number;
  saved: boolean;
  moduleType?: 'A' | 'B';
  cells?: number;
  storage?: number;
  corridorLength?: number;
  validationStatus?: string;
}

export interface ScenarioResult {
  id: string;
  name: string;
  description: string;
  peakFlow: number;
  runoff: number;
  overflow: number;
  timeToPeak: number;
  cost: number;
  area: number;
  color: string;
}

export interface CommunityReport {
  id: string;
  category: string;
  location: string;
  description: string;
  reporter: string;
  status: 'recibido' | 'validado' | 'inspeccion' | 'resuelto';
  createdAt: string;
  assignee?: string;
}
