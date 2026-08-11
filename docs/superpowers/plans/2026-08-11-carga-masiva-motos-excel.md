# Carga masiva de motos por remito y Excel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que un administrador descargue una plantilla Excel, importe varias motos desde Excel y revise ese lote en el mismo flujo existente de remito y carga manual.

**Architecture:** Extraer contrato, parser, plantilla y validaciones a un módulo frontend puro y testeable. `RemitoImportModal` adapta remito, Excel y carga manual a `VehicleDraft[]`; una transformación genera el payload de `POST /vehicles/bulk`. Backend y base no cambian.

**Tech Stack:** React 19, TypeScript 6, SheetJS `xlsx` 0.18.5, Jest/ts-jest ya presentes en workspace, TanStack Query y endpoint NestJS existente.

## Global Constraints

- Solo administradores ven y usan carga masiva.
- Excel se procesa localmente y no se almacena en servidor.
- No agregar dependencias, endpoints ni migraciones.
- Aceptar `.xlsx`, `.xls` y `.csv` con contrato de plantilla; no inferir formatos arbitrarios.
- Código interno, marca, modelo, chasis y motor obligatorios.
- Número de remito y tipo de ingreso comunes al lote; ambos opcionales.
- Rechazar lote completo si cualquier fila falla.
- Preservar `AdminGuard` en endpoints actuales.

## File Map

- Create: `apps/frontend/src/lib/vehicleBatch.ts` — tipos, parser, plantilla, validación y payload.
- Create: `apps/frontend/src/lib/vehicleBatch.spec.ts` — pruebas unitarias.
- Create: `apps/frontend/jest.config.cjs` — Jest/ts-jest frontend.
- Modify: `apps/frontend/package.json` — script `test`; sin dependencias nuevas.
- Modify: `apps/frontend/src/components/vehicles/RemitoImportModal.tsx` — entradas y revisión común.
- Modify: `apps/frontend/src/pages/VehiclesPage.tsx` — acción y ayuda coherentes.

---

### Task 1: Contrato, plantilla y parser Excel

**Files:**
- Create: `apps/frontend/jest.config.cjs`
- Modify: `apps/frontend/package.json`
- Create: `apps/frontend/src/lib/vehicleBatch.spec.ts`
- Create: `apps/frontend/src/lib/vehicleBatch.ts`

**Interfaces:**
- Consumes: `XLSX.WorkBook` y helpers `XLSX.utils`.
- Produces: `VehicleDraft`, `TEMPLATE_HEADERS`, `createVehicleTemplateWorkbook(): XLSX.WorkBook`, `parseVehicleWorkbook(workbook: XLSX.WorkBook): VehicleDraft[]`.

- [ ] **Step 1: Add frontend test runner and failing parser tests**

Add to `apps/frontend/package.json` scripts:

```json
"test": "jest --config jest.config.cjs"
```

Create `apps/frontend/jest.config.cjs`:

```js
module.exports = {
  rootDir: 'src',
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: { module: 'CommonJS', target: 'ES2022', esModuleInterop: true, strict: true },
    }],
  },
}
```

Create `apps/frontend/src/lib/vehicleBatch.spec.ts`:

