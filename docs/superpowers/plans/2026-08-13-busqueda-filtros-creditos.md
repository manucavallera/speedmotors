# Búsqueda y filtros escalables de créditos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar búsqueda por cliente, filtro por clase de deuda y paginación de 50 registros a Créditos sin degradar el rendimiento cuando crezca la tabla.

**Architecture:** `GET /credits` validará filtros tipados y devolverá una página con conteo total; PostgreSQL aplicará búsqueda, estado y clasificación antes de calcular saldos únicamente para los elementos visibles. El frontend centralizará parámetros y paginación en `useCredits`, estabilizará la búsqueda durante 300 ms y renderizará los controles sobre la tabla existente.

**Tech Stack:** NestJS 11, class-validator/class-transformer, Drizzle ORM 0.45, PostgreSQL, Jest/ts-jest, React 19, TanStack Query 5, TypeScript 6, Vite 8.

## Global Constraints

- Búsqueda por nombre sin distinguir mayúsculas, minúsculas ni acentos.
- Tipos visibles: `Todos los tipos`, `Financiación fija`, `Cuota libre`, `Cuenta corriente`.
- `fija = cuotas_simples`; `libre = saldo_compuesto con interestRate > 0`; `cuenta_corriente = saldo_compuesto con interestRate = 0`.
- Estado, búsqueda y tipo se combinan en la misma consulta.
- Página por defecto `1`; límite por defecto `50`; límite permitido `1..100`.
- Sólo se calculan saldos para los elementos de la página solicitada.
- Orden estable por `createdAt DESC, id DESC`.
- La búsqueda espera 300 ms sin escritura antes de consultar.
- No se crea ni modifica ninguna migración.
- Crear, consultar detalle, editar, cobrar y eliminar créditos conserva su comportamiento.
- `concesionaria-management-system-readme/` pertenece al usuario y queda fuera de todos los commits.

---

## Mapa de archivos

- `apps/backend/src/credits/list-credits.dto.ts`: parámetros validados del listado.
- `apps/backend/src/credits/credit-list.ts`: normalización pura, clasificación y contrato paginado.
- `apps/backend/src/credits/credit-list.spec.ts`: reglas de parámetros y tipos de deuda.
- `apps/backend/src/credits/credits.controller.ts`: recibe el DTO completo.
- `apps/backend/src/credits/credits.service.ts`: consulta filtrada, conteo, página y saldos visibles.
- `apps/frontend/src/lib/creditFilters.ts`: tipos, parámetros y clasificación compartida.
- `apps/frontend/src/lib/creditFilters.spec.ts`: contrato de parámetros y etiquetas.
- `apps/frontend/src/hooks/useDebouncedValue.ts`: estabilización genérica de 300 ms.
- `apps/frontend/src/hooks/useCredits.ts`: estado de filtros, página y respuesta paginada.
- `apps/frontend/src/pages/CreditsPage.tsx`: buscador, selector, conteo y paginación.
- `apps/frontend/src/components/credits/CreditsTable.tsx`: etiqueta vacía contextual y etiqueta de tipo compartida.

### Task 1: Definir y validar el contrato paginado

**Files:**
- Create: `apps/backend/src/credits/list-credits.dto.ts`
- Create: `apps/backend/src/credits/credit-list.ts`
- Create: `apps/backend/src/credits/credit-list.spec.ts`
- Modify: `apps/backend/src/credits/credits.controller.ts`

**Interfaces:**
- Produces: `DebtTypeFilter = 'fija' | 'libre' | 'cuenta_corriente'`.
- Produces: `ListCreditsQueryDto` con `status?`, `search?`, `debtType?`, `page = 1`, `limit = 50`.
- Produces: `normalizeCreditSearch(value?: string): string | undefined`.
- Controller calls: `creditsService.findAll(query)`.

- [ ] **Step 1: Escribir pruebas fallidas de normalización y clasificación**

Crear `credit-list.spec.ts` con expectativas literales:

```ts
import { creditMatchesDebtType, normalizeCreditSearch } from './credit-list'

describe('credit list filters', () => {
  it.each([
    ['GÓMEZ', 'gomez'],
    ['  Muñoz  ', 'munoz'],
    ['María José', 'maria jose'],
    ['', undefined],
  ])('normalizes %p for accent-insensitive search', (input, expected) => {
    expect(normalizeCreditSearch(input)).toBe(expected)
  })

  it('classifies fixed, free and account-current debts', () => {
    expect(creditMatchesDebtType({ creditType: 'cuotas_simples', interestRate: '5' }, 'fija')).toBe(true)
    expect(creditMatchesDebtType({ creditType: 'saldo_compuesto', interestRate: '5' }, 'libre')).toBe(true)
    expect(creditMatchesDebtType({ creditType: 'saldo_compuesto', interestRate: '0' }, 'cuenta_corriente')).toBe(true)
    expect(creditMatchesDebtType({ creditType: 'saldo_compuesto', interestRate: '0' }, 'libre')).toBe(false)
  })
})
```

