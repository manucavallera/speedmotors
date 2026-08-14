# Capital adicional: nota de débito — Implementation Plan

> **For agentic workers:** Implement task-by-task with verification after each task.

**Goal:** Generar y volver a descargar una nota de débito PDF para cada capital adicional.

**Architecture:** Reutilizar el historial y mutation existentes de capital; agregar un generador PDF aislado y un botón junto al movimiento, igual que el recibo de pagos. No cambia el cálculo ni el esquema de base de datos.

**Tech Stack:** React, TypeScript, jsPDF, Jest.

## Global Constraints

- Mantener fecha, importe y concepto del capital.
- No agregar migraciones.
- Mantener disponible el recibo existente de pagos.

### Task 1: Generador de nota de débito

**Files:**
- Modify: `apps/frontend/src/lib/pdf/receipt.ts`
- Modify: `apps/frontend/src/lib/pdf/index.ts`
- Test: `apps/frontend/src/lib/pdf/receipt.spec.ts`

- [ ] Agregar `generateCapitalDebitNote` con cliente, importe, fecha, concepto y referencia al crédito.
- [ ] Generar PDF descargable con nombre `nota-debito-capital-...pdf`.
- [ ] Probar que el generador invoque jsPDF y descargue el archivo.

### Task 2: Integración en historial

**Files:**
- Modify: `apps/frontend/src/components/credits/CreditDetailModal.tsx`
- Test: `apps/frontend/src/components/credits/CreditDetailModal.spec.tsx` o spec existente equivalente.

- [ ] Importar el generador.
- [ ] Mostrar botón `Nota de débito` en cada movimiento de capital.
- [ ] Pasar datos del movimiento y cliente al generador.
- [ ] Verificar que el botón no aparezca en pagos normales y que el historial siga mostrando el concepto.

### Task 3: Verificación final

- [ ] Ejecutar tests frontend focalizados.
- [ ] Ejecutar build frontend.
- [ ] Ejecutar `git diff --check`.
- [ ] Probar manualmente agregar capital y descargar la nota.
