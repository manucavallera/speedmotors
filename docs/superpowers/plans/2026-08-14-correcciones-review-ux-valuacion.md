# Correcciones post-review de UX de valuación Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corregir los cuatro hallazgos restantes del review de UX de valuación y dejar cobertura DOM reproducible antes del merge.

**Architecture:** Mantener cálculo de cambios en helpers puros, presentar estado mensual en un control dedicado y mover coordinación de edición directa a un hook tipado. Incorporar Testing Library y jsdom sólo como infraestructura de tests frontend, sin cambiar runtime ni contratos backend.

**Tech Stack:** React 19, TypeScript 6, TanStack Query 5, React Router 7, Jest 30, ts-jest, Testing Library, jsdom.

## Global Constraints

- Sin migraciones ni cambios backend.
- Sin acción para eliminar motos desde valuación.
- Sin cambios al cálculo o persistencia del cierre.
- Mantener estilos inline, TanStack Query y TypeScript estricto.
- No incluir `node_modules` ni `concesionaria-management-system-readme/`.
- Toda producción nueva debe tener test que se observe fallar antes de implementarla.

---

### Task 1: Indicadores reales y tests de interacción del editor

**Files:**
- Modify: `apps/frontend/package.json`
- Modify: `package-lock.json`
- Modify: `apps/frontend/jest.config.cjs`
- Modify: `apps/frontend/src/lib/stockValuation.ts`
- Modify: `apps/frontend/src/lib/stockValuation.spec.ts`
- Modify: `apps/frontend/src/components/stock-valuation/ValuationEditor.tsx`
- Create: `apps/frontend/src/components/stock-valuation/ValuationEditor.spec.tsx`

**Interfaces:**
- Produces: `valuationGroupChange(group: DraftGroup, generalMargin?: string): ValuationGroupChange`.
- Preserves: `projectDraftSellPrice`, `validateDraft`, `toValuationGroups` and existing editor props.

- [ ] **Step 1: Install the DOM test harness**

Run:

```bash
rtk npm install --save-dev --workspace=apps/frontend @testing-library/react @testing-library/user-event jest-environment-jsdom
```

Update Jest so `testRegex` accepts `.*\\.spec\\.tsx?$`, `moduleFileExtensions` includes `tsx`, transform matches `^.+\\.tsx?$`, and the ts-jest test tsconfig sets `jsx: 'react-jsx'`.

- [ ] **Step 2: Write failing behavior tests**

Extend `stockValuation.spec.ts` with cases proving:

```ts
expect(valuationGroupChange(mixedCostDraft, '')).toBe('none')
expect(valuationGroupChange(manualSamePriceDraft, '')).toBe('none')
expect(valuationGroupChange(manualDifferentPriceDraft, '')).toBe('sale')
expect(valuationGroupChange(marginSamePriceDraft, '25')).toBe('none')
```

Create `ValuationEditor.spec.tsx` under jsdom. Render one group, click `Ver motos (1)`, assert internal code, brand/model/version, status, chassis and engine appear; click `Editar` and assert exact unit callback; click `Ocultar motos` and assert detail disappears. Also render unchanged values and assert `Sin cambios`.

- [ ] **Step 3: Run RED**

Run:

```bash
rtk npm test --workspace=apps/frontend -- stockValuation.spec.ts ValuationEditor.spec.tsx --runInBand
```

Expected: helper cases fail because current code compares edit mode/raw empty string; editor test initially fails until test harness and effective badge wiring exist.

- [ ] **Step 4: Implement minimal effective comparison**

Treat blank cost with `currentCostPrice === null` as unchanged. For sale, compare `projectDraftSellPrice(group, generalMargin)` to `currentSellPrice`; invalid/incomplete projected values do not count as a confirmed change. Pass `generalMargin` through `valuationDraftChanged` and `ValuationEditor` badge calculation.

- [ ] **Step 5: Run GREEN and commit**

Run:

```bash
rtk npm test --workspace=apps/frontend -- stockValuation.spec.ts ValuationEditor.spec.tsx --runInBand
rtk git diff --check
```

Commit:

```bash
rtk git add package-lock.json apps/frontend/package.json apps/frontend/jest.config.cjs apps/frontend/src/lib/stockValuation.ts apps/frontend/src/lib/stockValuation.spec.ts apps/frontend/src/components/stock-valuation/ValuationEditor.tsx apps/frontend/src/components/stock-valuation/ValuationEditor.spec.tsx
rtk git commit -m "fix(stock): report effective valuation changes"
```

---

### Task 2: Estado mensual junto al selector y acciones probadas

**Files:**
- Create: `apps/frontend/src/components/stock-valuation/ValuationPeriodControl.tsx`
- Create: `apps/frontend/src/components/stock-valuation/ValuationPeriodControl.spec.tsx`
- Create: `apps/frontend/src/components/stock-valuation/ValuationActionBar.spec.tsx`
- Modify: `apps/frontend/src/components/stock-valuation/ValuationActionBar.tsx`
- Modify: `apps/frontend/src/pages/StockValuationPage.tsx`

**Interfaces:**
- Produces: `ValuationPeriodControl({ period, status, statusTone, onPeriodChange })`.
- `ValuationActionBar` keeps action-state props but no longer owns or renders period status.
- Status priority remains: preview ready, dirty, existing close, otherwise open.

- [ ] **Step 1: Write failing component tests**

`ValuationPeriodControl.spec.tsx` must render the selected month and status in one labelled container, call `onPeriodChange` with the chosen month, and expose closed/dirty/preview status copy.

`ValuationActionBar.spec.tsx` must click `Gestionar motos`, `Actualizar stock`, `Previsualizar cierre`, and conditionally `Confirmar cierre`, asserting callbacks and disabled states. It must assert period status text is absent from the action bar.