```ts
import * as XLSX from 'xlsx'
import { TEMPLATE_HEADERS, createVehicleTemplateWorkbook, parseVehicleWorkbook } from './vehicleBatch'

describe('vehicleBatch Excel contract', () => {
  it('generates Motos template with documented headers', () => {
    const workbook = createVehicleTemplateWorkbook()
    expect(workbook.SheetNames).toEqual(['Motos'])
    const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets.Motos, { header: 1, defval: '' })
    expect(rows[0]).toEqual(TEMPLATE_HEADERS)
    expect(rows[1]?.[0]).toBe('EJEMPLO-NO-IMPORTAR')
  })

  it('parses multiple motorcycles and ignores blank/example rows', () => {
    const sheet = XLSX.utils.aoa_to_sheet([
      TEMPLATE_HEADERS,
      ['EJEMPLO-NO-IMPORTAR', 'ART-0', 'Honda', 'Wave', 110, '', 'Rojo', 'EJ-CH', 'EJ-MO'],
      ['M-101', 'PROV-1', 'Honda', 'Wave', 110, 'S', 'Rojo', 'CH-101', 'MO-101'],
      [],
      ['M-102', '', 'Corven', 'Energy', '', '', 'Negro', 'CH-102', 'MO-102'],
    ])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, sheet, 'Motos')
    expect(parseVehicleWorkbook(workbook)).toEqual([
      { internalCode: 'M-101', importCode: 'PROV-1', brand: 'Honda', model: 'Wave', displacement: '110', version: 'S', color: 'Rojo', chassisNumber: 'CH-101', engineNumber: 'MO-101' },
      { internalCode: 'M-102', importCode: '', brand: 'Corven', model: 'Energy', displacement: '', version: '', color: 'Negro', chassisNumber: 'CH-102', engineNumber: 'MO-102' },
    ])
  })

  it('normalizes accents, case and spaces and accepts first CSV sheet', () => {
    const sheet = XLSX.utils.aoa_to_sheet([
      [' CÓDIGO INTERNO ', 'Código Proveedor', 'MARCA', 'Modelo', 'Cilindrada', 'Versión', 'Color', 'Chasis', 'Motor'],
      ['M-201', '', 'Bajaj', 'Rouser', '200', '', 'Azul', 'CH-201', 'MO-201'],
    ])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, sheet, 'Sheet1')
    expect(parseVehicleWorkbook(workbook)[0]?.internalCode).toBe('M-201')
  })

  it.each([
    { rows: [], message: 'El Excel no contiene datos' },
    { rows: [['Marca', 'Modelo']], message: 'Faltan columnas obligatorias: Código interno, Chasis, Motor' },
  ])('rejects invalid workbook: $message', ({ rows, message }) => {
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), 'Motos')
    expect(() => parseVehicleWorkbook(workbook)).toThrow(message)
  })
})
```

- [ ] **Step 2: Run tests and verify red**

Run:

```bash
npm test --workspace=apps/frontend -- --runInBand vehicleBatch.spec.ts
```

Expected: FAIL because `./vehicleBatch` does not exist.

- [ ] **Step 3: Implement minimal Excel contract**

Create `apps/frontend/src/lib/vehicleBatch.ts`:

```ts
import * as XLSX from 'xlsx'

export interface VehicleDraft {
  internalCode: string
  importCode: string
  brand: string
  model: string
  displacement: string
  version: string
  color: string
  chassisNumber: string
  engineNumber: string
}

export const TEMPLATE_HEADERS = [
  'Código interno', 'Código proveedor', 'Marca', 'Modelo', 'Cilindrada',
  'Versión', 'Color', 'Chasis', 'Motor',
]

const FIELD_BY_HEADER: Record<string, keyof VehicleDraft> = {
  'codigo interno': 'internalCode', 'codigo proveedor': 'importCode', marca: 'brand',
  modelo: 'model', cilindrada: 'displacement', version: 'version', color: 'color',
  chasis: 'chassisNumber', motor: 'engineNumber',
}
const REQUIRED_HEADERS = ['Código interno', 'Marca', 'Modelo', 'Chasis', 'Motor']

function normalizeHeader(value: unknown): string {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim().toLowerCase().replace(/\s+/g, ' ')
}

function emptyDraft(): VehicleDraft {
  return { internalCode: '', importCode: '', brand: '', model: '', displacement: '', version: '', color: '', chassisNumber: '', engineNumber: '' }
}

export function createVehicleTemplateWorkbook(): XLSX.WorkBook {
  const example = ['EJEMPLO-NO-IMPORTAR', 'ART-123', 'Honda', 'Wave', 110, 'S', 'Rojo', 'CHASIS-123', 'MOTOR-123']
  const sheet = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, example])
  sheet['!cols'] = TEMPLATE_HEADERS.map(header => ({ wch: Math.max(header.length + 2, 16) }))
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Motos')
  return workbook
}

export function parseVehicleWorkbook(workbook: XLSX.WorkBook): VehicleDraft[] {
  const sheetName = workbook.SheetNames.includes('Motos') ? 'Motos' : workbook.SheetNames[0]
  if (!sheetName) throw new Error('El Excel no contiene datos')
  const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], { header: 1, defval: '' })
  if (rows.length === 0 || rows[0].every(value => String(value).trim() === '')) throw new Error('El Excel no contiene datos')
  const headers = rows[0].map(normalizeHeader)
  const missing = REQUIRED_HEADERS.filter(header => !headers.includes(normalizeHeader(header)))
  if (missing.length) throw new Error(`Faltan columnas obligatorias: ${missing.join(', ')}`)
  const drafts = rows.slice(1).flatMap(row => {
    if (row.every(value => String(value ?? '').trim() === '')) return []
    const draft = emptyDraft()
    headers.forEach((header, index) => {
      const field = FIELD_BY_HEADER[header]
      if (field) draft[field] = String(row[index] ?? '').trim()
    })
    return draft.internalCode.toUpperCase() === 'EJEMPLO-NO-IMPORTAR' ? [] : [draft]
  })
  if (!drafts.length) throw new Error('El Excel no contiene motos para importar')
  return drafts
}
```

