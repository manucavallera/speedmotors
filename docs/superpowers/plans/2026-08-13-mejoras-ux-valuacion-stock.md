# Mejoras UX de valuación de stock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mostrar las motos que integran cada grupo de valuación, facilitar su edición desde el inventario y mantener visibles y seguras las acciones del cierre mensual.

**Architecture:** El backend ampliará exclusivamente la respuesta de stock actual con resúmenes identificatorios de las unidades, sin modificar la proyección ni la persistencia. El frontend separará los cálculos de estado, el detalle desplegable y la barra de acciones; la edición directa se resolverá mediante parámetros de URL en la pantalla existente de vehículos.

**Tech Stack:** NestJS 11, Drizzle ORM, Jest/ts-jest, React 19, React Router 7, TanStack Query 5, TypeScript 6, Vite 8.

## Global Constraints

- Sólo las motos `disponible` y `reservado` forman parte de la valuación; las vendidas y lanchas quedan excluidas.
- La valuación y el detalle de unidades siguen protegidos para administradores.
- El cierre continúa operando por marca, modelo y versión, nunca por unidad individual.
- No se agrega una acción de eliminación dentro de `Valuación de stock`.
- Toda modificación posterior invalida la previsualización y obliga a calcularla nuevamente.
- No se crea ni modifica ninguna migración de base de datos.
- La carpeta sin seguimiento `concesionaria-management-system-readme/` no pertenece a esta tarea y no debe agregarse a commits.

---

## Mapa de archivos

- `apps/backend/src/stock-valuations/stock-valuation.domain.ts`: contrato interno de motos elegibles y agrupación.
- `apps/backend/src/stock-valuations/stock-valuations.service.ts`: proyección segura de unidades para la respuesta del stock actual.
- `apps/backend/src/stock-valuations/stock-valuations.service.spec.ts`: cobertura del filtrado y de los datos identificatorios expuestos.
- `apps/frontend/src/types/stock-valuation.types.ts`: contrato TypeScript de cada unidad resumida.
- `apps/frontend/src/lib/stockValuation.ts`: funciones puras para detectar cambios y construir navegación segura.
- `apps/frontend/src/lib/stockValuation.spec.ts`: pruebas unitarias de estado y URLs.
- `apps/frontend/src/hooks/useStockValuation.ts`: actualización explícita del stock e invalidación de previsualización.
- `apps/frontend/src/components/stock-valuation/ValuationEditor.tsx`: filas desplegables, unidades e indicadores por grupo.
- `apps/frontend/src/components/stock-valuation/ValuationActionBar.tsx`: barra superior fija y estado del período.
- `apps/frontend/src/components/stock-valuation/ValuationSummary.tsx`: resumen de totales sin ser el único punto de acción.
- `apps/frontend/src/pages/StockValuationPage.tsx`: coordinación de navegación, actualización y cierre.
- `apps/frontend/src/pages/VehiclesPage.tsx`: apertura directa de una moto por `?edit=<id>` y retorno seguro.

### Task 1: Exponer las unidades elegibles de cada grupo

**Files:**
- Modify: `apps/backend/src/stock-valuations/stock-valuation.domain.ts`
- Modify: `apps/backend/src/stock-valuations/stock-valuations.service.ts`
- Test: `apps/backend/src/stock-valuations/stock-valuations.service.spec.ts`

**Interfaces:**
- Consumes: filas de `vehicles` ya filtradas por `type = moto` y estado elegible.
- Produces: `CurrentValuationResponse.groups[].units: ValuationVehicleUnit[]`, donde cada unidad contiene `id`, `internalCode`, `brand`, `model`, `version`, `status`, `chassisNumber` y `engineNumber`.
- Preserves: `projectValuation(rows, request)` y `stockFingerprint(rows)` mantienen sus firmas y comportamiento.

- [ ] **Step 1: Escribir la prueba fallida del contrato de unidades**

Ampliar `VehicleRow` y el factory `vehicle()` con campos identificatorios anulables. Agregar a `StockValuationsService`:

```ts
it('returns identifying data only for units inside each eligible group', async () => {
  const database = new FakeDatabase()
  database.vehicles = [
    vehicle({ id: 1, internalCode: 'SM-001', chassisNumber: 'CH-1', engineNumber: 'EN-1' }),
    vehicle({ id: 2, status: 'reservado', internalCode: 'SM-002' }),
    vehicle({ id: 3, type: 'lancha', internalCode: 'BOAT-1' }),
    vehicle({ id: 4, status: 'vendido', internalCode: 'SOLD-1' }),
  ]

  const current = await serviceWith(database).current('2026-08')

  expect(current.groups).toHaveLength(1)
  expect(current.groups[0].units).toEqual([
    expect.objectContaining({ id: 1, internalCode: 'SM-001', status: 'disponible', chassisNumber: 'CH-1', engineNumber: 'EN-1' }),
    expect.objectContaining({ id: 2, internalCode: 'SM-002', status: 'reservado' }),
  ])
  expect(current.groups[0].units).not.toEqual(expect.arrayContaining([
    expect.objectContaining({ internalCode: 'BOAT-1' }),
    expect.objectContaining({ internalCode: 'SOLD-1' }),
  ]))
})
```

- [ ] **Step 2: Ejecutar la prueba y verificar que falle**

Run:

```bash
npm test --workspace=apps/backend -- stock-valuations/stock-valuations.service.spec.ts --runInBand
```

Expected: FAIL porque `units` todavía no existe en el grupo devuelto.

- [ ] **Step 3: Implementar el resumen mínimo de unidades**

Agregar los campos identificatorios al contrato interno:

```ts
export interface EligibleVehicle {
  id: number
  brand: string
  model: string
  version: string | null
  status: EligibleStatus
  internalCode: string | null
  chassisNumber: string | null
  engineNumber: string | null
  costPrice: string
  sellPrice: string
  updatedAt: Date
}
```

Mapear esos campos en `eligibleRows()`. En `current()`, sustituir el descarte completo de `vehicles` por una proyección explícita:

```ts
const groups = groupEligibleVehicles(rows).map(({ vehicles: groupedRows, ...group }) => ({
  ...group,
  units: groupedRows.map((row) => ({
    id: row.id,
    internalCode: row.internalCode,
    brand: row.brand.trim(),
    model: row.model.trim(),
    version: row.version?.trim() || null,
    status: row.status,
    chassisNumber: row.chassisNumber,
    engineNumber: row.engineNumber,
  })),
}))
```

No incluir precios, notas, fotos ni fechas en `units`.

- [ ] **Step 4: Ejecutar las pruebas de backend**

Run:

```bash
npm test --workspace=apps/backend -- stock-valuations --runInBand
```

