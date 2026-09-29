# Comprobantes preimpresos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Imprimir los datos variables de una venta sobre las facturas y remitos físicos preimpresos de Speed Motors.

**Architecture:** Se separa la composición de campos, comprobable sin jsPDF, del adaptador que los dibuja en un PDF. Cada formulario declara su tamaño real, coordenadas y límite de renglones; un offset persistente por formulario permite calibrar la impresora sin editar código. Los botones nuevos conviven con los PDFs digitales existentes.

**Tech Stack:** React 19, TypeScript, jsPDF 4, Jest 30, `ts-jest`.

**Spec:** `docs/superpowers/specs/2026-09-29-comprobantes-preimpresos-design.md`

## Global Constraints

- Imprimir solo datos variables: nunca dibujar logo, marco, CAI, punto de venta, número de comprobante ni códigos fiscales preimpresos.
- Factura: A4, 210 × 297 mm. Remito: Carta, 215,9 × 279,4 mm.
- Las coordenadas y desplazamientos se expresan en milímetros; los PDFs se imprimen a tamaño real, sin encabezado ni pie del navegador.
- La configuración de calibración se guarda localmente por navegador e impresora bajo una clave exclusiva, sin alterar `speedmotors_settings`.
- Los PDFs digitales `generateInvoice` y `generateRemito` conservan su comportamiento y aspecto actuales.
- Todo código nuevo usa tipos explícitos; no se agrega `any`.

## Review Focus

- Cliente sin CUIT y con DNI: imprimir el DNI en el campo fiscal disponible y no emitir texto `undefined`.
- Descripción de moto larga o más renglones que el formulario: bloquear la generación antes de consumir un original.
- Factura tipo A, B y venta mixta: los importes visibles deben tomar solamente el monto facturable cuando corresponde.
- Offset de calibración negativo o positivo: desplazar todos los campos de la misma plantilla sin alterar la otra.
- Remito Carta y factura A4: el PDF resultante debe conservar el tamaño del papel correspondiente.

---

## File Structure

- `apps/frontend/src/lib/pdf/preprinted/types.ts`: tipos de datos de venta, cliente, comandos de texto y errores de capacidad.
- `apps/frontend/src/lib/pdf/preprinted/layouts.ts`: tamaños, zonas, coordenadas iniciales y capacidades de cada formulario.
- `apps/frontend/src/lib/pdf/preprinted/settings.ts`: carga, valida y persiste offsets de calibración por plantilla.
- `apps/frontend/src/lib/pdf/preprinted/compose.ts`: transforma venta y cliente en comandos de impresión con validación de renglones.
- `apps/frontend/src/lib/pdf/preprinted.ts`: adaptador jsPDF y funciones públicas para factura, remito y hojas de prueba.
- `apps/frontend/src/lib/pdf/preprinted/*.spec.ts`: pruebas unitarias del compositor, layouts y offsets.
- `apps/frontend/src/components/sales/SaleDetailModal.tsx`: acciones para imprimir formularios físicos desde una venta.
- `apps/frontend/src/components/clients/SalesHistoryList.tsx`: mismas acciones desde el historial del cliente.
- `apps/frontend/src/pages/SettingsPage.tsx`: controles de calibración y generación de hojas de prueba.
- `apps/frontend/package.json`, `apps/frontend/package-lock.json`: incorporar `ts-jest`, requerido por la configuración de Jest existente.

### Task 1: Base tipada, coordenadas y configuración de calibración

**Files:**
- Create: `apps/frontend/src/lib/pdf/preprinted/types.ts`
- Create: `apps/frontend/src/lib/pdf/preprinted/layouts.ts`
- Create: `apps/frontend/src/lib/pdf/preprinted/settings.ts`
- Test: `apps/frontend/src/lib/pdf/preprinted/layouts.spec.ts`
- Modify: `apps/frontend/package.json`
- Modify: `apps/frontend/package-lock.json`