- [ ] **Step 4: Verify parser and build**

Run:

```bash
npm test --workspace=apps/frontend -- --runInBand vehicleBatch.spec.ts
npm run build --workspace=apps/frontend
```

Expected: parser suite PASS; TypeScript/Vite build exits 0.

- [ ] **Step 5: Commit parser and template**

```bash
git add apps/frontend/package.json apps/frontend/jest.config.cjs apps/frontend/src/lib/vehicleBatch.ts apps/frontend/src/lib/vehicleBatch.spec.ts
git commit -m "feat(stock): add vehicle Excel parser"
```

---

### Task 2: Validación común e integración del modal

**Files:**
- Modify: `apps/frontend/src/lib/vehicleBatch.spec.ts`
- Modify: `apps/frontend/src/lib/vehicleBatch.ts`
- Modify: `apps/frontend/src/components/vehicles/RemitoImportModal.tsx`
- Modify: `apps/frontend/src/pages/VehiclesPage.tsx`

**Interfaces:**
- Consumes: contratos de Task 1, `POST /vehicles/parse-remito` y callback existente hacia `POST /vehicles/bulk`.
- Produces: `VehicleBatchDefaults`, `VehicleImportItem`, `blankVehicleDraft()`, `validateVehicleDrafts()`, `toVehicleImportItems()` y UI unificada.

- [ ] **Step 1: Write failing validation and payload tests**

Append imports and tests to `vehicleBatch.spec.ts`:

```ts
import { blankVehicleDraft, toVehicleImportItems, validateVehicleDrafts } from './vehicleBatch'

describe('vehicle batch review', () => {
  const valid = { internalCode: ' m-301 ', importCode: ' ART-301 ', brand: ' Honda ', model: ' Wave ', displacement: '110', version: '', color: ' Rojo ', chassisNumber: ' CH-301 ', engineNumber: ' MO-301 ' }

  it('reports row fields, invalid displacement and duplicate codes', () => {
    expect(validateVehicleDrafts([
      { ...blankVehicleDraft(), internalCode: 'M-1', brand: 'Honda', model: 'Wave', displacement: '-1' },
      { ...blankVehicleDraft(), internalCode: 'm-1', brand: 'Corven', model: 'Energy', chassisNumber: 'CH-2', engineNumber: 'MO-2' },
    ])).toEqual([
      'Fila 2: completá Chasis, Motor',
      'Fila 2: Cilindrada debe ser un número no negativo',
      'Código interno repetido en las filas 2 y 3: M-1',
    ])
  })

  it('normalizes reviewed rows into existing bulk payload', () => {
    expect(toVehicleImportItems([valid], { remitoNumber: ' R-55 ', ingresoTipo: 'blanco' })).toEqual([{
      type: 'moto', internalCode: 'M-301', importCode: 'ART-301', brand: 'Honda', model: 'Wave',
      displacement: 110, version: null, color: 'Rojo', chassisNumber: 'CH-301', engineNumber: 'MO-301',
      remitoNumber: 'R-55', ingresoTipo: 'blanco', costPrice: '0', sellPrice: '0', status: 'disponible',
    }])
  })
})
```