- [ ] **Step 2: Ejecutar RED**

```bash
npm test --workspace=apps/backend -- credit-list.spec.ts --runInBand
```

Expected: FAIL porque el módulo todavía no existe.

- [ ] **Step 3: Implementar helpers y DTO mínimo**

`normalizeCreditSearch()` usa:

```ts
value.trim().toLocaleLowerCase('es-AR').normalize('NFD').replace(/\p{Diacritic}/gu, '') || undefined
```

`creditMatchesDebtType()` implementa literalmente la clasificación de Global Constraints y se utilizará como especificación ejecutable de las condiciones SQL.

Crear el DTO:

```ts
export class ListCreditsQueryDto {
  @IsOptional() @IsIn(['activo', 'pagado', 'cancelado']) status?: CreditStatus
  @IsOptional() @IsString() @MaxLength(150) search?: string
  @IsOptional() @IsIn(['fija', 'libre', 'cuenta_corriente']) debtType?: DebtTypeFilter
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 50
}
```

Cambiar el controlador a:

```ts
@Get()
findAll(@Query() query: ListCreditsQueryDto) {
  return this.creditsService.findAll(query)
}
```

- [ ] **Step 4: Ejecutar GREEN y build**

```bash
npm test --workspace=apps/backend -- credit-list.spec.ts --runInBand
npm run build --workspace=apps/backend
```

Expected: prueba y build PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/credits/list-credits.dto.ts apps/backend/src/credits/credit-list.ts apps/backend/src/credits/credit-list.spec.ts apps/backend/src/credits/credits.controller.ts
git commit -m "feat(credits): validate list filters"
```

### Task 2: Consultar y paginar créditos en el servidor

**Files:**
- Modify: `apps/backend/src/credits/credits.service.ts`
- Modify: `apps/backend/src/credits/credit-list.spec.ts`

**Interfaces:**
- Consumes: `ListCreditsQueryDto` y `normalizeCreditSearch()`.
- Produces: `Promise<{ items: CreditWithClientAndBalance[]; total: number; page: number; pages: number }>`.
- Preserves: `findOne`, create/update, pagos, cuotas y cálculo de saldo.

- [ ] **Step 1: Agregar prueba fallida del cálculo de página**

Agregar un helper puro `creditPageMeta(total, page, limit)` y su prueba:

```ts
it.each([
  [0, 1, 50, { total: 0, page: 1, pages: 0, offset: 0 }],
  [120, 1, 50, { total: 120, page: 1, pages: 3, offset: 0 }],
  [120, 3, 50, { total: 120, page: 3, pages: 3, offset: 100 }],
  [120, 4, 50, { total: 120, page: 4, pages: 3, offset: 150 }],
])('builds stable page metadata', (total, page, limit, expected) => {
  expect(creditPageMeta(total, page, limit)).toEqual(expected)
})
```

- [ ] **Step 2: Ejecutar RED**

```bash
npm test --workspace=apps/backend -- credit-list.spec.ts --runInBand
```

Expected: FAIL porque `creditPageMeta` no existe.

- [ ] **Step 3: Implementar consulta filtrada**

Cambiar `findAll(status?)` por `findAll(query: ListCreditsQueryDto)`.

Construir `conditions` con Drizzle:

```ts
if (query.status) conditions.push(eq(credits.status, query.status))
if (search) conditions.push(sql`translate(lower(${clients.name}), 'áéíóúüñ', 'aeiouun') like ${`%${search}%`}`)
if (query.debtType === 'fija') conditions.push(eq(credits.creditType, 'cuotas_simples'))
if (query.debtType === 'libre') conditions.push(and(eq(credits.creditType, 'saldo_compuesto'), gt(credits.interestRate, '0'))!)
if (query.debtType === 'cuenta_corriente') conditions.push(and(eq(credits.creditType, 'saldo_compuesto'), eq(credits.interestRate, '0'))!)
```

Usar la misma condición combinada en:

1. `SELECT count(*)` con unión a clientes;
2. consulta de página con `.limit(limit).offset(offset).orderBy(desc(credits.createdAt), desc(credits.id))`.

Después de recibir la página, ejecutar `computeBalance()` sólo en `rows.map()` de esos elementos y devolver:

```ts
return { items, total, page, pages }
```

- [ ] **Step 4: Verificar helper, backend completo y build**

```bash
npm test --workspace=apps/backend -- credit-list.spec.ts --runInBand
npm test --workspace=apps/backend -- --runInBand
npm run build --workspace=apps/backend
```

Expected: todas las pruebas y build PASS.

- [ ] **Step 5: Smoke SQL con PostgreSQL aislado**

Crear una base temporal desde el esquema vigente, insertar al menos seis clientes/créditos que cubran acentos, los tres tipos y estados, y comprobar por HTTP autenticado o llamada de servicio real:

- `search=gomez` encuentra `Gómez`;
- `debtType=fija` devuelve sólo `cuotas_simples`;
- `debtType=libre` devuelve sólo compuesto con interés positivo;
- `debtType=cuenta_corriente` devuelve sólo compuesto con interés cero;
- combinación con estado reduce el total;
- `limit=2` devuelve dos elementos y `pages` correcto.

Eliminar la base temporal al terminar. No ejecutar este smoke contra producción.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/credits/credits.service.ts apps/backend/src/credits/credit-list.ts apps/backend/src/credits/credit-list.spec.ts
git commit -m "feat(credits): paginate filtered debts"
```

