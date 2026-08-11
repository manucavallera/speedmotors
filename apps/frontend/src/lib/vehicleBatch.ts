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

export interface VehicleBatchDefaults {
  remitoNumber: string
  ingresoTipo: '' | 'blanco' | 'negro' | 'mixto'
}

export type ParsedRemitoItem = Partial<Omit<VehicleDraft, 'displacement'>> & {
  displacement?: number | null
}

export interface VehicleImportItem {
  type: 'moto'
  internalCode: string
  importCode: string | null
  brand: string
  model: string
  displacement: number | null
  version: string | null
  color: string | null
  chassisNumber: string
  engineNumber: string
  remitoNumber: string | null
  ingresoTipo?: 'blanco' | 'negro' | 'mixto'
  costPrice: '0'
  sellPrice: '0'
  status: 'disponible'
}

export const TEMPLATE_HEADERS = [
  'Código interno',
  'Código proveedor',
  'Marca',
  'Modelo',
  'Cilindrada',
  'Versión',
  'Color',
  'Chasis',
  'Motor',
]

const FIELD_BY_HEADER: Record<string, keyof VehicleDraft> = {
  'codigo interno': 'internalCode',
  'codigo proveedor': 'importCode',
  marca: 'brand',
  modelo: 'model',
  cilindrada: 'displacement',
  version: 'version',
  color: 'color',
  chasis: 'chassisNumber',
  motor: 'engineNumber',
}

const REQUIRED_HEADERS = ['Código interno', 'Marca', 'Modelo', 'Chasis', 'Motor']
const IDENTIFIER_LABEL_BY_FIELD: Partial<Record<keyof VehicleDraft, string>> = {
  internalCode: 'Código interno',
  importCode: 'Código proveedor',
  chassisNumber: 'Chasis',
  engineNumber: 'Motor',
}

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

export function blankVehicleDraft(): VehicleDraft {
  return {
    internalCode: '',
    importCode: '',
    brand: '',
    model: '',
    displacement: '',
    version: '',
    color: '',
    chassisNumber: '',
    engineNumber: '',
  }
}

export function adaptParsedRemitoItems(items: ParsedRemitoItem[]): VehicleDraft[] {
  return items.map(item => ({
    ...blankVehicleDraft(),
    importCode: item.importCode ?? '',
    brand: item.brand ?? '',
    model: item.model ?? '',
    displacement: item.displacement == null ? '' : String(item.displacement),
    version: item.version ?? '',
    color: item.color ?? '',
    engineNumber: item.engineNumber ?? '',
    chassisNumber: item.chassisNumber ?? '',
  }))
}

export function createVehicleTemplateWorkbook(): XLSX.WorkBook {
  const example = [
    'EJEMPLO-NO-IMPORTAR',
    'ART-123',
    'Honda',
    'Wave',
    110,
    'S',
    'Rojo',
    'CHASIS-123',
    'MOTOR-123',
  ]
  const sheet = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, example])
  sheet['!cols'] = TEMPLATE_HEADERS.map(header => ({
    wch: Math.max(header.length + 2, 16),
  }))
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Motos')
  return workbook
}

export function readVehicleWorkbook(data: ArrayBuffer | Uint8Array): XLSX.WorkBook {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data)
  const isXlsx = bytes[0] === 0x50 && bytes[1] === 0x4b
  const isXls = bytes[0] === 0xd0 && bytes[1] === 0xcf

  if (isXlsx || isXls) {
    return XLSX.read(bytes, { type: 'array', raw: true })
  }

  const csv = new TextDecoder('utf-8').decode(bytes).replace(/^\uFEFF/, '')
  return XLSX.read(csv, { type: 'string', raw: true })
}

export function parseVehicleWorkbook(workbook: XLSX.WorkBook): VehicleDraft[] {
  const sheetName = workbook.SheetNames.includes('Motos')
    ? 'Motos'
    : workbook.SheetNames[0]

  if (!sheetName) throw new Error('El Excel no contiene datos')

  const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
    header: 1,
    defval: '',
  })

  if (rows.length === 0 || rows[0].every(value => String(value).trim() === '')) {
    throw new Error('El Excel no contiene datos')
  }

  const headers = rows[0].map(normalizeHeader)
  const missing = REQUIRED_HEADERS.filter(header => (
    !headers.includes(normalizeHeader(header))
  ))

  if (missing.length > 0) {
    throw new Error(`Faltan columnas obligatorias: ${missing.join(', ')}`)
  }

  const drafts = rows.slice(1).flatMap((row, rowIndex) => {
    if (row.every(value => String(value ?? '').trim() === '')) return []

    const draft = blankVehicleDraft()
    headers.forEach((header, index) => {
      const field = FIELD_BY_HEADER[header]
      if (!field) return

      const value = row[index] ?? ''
      const identifierLabel = IDENTIFIER_LABEL_BY_FIELD[field]
      if (identifierLabel && typeof value === 'number') {
        throw new Error(`Fila ${rowIndex + 2}: ${identifierLabel} debe estar guardado como texto`)
      }

      draft[field] = String(value).trim()
    })

    return draft.internalCode.toUpperCase() === 'EJEMPLO-NO-IMPORTAR'
      ? []
      : [draft]
  })

  if (drafts.length === 0) {
    throw new Error('El Excel no contiene motos para importar')
  }

  return drafts
}

export function validateVehicleDrafts(rows: VehicleDraft[]): string[] {
  if (rows.length === 0) return ['Agregá al menos una moto']

  const errors: string[] = []
  const firstRowByCode = new Map<string, number>()

  rows.forEach((row, index) => {
    const rowNumber = index + 2
    const missing = [
      ['Código interno', row.internalCode],
      ['Marca', row.brand],
      ['Modelo', row.model],
      ['Chasis', row.chassisNumber],
      ['Motor', row.engineNumber],
    ]
      .filter(([, value]) => !value.trim())
      .map(([label]) => label)

    if (missing.length > 0) {
      errors.push(`Fila ${rowNumber}: completá ${missing.join(', ')}`)
    }

    if (
      row.displacement.trim()
      && (!Number.isInteger(Number(row.displacement)) || Number(row.displacement) < 0)
    ) {
      errors.push(`Fila ${rowNumber}: Cilindrada debe ser un número entero no negativo`)
    }

    const code = row.internalCode.trim().toUpperCase()
    if (code) {
      const firstRow = firstRowByCode.get(code)
      if (firstRow !== undefined) {
        errors.push(`Código interno repetido en las filas ${firstRow} y ${rowNumber}: ${code}`)
      } else {
        firstRowByCode.set(code, rowNumber)
      }
    }
  })

  return errors
}

export function toVehicleImportItems(
  rows: VehicleDraft[],
  defaults: VehicleBatchDefaults,
): VehicleImportItem[] {
  return rows.map(row => ({
    type: 'moto',
    internalCode: row.internalCode.trim().toUpperCase(),
    importCode: row.importCode.trim() || null,
    brand: row.brand.trim(),
    model: row.model.trim(),
    displacement: row.displacement.trim() ? Number(row.displacement) : null,
    version: row.version.trim() || null,
    color: row.color.trim() || null,
    chassisNumber: row.chassisNumber.trim(),
    engineNumber: row.engineNumber.trim(),
    remitoNumber: defaults.remitoNumber.trim() || null,
    ...(defaults.ingresoTipo ? { ingresoTipo: defaults.ingresoTipo } : {}),
    costPrice: '0',
    sellPrice: '0',
    status: 'disponible',
  }))
}
