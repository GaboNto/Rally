import { DatePipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HydroService } from '../core/hydro.service';
import { GreenIntervention, RiskLevel, RiskZone } from '../core/models';
import { HydroMapComponent, SurfaceMode } from '../shared/hydro-map.component';

interface ForecastDay {
  label: string;
  rain: number;
  retention: number;
  condition: string;
}

@Component({
  selector: 'app-geo-map-page',
  standalone: true,
  imports: [DatePipe, RouterLink, HydroMapComponent],
  template: `
    <section class="page-head">
      <div><div class="eyebrow">Centro integrado de análisis</div><h1>Mapa de decisión pluvial</h1><p>Evento de lluvia, topografía, drenaje e infraestructura verde en un solo flujo.</p></div>
      <span class="badge green">Análisis territorial integrado</span>
    </section>

    <section class="decision-flow" aria-label="Flujo de decisión">
      <div class="done"><span>1</span><p><b>Evento de lluvia</b><small>Selecciona la lámina</small></p></div><i></i>
      <div class="done"><span>2</span><p><b>Riesgo territorial</b><small>Cruce con altura y red</small></p></div><i></i>
      <div [class.done]="selectedParks().length"><span>3</span><p><b>Intervención</b><small>Configura la bioesponja</small></p></div><i></i>
      <div [class.done]="selectedParks().length"><span>4</span><p><b>Impacto esperado</b><small>Compara el resultado</small></p></div>
    </section>

    <section class="forecast card">
      <div class="forecast-intro"><span class="weather-icon">☔</span><div><small>ESCENARIOS DEL INFORME</small><h2>¿Qué evento quieres evaluar?</h2><p>La proyección usa las láminas de comprobación y la capacidad estática documentada.</p></div></div>
      <div class="forecast-days">
        @for (day of forecast; track day.label; let index = $index) {
          <button [class.active]="selectedForecastIndex() === index" (click)="selectForecast(index)">
            <span>{{day.label}}</span><b>{{day.condition}}</b><strong>{{day.rain}} mm</strong><small>{{day.retention}}% retenido por corredor</small>
          </button>
        }
      </div>
    </section>

    <section class="analysis-grid">
      <article class="card map-card">
        <div class="map-toolbar">
          <div><small>ESCENARIO ANALIZADO</small><b>{{activeForecast().label}} · {{activeForecast().rain}} mm/24 h</b></div>
          <div class="map-controls">
            <div class="segmented"><button [class.active]="surfaceMode()==='susceptibility'" (click)="surfaceMode.set('susceptibility')">{{hydro.demoArea()==='belem' ? 'Prioridad' : 'Riesgo'}}</button><button [class.active]="surfaceMode()==='elevation'" (click)="surfaceMode.set('elevation')">Elevación</button></div>
            <div class="segmented compare"><button [class.active]="viewMode()==='before'" (click)="viewMode.set('before')">Actual</button><button [class.active]="viewMode()==='after'" [disabled]="!selectedParks().length" (click)="viewMode.set('after')">Con bioesponja</button></div>
          </div>
        </div>
        <div class="map-holder">
          <app-hydro-map
            [sensors]="[]" [segments]="hydro.demoArea()!=='quibdo'?hydro.segments():[]"
            [zones]="displayZones()" [reservoirs]="hydro.demoArea()!=='quibdo'?hydro.reservoirs():[]" [interventions]="decisionInterventions()"
            [selectedZoneId]="selectedZone().id" [selectedInterventionIds]="selectedParks()" [showRiskSurface]="true" [surfaceMode]="surfaceMode()"
            [riskOpacity]="surfaceMode()==='susceptibility'?0.24:0.08" [decisionMode]="true" [rainfall]="activeForecast().rain" [comparisonMode]="viewMode()" [demoArea]="hydro.demoArea()"
            (zoneSelected)="selectZone($event)" (interventionSelected)="togglePark($event)" />
          <div class="map-story">
            @if(hydro.demoArea()==='belem'){
              <span><i class="water"></i>Cota DEM 90 m</span><span><i class="flow"></i>Eje vial OSM</span><span><i class="park"></i>Bioesponja proyectada</span><span><i class="risk"></i>Corredor de análisis</span>
            } @else {
              <span><i class="water"></i>Profundidad proyectada</span><span><i class="flow"></i>Ruta de escurrimiento</span><span><i class="park"></i>Ubicación de bioesponja</span><span><i class="risk"></i>Zona prioritaria</span>
            }
          </div>
          <div class="map-caption">{{hydro.demoArea()==='belem' ? 'Fuentes territoriales: Open-Meteo DEM 90 m y OpenStreetMap · diseño sujeto a ingeniería de detalle' : 'Altura del terreno + ' + activeForecast().rain + ' mm · profundidad recalculada'}}</div>
        </div>
      </article>

      <aside class="decision-panel card">
        <div class="panel-head"><div><small>ZONA SELECCIONADA</small><h2>{{selectedZone().name}}</h2></div><span class="risk-badge {{selectedRisk()}}">{{riskLabel(selectedRisk())}}</span></div>
        <div class="rain-alert" [class.critical]="selectedRiskScore() >= 68"><span>!</span><div><b>{{riskMessage()}}</b><p>Evento de {{activeForecast().rain}} mm · análisis territorial basado en elevación, escorrentía y capacidad de drenaje.</p></div></div>
        <div class="integrated-risk">
          <div class="integrated-head"><div><small>RIESGO INTEGRADO</small><b>{{selectedRiskScore()}}/100</b></div><span>Índice territorial</span></div>
          <div class="risk-factor"><span>Topografía <b>45%</b></span><i><em [style.width.%]="topographyScore(selectedZone())"></em></i></div>
          <div class="risk-factor"><span>Pronóstico <b>35%</b></span><i><em [style.width.%]="rainScore()"></em></i></div>
          <div class="risk-factor drainage"><span>Drenaje <b>20%</b></span><i><em [style.width.%]="drainageScore(selectedZone())"></em></i></div>
        </div>
        <div class="evidence">
          <h3>¿Por qué se genera el riesgo?</h3>
          <div><span>⌁</span><p><b>Topografía</b><small>{{topographyReason()}}</small></p></div>
          <div><span>≋</span><p><b>Escorrentía estimada</b><small>{{selectedZone().runoff}}% de concentración superficial.</small></p></div>
          <div><span>◇</span><p><b>Drenaje</b><small>{{drainageReason()}}</small></p></div>
        </div>
        <div class="recommendation">
          <small>SOLUCIÓN RECOMENDADA</small><h3>{{recommendedPark().name}}</h3><p>{{recommendedPark().type}} de {{recommendedPark().area}} m² en {{recommendedPark().zone}}.</p>
          <div class="recommendation-stats"><span><b>{{recommendedPark().runoffReduction}}%</b> retención a 50 mm</span><span><b>{{recommendedPark().storage || '—'}} m³</b> almacenamiento</span><span><b>{{recommendedPark().cost ? formatMillions(recommendedPark().cost) : 'Pendiente'}}</b> presupuesto</span></div>
          <div class="recommendation-actions">
            <button class="btn ghost" (click)="togglePark(recommendedPark().id)">{{isParkSelected(recommendedPark().id) ? 'Quitar ubicación' : 'Comparar en esta zona'}}</button>
            <a class="btn primary" routerLink="/infraestructura-verde" [queryParams]="{ zone: selectedZone().id, rain: activeForecast().rain, forecast: selectedForecastIndex(), intervention: recommendedPark().id }">Diseñar solución →</a>
          </div>
        </div>
      </aside>
    </section>

    <section class="impact card">
      <div class="impact-head"><div><div class="eyebrow">Comparación del escenario</div><h2>Impacto estimado de la decisión</h2><p>{{selectedParks().length ? 'Bioesponja evaluada en ' + recommendedPark().zone + '.' : 'Selecciona una ubicación para calcular el escenario intervenido.'}}</p></div><div class="impact-actions"><button class="btn ghost" (click)="clearPlan()" [disabled]="!selectedParks().length">Limpiar</button><button class="btn primary" (click)="savePlan()" [disabled]="!selectedParks().length">Guardar plan</button></div></div>
      <div class="comparison">
        <div class="comparison-label"><span>INDICADOR</span><b>Situación actual</b><strong>Con intervención</strong></div>
        <div><span>Agua acumulada</span><b>{{estimatedWater()}} m³</b><strong>{{projectedWater()}} m³ <em>−{{waterSaved()}} m³</em></strong></div>
        <div><span>Caudal máximo</span><b>{{peakFlow().toFixed(2)}} m³/s</b><strong>{{projectedPeakFlow().toFixed(2)}} m³/s</strong></div>
        <div><span>Profundidad máxima proyectada</span><b>{{estimatedDepth()}} cm</b><strong>{{projectedDepth()}} cm</strong></div>
        <div><span>Tiempo de evacuación</span><b>{{drainHours().toFixed(1)}} h</b><strong>{{projectedDrainHours().toFixed(1)}} h</strong></div>
      </div>
      @if (savedAt()) { <div class="saved-message">✓ Plan guardado correctamente a las {{savedAt() | date:'HH:mm'}}.</div> }
    </section>

    <section class="portfolio-head"><div><div class="eyebrow">Ubicaciones candidatas</div><h2>La misma bioesponja, dimensionada para cada zona</h2></div><span>{{selectedParks().length ? '1 ubicación en evaluación' : 'Selecciona una zona'}}</span></section>
    <section class="park-grid">
      @for (park of decisionInterventions(); track park.id; let index = $index) {
        <article class="card park-option" [class.selected]="isParkSelected(park.id)">
          <div class="park-option-head"><span>0{{index + 1}}</span><div><small>{{park.type}}</small><h3>{{park.name}}</h3></div><b>{{park.score}}/100</b></div>
          <p>{{park.zone}} · {{hydro.demoArea()==='belem' ? (park.validationStatus || 'Validación de ingeniería requerida') : park.lat.toFixed(4) + ', ' + park.lng.toFixed(4)}}</p>
          <div class="park-metrics"><span><small>SUPERFICIE</small><b>{{park.area}} m²</b></span><span><small>REDUCCIÓN</small><b>{{park.runoffReduction}}%</b></span><span><small>FACTIBILIDAD</small><b>{{park.feasibility}}%</b></span></div>
          <button class="btn" [class.primary]="!isParkSelected(park.id)" (click)="togglePark(park.id)">{{isParkSelected(park.id) ? 'Ubicación seleccionada ✓' : 'Evaluar en esta zona'}}</button>
        </article>
      }
    </section>

    <section class="next-step card"><div><span>✓</span><div><small>SIGUIENTE PASO</small><h3>El plan conecta la predicción con una decisión concreta</h3><p>Guarda la combinación seleccionada y genera el informe institucional con diagnóstico territorial, ubicaciones y hoja de ruta.</p></div></div><a routerLink="/informes" class="btn primary">Abrir informe integral →</a></section>
  `,
  styles: [`
    .decision-flow{display:grid;grid-template-columns:auto 1fr auto 1fr auto 1fr auto;align-items:center;padding:15px 18px;margin-bottom:14px;background:#091c27;border:1px solid var(--line);border-radius:12px}.decision-flow>div{display:flex;align-items:center;gap:9px;color:#5e7884}.decision-flow>div>span{width:27px;height:27px;border-radius:50%;display:grid;place-items:center;background:#112a35;border:1px solid #25424d;font-size:10px;font-weight:800}.decision-flow p,.decision-flow b,.decision-flow small{display:block;margin:0}.decision-flow b{font-size:10px}.decision-flow small{font-size:8px;margin-top:2px}.decision-flow i{height:1px;background:#23404b;margin:0 14px}.decision-flow .done{color:#c7dbdf}.decision-flow .done>span{background:#123d43;border-color:#2a9d96;color:#61ded3}.decision-flow .done+i{background:#247c79}.forecast{display:grid;grid-template-columns:245px 1fr;gap:18px;padding:16px;margin-bottom:14px}.forecast-intro{display:flex;align-items:center;gap:13px;padding-right:16px;border-right:1px solid var(--line)}.weather-icon{width:40px;height:40px;border-radius:11px;background:#103746;display:grid;place-items:center;font-size:18px}.forecast-intro small{font-size:7px;letter-spacing:1px;color:var(--cyan)}.forecast-intro h2{font-size:13px;margin:4px 0}.forecast-intro p{font-size:8px;color:#66818c;margin:0}.forecast-days{display:grid;grid-template-columns:repeat(5,1fr);gap:7px}.forecast-days button{min-width:0;border:1px solid #1b3945;border-radius:9px;background:#0b222d;color:#91a6ae;padding:9px;text-align:left}.forecast-days button:hover,.forecast-days button.active{border-color:#35d4cc;background:#10343d;color:#e1f0f2}.forecast-days span,.forecast-days b,.forecast-days strong,.forecast-days small{display:block}.forecast-days span{font-size:7px;text-transform:uppercase;letter-spacing:.8px}.forecast-days b{font-size:9px;margin:2px 0}.forecast-days strong{font-size:16px;color:#59d9d1;margin:5px 0 2px}.forecast-days small{font-size:7px;color:#68838d}.analysis-grid{display:grid;grid-template-columns:minmax(0,1fr) 350px;gap:14px}.map-card{overflow:hidden}.map-toolbar{height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 15px;border-bottom:1px solid var(--line)}.map-toolbar small,.map-toolbar b{display:block}.map-toolbar small{font-size:7px;letter-spacing:1px;color:#5e7b86}.map-toolbar b{font-size:11px;margin-top:3px}.map-controls{display:flex;gap:8px}.segmented{display:flex;background:#071923;border:1px solid #1c3945;padding:3px;border-radius:8px}.segmented button{border:0;background:transparent;color:#667f8a;font-size:8px;padding:6px 9px;border-radius:5px}.segmented button.active{background:#17414b;color:#6ce4dc}.segmented button:disabled{opacity:.35}.map-holder{position:relative;height:590px;padding:9px}.map-story{position:absolute;left:24px;bottom:24px;z-index:500;display:flex;gap:13px;padding:10px 12px;border-radius:9px;background:#061720ed;border:1px solid #294550;color:#a3b6bc;font-size:8px;box-shadow:0 8px 25px #0007}.map-story span{display:flex;align-items:center;gap:6px}.map-story i{width:10px;height:10px;display:block}.map-story .water{border-radius:50%;background:#168ad0;border:2px solid #7dd3fc}.map-story .flow{height:3px;background:#6bc7f5;border-radius:3px;border-top:1px dashed white}.map-story .park{border-radius:50%;background:#35d4cc;box-shadow:0 0 0 3px #22c55e44}.map-story .risk{border:2px solid #ef4444;background:#ef444455}.map-caption{position:absolute;right:22px;bottom:22px;z-index:500;font-size:7px;color:#769099;background:#071923cc;padding:5px 7px;border-radius:5px}.decision-panel{padding:18px}.panel-head{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:15px;border-bottom:1px solid var(--line)}.panel-head small{font-size:7px;letter-spacing:1px;color:#63808b}.panel-head h2{font-size:17px;margin:4px 0}.risk-badge{font-size:8px;text-transform:uppercase;padding:6px 8px;border-radius:20px}.risk-badge.alto{color:#ff8b83;background:#3a2023}.risk-badge.medio{color:#f5c568;background:#372c1b}.risk-badge.bajo{color:#5bdfb2;background:#12332c}.rain-alert{display:flex;gap:10px;padding:12px;margin:14px 0;background:#292418;border:1px solid #51421f;border-radius:9px}.rain-alert.critical{background:#321e22;border-color:#663238}.rain-alert>span{width:24px;height:24px;border-radius:7px;background:#f2b84a;color:#261e0d;display:grid;place-items:center;font-weight:900}.rain-alert.critical>span{background:#ef6b63;color:white}.rain-alert b{font-size:9px}.rain-alert p{font-size:8px;color:#8ba0a8;margin:3px 0 0}.evidence h3{font-size:10px;margin:0 0 7px}.evidence>div{display:flex;gap:9px;padding:8px 0;border-bottom:1px solid #142e39}.evidence>div>span{width:23px;height:23px;border-radius:6px;display:grid;place-items:center;background:#10323d;color:#4bd5ca;font-size:11px}.evidence p,.evidence b,.evidence small{display:block;margin:0}.evidence b{font-size:9px}.evidence small{font-size:8px;color:#6d8791;line-height:1.4;margin-top:2px}.recommendation{margin-top:14px;padding:14px;background:linear-gradient(145deg,#10363b,#0d292f);border:1px solid #23625f;border-radius:10px}.recommendation>small{font-size:7px;letter-spacing:1px;color:#57d8c9}.recommendation h3{font-size:13px;margin:5px 0}.recommendation>p{font-size:8px;color:#7e969e;margin:0}.recommendation-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin:11px 0}.recommendation-stats span{font-size:7px;color:#6f8992}.recommendation-stats b{display:block;font-size:10px;color:#c9dadd;margin-bottom:2px}.recommendation .btn{width:100%;font-size:9px}.impact{margin-top:14px;padding:18px}.impact-head{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:14px}.impact-head h2{font-size:16px;margin:0 0 4px}.impact-head p{font-size:9px;color:#6d8791;margin:0}.impact-actions{display:flex;gap:7px}.impact-actions button:disabled{opacity:.4}.comparison{display:grid;grid-template-columns:1.2fr repeat(4,1fr);border:1px solid var(--line);border-radius:10px;overflow:hidden}.comparison>div{display:grid;grid-template-rows:repeat(3,auto);padding:11px 13px;border-left:1px solid var(--line)}.comparison>div:first-child{border:0;background:#0d2933}.comparison span{font-size:7px;color:#69838d;text-transform:uppercase;letter-spacing:.5px}.comparison b{font-size:11px;margin:6px 0}.comparison strong{font-size:12px;color:#58d7ca}.comparison em{font-size:7px;color:#4fd5a5;font-style:normal}.saved-message{font-size:8px;color:#58d6ad;margin-top:10px}.portfolio-head{display:flex;justify-content:space-between;align-items:flex-end;margin:22px 0 10px}.portfolio-head h2{font-size:16px;margin:0}.portfolio-head>span{font-size:8px;color:#65d9ce;background:#10333c;padding:6px 9px;border-radius:20px}.park-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.park-option{padding:16px}.park-option.selected{border-color:#39bdb4;box-shadow:inset 0 3px #35d4cc}.park-option-head{display:grid;grid-template-columns:32px 1fr auto;align-items:center;gap:9px}.park-option-head>span{width:31px;height:31px;border-radius:8px;background:#10323d;color:#52d8cf;display:grid;place-items:center;font-size:9px;font-weight:800}.park-option-head small{font-size:7px;color:#68838d;text-transform:uppercase}.park-option-head h3{font-size:11px;margin:2px 0}.park-option-head>b{font-size:10px;color:#53d7c9}.park-option>p{font-size:8px;color:#6a8490;margin:11px 0}.park-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-bottom:11px}.park-metrics span{padding:8px;background:#0d2832;border-radius:6px}.park-metrics small,.park-metrics b{display:block}.park-metrics small{font-size:6px;color:#607b86}.park-metrics b{font-size:9px;margin-top:3px}.park-option .btn{width:100%;font-size:9px}.next-step{display:flex;justify-content:space-between;align-items:center;padding:17px 18px;margin-top:14px}.next-step>div{display:flex;align-items:center;gap:12px}.next-step>div>span{width:34px;height:34px;border-radius:50%;background:#123a35;color:#4bddac;display:grid;place-items:center}.next-step small{font-size:7px;color:#62b9af;letter-spacing:1px}.next-step h3{font-size:12px;margin:3px 0}.next-step p{font-size:8px;color:#6d8791;margin:0}
    .integrated-risk{padding:12px;margin-bottom:12px;background:#0a222d;border:1px solid #1a3c48;border-radius:9px}.integrated-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:9px}.integrated-head small,.integrated-head b{display:block}.integrated-head small{font-size:6px;letter-spacing:1px;color:#68858e}.integrated-head b{font-size:20px;color:#65ddd4;margin-top:2px}.integrated-head>span{font-size:7px;color:#7ea0a8;background:#102f39;padding:5px 7px;border-radius:15px}.risk-factor{display:grid;grid-template-columns:105px 1fr;align-items:center;gap:8px;margin:6px 0}.risk-factor>span{font-size:7px;color:#839ba3;display:flex;justify-content:space-between}.risk-factor>span b{color:#b8cbd0}.risk-factor>i{height:5px;background:#14323d;border-radius:5px;overflow:hidden}.risk-factor em{display:block;height:100%;background:#f0b64c}.risk-factor.sensor em{background:#45d3ca}.risk-factor.drainage em{background:#ef7168}.sensor-confirmation{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:9px;padding:10px 11px;margin-bottom:12px;background:#102e35;border:1px solid #23535c;border-radius:9px}.sensor-confirmation>span{width:25px;height:25px;border-radius:50%;display:grid;place-items:center;background:#16434a;color:#55ddd2}.sensor-confirmation small,.sensor-confirmation b{display:block}.sensor-confirmation small{font-size:6px;letter-spacing:.8px;color:#5fcfc6}.sensor-confirmation b{font-size:9px;margin:2px 0}.sensor-confirmation p{font-size:7px;color:#718d95;margin:0}.sensor-confirmation>strong{font-size:16px;color:#65ddd4}.recommendation-actions{display:grid;grid-template-columns:1fr 1.15fr;gap:7px}.recommendation-actions .btn{text-align:center}
    .map-story .grate{border:2px solid #59ded2;background:repeating-linear-gradient(90deg,#0d3039 0 2px,#59ded2 2px 3px)}
    .grate-detail{width:100%;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:9px;padding:10px 11px;margin:0 0 12px;text-align:left;color:inherit;background:#0b2933;border:1px solid #24505a;border-radius:9px;cursor:pointer}.grate-symbol{width:27px;height:27px;border-radius:7px;display:grid;place-items:center;background:#123e46;color:#58ddd2}.grate-detail small,.grate-detail b{display:block}.grate-detail small{font-size:6px;letter-spacing:.9px;color:#5fcfc6}.grate-detail b{font-size:9px;margin:2px 0}.grate-detail p{font-size:7px;color:#7a939b;margin:0}.grate-detail>strong{font-size:7px;text-transform:uppercase;padding:5px 7px;border-radius:12px;color:#55dbad;background:#12372f}.grate-detail>strong.atencion{color:#f6ca70;background:#3a2f1d}.grate-detail>strong.obstruida{color:#ff8c84;background:#3b2024}.operating-systems{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}.system-card{display:grid;grid-template-columns:42px 1fr auto;align-items:center;gap:13px;padding:17px;border-top:2px solid #36d4c9}.system-card.intervention{border-top-color:#55d79c}.system-number{width:40px;height:40px;border-radius:10px;display:grid;place-items:center;background:#113843;color:#57ddd2;font-weight:800}.system-copy small{font-size:7px;letter-spacing:1px;color:#52d6cc}.system-copy h2{font-size:14px;margin:3px 0 5px}.system-copy p{max-width:650px;font-size:8px;line-height:1.55;color:#78929b;margin:0}.system-copy p b{color:#c3d8dc}.system-kpis{display:flex;gap:7px}.system-kpis span{min-width:76px;padding:9px;background:#0b2731;border-radius:8px;color:#6f8992;font-size:7px}.system-kpis b{display:block;color:#d5e6e8;font-size:14px;margin-bottom:2px}.system-kpis .warning b{color:#f4c163}.design-note{grid-column:1/-1;margin:0;padding:8px 12px;border-left:3px solid #4ca6c8;background:#0b202a;color:#77909a;font-size:8px}
    @media(max-width:1200px){.analysis-grid{grid-template-columns:1fr}.decision-panel{display:grid;grid-template-columns:1fr 1fr;gap:14px}.panel-head,.rain-alert{grid-column:1/-1}.forecast{grid-template-columns:1fr}.forecast-intro{border-right:0;border-bottom:1px solid var(--line);padding:0 0 12px}.comparison{grid-template-columns:1fr 1fr 1fr}.comparison-label{display:none!important}.park-grid{grid-template-columns:1fr 1fr}.operating-systems{grid-template-columns:1fr}}@media(max-width:720px){.decision-flow{grid-template-columns:1fr 1fr;gap:8px}.decision-flow i{display:none}.forecast-days{grid-template-columns:repeat(2,1fr)}.analysis-grid{display:block}.decision-panel{display:block;margin-top:12px}.map-toolbar{height:auto;padding:12px;align-items:flex-start;gap:10px;flex-direction:column}.map-holder{height:500px}.map-controls{width:100%}.segmented{flex:1}.segmented button{flex:1}.map-caption{display:none}.comparison{grid-template-columns:1fr}.comparison>div{border-left:0;border-top:1px solid var(--line)}.impact-head,.next-step{align-items:stretch;flex-direction:column;gap:12px}.park-grid{grid-template-columns:1fr}.recommendation-actions{grid-template-columns:1fr}.system-card{grid-template-columns:36px 1fr}.system-kpis{grid-column:1/-1;flex-wrap:wrap}}
    .forecast-days{grid-template-columns:repeat(4,1fr)}
  `],
})
export class GeoMapPageComponent {
  readonly surfaceMode = signal<SurfaceMode>('susceptibility');
  readonly selectedForecastIndex = signal(1);
  readonly selectedZoneId = signal('Z-01');
  readonly selectedParks = signal<string[]>(this.loadSavedParks());
  readonly viewMode = signal<'before' | 'after'>(this.selectedParks().length ? 'after' : 'before');
  readonly savedAt = signal<Date | null>(null);

