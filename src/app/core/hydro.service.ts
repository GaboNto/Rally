import { Injectable, computed, signal } from '@angular/core';
import { BELEM_ALERTS, BELEM_INTERVENTIONS, BELEM_REPORTS, BELEM_RESERVOIRS, BELEM_SCENARIOS, BELEM_SEGMENTS, BELEM_SENSORS, BELEM_ZONES, DEMO_ALERTS, DEMO_INTERVENTIONS, DEMO_REPORTS, DEMO_RESERVOIRS, DEMO_SCENARIOS, DEMO_SEGMENTS, DEMO_SENSORS, DEMO_ZONES, TALCAHUANO_ALERTS, TALCAHUANO_INTERVENTIONS, TALCAHUANO_REPORTS, TALCAHUANO_RESERVOIRS, TALCAHUANO_SCENARIOS, TALCAHUANO_SEGMENTS, TALCAHUANO_SENSORS, TALCAHUANO_ZONES } from './demo-data';
import { AlertStatus, CommunityReport, SimulationMode } from './models';

export type DemoArea = 'arica' | 'quibdo' | 'talcahuano' | 'belem';

@Injectable({ providedIn: 'root' })
export class HydroService {
  readonly demoArea = signal<DemoArea>('belem');
  readonly sensors = signal(structuredClone(BELEM_SENSORS));
  readonly segments = signal(structuredClone(BELEM_SEGMENTS));
  readonly zones = signal(structuredClone(BELEM_ZONES));
  readonly reservoirs = signal(structuredClone(BELEM_RESERVOIRS));
  readonly alerts = signal(structuredClone(BELEM_ALERTS));
  readonly interventions = signal(structuredClone(BELEM_INTERVENTIONS));
  readonly scenarios = signal(structuredClone(BELEM_SCENARIOS));
  readonly reports = signal(structuredClone(BELEM_REPORTS));
  readonly selectedSensorId = signal('BL-RQ-IN');
  readonly simulationMode = signal<SimulationMode>('normal');
  readonly simulationRunning = signal(false);
  readonly lastUpdated = signal(new Date());
  private timer?: ReturnType<typeof setInterval>;

  constructor() {
    try {
      const savedAlerts = JSON.parse(localStorage.getItem('pomerape-alerts') || 'null');
      if (Array.isArray(savedAlerts)) this.alerts.set(savedAlerts);
    } catch {
      localStorage.removeItem('pomerape-alerts');
    }
  }

  readonly selectedSensor = computed(() => this.sensors().find(s => s.id === this.selectedSensorId()) ?? this.sensors()[0]);
  readonly activeAlerts = computed(() => this.alerts().filter(a => a.status !== 'cerrada'));
  readonly metrics = computed(() => {
    const sensors = this.sensors();
    const connected = sensors.filter(s => s.status === 'activo');
    return {
      active: connected.length,
      offline: sensors.filter(s => s.status === 'desconectado').length,
      sectors: new Set(sensors.map(s => s.sector)).size,
      highRisk: this.zones().filter(z => z.risk === 'alto').length,
      obstructions: this.segments().filter(s => s.condition === 'posible_obstruccion').length,
      averageLevel: Math.round(connected.reduce((sum, s) => sum + s.level, 0) / connected.length),
      alerts: this.activeAlerts().length,
    };
  });