Expected: PASS para las pruebas de dominio, servicio, DTO, controlador y esquema de valuaciones.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/stock-valuations/stock-valuation.domain.ts apps/backend/src/stock-valuations/stock-valuations.service.ts apps/backend/src/stock-valuations/stock-valuations.service.spec.ts
git commit -m "feat(stock): expose valuation units"
```

### Task 2: Modelar cambios, estados y navegación en funciones puras

**Files:**
- Modify: `apps/frontend/src/types/stock-valuation.types.ts`
- Modify: `apps/frontend/src/lib/stockValuation.ts`
- Test: `apps/frontend/src/lib/stockValuation.spec.ts`

**Interfaces:**
- Consumes: `DraftGroup`, `ValuationGroup`, margen general y período.
- Produces: `ValuationVehicleUnit`, `valuationDraftChanged()`, `valuationGroupChange()`, `vehicleEditUrl()` y `safeValuationReturnTo()`.
- Used by: Tasks 3, 4 and 5.

- [ ] **Step 1: Escribir pruebas fallidas para cambios y URLs**

Agregar imports y casos a `stockValuation.spec.ts`:

```ts
describe('valuation UX helpers', () => {
  it('detects cost, sale and unchanged groups', () => {
    const base = group({ currentCostPrice: 100, currentSellPrice: 130 })
    expect(valuationGroupChange({ ...createValuationDraft([base])[0], costPrice: '110' })).toBe('cost')
    expect(valuationGroupChange({ ...createValuationDraft([base])[0], saleMode: 'manual', manualSellPrice: '140' })).toBe('sale')
    expect(valuationGroupChange({ ...createValuationDraft([base])[0], costPrice: '110', saleMode: 'margin', marginPercent: '20' })).toBe('both')
    expect(valuationGroupChange(createValuationDraft([base])[0])).toBe('none')
  })

  it('detects unsaved valuation inputs', () => {
    const groups = [group({ currentCostPrice: 100 })]
    expect(valuationDraftChanged(createValuationDraft(groups), '', groups)).toBe(false)
    expect(valuationDraftChanged([{ ...createValuationDraft(groups)[0], costPrice: '101' }], '', groups)).toBe(true)
    expect(valuationDraftChanged(createValuationDraft(groups), '25', groups)).toBe(true)
  })

  it('builds an editable vehicle URL with a safe return path', () => {
    expect(vehicleEditUrl(42, 'SM-001', '2026-08')).toBe('/vehicles?edit=42&search=SM-001&returnTo=%2Fstock-valuation%3Fperiod%3D2026-08')
    expect(safeValuationReturnTo('/stock-valuation?period=2026-08')).toBe('/stock-valuation?period=2026-08')
    expect(safeValuationReturnTo('https://evil.example')).toBeNull()
  })
})
```

- [ ] **Step 2: Ejecutar la prueba y verificar que falle**

Run:

```bash
npm test --workspace=apps/frontend -- stockValuation.spec.ts --runInBand
```

Expected: FAIL porque los helpers y `ValuationVehicleUnit` todavía no existen.

- [ ] **Step 3: Implementar tipos y helpers mínimos**

Agregar:

```ts
export interface ValuationVehicleUnit {
  id: number
  internalCode: string | null
  brand: string
  model: string
  version: string | null
  status: 'disponible' | 'reservado'
  chassisNumber: string | null
  engineNumber: string | null
}
```

Extraer los campos compartidos actuales a `ValuationGroupBase`; hacer que `ValuationGroup` lo extienda y agregue `units: ValuationVehicleUnit[]`. `DraftGroup` continúa extendiendo `ValuationGroup`, mientras `ProjectedValuationGroup` debe extender `ValuationGroupBase`, porque la respuesta de previsualización no necesita repetir las unidades. Implementar helpers con firmas exactas:

```ts
export type ValuationGroupChange = 'none' | 'cost' | 'sale' | 'both'

export function valuationGroupChange(group: DraftGroup): ValuationGroupChange
export function valuationDraftChanged(draft: DraftGroup[], generalMargin: string, source: ValuationGroup[]): boolean
export function vehicleEditUrl(vehicleId: number, internalCode: string | null, period: string): string
export function safeValuationReturnTo(value: string | null): string | null
```

`valuationGroupChange()` considera cambio de costo cuando `Number(costPrice) !== currentCostPrice`, y cambio de venta cuando `saleMode !== 'unchanged'`. `valuationDraftChanged()` también considera margen general no vacío. `vehicleEditUrl()` agrega `search` sólo cuando existe código interno. `safeValuationReturnTo()` acepta exclusivamente `/stock-valuation` o `/stock-valuation?…` y rechaza URLs absolutas o rutas distintas.

- [ ] **Step 4: Ejecutar las pruebas de helpers**

Run:

```bash
npm test --workspace=apps/frontend -- stockValuation.spec.ts --runInBand
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/types/stock-valuation.types.ts apps/frontend/src/lib/stockValuation.ts apps/frontend/src/lib/stockValuation.spec.ts
git commit -m "feat(stock): model valuation UX state"
```

### Task 3: Mostrar las motos dentro de cada grupo

**Files:**
- Modify: `apps/frontend/src/components/stock-valuation/ValuationEditor.tsx`
- Modify: `apps/frontend/src/pages/StockValuationPage.tsx`

**Interfaces:**
- Consumes: `DraftGroup.units`, `valuationGroupChange(group)` y `onEditUnit(unit)`.
- Produces: filas desplegables con identificación de unidades y navegación a edición.

- [ ] **Step 1: Usar primero el contrato nuevo para obtener un fallo de tipos**

Sin modificar todavía `ValuationEditor`, pasarle desde `StockValuationPage`:

```tsx
<ValuationEditor
  groups={valuation.draft}
  generalMargin={valuation.generalMargin}
  onGeneralMarginChange={valuation.setGeneralMargin}
  onGroupsChange={valuation.setDraft}
  onEditUnit={(unit) => navigate(vehicleEditUrl(unit.id, unit.internalCode, period))}