  readonly forecast: ForecastDay[] = [
    { label: 'Evento frecuente', rain: 15, retention: 100, condition: 'Comprobación estática' },
    { label: 'Evento de diseño', rain: 50, retention: 100, condition: 'Base del anteproyecto' },
    { label: 'Evento superior', rain: 100, retention: 50, condition: 'Con excedencia' },
    { label: 'Evento extremo', rain: 150, retention: 33, condition: 'Con excedencia alta' },
  ];

  private readonly quibdoZones: RiskZone[] = [
    { id: 'QZ-01', name: 'Sector Centro', risk: 'alto', runoff: 88, polygon: [[5.681,-76.663],[5.681,-76.652],[5.692,-76.652],[5.692,-76.664]] },
    { id: 'QZ-02', name: 'Sector Norte', risk: 'medio', runoff: 69, polygon: [[5.695,-76.666],[5.695,-76.653],[5.707,-76.651],[5.707,-76.665]] },
    { id: 'QZ-03', name: 'Sector Ribera', risk: 'alto', runoff: 91, polygon: [[5.665,-76.676],[5.666,-76.663],[5.679,-76.661],[5.679,-76.676]] },
  ];
  private readonly quibdoInterventions: GreenIntervention[] = [
    { id:'QV-01', name:'Bioesponja Centro', type:'Bioesponja modular', zone:'Sector Centro', score:89, cost:9600000, area:60, runoffReduction:21, feasibility:84, lat:5.687, lng:-76.658, saved:false },
    { id:'QV-02', name:'Bioesponja Norte', type:'Bioesponja modular', zone:'Sector Norte', score:82, cost:12400000, area:80, runoffReduction:25, feasibility:77, lat:5.701, lng:-76.659, saved:false },
    { id:'QV-03', name:'Bioesponja Ribera', type:'Bioesponja modular', zone:'Sector Ribera', score:86, cost:15200000, area:100, runoffReduction:31, feasibility:72, lat:5.672, lng:-76.669, saved:false },
  ];

