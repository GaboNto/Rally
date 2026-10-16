import { Injectable, computed, signal } from '@angular/core';
import { DEMO_ALERTS, DEMO_INTERVENTIONS, DEMO_REPORTS, DEMO_RESERVOIRS, DEMO_SCENARIOS, DEMO_SEGMENTS, DEMO_SENSORS, DEMO_ZONES } from './demo-data';
import { AlertStatus, CommunityReport, SimulationMode } from './models';

export type DemoArea = 'arica' | 'quibdo';

@Injectable({ providedIn: 'root' })
export class HydroService {
  readonly demoArea = signal<DemoArea>('arica');
  readonly sensors = signal(structuredClone(DEMO_SENSORS));
  readonly segments = signal(structuredClone(DEMO_SEGMENTS));
  readonly zones = signal(structuredClone(DEMO_ZONES));
  readonly reservoirs = signal(structuredClone(DEMO_RESERVOIRS));
  readonly alerts = signal(structuredClone(DEMO_ALERTS));
  readonly interventions = signal(structuredClone(DEMO_INTERVENTIONS));
  readonly scenarios = signal(structuredClone(DEMO_SCENARIOS));
  readonly reports = signal(structuredClone(DEMO_REPORTS));
  readonly selectedSensorId = signal('HG-003');
  readonly simulationMode = signal<SimulationMode>('normal');
  readonly simulationRunning = signal(false);
  readonly lastUpdated = signal(new Date());
  private timer?: ReturnType<typeof setInterval>;

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
  setDemoArea(area: DemoArea) { this.demoArea.set(area); }

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