**Interfaces:**
- Produces `PrintedFormKind = 'invoice' | 'remito'`, `PrintedFormLayout`, `PrintOffset`, `getPrintedFormLayout(kind)`, `loadPrintOffset(kind)` and `savePrintOffset(kind, offset)`.
- Consumed by the composer, jsPDF adapter and calibration controls in later tasks.

- [ ] **Step 1: Write the failing layout and calibration tests**

Test that invoice reports `[210, 297]`, remito reports `[215.9, 279.4]`, saved invoice offsets do not affect remito offsets, and malformed localStorage values fall back to `{ x: 0, y: 0 }`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --workspace=apps/frontend -- --runInBand lib/pdf/preprinted/layouts.spec.ts`

Expected: FAIL because `ts-jest` and the preprinted modules do not exist.

- [ ] **Step 3: Install and declare `ts-jest`, then implement the layout and offset interfaces**

Use `npm install --workspace=apps/frontend --save-dev ts-jest`. Define immutable coordinate maps from the two reference PDFs; the remito map covers date, customer, address, CUIT/DNI, IVA checkbox, quantity, description, reception and transport. The invoice map covers date, customer fiscal data, item columns, net/IVA/total and payment condition. Store offsets in `localStorage['speedmotors_preprinted_offsets']` as `{ invoice: { x, y }, remito: { x, y } }` and reject non-finite values.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test --workspace=apps/frontend -- --runInBand lib/pdf/preprinted/layouts.spec.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/package.json apps/frontend/package-lock.json apps/frontend/src/lib/pdf/preprinted
git commit -m "feat: add preprinted form layouts"
```

### Task 2: Compose and render the variable-field PDFs

**Files:**
- Create: `apps/frontend/src/lib/pdf/preprinted/compose.ts`
- Create: `apps/frontend/src/lib/pdf/preprinted.ts`
- Modify: `apps/frontend/src/lib/pdf/index.ts`
- Test: `apps/frontend/src/lib/pdf/preprinted/compose.spec.ts`

**Interfaces:**
- Consumes `PrintedFormKind`, layouts and offsets from Task 1.
- Produces `composePreprintedForm(kind, sale, client, offset): PrintTextCommand[]`, `generatePreprintedInvoice(sale, client)`, `generatePreprintedRemito(sale, client)` and `generatePreprintedCalibration(kind)`.

- [ ] **Step 1: Write the failing composer tests**

Use typed fixtures to assert: client DNI is emitted if CUIT is absent; an invoice A/B uses its sale total while `mixto` uses `amountFormal`; date is separated into day/month/year for the remito; all commands shift by the supplied offset; and an item set exceeding the layout line budget throws `PrintedFormOverflowError` before a PDF is saved.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --workspace=apps/frontend -- --runInBand lib/pdf/preprinted/compose.spec.ts`

Expected: FAIL because `composePreprintedForm` does not exist.

- [ ] **Step 3: Implement `composePreprintedForm` and the jsPDF adapter**

The composer returns only text and checkbox-mark commands. It splits descriptions to the fixed column width, counts lines against the physical grid, and produces no command for missing optional data. The adapter initializes jsPDF with the layout’s exact format, uses black text and no background or border drawing, applies the saved offset, calls `save` with an unambiguous filename, and exposes a gridded calibration page that does not resemble a fiscal document.

- [ ] **Step 4: Export the public generators and run the targeted test**

Run: `npm test --workspace=apps/frontend -- --runInBand lib/pdf/preprinted/compose.spec.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/lib/pdf/preprinted.ts apps/frontend/src/lib/pdf/preprinted apps/frontend/src/lib/pdf/index.ts
git commit -m "feat: generate preprinted receipt overlays"
```

### Task 3: Expose printing and calibration in the application

**Files:**
- Modify: `apps/frontend/src/components/sales/SaleDetailModal.tsx`
- Modify: `apps/frontend/src/components/clients/SalesHistoryList.tsx`
- Modify: `apps/frontend/src/pages/SettingsPage.tsx`
- Test: `apps/frontend/src/pages/SettingsPage.spec.tsx`

**Interfaces:**
- Consumes the generator and offset interfaces from Tasks 1 and 2.
- Produces visible `Factura preimpresa`, `Remito preimpreso` and calibration controls.

- [ ] **Step 1: Write the failing settings test**

Mock the calibration generator. Verify that saving a positive or negative invoice offset persists only the invoice record, and that the invoice and remito calibration buttons invoke their matching generator.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --workspace=apps/frontend -- --runInBand pages/SettingsPage.spec.tsx`