### Task 3: Modelar filtros y estado paginado en el frontend

**Files:**
- Create: `apps/frontend/src/lib/creditFilters.ts`
- Create: `apps/frontend/src/lib/creditFilters.spec.ts`
- Create: `apps/frontend/src/hooks/useDebouncedValue.ts`
- Modify: `apps/frontend/src/hooks/useCredits.ts`

**Interfaces:**
- Produces: `DebtTypeFilter = 'todos' | 'fija' | 'libre' | 'cuenta_corriente'`.
- Produces: `PaginatedCreditsResponse`.
- Produces: `creditListParams({ status, debtType, search, page, limit })`.
- Hook exposes: `search`, `setSearch`, `debtTypeFilter`, `setDebtTypeFilter`, `page`, `setPage`, `total`, `pages`, `isFetching`.

- [ ] **Step 1: Escribir pruebas fallidas del contrato de parámetros**

```ts
describe('credit list params', () => {
  it('omits all-filter values and trims search', () => {
    expect(creditListParams({ status: 'todos', debtType: 'todos', search: '  ', page: 1, limit: 50 }))
      .toEqual({ page: 1, limit: 50 })
  })

  it('combines status, type, search and pagination', () => {
    expect(creditListParams({ status: 'activo', debtType: 'libre', search: ' Gómez ', page: 3, limit: 50 }))
      .toEqual({ status: 'activo', debtType: 'libre', search: 'Gómez', page: 3, limit: 50 })
  })

  it.each([
    ['cuotas_simples', '5', 'Financiación fija'],
    ['saldo_compuesto', '5', 'Cuota libre'],
    ['saldo_compuesto', '0', 'Cuenta corriente'],
  ])('labels debt types', (creditType, interestRate, expected) => {
    expect(creditDebtLabel({ creditType, interestRate } as Credit)).toBe(expected)
  })
})
```

- [ ] **Step 2: Ejecutar RED**

```bash
npm test --workspace=apps/frontend -- creditFilters.spec.ts --runInBand
```

Expected: FAIL porque el módulo no existe.

- [ ] **Step 3: Implementar helpers, debounce y hook**

Crear `useDebouncedValue<T>(value, delayMs)` con efecto que limpia el timeout anterior. En `useCredits`:

```ts
const [search, setSearchState] = useState('')
const deferredSearch = useDebouncedValue(search, 300)
const [debtTypeFilter, setDebtTypeFilterState] = useState<DebtTypeFilter>('todos')
const [page, setPage] = useState(1)
const limit = 50
```

Los setters de búsqueda, estado y tipo llaman `setPage(1)`. La query usa:

```ts
queryKey: ['credits', { statusFilter, debtTypeFilter, search: deferredSearch.trim(), page, limit }]
queryFn: () => api.get('/credits', { params: creditListParams(...) }).then(r => r.data)
placeholderData: previous => previous
```

Si una respuesta tiene `total > 0`, `pages > 0` y `page > pages`, ejecutar `setPage(pages)` en un efecto guardado por esas dependencias.