  readonly activeForecast = computed(() => this.forecast[this.selectedForecastIndex()]);
  readonly decisionZones = computed(() => this.hydro.demoArea() === 'quibdo' ? this.quibdoZones : this.hydro.zones());
  readonly decisionInterventions = computed(() => this.hydro.demoArea() === 'quibdo' ? this.quibdoInterventions : this.hydro.interventions());
  readonly selectedZone = computed(() => this.decisionZones().find(zone => zone.id === this.selectedZoneId()) ?? this.decisionZones()[0]);
  readonly selectedRiskScore = computed(() => this.integratedRiskScore(this.selectedZone()));
  readonly selectedRisk = computed(() => this.calculatedRisk(this.selectedZone()));
  readonly recommendedPark = computed(() => this.decisionInterventions().find(park => park.zone === this.selectedZone().name) ?? this.decisionInterventions()[0]);
  readonly impactReduction = computed(() => {
    const selected = this.decisionInterventions().find(park => this.selectedParks().includes(park.id));
    if (!selected) return 0;
    if (this.hydro.demoArea() === 'belem') return Math.min(100, Math.round((selected.storage ?? 16.5) / Math.max(.1, this.estimatedWater()) * 100));
    return Math.min(65, selected.runoffReduction);
  });
  readonly displayZones = computed(() => this.decisionZones().map(zone => ({ ...zone, risk: this.calculatedRisk(zone) })));
  readonly estimatedWater = computed(() => this.hydro.demoArea() === 'belem' ? +(this.activeForecast().rain / 1000 * (300 * .9 + 60)).toFixed(1) : Math.round(this.activeForecast().rain * (8 + this.selectedZone().runoff / 6)));
  readonly projectedWater = computed(() => +(this.estimatedWater() * (1 - this.impactReduction() / 100)).toFixed(1));
  readonly waterSaved = computed(() => this.estimatedWater() - this.projectedWater());
  readonly estimatedDepth = computed(() => this.depthForZone(this.selectedZone()));
  readonly projectedDepth = computed(() => Math.max(0, Math.round(this.estimatedDepth() * (1 - this.impactReduction() / 100))));
  readonly peakFlow = computed(() => +(0.9 + this.activeForecast().rain / 20 + this.selectedZone().runoff / 100).toFixed(2));
  readonly projectedPeakFlow = computed(() => +(this.peakFlow() * (1 - this.impactReduction() / 120)).toFixed(2));
  readonly riskArea = computed(() => +(1.2 + this.activeForecast().rain / 11 + this.selectedZone().runoff / 100).toFixed(1));
  readonly projectedRiskArea = computed(() => +(this.riskArea() * (1 - this.impactReduction() / 105)).toFixed(1));
  readonly drainHours = computed(() => +(2.1 + this.activeForecast().rain / 9).toFixed(1));
  readonly projectedDrainHours = computed(() => +(this.drainHours() * (1 - this.impactReduction() / 110)).toFixed(1));

