# Valuación mensual de stock de motos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir actualización masiva de costo y venta por marca, modelo y versión, y guardar cierres mensuales históricos del stock de motos disponible y reservado.

**Architecture:** Nuevo módulo backend `stock-valuations` separado de `VehiclesService`, con cálculo puro testeable y persistencia transaccional en dos tablas de instantáneas. Nueva pantalla frontend `Valuación de stock`, con borrador local, vista previa autoritativa del servidor, confirmación y consulta de historial. Excel queda fuera de esta fase.

**Tech Stack:** NestJS 11, Drizzle ORM 0.45, PostgreSQL, class-validator, Jest/ts-jest, React 19, React Query 5, TypeScript 6, Vite 8.

## Global Constraints

- Agrupar motos por marca + modelo + versión, ignorando mayúsculas y espacios exteriores.
- Incluir estados `disponible` y `reservado`; excluir `vendido` y vehículos `lancha`.
- Costo final obligatorio y mayor que cero en todos los grupos.
- Precio de venta opcional con precedencia: manual > margen específico > margen general > sin cambio.
- Margen permitido: 0% a 1000%; dinero redondeado a dos decimales.
- Un solo cierre vigente por `YYYY-MM`; reemplazo sólo con confirmación explícita.
- Actualización de precios y cierre deben ser una única transacción.
- Función visible e invocable sólo por administradores.
- No implementar exportación/importación Excel en esta fase.

---

## File Structure

### Backend

- `apps/backend/src/db/stock-valuations.schema.ts`: encabezado y líneas históricas.
- `apps/backend/src/db/stock-valuations.schema.spec.ts`: nombres y exportación del schema.
- `apps/backend/drizzle/0047_stock_valuations.sql`: migración idempotente de producción.
- `apps/backend/src/stock-valuations/stock-valuation.domain.ts`: agrupación, precedencia, redondeo, validación, fingerprint y totales puros.
- `apps/backend/src/stock-valuations/stock-valuation.domain.spec.ts`: contrato del dominio.
- `apps/backend/src/stock-valuations/stock-valuations.dto.ts`: payloads validados.
- `apps/backend/src/stock-valuations/stock-valuations.service.ts`: queries, vista previa, concurrencia y transacción de cierre.
- `apps/backend/src/stock-valuations/stock-valuations.service.spec.ts`: comportamiento del servicio con DB falsa.
- `apps/backend/src/stock-valuations/stock-valuations.controller.ts`: API protegida.
- `apps/backend/src/stock-valuations/stock-valuations.module.ts`: límite del módulo.

### Frontend

- `apps/frontend/src/types/stock-valuation.types.ts`: contratos de API y borrador.
- `apps/frontend/src/lib/stockValuation.ts`: transformación y cálculo visual puro.
- `apps/frontend/src/lib/stockValuation.spec.ts`: precedencia y validación del borrador.
- `apps/frontend/src/hooks/useStockValuation.ts`: React Query y estado editable.
- `apps/frontend/src/components/stock-valuation/ValuationEditor.tsx`: controles y tabla de grupos.
- `apps/frontend/src/components/stock-valuation/ValuationSummary.tsx`: totales y confirmación.
- `apps/frontend/src/components/stock-valuation/ValuationHistory.tsx`: cierres y detalle congelado.
- `apps/frontend/src/pages/StockValuationPage.tsx`: orquestación y guardia visual de administrador.

---

### Task 1: Motor de cálculo del dominio

**Files:**
- Create: `apps/backend/src/stock-valuations/stock-valuation.domain.ts`
- Create: `apps/backend/src/stock-valuations/stock-valuation.domain.spec.ts`

**Interfaces:**
- Consumes: filas de `vehicles` reducidas a `EligibleVehicle` y `ValuationRequest`.
- Produces: `groupEligibleVehicles(rows)`, `stockFingerprint(rows)`, `projectValuation(rows, request)` y tipos usados por `StockValuationsService`.

- [ ] **Step 1: Escribir pruebas rojas de agrupación**