- [ ] **Step 4: Ejecutar tests y build**

```bash
npm test --workspace=apps/frontend -- creditFilters.spec.ts --runInBand
npm test --workspace=apps/frontend -- --runInBand
npm run build --workspace=apps/frontend
```

Expected: todas las pruebas y build PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/lib/creditFilters.ts apps/frontend/src/lib/creditFilters.spec.ts apps/frontend/src/hooks/useDebouncedValue.ts apps/frontend/src/hooks/useCredits.ts
git commit -m "feat(credits): query paginated filters"
```

### Task 4: Agregar controles y resultados a la pantalla

**Files:**
- Modify: `apps/frontend/src/pages/CreditsPage.tsx`
- Modify: `apps/frontend/src/components/credits/CreditsTable.tsx`

**Interfaces:**
- Consumes: estado paginado de `useCredits` y `creditDebtLabel()`.
- Produces: buscador, selector de tipo, indicador de actualización, mensaje vacío y `Pagination`.

- [ ] **Step 1: Conectar controles a la página**

Agregar debajo del banner un panel responsive con:

```tsx
<input
  value={c.search}
  onChange={(event) => c.setSearch(event.target.value)}
  placeholder="Buscar cliente..."
  aria-label="Buscar cliente"
/>

<select
  value={c.debtTypeFilter}
  onChange={(event) => c.setDebtTypeFilter(event.target.value as DebtTypeFilter)}
  aria-label="Tipo de deuda"
>
  <option value="todos">Todos los tipos</option>
  <option value="fija">Financiación fija</option>
  <option value="libre">Cuota libre</option>
  <option value="cuenta_corriente">Cuenta corriente</option>
</select>
```

Mantener los chips de estado. Mostrar `<span>Actualizando…</span>` cuando `isFetching && !isLoading`.

- [ ] **Step 2: Adaptar tabla, conteo y paginación**

Eliminar el filtrado local por estado de `CreditsPage`; `c.credits` ya contiene la página del servidor.

Cambiar el subtítulo a:

```tsx
{c.total} crédito{c.total === 1 ? '' : 's'} encontrado{c.total === 1 ? '' : 's'}
```

Pasar `emptyMessage="No hay créditos para estos filtros"` a `CreditsTable`. Reemplazar su `tipoLabel` privado por `creditDebtLabel()`.

Renderizar:

```tsx
<Pagination page={c.page} pages={c.pages} total={c.total} onPage={c.setPage} />
```

- [ ] **Step 3: Verificar comportamiento existente y build**

```bash
npm test --workspace=apps/frontend -- --runInBand
npm run build --workspace=apps/frontend
git diff --check
```

Realizar smoke manual:

1. Buscar un apellido con acento escribiéndolo sin acento.
2. Combinar cada tipo con estado activo.
3. Navegar a página 2 y cambiar tipo; comprobar retorno a página 1.
4. Abrir detalle, editar y registrar un pago; comprobar que el listado conserva filtros y se actualiza.
5. Limpiar filtros; comprobar total general y paginación.

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/pages/CreditsPage.tsx apps/frontend/src/components/credits/CreditsTable.tsx
git commit -m "feat(credits): add search and debt filters"
```

### Task 5: Verificación y revisión final

**Files:**
- Review: archivos de Tasks 1–4.

- [ ] **Step 1: Ejecutar verificación fresca completa**

```bash
npm test --workspace=apps/backend -- --runInBand
npm test --workspace=apps/frontend -- --runInBand
npm run build --workspace=apps/backend
npm run build --workspace=apps/frontend
git diff --check
```

Expected: cero fallos, ambos builds exitosos y diff limpio.

- [ ] **Step 2: Confirmar límites del cambio**

```bash
git diff --name-only master...HEAD
git status --short
```

Confirmar que no existan archivos bajo `apps/backend/drizzle/`, que `concesionaria-management-system-readme/` permanezca fuera de commits y que ningún endpoint de escritura haya cambiado su autorización.

- [ ] **Step 3: Solicitar revisión integral**

Aplicar `superpowers:requesting-code-review` desde el commit base hasta `HEAD`. La revisión debe comprobar especialmente:

- coincidencia exacta entre conteo y consulta de página;
- búsqueda parametrizada sin interpolación SQL insegura;
- clasificación de interés cero/positivo;
- cálculo de saldo limitado a la página;
- carreras de debounce y parámetros de React Query;
- preservación de creación, detalle, edición y pagos.

Corregir cualquier Critical o Important con prueba de regresión y repetir Step 1.