  constructor(public hydro: HydroService) {}

  selectForecast(index: number) { this.selectedForecastIndex.set(index); }
  selectZone(id: string) { this.selectedZoneId.set(id); }
  isParkSelected(id: string) { return this.selectedParks().includes(id); }
  togglePark(id: string) {
    this.selectedParks.update(ids => ids.includes(id) ? [] : [id]);
    this.viewMode.set(this.selectedParks().length ? 'after' : 'before');
    this.savedAt.set(null);
  }
  clearPlan() { this.selectedParks.set([]); this.viewMode.set('before'); this.savedAt.set(null); localStorage.removeItem('pomerape-decision-plan'); }
  savePlan() {
    localStorage.setItem('pomerape-decision-plan', JSON.stringify({ area: this.hydro.demoArea(), parks: this.selectedParks(), forecast: this.selectedForecastIndex(), savedAt: new Date().toISOString() }));
    this.savedAt.set(new Date());
  }
  riskLabel(risk: RiskLevel) { return risk === 'alto' ? 'Riesgo alto' : risk === 'medio' ? 'Riesgo medio' : 'Riesgo bajo'; }
  riskMessage() { return this.activeForecast().rain < 5 ? 'Evento de baja intensidad; prioridad estructural bajo vigilancia' : this.selectedRiskScore() >= 68 ? 'Riesgo alto confirmado por el análisis integrado' : this.selectedRiskScore() >= 42 ? 'Condición que requiere seguimiento operativo' : 'Condición dentro del rango de observación'; }
  rainScore() { return Math.min(100, Math.round(this.activeForecast().rain / 45 * 100)); }
  topographyScore(zone: RiskZone) { return ({ bajo: 25, medio: 58, alto: 86 } as const)[zone.risk]; }
  drainageScore(zone: RiskZone) {
    if (this.hydro.demoArea() === 'quibdo') return 52;
    const segment = this.hydro.segments().find(item => item.sector === this.zoneSector(zone));
    if (!segment) return 45;
    return ({ normal: 22, no_concluyente: 48, posible_obstruccion: 88, sobrecarga: 96 } as const)[segment.condition];
  }
  topographyReason() { return this.selectedRisk() === 'alto' ? 'Cota baja y convergencia probable del escurrimiento.' : this.selectedRisk() === 'medio' ? 'Zona de transición con pendiente moderada.' : 'Cota relativamente favorable para evacuar el agua.'; }
  drainageReason() {
    if (this.hydro.demoArea() === 'quibdo') return 'Capacidad inferida a partir del modelo territorial disponible.';
    const segment = this.hydro.segments().find(item => item.sector === this.selectedZone().name.replace('Sector ', '').replace(' Sur', ''));
    return segment ? `${segment.name}: ${segment.condition.replaceAll('_', ' ')} (${segment.confidence}% de confianza).` : 'Sin anomalías relevantes vinculadas.';
  }
  formatMillions(value: number) { return '$' + (value / 1_000_000).toFixed(1).replace('.', ',') + ' M'; }

