# Financiación por tercero y consignaciones Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Registrar ventas financiadas por una financiera externa y administrar motos entregadas en consignación a negocios reventa.

**Architecture:** Se amplían los enums y tablas existentes con una migración compatible. La financiación externa agrega un campo a `sales`; las consignaciones usan tablas propias relacionadas con `vehicles` y un módulo API/pantalla dedicado.

**Tech Stack:** NestJS, Drizzle/PostgreSQL, React, React Query, Jest y Testing Library.

**Spec:** `docs/superpowers/specs/2026-08-28-third-party-financing-and-resales.md`

## Global Constraints

- Mantener compatibilidad con ventas y motos existentes.
- El nombre de financiera es texto libre y obligatorio solo para `financiado_tercero`.
- Una moto consignada no debe quedar disponible para ventas o reservas.
- Escribir pruebas antes de producción y ejecutar verificaciones con `rtk`.

### Task 1: Venta financiada por tercero

**Files:**
- Modify: `apps/backend/src/db/enums.ts`, `apps/backend/src/db/sales.schema.ts`, `apps/backend/src/sales/create-sale.dto.ts`, `apps/backend/src/sales/sales.service.ts`
- Create: `apps/backend/drizzle/0050_third_party_financing.sql`
- Modify: `apps/frontend/src/components/sales/SaleFormModal.tsx`, `apps/frontend/src/types/sales.types.ts`, `apps/frontend/src/types/api.types.ts`, `apps/frontend/src/components/sales/SalesTable.tsx`, `apps/frontend/src/components/sales/SaleDetailModal.tsx`
- Test: `apps/backend/src/sales/create-sale.dto.spec.ts`

- [ ] Escribir prueba de contrato para aceptar el tipo nuevo, exigir financiera y conservar tipos existentes.
- [ ] Ejecutar `cd apps/backend && rtk npm test -- --runInBand src/sales/create-sale.dto.spec.ts` y confirmar fallo.
- [ ] Implementar enum, columna `financing_provider`, DTO y validación de servicio.
- [ ] Agregar selector y campo condicional; enviar y mostrar `financingProvider`.
- [ ] Ejecutar prueba, typecheck y build frontend.

### Task 2: Estado y modelo de consignación

**Files:**
- Modify: `apps/backend/src/db/enums.ts`, `apps/backend/src/db/vehicles.schema.ts`, `apps/backend/src/db/schema.ts`, `apps/backend/src/vehicles/vehicle.dto.ts`, `apps/backend/src/vehicles/vehicles.service.ts`, `apps/backend/src/vehicles/vehicles.controller.ts`
- Create: `apps/backend/src/db/resales.schema.ts`, `apps/backend/src/resales/resales.dto.ts`, `apps/backend/src/resales/resales.service.ts`, `apps/backend/src/resales/resales.controller.ts`, `apps/backend/src/resales/resales.module.ts`, `apps/backend/drizzle/0051_resales_consignments.sql`
- Test: `apps/backend/src/resales/resales.service.spec.ts`

- [ ] Escribir prueba para entregar una moto disponible a una reventa y rechazar moto no disponible.
- [ ] Ejecutar prueba y confirmar fallo.
- [ ] Implementar tablas `resellers` y `resale_consignment`, endpoints CRUD/entrega/venta y estado `reventa`.
- [ ] Registrar fecha, precio acordado, fecha e importe de venta, y actualizar estado atómicamente.
- [ ] Ejecutar pruebas backend y migración de esquema.

### Task 3: Pantalla Reventas e inventario

**Files:**
- Create: `apps/frontend/src/pages/ResalesPage.tsx`, `apps/frontend/src/components/resales/ResaleFormModal.tsx`
- Modify: `apps/frontend/src/components/vehicles/VehicleFormModal.tsx`, `apps/frontend/src/components/vehicles/VehiclesGrid.tsx`, `apps/frontend/src/pages/VehiclesPage.tsx`, `apps/frontend/src/components/layout/Sidebar.tsx`, `apps/frontend/src/App.tsx`
- Test: `apps/frontend/src/pages/ResalesPage.spec.tsx`

- [ ] Escribir prueba de render de la pestaña Reventas y sus motos consignadas.
- [ ] Ejecutar prueba y confirmar fallo.
- [ ] Implementar navegación, alta de negocio, entrega de moto y registro de venta.
- [ ] Actualizar etiquetas/filtros del inventario para mostrar `Reventa`.
- [ ] Ejecutar pruebas frontend, `rtk npm run build` y `rtk git diff --check`.