/>
```

- [ ] **Step 2: Ejecutar el build y verificar que falle**

Run:

```bash
npm run build --workspace=apps/frontend
```

Expected: FAIL con `Property 'onEditUnit' does not exist on type 'Props'`.

- [ ] **Step 3: Implementar expansión e indicadores**

Extender `Props` con `onEditUnit: (unit: ValuationVehicleUnit) => void`. En `ValuationEditor`, mantener `expandedGroups` como `Set<string>`. Agregar una columna `Detalle` con:

```tsx
<button type="button" onClick={() => toggleExpanded(group.groupKey)} style={btnSecondary}>
  {expandedGroups.has(group.groupKey) ? 'Ocultar motos' : `Ver motos (${group.totalUnits})`}
</button>
```

Después de la fila principal, renderizar una fila con `colSpan={9}` cuando el grupo esté abierto. Cada unidad mostrará código interno con fallback `Moto #<id>`, estado, cuadro, motor y:

```tsx
<button type="button" onClick={() => onEditUnit(unit)} style={btnSecondary}>
  Editar
</button>
```

Agregar una insignia obtenida de `valuationGroupChange(group)` con las etiquetas `Sin cambios`, `Cambia costo`, `Cambia venta` o `Cambian costo y venta`. No agregar `Eliminar`.

- [ ] **Step 4: Verificar frontend**

Run:

```bash
npm test --workspace=apps/frontend -- stockValuation.spec.ts --runInBand
npm run build --workspace=apps/frontend
```

Expected: tests PASS y build PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/components/stock-valuation/ValuationEditor.tsx apps/frontend/src/pages/StockValuationPage.tsx
git commit -m "feat(stock): show grouped valuation units"
```

### Task 4: Agregar barra de acciones, estados y actualización segura

**Files:**
- Create: `apps/frontend/src/components/stock-valuation/ValuationActionBar.tsx`
- Modify: `apps/frontend/src/hooks/useStockValuation.ts`
- Modify: `apps/frontend/src/components/stock-valuation/ValuationSummary.tsx`
- Modify: `apps/frontend/src/pages/StockValuationPage.tsx`

**Interfaces:**
- Consumes: `existingValuation`, `preview`, `isDirty`, errores y estados pendientes de React Query.
- Produces: `refreshStock(): Promise<void>` desde el hook y una barra fija con callbacks `onManage`, `onRefresh`, `onPreview` y `onClose`.

- [ ] **Step 1: Implementar primero el estado verificable del hook**

Calcular en `useStockValuation()`:

```ts
const isDirty = valuationDraftChanged(draft, generalMargin, currentQuery.data?.groups ?? [])