  private integratedRiskScore(zone: RiskZone) {
    let score = this.topographyScore(zone) * .45 + this.rainScore() * .35 + this.drainageScore(zone) * .20;
    if (this.viewMode() === 'after') {
      const reduction = this.decisionInterventions().filter(park => park.zone === zone.name && this.selectedParks().includes(park.id)).reduce((sum, park) => sum + park.runoffReduction, 0);
      score -= reduction * .7;
    }
    if (this.activeForecast().rain < 5) score = Math.min(score, 55);
    else if (this.activeForecast().rain < 10) score = Math.min(score, 64);
    return Math.max(0, Math.min(100, Math.round(score)));
  }
  private calculatedRisk(zone: RiskZone): RiskLevel {
    const score = this.integratedRiskScore(zone);
    return score >= 68 ? 'alto' : score >= 42 ? 'medio' : 'bajo';
  }
  private zoneSector(zone: RiskZone) { return zone.name.replace('Sector ', '').replace(' Sur', ''); }
  private depthForZone(zone: RiskZone) {
    const rain = this.activeForecast().rain;
    const drainagePressure = Math.max(0, this.drainageScore(zone) - 45) / 220;
    return Math.max(0, Math.round(rain * (zone.runoff / 100) * .52 * (1 + drainagePressure)));
  }
  private loadSavedParks(): string[] {
    try {
      const parks = JSON.parse(localStorage.getItem('pomerape-decision-plan') || '{}').parks || [];
      return parks.length ? [parks[0]] : [];
    }
    catch { return []; }
  }
}