- [ ] **Step 2: Run RED**

Run:

```bash
rtk npm test --workspace=apps/frontend -- ValuationPeriodControl.spec.tsx ValuationActionBar.spec.tsx --runInBand
```

Expected: missing `ValuationPeriodControl` and current action bar still owns status.

- [ ] **Step 3: Implement control and rewire page**

Create the focused period component using inline styles. Compute the existing four-state copy in `StockValuationPage`, render it adjacent to the month input, and remove status calculation/rendering plus no-longer-needed props from `ValuationActionBar`. Keep sticky action behavior and button semantics unchanged.

- [ ] **Step 4: Run GREEN and commit**

Run:

```bash
rtk npm test --workspace=apps/frontend -- ValuationPeriodControl.spec.tsx ValuationActionBar.spec.tsx --runInBand
rtk npm run build --workspace=apps/frontend
rtk git diff --check
```

Commit:

```bash
rtk git add apps/frontend/src/components/stock-valuation/ValuationPeriodControl.tsx apps/frontend/src/components/stock-valuation/ValuationPeriodControl.spec.tsx apps/frontend/src/components/stock-valuation/ValuationActionBar.tsx apps/frontend/src/components/stock-valuation/ValuationActionBar.spec.tsx apps/frontend/src/pages/StockValuationPage.tsx
rtk git commit -m "fix(stock): place status beside valuation period"
```

---

### Task 3: Hook tipado para edición directa y cobertura del flujo

**Files:**
- Create: `apps/frontend/src/hooks/useVehicleDirectEdit.ts`
- Create: `apps/frontend/src/hooks/useVehicleDirectEdit.spec.tsx`
- Modify: `apps/frontend/src/pages/VehiclesPage.tsx`
- Test: `apps/frontend/src/lib/vehicleDirectEdit.spec.ts`

**Interfaces:**
- Produces: `useVehicleDirectEdit({ isAdmin, onOpen, onFallbackSearch }): { returnTo: string | null }`.
- `onOpen(vehicle: Vehicle)` receives a typed API vehicle.
- `onFallbackSearch(search: string)` resets visible search and page after failure.
- Hook owns URL parsing, detail `useQuery<Vehicle>`, handled-id guard, error toast and clean navigation replacement.

- [ ] **Step 1: Write failing hook tests**

Using `renderHook`, `QueryClientProvider` and `MemoryRouter`, cover:

1. `/vehicles?edit=42&returnTo=%2Fstock-valuation%3Fperiod%3D2026-08` fetches `/vehicles/42`, calls `onOpen` once with typed vehicle and exposes safe return path.
2. Failed detail fetch calls fallback with the supplied search, emits the existing error toast and replaces URL with `/vehicles`.
3. Non-admin or invalid id performs no detail request.

- [ ] **Step 2: Run RED**

Run:

```bash
rtk npm test --workspace=apps/frontend -- useVehicleDirectEdit.spec.tsx vehicleDirectEdit.spec.ts --runInBand
```

Expected: hook module does not exist.

- [ ] **Step 3: Implement hook and simplify page**

Move direct-edit query/effects/handled-id state and URL parsing into the hook. Use `Vehicle` from `types/api.types`; type Axios response as `api.get<Vehicle>`. Keep list query, create/update/delete/bulk mutations and modal lifecycle in `VehiclesPage`. Use returned `returnTo` in existing `finishEditing`.

- [ ] **Step 4: Run GREEN, scoped lint and commit**

Run:

```bash
rtk npm test --workspace=apps/frontend -- useVehicleDirectEdit.spec.tsx vehicleDirectEdit.spec.ts --runInBand
rtk npx eslint src/hooks/useVehicleDirectEdit.ts src/hooks/useVehicleDirectEdit.spec.tsx src/pages/VehiclesPage.tsx --quiet
rtk npm run build --workspace=apps/frontend
rtk git diff --check
```

Commit:

```bash
rtk git add apps/frontend/src/hooks/useVehicleDirectEdit.ts apps/frontend/src/hooks/useVehicleDirectEdit.spec.tsx apps/frontend/src/pages/VehiclesPage.tsx
rtk git commit -m "refactor(vehicles): isolate direct valuation edit"
```

---

### Task 4: Verificación integral

**Files:**
- Review: all files changed in Tasks 1-3.

**Interfaces:**
- Produces: fresh evidence for tests, builds, scoped lint and clean diff.

- [ ] **Step 1: Run full verification**

```bash
rtk npm test --workspace=apps/frontend -- --runInBand
rtk npm test --workspace=apps/backend -- --runInBand
rtk npm run build --workspace=apps/frontend
rtk npm run build --workspace=apps/backend
rtk npx eslint src/lib/stockValuation.ts src/lib/stockValuation.spec.ts src/components/stock-valuation/ValuationEditor.tsx src/components/stock-valuation/ValuationEditor.spec.tsx src/components/stock-valuation/ValuationPeriodControl.tsx src/components/stock-valuation/ValuationPeriodControl.spec.tsx src/components/stock-valuation/ValuationActionBar.tsx src/components/stock-valuation/ValuationActionBar.spec.tsx src/pages/StockValuationPage.tsx src/hooks/useVehicleDirectEdit.ts src/hooks/useVehicleDirectEdit.spec.tsx src/pages/VehiclesPage.tsx --quiet
rtk git diff --check
rtk git status --short
```

Expected: zero failed tests, both builds exit 0, scoped lint and diff-check clean; only known untracked `node_modules` may remain.

- [ ] **Step 2: Audit scope**

Confirm no backend, migration, deletion action or unrelated README path changed.
