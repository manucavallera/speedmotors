# Cerebrum

> OpenWolf's learning memory. Updated automatically as the AI learns from interactions.
> Do not edit manually unless correcting an error.
> Last updated: 2026-05-01

## User Preferences

- **Frontend modularización:** Fragmentar archivos >3,000 tok. Utilitarios (pdf, helpers) en subcarpetas con barrel `index.ts`. Pages actúan solo como orquestadores — extraer modales y forms a componentes propios. Componentes compartidos (TableShell, PageHeader) en `components/shared/`.

## Key Learnings

- **Project:** speedmotors
- **Schema modular:** DB schema dividido por dominio en `apps/backend/src/db/`. Para cambios de DB, cargar solo `[entidad].schema.ts` + `enums.ts`. Prohibido leer `schema.ts` completo (es barrel puro). Archivos: enums, users, clients, catalog (categories+suppliers+products), vehicles, sales (sales+saleItems+installments), quotes, cash, stock, orders, expenses, relations.
- **Barcode lookup:** búsqueda por `x.barcode` Y `x.code` (case-insensitive + trim) — los productos ya vienen con código impreso del fabricante que coincide con el campo `code`. El campo `barcode` es extra para casos donde difieren.
- **Producción DB:** EasyPanel → terminal del servicio PostgreSQL → `psql -U postgres` → `\c "speedmotors-db"` (nombre con guión, requiere comillas).

## Do-Not-Repeat

<!-- Mistakes made and corrected. Each entry prevents the same mistake recurring. -->
<!-- Format: [YYYY-MM-DD] Description of what went wrong and what to do instead. -->

[2026-05-22] BrowserMultiFormatReader.decodeFromVideoDevice dispara el callback múltiples veces por segundo mientras detecta el código. Siempre usar un ref `firedRef` para que onScan solo se ejecute una vez por sesión de escaneo.

[2026-06-29] En Drizzle raw sql, para filtrar por mes/día sobre columnas tipo `date` o `timestamp` usar SIEMPRE `to_char(col,'YYYY-MM')=$mes`, NUNCA `col LIKE 'YYYY-MM%'` — Postgres no tiene operador LIKE para `date` (tira 500 "operator does not exist: date ~~ unknown"). Engaña porque con tabla vacía devuelve [] sin evaluar (falso-verde). Ver bug-510.

[2026-05-22] Cuando se agrega un producto por barcode en ventas, verificar si ya existe en items (por productId) e incrementar cantidad en vez de agregar nueva línea.

## Decision Log

<!-- Significant technical decisions with rationale. Why X was chosen over Y. -->

### [2026-06-01] saldo_compuesto: eliminada regla de 20 días
- El dueño confirmó: pago parcial NO exime el interés mensual. Antes `applyPendingInterest` saltaba el cargo del mes si había un pago 20+ días antes del vencimiento (`hasEarlyPayment`). Removido junto con `payments`/`periodStart` (quedaron sin uso). Interés mensual siempre se cobra sobre `balanceBefore`; pago total corta el loop via `balanceBefore<=0`. Commit d09306c.

### [2026-06-01] Límite de carga de productos 2000→50000 (parche, no solución)
- Con 4386 productos, 5 pantallas cargaban `/products?limit=2000` y filtraban client-side → productos >2000 invisibles en Movimientos, Ventas, Reservas, Presupuestos, OC. Bug reportado como "producto existe pero no aparece al registrar movimiento" (VHRS1A). Subido cap backend 5000→50000 y limit frontend a 50000 en los 5 loaders. Commit 2ff76f4.
- **Es parche.** Solución real pendiente: búsqueda server-side en `SearchableSelect` (consultar al backend a medida que se escribe). El backend `products.findAll` ya soporta `search` (ilike name/code). Hay colchón hasta 50000 productos, sin apuro.

## Key Learnings (2026-05-30)
- **Cuotas/deuda: fuente de verdad = módulo créditos.** Ventas financiadas y cuenta corriente escriben en `credits` + `creditInstallments` (NO en la tabla legacy `installments`, que quedó muerta). Toda lectura de deuda/cuotas debe usar credits/creditInstallments.
  - Cobranza (`sales.getPendingInstallments`) → `creditInstallments` donde `paidAt IS NULL`. Pago delega a `creditsService.payInstallment`.
  - Cuenta corriente (`clients.getAccount` + `findAll` balanceSql) → deuda = `computeBalance(credit)` (cuenta corriente) o cuotas impagas (cuotas_simples), menos clientPayments.
  - `creditInstallments` NO tiene columna `status`: pendiente = `paidAt IS NULL`.
- **Interés compuesto en cuotas fijas:** `calcCuotasFijas` en `credits/credit-math.ts` es la única fórmula (total = capital×(1+r)^n/n). Ventas y créditos la comparten. No duplicar.
- **Interés saldo_compuesto avanza por mes (setMonth+1), mismo día**, no +30 días.
- **Dominio:** cuenta corriente = 30 días para pagar, se registra el pago y baja la deuda. Cobranza = cuotas de créditos financiados.

## Do-Not-Repeat (2026-05-30)
- No usar la tabla `installments` (legacy) para leer cuotas/deuda. Está vacía. Usar `creditInstallments`.
- No escribir fórmula de interés inline: usar `calcCuotasFijas`.
- El usuario (dueño, no dev) se frustra con preguntas de dominio repetidas. Deducir del código, ejecutar, preguntar solo decisiones de negocio reales.
- NO marcar como bug la "regla 20 días" de saldo variable. Es política a propósito del dueño: cualquier pago que entre 20+ días antes de la fecha de interés mensual → ese mes NO se cobra interés (aunque sea pago parcial). `applyPendingInterest` borra/omite el cargo de ese mes. Comportamiento correcto.

## Decision Log (2026-05-30) — CORRECCIÓN fórmula cuotas fijas
- **Cuotas fijas = INTERÉS SIMPLE**, NO compuesto. Fórmula correcta confirmada por el dueño: `cuota = capital × (1 + tasa × meses) / meses` = `capital/n + capital·tasa`.
- El commit de ayer `bd60b8a` ("cuotas fijas usan interés compuesto, no simple") estaba AL REVÉS — sobrecobra. Revertido hoy a simple en `credit-math.ts` (`calcCuotasFijas`).
- Corrige la entrada previa de hoy que decía "interés compuesto en cuotas fijas": ESO ESTABA MAL, ignorar.
- Unificado en simple: credit-math.ts, credits.generateInstallments, sales.service, SaleFormModal preview, SaleTotalsPanel (era sistema francés, ahora simple), CreditFormModal preview (ya era simple).
- **3 modelos posibles** (para 990k/12/5%): francés $111.697 | simple $132.000 (ELEGIDO) | compuesto $148.158.