```ts
const rows: EligibleVehicle[] = [
  vehicle({ id: 1, brand: 'Guerrero', model: 'Trip', version: 'TA', status: 'disponible' }),
  vehicle({ id: 2, brand: ' guerrero ', model: 'TRIP', version: 'ta', status: 'reservado' }),
  vehicle({ id: 3, brand: 'Guerrero', model: 'Trip', version: 'TF', status: 'disponible' }),
]

expect(groupEligibleVehicles(rows)).toMatchObject([
  { brand: 'Guerrero', model: 'Trip', version: 'TA', availableUnits: 1, reservedUnits: 1, totalUnits: 2 },
  { brand: 'Guerrero', model: 'Trip', version: 'TF', availableUnits: 1, reservedUnits: 0, totalUnits: 1 },
])
```

- [ ] **Step 2: Ejecutar prueba y comprobar fallo**

Run: `npm test --workspace=apps/backend -- stock-valuation.domain.spec.ts --runInBand`

Expected: FAIL porque módulo y funciones aún no existen.

- [ ] **Step 3: Definir contratos y agrupación mínima**

```ts
export type EligibleStatus = 'disponible' | 'reservado'
export type SaleMode = 'unchanged' | 'manual' | 'margin'

export interface EligibleVehicle {
  id: number
  brand: string
  model: string
  version: string | null
  status: EligibleStatus
  costPrice: string
  sellPrice: string
  updatedAt: Date
}

export interface GroupPriceEdit {
  groupKey: string
  costPrice: number
  saleMode: SaleMode
  manualSellPrice?: number
  marginPercent?: number
}

export interface ValuationRequest {
  period: string
  stockFingerprint: string
  generalMarginPercent?: number
  groups: GroupPriceEdit[]
}
```

Implementar `normalizeGroupPart(value)`, clave opaca estable y orden por marca/modelo/versión.

- [ ] **Step 4: Escribir pruebas rojas de precios y totales**

Casos obligatorios:

```ts
expect(projectedSell({ mode: 'manual', manual: 150, groupMargin: 20, generalMargin: 30, cost: 100, current: 90 })).toBe(150)
expect(projectedSell({ mode: 'margin', groupMargin: 20, generalMargin: 30, cost: 100, current: 90 })).toBe(120)
expect(projectedSell({ mode: 'margin', generalMargin: 30, cost: 100, current: 90 })).toBe(130)
expect(projectedSell({ mode: 'unchanged', cost: 100, current: 90 })).toBe(90)
```

Agregar casos: margen 1000 válido, 1000.01 inválido, costo cero inválido, venta cero cuenta como unidad sin precio, redondeo `100.005 -> 100.01`, costos actuales mixtos reportados como `null`.

- [ ] **Step 5: Ejecutar pruebas y comprobar fallo específico**

Run: `npm test --workspace=apps/backend -- stock-valuation.domain.spec.ts --runInBand`

Expected: FAIL en precedencia/validación todavía ausente.

- [ ] **Step 6: Implementar proyección pura**

`projectValuation` debe devolver:

```ts
interface ValuationProjection {
  period: string
  stockFingerprint: string
  groups: ProjectedGroup[]
  totals: {
    availableUnits: number
    reservedUnits: number
    totalUnits: number
    totalCost: number
    totalSell: number
    potentialMargin: number
    unpricedSaleUnits: number
  }
}
```

Validar exactamente un edit por grupo, ningún grupo desconocido, todos los grupos presentes y costos finales mayores que cero. Derivar `sellPrice` según precedencia. Sumar con enteros de centavos para evitar error flotante.

- [ ] **Step 7: Ejecutar pruebas verdes**

