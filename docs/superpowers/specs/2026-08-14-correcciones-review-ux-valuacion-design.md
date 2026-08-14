# Correcciones post-review de UX de valuación

## Objetivo

Cerrar los hallazgos restantes del review de `feat/valuation-ux-improvements` sin cambiar el dominio, la persistencia ni el alcance funcional de la valuación mensual.

## Cambios de comportamiento

### Indicadores de cambios reales

`valuationGroupChange` comparará los valores efectivos proyectados contra los valores actuales. Elegir modo manual o margen no contará como cambio si produce el mismo precio de venta. Un costo vacío en un grupo con costos mixtos seguirá siendo una entrada pendiente, no un cambio confirmado.

### Estado junto al período

El estado `Sin cerrar`, `Cerrado`, `Con cambios sin previsualizar` o `Previsualización lista` aparecerá en el mismo bloque visual que el selector mensual. La barra sticky conservará únicamente las acciones para evitar duplicar estado.

### Edición directa aislada y tipada

La carga, apertura, error y retorno de `?edit=<id>` saldrán de `VehiclesPage` hacia un hook dedicado. La consulta de detalle y el vehículo editado usarán un tipo explícito compatible con `VehicleFormModal`; no se agregará ningún `any` nuevo. La page seguirá orquestando modal, listado y mutations existentes.

## Pruebas de interacción

Se agregará `jest-environment-jsdom`, Testing Library para React y `user-event` como dependencias de desarrollo. Jest aceptará archivos `.spec.tsx` con JSX de React.

Las pruebas renderizadas cubrirán:

- badges basados en cambios efectivos;
- expandir y contraer unidades, mostrando identidad, estado y edición;
- estado junto al selector y visibilidad de acciones;
- navegación de `Gestionar motos` y edición de unidad;
- confirmación de refresh con y sin cambios;
- apertura directa de edición, error y retorno mediante el hook aislado.

Los helpers puros y pruebas existentes seguirán funcionando. Los tests de UI usarán mocks solamente en fronteras externas: router, API, auth y queries.

## Límites

- Sin migraciones ni cambios backend.
- Sin acción para eliminar motos desde valuación.
- Sin cambios al cálculo o persistencia del cierre.
- Sin incluir `node_modules` ni `concesionaria-management-system-readme/`.
- Mantener estilos inline y TanStack Query.

## Criterios de aceptación

1. Los badges reflejan diferencias reales de costo y venta.
2. El estado del período aparece junto al selector mensual.
3. `VehiclesPage` no contiene la coordinación interna de edición directa y esa coordinación está tipada.
4. Las interacciones pedidas por la spec original tienen pruebas DOM automatizadas.
5. Tests frontend/backend, builds, lint scoped y `git diff --check` terminan sin errores nuevos.