const refreshStock = async () => {
  const result = await currentQuery.refetch({ throwOnError: true })
  if (!result.data) throw new Error('No se recibió el stock actualizado')
  setDraftState(createValuationDraft(result.data.groups))
  setGeneralMarginState('')
  setPreview(null)
  setDraftSource(`${result.data.period}:${result.data.stockFingerprint}`)
}
```

Exponer `isDirty` y `refreshStock` en el retorno. Mantener `setDraft()` y `setGeneralMargin()` invalidando `preview` como actualmente. No limpiar el borrador antes de que `refetch()` termine correctamente: ante un error deben conservarse todos los valores locales.

- [ ] **Step 2: Crear la barra con estados explícitos**

Definir props:

```ts
interface Props {
  existingValuation: StockValuationHeader | null
  previewReady: boolean
  isDirty: boolean
  errors: string[]
  isRefreshing: boolean
  isPreviewing: boolean
  isClosing: boolean
  onManage: () => void
  onRefresh: () => void
  onPreview: () => void
  onClose: () => void
}
```

La prioridad del texto de estado será:

1. `Previsualización lista` si `previewReady`;
2. `Con cambios sin previsualizar` si `isDirty`;
3. `Cerrado <fecha>` si existe cierre;
4. `Sin cerrar`.

Renderizar la sección con `position: 'sticky'`, `top: 0`, `zIndex: 10`, fondo blanco y los botones `Gestionar motos`, `Actualizar stock`, `Previsualizar cierre`; mostrar `Confirmar cierre` sólo con `previewReady`.

- [ ] **Step 3: Conectar actualización y advertencias en la página**

Usar `useNavigate()` y leer el período inicial con `useSearchParams()` para conservar `?period=YYYY-MM`. Antes de actualizar:

```ts
const refresh = async () => {
  if (valuation.isDirty && !window.confirm('Hay cambios sin confirmar. ¿Querés descartarlos y actualizar el stock?')) return
  try {
    await valuation.refreshStock()
    toast.success('Stock actualizado')
  } catch (error) {
    toast.error(apiError(error))
  }
}
```

Si `valuation.current?.existingValuation` existe, mostrar junto a la barra la advertencia `Este período ya tiene cierre. Confirmarlo nuevamente reemplazará la fotografía existente.` Mantener la segunda confirmación de `PERIOD_EXISTS` en `close()`.

Conservar en `ValuationSummary` totales, errores y `Restablecer`; retirar de allí `Previsualizar cierre` y `Confirmar cierre` para que exista una única zona de acciones persistentes.

- [ ] **Step 4: Ejecutar pruebas y build**

Run:

```bash
npm test --workspace=apps/frontend -- --runInBand
npm run build --workspace=apps/frontend
```

Expected: todas las pruebas PASS y build PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/components/stock-valuation/ValuationActionBar.tsx apps/frontend/src/hooks/useStockValuation.ts apps/frontend/src/components/stock-valuation/ValuationSummary.tsx apps/frontend/src/pages/StockValuationPage.tsx
git commit -m "feat(stock): keep valuation actions visible"
```

### Task 5: Abrir y retornar desde la edición directa de una moto

**Files:**
- Modify: `apps/frontend/src/pages/VehiclesPage.tsx`

**Interfaces:**
- Consumes: `/vehicles?edit=42&returnTo=%2Fstock-valuation%3Fperiod%3D2026-08` y `safeValuationReturnTo()`.
- Produces: apertura automática de `VehicleFormModal` para la unidad solicitada y retorno a la valuación al guardar o cancelar.

- [ ] **Step 1: Conectar lectura segura de parámetros**

Agregar `useEffect`, `useNavigate` y `useSearchParams`. Derivar:

```ts
const [searchParams] = useSearchParams()
const navigate = useNavigate()
const requestedEditId = Number(searchParams.get('edit'))
const fallbackSearch = searchParams.get('search') ?? ''
const returnTo = safeValuationReturnTo(searchParams.get('returnTo'))
const hasDirectEdit = Number.isInteger(requestedEditId) && requestedEditId > 0
```

Crear una consulta con clave `['vehicles', 'detail', requestedEditId]`, `GET /vehicles/:id` y `enabled: isAdmin && hasDirectEdit`.

- [ ] **Step 2: Abrir el formulario una sola vez y manejar errores**