Run: `npm test --workspace=apps/backend -- stock-valuation.domain.spec.ts --runInBand`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/backend/src/stock-valuations/stock-valuation.domain.ts apps/backend/src/stock-valuations/stock-valuation.domain.spec.ts
git commit -m "feat(stock): add valuation domain"
```

---

### Task 2: Persistencia de cierres históricos

**Files:**
- Create: `apps/backend/src/db/stock-valuations.schema.ts`
- Create: `apps/backend/src/db/stock-valuations.schema.spec.ts`
- Modify: `apps/backend/src/db/schema.ts`
- Create: `apps/backend/drizzle/0047_stock_valuations.sql`

**Interfaces:**
- Consumes: totales y grupos de `ValuationProjection`.
- Produces: `stockValuations` y `stockValuationLines` exportados por `db/schema.ts`.

- [ ] **Step 1: Crear prueba roja del schema**

Crear `stock-valuations.schema.spec.ts`:

```ts
import { stockValuations, stockValuationLines } from '../db/schema'
import { getTableName } from 'drizzle-orm'

it('exports the valuation snapshot tables', () => {
  expect(getTableName(stockValuations)).toBe('stock_valuations')
  expect(getTableName(stockValuationLines)).toBe('stock_valuation_lines')
})
```

Run: `npm test --workspace=apps/backend -- stock-valuations.schema.spec.ts --runInBand`

Expected: FAIL porque tablas no existen.

- [ ] **Step 2: Definir tablas Drizzle**

`stockValuations`:

```ts
id: serial primary key
period: varchar(7) unique not null
closedAt: timestamp defaultNow not null
availableUnits/reservedUnits/totalUnits: integer not null
totalCost/totalSell/potentialMargin: numeric(14,2) not null
unpricedSaleUnits: integer not null default 0
createdAt/updatedAt: timestamp defaultNow not null
```

`stockValuationLines`:

```ts
id: serial primary key
valuationId: integer references stockValuations(id) onDelete cascade
brand/model: varchar(100) not null
version: varchar(100)
availableUnits/reservedUnits/totalUnits: integer not null
costPrice: numeric(12,2) not null
sellPrice: numeric(12,2) nullable
totalCost/totalSell/potentialMargin: numeric(14,2) not null
```

Agregar índice por `valuation_id` y restricción única de `period`.

- [ ] **Step 3: Crear migración SQL idempotente**

Crear tablas con `CREATE TABLE IF NOT EXISTS`, FK `ON DELETE CASCADE`, índice único `stock_valuations_period_unique` e índice `stock_valuation_lines_valuation_idx`. No editar migraciones previas.

- [ ] **Step 4: Verificar schema y SQL**

Run: `npm run build --workspace=apps/backend`

Expected: PASS.

Run: `git diff --check -- apps/backend/src/db apps/backend/drizzle/0047_stock_valuations.sql`

Expected: sin salida.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/db/stock-valuations.schema.ts apps/backend/src/db/schema.ts apps/backend/drizzle/0047_stock_valuations.sql
git commit -m "feat(stock): persist monthly valuations"
```

---

### Task 3: API transaccional de valuación

**Files:**
- Create: `apps/backend/src/stock-valuations/stock-valuations.dto.ts`
- Create: `apps/backend/src/stock-valuations/stock-valuations.service.ts`
- Create: `apps/backend/src/stock-valuations/stock-valuations.service.spec.ts`
- Create: `apps/backend/src/stock-valuations/stock-valuations.controller.ts`
- Create: `apps/backend/src/stock-valuations/stock-valuations.module.ts`
- Modify: `apps/backend/src/app.module.ts`

**Interfaces:**
- Consumes: `ValuationRequest`, tablas Drizzle y `projectValuation`.
- Produces: `current(period)`, `preview(dto)`, `close(dto)`, `list()`, `findOne(id)` y endpoints `/stock-valuations`.

- [ ] **Step 1: Escribir pruebas rojas del servicio**

Construir DB falsa inyectable con `select`, `transaction`, `update`, `insert`, `delete`. Cubrir:

```ts
it('filters eligible motos before projection')
it('rejects a stale stock fingerprint')
it('updates all group vehicles and writes snapshot atomically')
it('returns ConflictException for an existing period without replaceExisting')
it('replaces header and lines when replaceExisting is true')
it('keeps historical reads independent from current vehicles')
```

Run: `npm test --workspace=apps/backend -- stock-valuations.service.spec.ts --runInBand`

Expected: FAIL porque servicio no existe.

