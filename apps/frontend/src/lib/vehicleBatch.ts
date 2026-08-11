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

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function emptyDraft(): VehicleDraft {
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

  const drafts = rows.slice(1).flatMap(row => {
    if (row.every(value => String(value ?? '').trim() === '')) return []

    const draft = emptyDraft()
    headers.forEach((header, index) => {
      const field = FIELD_BY_HEADER[header]
      if (field) draft[field] = String(row[index] ?? '').trim()
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
