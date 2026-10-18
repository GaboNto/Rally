# Arquitectura y guía de uso de Pomerape

## Organización de la aplicación

Pomerape es una aplicación web desarrollada con **Angular 19** y **TypeScript**. **Leaflet** y **OpenStreetMap** muestran el territorio y las capas del mapa; **Apache ECharts** presenta gráficos e indicadores. Los estilos están escritos en **SCSS**.

| Ruta | Función |
| --- | --- |
| `/dashboard` | Centro de control e indicadores generales. |
| `/mapa` | Análisis territorial y comparación de intervenciones. |
| `/red-monitoreo` | Sensores, lecturas y diagnóstico de drenaje. |
| `/infraestructura-verde` | Configuración de bioesponjas. |
| `/modelo-bioesponja` | Simulación de lluvia, marea, almacenamiento y descarga. |
| `/alertas` | Seguimiento de alertas. |
| `/informes` | Presentación y exportación de resultados. |

## Estructura del repositorio

```text
src/app/
├── core/                 Modelos, datos y estado compartido
├── pages/                Pantallas de la plataforma
├── shared/               Mapa y gráficos reutilizables
└── app.routes.ts         Rutas principales
public/assets/           Recursos gráficos y cartográficos
docs/                    Documentación del proyecto
```

## Flujo de información

El servicio `HydroService` concentra sensores, zonas, segmentos, intervenciones, escenarios, alertas e informes. Los componentes leen ese estado para construir el tablero, el mapa y los módulos operativos. La selección de un área carga sus datos correspondientes; **Belém** es el área inicial.

El mapa permite incorporar capas **WMS**, **XYZ** y **GeoJSON**. Las decisiones y configuraciones seleccionadas se conservan en el almacenamiento local del navegador. Los resultados pueden exportarse como **CSV** o imprimirse y guardarse como **PDF** desde la aplicación.

## Ejecución local

```bash
npm install
npm start
```

La aplicación estará en `http://localhost:4200`.

```bash
npm run build
```

La compilación de producción se crea en `dist/rally/browser`.

## Contexto del proyecto

Pomerape forma parte de **RED BIOESPONJA AMAZÓNICA**, solución premiada con el **1.er lugar de Impacto Social en la sede de la Universidad de Tarapacá** durante el **Rally Latinoamericano de Innovación 2026**. Para conocer el problema, los componentes de la solución y el recorrido de uso, consulta la [descripción del proyecto](PROYECTO.md).