- [ ] **Step 2: Implementar DTOs validados**

```ts
export class GroupPriceEditDto {
  @IsString() groupKey!: string
  @IsNumber() @Min(0.01) costPrice!: number
  @IsIn(['unchanged', 'manual', 'margin']) saleMode!: SaleMode
  @IsOptional() @IsNumber() @Min(0) manualSellPrice?: number
  @IsOptional() @IsNumber() @Min(0) @Max(1000) marginPercent?: number
}

export class PreviewStockValuationDto {
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/) period!: string
  @IsString() stockFingerprint!: string
  @IsOptional() @IsNumber() @Min(0) @Max(1000) generalMarginPercent?: number
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => GroupPriceEditDto)
  groups!: GroupPriceEditDto[]
}

export class CloseStockValuationDto extends PreviewStockValuationDto {
  @IsOptional() @IsBoolean() replaceExisting?: boolean
}
```

- [ ] **Step 3: Implementar lecturas y vista previa**

- `eligibleRows(executor = this.database)` selecciona motos disponibles/reservadas.
- `current(period)` arma grupos con precios actuales, fingerprint y cierre existente.
- `preview(dto)` recalcula desde DB y llama `projectValuation`.
- `list()` ordena cierres por período descendente.
- `findOne(id)` devuelve encabezado y líneas o `NotFoundException`.

- [ ] **Step 4: Implementar cierre atómico**

Dentro de `database.transaction`:

1. releer stock elegible;
2. comparar fingerprint;
3. proyectar y validar;
4. buscar cierre del período;
5. lanzar `ConflictException` si existe sin reemplazo;
6. actualizar `costPrice`, `sellPrice` y `updatedAt` por ids de cada grupo;
7. insertar o actualizar encabezado;
8. borrar líneas anteriores si reemplaza;
9. insertar todas las líneas proyectadas;
10. devolver detalle persistido.

Nunca usar totales enviados por cliente.

- [ ] **Step 5: Ejecutar pruebas del servicio**

Run: `npm test --workspace=apps/backend -- stock-valuations.service.spec.ts --runInBand`

Expected: PASS.

- [ ] **Step 6: Implementar controlador y módulo**

Rutas exactas:

```ts
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('stock-valuations')

@Get('preview') current(@Query('period') period: string)
@Post('preview') preview(@Body() dto: PreviewStockValuationDto)
@Post('close') close(@Body() dto: CloseStockValuationDto)
@Get() list()
@Get(':id') findOne(@Param('id', ParseIntPipe) id: number)
```

Registrar `StockValuationsModule` en `AppModule`.

- [ ] **Step 7: Verificar backend completo**

Run: `npm test --workspace=apps/backend -- --runInBand`

Expected: todas PASS.