Expected: FAIL because the calibration controls do not exist.

- [ ] **Step 3: Add printing actions and calibration controls**

Keep `Factura` and `Remito` bound to the existing digital PDFs. Add adjacent actions named `Factura preimpresa` and `Remito preimpreso`; invoice remains unavailable for invoice type `X`. In Settings, add a compact “Impresión en formularios preimpresos” section with independent X/Y offsets in millimetres, a save action and a test-print button per form. Add copy that asks the operator to choose the document’s paper size and 100% scale, with browser headers and footers disabled.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test --workspace=apps/frontend -- --runInBand pages/SettingsPage.spec.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/components/sales/SaleDetailModal.tsx apps/frontend/src/components/clients/SalesHistoryList.tsx apps/frontend/src/pages/SettingsPage.tsx apps/frontend/src/pages/SettingsPage.spec.tsx
git commit -m "feat: add preprinted form print actions"
```

### Task 4: Integrate and calibrate against the supplied forms

**Files:**
- Modify: `apps/frontend/src/lib/pdf/preprinted/layouts.ts`
- Modify: `apps/frontend/src/lib/pdf/preprinted/compose.spec.ts`

**Interfaces:**
- Consumes the generated calibration pages and saved offsets from previous tasks.
- Produces finalized field coordinates for the invoice and remito printer setup.

- [ ] **Step 1: Add boundary fixtures for the longest permitted invoice and remito detail**

Assert the exact maximum accepted line counts for each layout and assert one additional line raises `PrintedFormOverflowError`.

- [ ] **Step 2: Run the compositor test to verify the extra-line case fails until the limits are encoded**

Run: `npm test --workspace=apps/frontend -- --runInBand lib/pdf/preprinted/compose.spec.ts`

Expected: FAIL with the expected overflow assertion until the final form limits are set.

- [ ] **Step 3: Print calibration sheets over photocopies of the supplied factura and remito**

Set each final X/Y offset in Settings after checking every zone: header data, detail grid, totals, signatures and transport. Update only the coordinate constants or saved default offset that the physical result proves need adjustment; do not move individual fields ad hoc.

- [ ] **Step 4: Run the full frontend verification**

Run: `npm test --workspace=apps/frontend -- --runInBand && npm run build --workspace=apps/frontend`

Expected: all frontend tests PASS and Vite completes a production build.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/lib/pdf/preprinted/layouts.ts apps/frontend/src/lib/pdf/preprinted/compose.spec.ts
git commit -m "fix: calibrate preprinted form layouts"
```

## Self-review

- Spec coverage: Tasks 1–2 implement distinct layouts, variable-only content, size preservation, text bounds and overflow protection. Task 3 exposes daily printing and calibration. Task 4 provides the physical validation required for alignment.
- Type consistency: `PrintedFormKind`, `PrintOffset`, `composePreprintedForm` and the three public generators are defined once and consumed by the later tasks.
- Review Focus coverage: DNI and mixed amounts are tested in Task 2; overflow in Tasks 2 and 4; offsets in Task 1; paper sizes in Task 1.
- Scope: the plan leaves existing digital PDFs and sales persistence untouched, so no backend or database change is needed.