  selectSensor(id: string) { this.selectedSensorId.set(id); }
  setDemoArea(area: DemoArea) {
    this.demoArea.set(area);
    const talcahuano = area === 'talcahuano';
    const belem = area === 'belem';
    this.sensors.set(structuredClone(belem ? BELEM_SENSORS : talcahuano ? TALCAHUANO_SENSORS : DEMO_SENSORS));
    this.segments.set(structuredClone(belem ? BELEM_SEGMENTS : talcahuano ? TALCAHUANO_SEGMENTS : DEMO_SEGMENTS));
    this.zones.set(structuredClone(belem ? BELEM_ZONES : talcahuano ? TALCAHUANO_ZONES : DEMO_ZONES));
    this.reservoirs.set(structuredClone(belem ? BELEM_RESERVOIRS : talcahuano ? TALCAHUANO_RESERVOIRS : DEMO_RESERVOIRS));
    this.alerts.set(structuredClone(belem ? BELEM_ALERTS : talcahuano ? TALCAHUANO_ALERTS : DEMO_ALERTS));
    this.interventions.set(structuredClone(belem ? BELEM_INTERVENTIONS : talcahuano ? TALCAHUANO_INTERVENTIONS : DEMO_INTERVENTIONS));
    this.scenarios.set(structuredClone(belem ? BELEM_SCENARIOS : talcahuano ? TALCAHUANO_SCENARIOS : DEMO_SCENARIOS));
    this.reports.set(structuredClone(belem ? BELEM_REPORTS : talcahuano ? TALCAHUANO_REPORTS : DEMO_REPORTS));
    this.selectedSensorId.set(belem ? 'BL-RQ-IN' : talcahuano ? 'TH-001' : 'HG-003');
    this.lastUpdated.set(new Date());
  }

  setSimulation(mode: SimulationMode, running: boolean) {
    this.simulationMode.set(mode);
    this.simulationRunning.set(running);
    if (this.timer) clearInterval(this.timer);
    if (running) {
      this.tickSimulation();
      this.timer = setInterval(() => this.tickSimulation(), 4000);
    }
  }

  tickSimulation() {
    const mode = this.simulationMode();
    const effects: Record<SimulationMode, { upstream: number; downstream: number; rain: number }> = {
      normal: { upstream: .2, downstream: .15, rain: 0 },
      obstruccion: { upstream: 3.2, downstream: .2, rain: 1 },
      sobrecarga: { upstream: 2.5, downstream: 2.3, rain: 4 },
      lluvia: { upstream: 1.8, downstream: 1.3, rain: 6 },
      recuperacion: { upstream: -2.8, downstream: -1.7, rain: -2 },
    };
    const effect = effects[mode];
    const timestamp = new Date().toISOString();
    this.sensors.update(items => items.map(sensor => {
      if (sensor.status !== 'activo') return sensor;
      const change = sensor.position === 'aguas arriba' ? effect.upstream : effect.downstream;
      const level = Math.max(3, Math.min(sensor.capacity + 12, +(sensor.level + change + (Math.random() - .5)).toFixed(1)));
      const reading = { timestamp, level, flow: +(level / 68).toFixed(2), rainfall: Math.max(0, effect.rain) };
      return { ...sensor, level, variation: +change.toFixed(1), lastReading: timestamp, readings: [...sensor.readings.slice(-23), reading] };
    }));
    this.lastUpdated.set(new Date());
  }

  updateAlert(id: string, status: AlertStatus) {
    this.alerts.update(items => items.map(a => a.id === id ? { ...a, status, assignee: status === 'asignada' ? 'Equipo de turno' : a.assignee } : a));
    localStorage.setItem('pomerape-alerts', JSON.stringify(this.alerts()));
    this.lastUpdated.set(new Date());
  }

  toggleIntervention(id: string) {
    this.interventions.update(items => items.map(i => i.id === id ? { ...i, saved: !i.saved } : i));
  }

  addReport(report: Pick<CommunityReport, 'category' | 'location' | 'description' | 'reporter'>) {
    const item: CommunityReport = { ...report, id: `RC-${String(29 + this.reports().length).padStart(3, '0')}`, status: 'recibido', createdAt: new Date().toISOString() };
    this.reports.update(items => [item, ...items]);
  }

  advanceReport(id: string) {
    const order: CommunityReport['status'][] = ['recibido', 'validado', 'inspeccion', 'resuelto'];
    this.reports.update(items => items.map(r => {
      if (r.id !== id) return r;
      const status = order[Math.min(order.indexOf(r.status) + 1, order.length - 1)];
      return { ...r, status, assignee: status === 'inspeccion' ? 'Cuadrilla municipal' : r.assignee };
    }));
  }
}