Run: `npm run build --workspace=apps/backend`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/backend/src/stock-valuations apps/backend/src/app.module.ts
git commit -m "feat(stock): add valuation API"
```

---

### Task 4: Contrato y estado editable frontend

**Files:**
- Create: `apps/frontend/src/types/stock-valuation.types.ts`
- Create: `apps/frontend/src/lib/stockValuation.ts`
- Create: `apps/frontend/src/lib/stockValuation.spec.ts`
- Create: `apps/frontend/src/hooks/useStockValuation.ts`

**Interfaces:**
- Consumes: respuestas de `/stock-valuations/preview`, `/close`, lista y detalle.
- Produces: `createValuationDraft`, `projectDraftSellPrice`, `validateDraft`, `useStockValuation`.

- [ ] **Step 1: Escribir pruebas rojas de borrador**

```ts
expect(projectDraftSellPrice({ costPrice: '100', saleMode: 'manual', manualSellPrice: '145' }, 30)).toBe(145)
expect(projectDraftSellPrice({ costPrice: '100', saleMode: 'margin', marginPercent: '20' }, 30)).toBe(120)
expect(projectDraftSellPrice({ costPrice: '100', saleMode: 'margin', marginPercent: '' }, 30)).toBe(130)
expect(validateDraft([{ costPrice: '0' } as DraftGroup], '')).toContain('Ingresá un costo mayor que cero')
```

Run: `npm test --workspace=apps/frontend -- stockValuation.spec.ts --runInBand`

Expected: FAIL porque helper no existe.

- [ ] **Step 2: Definir tipos de API y borrador**

Incluir `CurrentValuationResponse`, `ValuationGroup`, `DraftGroup`, `ValuationProjection`, `ValuationSummary`, `StockValuationHeader`, `StockValuationDetail`. Mantener nombres JSON iguales al backend.

- [ ] **Step 3: Implementar helpers puros**

- convertir `number | null` a inputs sin perder `0`;
- mostrar `null` como “Varios” en precio actual;
- construir DTO sin mandar strings vacíos;
- validar costos, modo manual y margen;
- redondear sólo para previsualización visual.

- [ ] **Step 4: Ejecutar pruebas verdes**

Run: `npm test --workspace=apps/frontend -- stockValuation.spec.ts --runInBand`

Expected: PASS.

- [ ] **Step 5: Implementar hook**

`useStockValuation(period)` debe exponer:

```ts
{
  current, history, detail,
  draft, setDraft, generalMargin, setGeneralMargin,
  preview, previewMutation,
  close(replaceExisting?: boolean), closeMutation,
  selectHistory(id: number), resetDraft()
}
```

Invalidar `['stock-valuations']`, `['stock-valuations', 'current']` y `['vehicles']` tras cierre.

- [ ] **Step 6: Verificar tipos y commit**

Run: `npm test --workspace=apps/frontend -- stockValuation.spec.ts --runInBand`

Expected: PASS.

```bash
git add apps/frontend/src/types/stock-valuation.types.ts apps/frontend/src/lib/stockValuation.ts apps/frontend/src/lib/stockValuation.spec.ts apps/frontend/src/hooks/useStockValuation.ts
git commit -m "feat(stock): add valuation client state"
```

---

### Task 5: Pantalla de actualización y cierres

**Files:**
- Create: `apps/frontend/src/components/stock-valuation/ValuationEditor.tsx`
- Create: `apps/frontend/src/components/stock-valuation/ValuationSummary.tsx`
- Create: `apps/frontend/src/components/stock-valuation/ValuationHistory.tsx`
- Create: `apps/frontend/src/pages/StockValuationPage.tsx`
- Modify: `apps/frontend/src/App.tsx`
- Modify: `apps/frontend/src/components/layout/Sidebar.tsx`
- Modify: `apps/frontend/src/components/layout/AppLayout.tsx`

**Interfaces:**
- Consumes: `useStockValuation`, tipos y estilos UI existentes.
- Produces: ruta `/stock-valuation` visible sólo para admin.

- [ ] **Step 1: Crear página orquestadora y guardia visual**

Si `!isAdmin`, renderizar `<Navigate to="/vehicles" replace />`. Para admin: selector `type="month"`, `InfoBanner`, editor, resumen e historial.

- [ ] **Step 2: Crear editor responsive**

- búsqueda cliente por marca/modelo/versión;
- input de margen general;
- tabla con cantidades disponibles/reservadas;
- costo actual “Varios” cuando corresponda;
- costo nuevo obligatorio;
- modo venta sin cambio/manual/margen;
- input condicional de margen o venta;
- venta proyectada;
- error por grupo debajo de campos.

En móvil, permitir desplazamiento horizontal sin cortar acciones.

- [ ] **Step 3: Crear resumen y confirmación**

Mostrar totales actuales/proyectados y cobertura de venta. Botón `Previsualizar cierre` usa servidor. Botón `Confirmar cierre` sólo aparece con preview vigente. Antes de enviar, usar `window.confirm` con período, unidades y totales.

Si API responde 409 por cierre existente, preguntar explícitamente `Ya existe el cierre YYYY-MM. ¿Reemplazarlo?`; sólo entonces reenviar con `replaceExisting: true`.

- [ ] **Step 4: Crear historial**

Lista descendente. Al elegir cierre, solicitar detalle y mostrar encabezado más tabla congelada. Nunca mezclar detalle histórico con grupos actuales.

- [ ] **Step 5: Registrar navegación**

- lazy import en `App.tsx`;
- ruta `stock-valuation`;
- título `/stock-valuation: 'Valuación de stock'`;
- item de Inventario con icono `Calculator` o `ClipboardCheck` sólo cuando `user.role === 'admin'`.

- [ ] **Step 6: Verificar build frontend**

Run: `npm test --workspace=apps/frontend -- --runInBand`

Expected: todas PASS.

Run: `npm run build --workspace=apps/frontend`

Expected: PASS sin errores TypeScript.

- [ ] **Step 7: Commit**

```bash
git add apps/frontend/src/components/stock-valuation apps/frontend/src/pages/StockValuationPage.tsx apps/frontend/src/App.tsx apps/frontend/src/components/layout/Sidebar.tsx apps/frontend/src/components/layout/AppLayout.tsx
git commit -m "feat(stock): add valuation screen"
```

---

### Task 6: Migración integrada y verificación funcional

**Files:**
- Verify: all files introduced in Tasks 1–5.
- Modify: only a specific failing source or test file when verification identifies a concrete defect.

**Interfaces:**
- Consumes: aplicación completa y PostgreSQL local de integración.
- Produces: evidencia de migración, API, build y flujo crítico.

- [ ] **Step 1: Aplicar migración en base de integración**

Crear una DB temporal específica; aplicar migraciones base usadas por el proyecto y `0047_stock_valuations.sql`. Nunca apuntar a producción para esta prueba.

Expected: ambas tablas, FK, índice de líneas y período único existen.

- [ ] **Step 2: Ejecutar prueba HTTP autenticada**

Con usuario admin y datos fixture:

1. crear Guerrero Trip TA disponible y reservada;
2. crear Guerrero Trip TF;
3. llamar `GET /stock-valuations/preview`;
4. previsualizar TA costo 1.000.000, margen general 30%;
5. sobrescribir TF con margen 25%;
6. cerrar período;
7. verificar TA venta 1.300.000 y TF según 25%;
8. verificar motos vendidas/lanchas sin cambios;
9. verificar historial;
10. repetir sin `replaceExisting` y esperar 409.

- [ ] **Step 3: Ejecutar suite final**

Run: `npm test --workspace=apps/backend -- --runInBand`

Expected: PASS.

Run: `npm test --workspace=apps/frontend -- --runInBand`

Expected: PASS.

Run: `npm run build --workspace=apps/backend`

Expected: PASS.

Run: `npm run build --workspace=apps/frontend`

Expected: PASS.

Run: `git diff --check`

Expected: sin salida.

- [ ] **Step 4: Actualizar CodeGraph y revisar impacto**

Ejecutar actualización incremental del grafo y `detect_changes` contra `2f0f0ca`, detalle mínimo. Revisar especialmente rutas de vehículos, auth admin, schema y navegación.

- [ ] **Step 5: Commit de correcciones de integración**

Revisar `git status --short`, agregar por ruta explícita únicamente cada archivo corregido y ejecutar `git commit -m "fix(stock): harden valuation flow"`.

Si no hubo correcciones, no crear commit vacío.

---

## Final Acceptance Checklist

- [ ] Guerrero / Trip / TA cambia sin afectar TF, TBA o TFE.
- [ ] Disponibles y reservadas se actualizan y cuentan por separado.
- [ ] Vendidas y lanchas quedan fuera.
- [ ] Costo cero bloquea cierre.
- [ ] Venta manual vence margen específico y general.
- [ ] Margen específico vence margen general.
- [ ] Venta sin precio se permite y queda contabilizada como faltante.
- [ ] Vista previa obsoleta se rechaza.
- [ ] Cierre y precios se guardan o revierten juntos.
- [ ] Reemplazo mensual requiere segunda confirmación.
- [ ] Historial no cambia con ediciones posteriores.
- [ ] Usuario vendedor no ve ni invoca la función.
- [ ] Tests y builds backend/frontend pasan.