Mantener `openedDirectId: number | null`. En un efecto, cuando llegue la unidad y no haya sido procesada, asignarla a `editing`, abrir `modal = 'edit'` y guardar el identificador. Si la consulta falla, mostrar `No se pudo abrir la moto solicitada`, copiar `fallbackSearch` al buscador para dejar visible la lista filtrada y limpiar los parámetros mediante `navigate('/vehicles', { replace: true })`. Mostrar el error una sola vez.

- [ ] **Step 3: Implementar salida y retorno**

Centralizar:

```ts
const finishEditing = () => {
  setModal(null)
  setEditing(null)
  if (returnTo) navigate(returnTo)
}
```

Usarlo como `onClose` del formulario directo y, después de invalidar `['vehicles']`, en `update.onSuccess`. Para ediciones iniciadas desde la grilla sin `returnTo`, sólo cerrar el modal. Nunca navegar a un valor que no haya pasado `safeValuationReturnTo()`.

- [ ] **Step 4: Ejecutar verificación completa**

Run:

```bash
npm test --workspace=apps/backend -- --runInBand
npm test --workspace=apps/frontend -- --runInBand
npm run build --workspace=apps/backend
npm run build --workspace=apps/frontend
git diff --check
```

Expected: ambas suites PASS, ambos builds PASS y `git diff --check` sin salida.

Realizar además un smoke test manual autenticado:

1. Abrir `/stock-valuation?period=2026-08` como administrador.
2. Desplegar Guerrero Trip y comprobar que aparecen sus unidades elegibles.
3. Abrir `Editar` en una unidad, cancelar y comprobar el retorno al mismo período.
4. Cambiar un costo y comprobar `Con cambios sin previsualizar`.
5. Previsualizar y comprobar `Previsualización lista` y el botón `Confirmar cierre`.
6. Cambiar nuevamente el costo y comprobar que `Confirmar cierre` desaparece.
7. Pulsar `Actualizar stock`, rechazar el descarte y comprobar que los cambios continúan.
8. Pulsar nuevamente, aceptar y comprobar que vuelve el stock persistido.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/pages/VehiclesPage.tsx
git commit -m "feat(vehicles): open valuation unit editor"
```

### Task 6: Revisión final y evidencia de entrega

**Files:**
- Review: todos los archivos modificados en Tasks 1–5.

**Interfaces:**
- Consumes: feature completa integrada.
- Produces: evidencia reproducible de pruebas, builds y contrato sin migraciones.

- [ ] **Step 1: Revisar el diff contra la especificación**

Run:

```bash
git diff master...HEAD -- apps/backend/src apps/frontend/src
git status --short
```

Confirmar que no exista código para eliminar motos dentro de valuación, que no haya archivos nuevos en `apps/backend/drizzle/` y que `concesionaria-management-system-readme/` siga sin seguimiento y fuera de commits.

- [ ] **Step 2: Ejecutar la verificación final desde cero**

Run:

```bash
npm test --workspace=apps/backend -- --runInBand
npm test --workspace=apps/frontend -- --runInBand
npm run build --workspace=apps/backend
npm run build --workspace=apps/frontend
git diff --check
```

Expected: cero fallos, builds exitosos y diff sin errores de espacios.

- [ ] **Step 3: Solicitar revisión de código**

Aplicar `superpowers:requesting-code-review` sobre el rango desde el commit anterior al inicio de la implementación hasta `HEAD`. Corregir cualquier hallazgo Critical o Important, volver a ejecutar Step 2 y documentar los resultados reales en la entrega.

- [ ] **Step 4: Commit de correcciones, sólo si la revisión las requiere**

```bash
git add apps/backend/src/stock-valuations apps/frontend/src/types/stock-valuation.types.ts apps/frontend/src/lib/stockValuation.ts apps/frontend/src/lib/stockValuation.spec.ts apps/frontend/src/hooks/useStockValuation.ts apps/frontend/src/components/stock-valuation apps/frontend/src/pages/StockValuationPage.tsx apps/frontend/src/pages/VehiclesPage.tsx
git commit -m "fix(stock): address valuation UX review"
```