- [ ] **Step 2: Run tests and verify red**

Run:

```bash
npm test --workspace=apps/frontend -- --runInBand vehicleBatch.spec.ts
```

Expected: FAIL because three batch helpers are not exported.

- [ ] **Step 3: Implement shared validation and transformation**

Add to `vehicleBatch.ts` and replace `emptyDraft()` usages with exported `blankVehicleDraft()`:

```ts
export interface VehicleBatchDefaults {
  remitoNumber: string
  ingresoTipo: '' | 'blanco' | 'negro' | 'mixto'
}

export interface VehicleImportItem {
  type: 'moto'; internalCode: string; importCode: string | null; brand: string; model: string
  displacement: number | null; version: string | null; color: string | null
  chassisNumber: string; engineNumber: string; remitoNumber: string | null
  ingresoTipo?: 'blanco' | 'negro' | 'mixto'; costPrice: '0'; sellPrice: '0'; status: 'disponible'
}

export function blankVehicleDraft(): VehicleDraft {
  return { internalCode: '', importCode: '', brand: '', model: '', displacement: '', version: '', color: '', chassisNumber: '', engineNumber: '' }
}

export function validateVehicleDrafts(rows: VehicleDraft[]): string[] {
  if (!rows.length) return ['Agregá al menos una moto']
  const errors: string[] = []
  const firstRowByCode = new Map<string, number>()
  rows.forEach((row, index) => {
    const rowNumber = index + 2
    const missing = [['Código interno', row.internalCode], ['Marca', row.brand], ['Modelo', row.model], ['Chasis', row.chassisNumber], ['Motor', row.engineNumber]]
      .filter(([, value]) => !value.trim()).map(([label]) => label)
    if (missing.length) errors.push(`Fila ${rowNumber}: completá ${missing.join(', ')}`)
    if (row.displacement.trim() && (!Number.isFinite(Number(row.displacement)) || Number(row.displacement) < 0)) errors.push(`Fila ${rowNumber}: Cilindrada debe ser un número no negativo`)
    const code = row.internalCode.trim().toUpperCase()
    if (code) {
      const first = firstRowByCode.get(code)
      if (first !== undefined) errors.push(`Código interno repetido en las filas ${first} y ${rowNumber}: ${code}`)
      else firstRowByCode.set(code, rowNumber)
    }
  })
  return errors
}

export function toVehicleImportItems(rows: VehicleDraft[], defaults: VehicleBatchDefaults): VehicleImportItem[] {
  return rows.map(row => ({
    type: 'moto', internalCode: row.internalCode.trim().toUpperCase(), importCode: row.importCode.trim() || null,
    brand: row.brand.trim(), model: row.model.trim(), displacement: row.displacement.trim() ? Number(row.displacement) : null,
    version: row.version.trim() || null, color: row.color.trim() || null,
    chassisNumber: row.chassisNumber.trim(), engineNumber: row.engineNumber.trim(), remitoNumber: defaults.remitoNumber.trim() || null,
    ...(defaults.ingresoTipo ? { ingresoTipo: defaults.ingresoTipo } : {}),
    costPrice: '0', sellPrice: '0', status: 'disponible',
  }))
}
```

- [ ] **Step 4: Verify unit tests green**

Run:

```bash
npm test --workspace=apps/frontend -- --runInBand vehicleBatch.spec.ts
```

Expected: all `vehicleBatch` tests PASS.

- [ ] **Step 5: Integrate Excel and shared validation into modal**

In `RemitoImportModal.tsx`:

1. Add `import * as XLSX from 'xlsx'` and import `VehicleDraft`, `blankVehicleDraft`, `createVehicleTemplateWorkbook`, `parseVehicleWorkbook`, `validateVehicleDrafts` and `toVehicleImportItems` from `../../lib/vehicleBatch`.
2. Replace local draft/item interfaces, `blankRow`, inline validation and inline payload mapping with those imports.
3. Keep `step: 'upload' | 'review'`; add separate hidden inputs for remito and Excel.
4. Preserve remito parsing, adapting returned items to `VehicleDraft`.
5. Add handlers:

```tsx
const excelInputRef = useRef<HTMLInputElement>(null)

function downloadExcelTemplate() {
  XLSX.writeFile(createVehicleTemplateWorkbook(), 'plantilla-carga-motos.xlsx')
}

async function importExcel(file: File) {
  setError('')
  try {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
    setRows(parseVehicleWorkbook(workbook))
    setStep('review')
  } catch (error) {
    setError(error instanceof Error ? error.message : 'No se pudo leer el Excel')
  } finally {
    if (excelInputRef.current) excelInputRef.current.value = ''
  }
}

function handleImport() {
  const errors = validateVehicleDrafts(rows)
  if (errors.length) {
    setError(errors.join('\n'))
    return
  }
  onImport(toVehicleImportItems(rows, shared))
}
```

6. Title upload step `Carga masiva de motos`.
7. Render actions `Analizar remito`, `Seleccionar Excel`, `Descargar plantilla Excel`, `Cargar manualmente`.
8. Excel input uses `accept=".xlsx,.xls,.csv"`; remito keeps `accept="image/*,application/pdf"`.
9. Errors use `whiteSpace: 'pre-line'`.
10. Preserve review table, add/remove rows, common remito/ingreso, pending state and callback.

- [ ] **Step 6: Make page copy match behavior**

In `VehiclesPage.tsx`, use:

```tsx
<button onClick={() => setModal('remito')} style={{ ...btnSecondary, fontSize: '14px' }}>
  📄 Carga masiva
</button>
```

Replace help sentence with:

```tsx
<span>Cargá varias motos desde un <strong>remito, una plantilla Excel o manualmente</strong></span>
```

- [ ] **Step 7: Run full automated verification**

Run:

```bash
npm test --workspace=apps/frontend -- --runInBand
npm run build --workspace=apps/frontend
npm run lint --workspace=apps/frontend
npm test --workspace=apps/backend -- --runInBand
git diff --check
```

Expected: frontend tests PASS; build exits 0; lint exits 0; backend suite PASS; diff check has no output.

- [ ] **Step 8: Verify acceptance flow in browser**

Run `npm run dev:frontend`, sign in as administrator, then verify:

1. `Carga masiva` opens all source actions.
2. Downloaded template contains `Motos`, nine headers and ignored example.
3. Replacing example with two motos and uploading shows two editable rows.
4. Multi-moto PDF/image still shows every detected row.
5. Manual mode allows several rows.
6. Duplicate/incomplete rows do not call bulk endpoint and show row errors.
7. Valid two-row lot makes one `POST /vehicles/bulk` and closes after success.
8. Backend conflict keeps modal open and existing mutation toast displays API error.

- [ ] **Step 9: Commit unified UI**

```bash
git add apps/frontend/src/lib/vehicleBatch.ts apps/frontend/src/lib/vehicleBatch.spec.ts apps/frontend/src/components/vehicles/RemitoImportModal.tsx apps/frontend/src/pages/VehiclesPage.tsx
git commit -m "feat(stock): unify bulk vehicle intake"
```

## Final Verification Gate

Run from repository root:

```bash
npm test --workspace=apps/frontend -- --runInBand
npm run build --workspace=apps/frontend
npm run lint --workspace=apps/frontend
npm test --workspace=apps/backend -- --runInBand
git diff --check
git status --short
```

Confirm no production/test change remains uncommitted. Preserve pre-existing untracked `concesionaria-management-system-readme/`.
