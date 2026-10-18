# RED BIOESPONJA AMAZÓNICA

### Tecnología e infraestructura verde para enfrentar inundaciones urbanas

**RED BIOESPONJA AMAZÓNICA** es la solución desarrollada por el equipo **Pomerape** durante el **Rally Latinoamericano de Innovación 2026**. Aborda las inundaciones urbanas que afectan a comunidades de **Belém do Pará, Brasil**, mediante jardines de biorretención, monitoreo inteligente, análisis territorial y herramientas digitales de apoyo a la decisión.

> 🏆 **1.er lugar en la categoría Impacto Social de la sede de la Universidad de Tarapacá.** Proyecto desarrollado en 28 horas por un equipo multidisciplinario.

## El desafío

Las lluvias intensas, la capacidad del drenaje urbano y las condiciones de marea pueden combinarse y provocar acumulación de agua en sectores vulnerables de Belém. La solución reúne información del territorio y del sistema de drenaje para identificar puntos críticos, evaluar intervenciones y apoyar una respuesta oportuna.

## La solución

| Componente | Función |
| --- | --- |
| **Infraestructura verde** | Jardines de biorretención que captan, almacenan, filtran y regulan la escorrentía. |
| **Sensores IoT** | Seguimiento de niveles de agua, precipitaciones y condiciones de drenaje para identificar saturación u obstrucciones. |
| **Análisis satelital** | Radar **Sentinel‑1** para apoyar la identificación de zonas vulnerables a inundaciones. |
| **Plataforma digital** | Visualización de mapas, indicadores, sensores, alertas e intervenciones. |
| **Simulación** | Evaluación de escenarios de lluvia y marea y del comportamiento de las bioesponjas. |

## Plataforma Pomerape

La aplicación web permite recorrer el problema desde el análisis territorial hasta la evaluación de una solución:

1. **Centro de control:** resume lluvia, zonas evaluadas, corredores e incidencias.
2. **Mapa de decisión:** muestra topografía, drenaje, zonas prioritarias y ubicaciones de bioesponjas; compara la situación actual con el escenario intervenido.
3. **Red de monitoreo:** presenta lecturas de sensores y diagnósticos de los tramos de drenaje.
4. **Infraestructura verde:** permite configurar módulos y evaluar su capacidad de captación.
5. **Modelo de bioesponja:** simula entrada, almacenamiento, infiltración, descarga y rebalse bajo distintas condiciones de lluvia y marea.
6. **Alertas e informes:** facilita el seguimiento de incidencias y la comunicación de resultados.

La experiencia inicia en **Belém** y también incluye áreas de exploración para **Arica, Talcahuano y Quibdó**.

## Tecnologías

**Angular 19 · TypeScript · SCSS · Leaflet · OpenStreetMap · Apache ECharts**

## Ejecutar el proyecto

**Requisitos:** Node.js 20 o 22 y npm 10 o superior.

```bash
npm install
npm start
```

Abre **http://localhost:4200**. Para generar la versión de producción:

```bash
npm run build
```

## Documentación

- [Descripción del proyecto y su funcionamiento](docs/PROYECTO.md)
- [Arquitectura y guía de uso](docs/ARQUITECTURA.md)

## Equipo y reconocimiento

**Pomerape** representó a la **Universidad de Tarapacá** en el Rally Latinoamericano de Innovación 2026. El proyecto obtuvo el **primer lugar de Impacto Social en su sede**, fruto de 28 horas de colaboración entre distintas especialidades.

Este repositorio reúne el trabajo tecnológico de la solución y muestra cómo la ingeniería, los datos y la infraestructura verde pueden combinarse para abordar un problema ambiental con impacto social.
