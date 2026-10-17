# Pomerape

Prototipo funcional de una plataforma inteligente de monitoreo y apoyo a la planificación del drenaje pluvial. Fue construido con Angular 19, Leaflet, OpenStreetMap y Apache ECharts.

> Todos los sensores, riesgos, diagnósticos, ubicaciones temáticas y resultados hidráulicos son datos ficticios de demostración. La aplicación no representa condiciones reales de Arica ni reemplaza estudios de ingeniería.

## Funcionalidades

- Centro de control con indicadores, mapa, telemetría y simulador IoT.
- Mapa geoespacial con una capa de calor transparente verde–amarillo–rojo, sin bordes rectangulares, además de drenaje, reservorios, sensores y propuestas verdes.
- Modo de concurso que simula una conexión a una API de modelo digital de elevación (DEM), con cotas térmicas, curvas de nivel y susceptibilidad derivada.
- Adaptador para conectar capas reales WMS, XYZ o GeoJSON sin modificar los componentes del mapa.
- Red de 12 sensores y generación periódica de lecturas coherentes.
- Diagnóstico preliminar de funcionamiento normal, posible obstrucción, sobrecarga o evidencia no concluyente.
- Priorización multicriterio de infraestructura verde.
- Comparación de cuatro escenarios hidráulicos demostrativos.
- Gestión completa de alertas: confirmar, asignar y cerrar.
- Flujo de reportes ciudadanos y vista de administración municipal.
- Exportación de datos CSV e impresión/guardado como PDF.

## Requisitos

- Node.js 20 o 22 LTS recomendado.
- npm 10 o superior.

## Instalación y ejecución

```bash
npm install
npm start
```

La aplicación queda disponible en `http://localhost:4200`.

## Validación

```bash
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
```

El build de producción se genera en `dist/rally/browser`.

## Arquitectura

- `src/app/core`: modelos tipados, datos demostrativos y estado compartido.
- `src/app/shared`: mapa Leaflet y adaptador reutilizable de ECharts.
- `src/app/pages`: módulos funcionales cargados mediante rutas lazy.
- `src/app/app.routes.ts`: navegación principal.

Los servicios se diseñaron para poder reemplazar el estado local por APIs REST, WebSocket/MQTT y un adaptador futuro para EPA SWMM sin mezclar esa lógica con los componentes visuales.

## Conectar una capa geoespacial

En **Mapa geoespacial → Fuente externa**, selecciona el formato e ingresa la URL pública del servicio. Para WMS también se requiere el identificador exacto de la capa. El servidor de origen debe permitir solicitudes CORS desde la aplicación.

Los GeoJSON pueden usar una propiedad `risk` o `riesgo` con valores `alto`, `medio` o `bajo`; Pomerape aplica automáticamente la escala roja, amarilla y verde.
