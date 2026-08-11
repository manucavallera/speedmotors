import { describe, expect, it } from '@jest/globals'
import * as XLSX from 'xlsx'
import {
  TEMPLATE_HEADERS,
  adaptParsedRemitoItems,
  blankVehicleDraft,
  createVehicleTemplateWorkbook,
  parseVehicleWorkbook,
  readVehicleWorkbook,
  toVehicleImportItems,
  validateVehicleDrafts,
} from './vehicleBatch'

describe('vehicleBatch Excel contract', () => {
  it('generates the Motos template with the documented headers', () => {
    const workbook = createVehicleTemplateWorkbook()
    expect(workbook.SheetNames).toEqual(['Motos'])

    const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets.Motos, {
      header: 1,
      defval: '',
    })

    expect(rows[0]).toEqual(TEMPLATE_HEADERS)
    expect(rows[1]?.[0]).toBe('EJEMPLO-NO-IMPORTAR')
  })

  it('parses multiple motorcycles and ignores blank and example rows', () => {
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
      {
        internalCode: 'M-101',
        importCode: 'PROV-1',
        brand: 'Honda',
        model: 'Wave',
        displacement: '110',
        version: 'S',
        color: 'Rojo',
        chassisNumber: 'CH-101',
        engineNumber: 'MO-101',
      },
      {
        internalCode: 'M-102',
        importCode: '',
        brand: 'Corven',
        model: 'Energy',
        displacement: '',
        version: '',
        color: 'Negro',
        chassisNumber: 'CH-102',
        engineNumber: 'MO-102',
      },
    ])
  })

  it('normalizes accents, case, and spaces and accepts the first CSV-style sheet', () => {
    const sheet = XLSX.utils.aoa_to_sheet([
      [' CÓDIGO INTERNO ', 'Código Proveedor', 'MARCA', 'Modelo', 'Cilindrada', 'Versión', 'Color', 'Chasis', 'Motor'],
      ['M-201', '', 'Bajaj', 'Rouser', '200', '', 'Azul', 'CH-201', 'MO-201'],
    ])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, sheet, 'Sheet1')

    expect(parseVehicleWorkbook(workbook)[0]?.internalCode).toBe('M-201')
  })

  it('preserves leading zeros and long identifiers from real CSV bytes', () => {
    const csv = [
      TEMPLATE_HEADERS.join(','),
      '00123,,Honda,Wave,110,,Rojo,0012345678901234567890,00077',
    ].join('\n')
    const workbook = readVehicleWorkbook(new TextEncoder().encode(csv))

    expect(parseVehicleWorkbook(workbook)[0]).toMatchObject({
      internalCode: '00123',
      chassisNumber: '0012345678901234567890',
      engineNumber: '00077',
    })
  })

  it('reads a Windows-1252 CSV exported by Excel', () => {
    const csv = [
      TEMPLATE_HEADERS.join(','),
      'M-301,,Corven,Energy,110,,Negro,CH-301,MO-301',
    ].join('\n')
    const windows1252 = Uint8Array.from(csv, character => character.charCodeAt(0))

    expect(parseVehicleWorkbook(readVehicleWorkbook(windows1252))[0]?.internalCode).toBe('M-301')
  })

  it('reads a UTF-16LE CSV exported by Excel', () => {
    const csv = `\uFEFF${[
      TEMPLATE_HEADERS.join(','),
      'M-302,,Honda,Wave,110,,Rojo,CH-302,MO-302',
    ].join('\n')}`
    const utf16 = new Uint8Array(csv.length * 2)
    Array.from(csv).forEach((character, index) => {
      const code = character.charCodeAt(0)
      utf16[index * 2] = code & 0xff
      utf16[index * 2 + 1] = code >> 8
    })

    expect(parseVehicleWorkbook(readVehicleWorkbook(utf16))[0]?.internalCode).toBe('M-302')
  })

  it('preserves text identifiers through a real XLSX round trip', () => {
    const source = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(source, XLSX.utils.aoa_to_sheet([
      TEMPLATE_HEADERS,
      ['00123', '', 'Honda', 'Wave', 110, '', 'Rojo', '0012345678901234567890', '00077'],
    ]), 'Motos')
    const bytes = XLSX.write(source, {
      type: 'array',
      bookType: 'xlsx',
    })
    const workbook = readVehicleWorkbook(bytes)

    expect(parseVehicleWorkbook(workbook)[0]).toMatchObject({
      internalCode: '00123',
      chassisNumber: '0012345678901234567890',
      engineNumber: '00077',
    })
  })

  it('rejects numeric identifier cells that may already be corrupted', () => {
    const sheet = XLSX.utils.aoa_to_sheet([
      TEMPLATE_HEADERS,
      [123, '', 'Honda', 'Wave', 110, '', 'Rojo', 'CH-123', 'MO-123'],
    ])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, sheet, 'Motos')

    expect(() => parseVehicleWorkbook(workbook)).toThrow(
      'Fila 2: Código interno debe estar guardado como texto',
    )
  })

  it.each([
    { rows: [], message: 'El Excel no contiene datos' },
    {
      rows: [['Marca', 'Modelo']],
      message: 'Faltan columnas obligatorias: Código interno, Chasis, Motor',
    },
  ])('rejects an invalid workbook: $message', ({ rows, message }) => {
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), 'Motos')

    expect(() => parseVehicleWorkbook(workbook)).toThrow(message)
  })
})

describe('vehicle batch review', () => {
  const valid = {
    internalCode: ' m-301 ',
    importCode: ' ART-301 ',
    brand: ' Honda ',
    model: ' Wave ',
    displacement: '110',
    version: '',
    color: ' Rojo ',
    chassisNumber: ' CH-301 ',
    engineNumber: ' MO-301 ',
  }

  it('adapts every motorcycle returned by a remito into review rows', () => {
    expect(adaptParsedRemitoItems([
      { importCode: 'A-1', brand: 'Honda', model: 'Wave', displacement: 110, chassisNumber: 'CH-1', engineNumber: 'MO-1' },
      { importCode: 'A-2', brand: 'Corven', model: 'Energy', displacement: 125, chassisNumber: 'CH-2', engineNumber: 'MO-2' },
    ])).toEqual([
      { ...blankVehicleDraft(), importCode: 'A-1', brand: 'Honda', model: 'Wave', displacement: '110', chassisNumber: 'CH-1', engineNumber: 'MO-1' },
      { ...blankVehicleDraft(), importCode: 'A-2', brand: 'Corven', model: 'Energy', displacement: '125', chassisNumber: 'CH-2', engineNumber: 'MO-2' },
    ])
  })

  it('rejects an empty reviewed batch', () => {
    expect(validateVehicleDrafts([])).toEqual(['Agregá al menos una moto'])
  })

  it('reports row fields, invalid displacement, and duplicate codes', () => {
    expect(validateVehicleDrafts([
      {
        ...blankVehicleDraft(),
        internalCode: 'M-1',
        brand: 'Honda',
        model: 'Wave',
        displacement: '-1',
      },
      {
        ...blankVehicleDraft(),
        internalCode: 'm-1',
        brand: 'Corven',
        model: 'Energy',
        chassisNumber: 'CH-2',
        engineNumber: 'MO-2',
      },
    ])).toEqual([
      'Fila 2: completá Chasis, Motor',
      'Fila 2: Cilindrada debe ser un número entero no negativo',
      'Código interno repetido en las filas 2 y 3: M-1',
    ])
  })

  it('rejects fractional displacement before the integer-only backend', () => {
    expect(validateVehicleDrafts([{
      ...blankVehicleDraft(),
      internalCode: 'M-2',
      brand: 'Honda',
      model: 'Wave',
      chassisNumber: 'CH-2',
      engineNumber: 'MO-2',
      displacement: '110.5',
    }])).toEqual([
      'Fila 2: Cilindrada debe ser un número entero no negativo',
    ])
  })

  it('normalizes reviewed rows into the existing bulk payload', () => {
    expect(toVehicleImportItems([valid], {
      remitoNumber: ' R-55 ',
      ingresoTipo: 'blanco',
    })).toEqual([{
      type: 'moto',
      internalCode: 'M-301',
      importCode: 'ART-301',
      brand: 'Honda',
      model: 'Wave',
      displacement: 110,
      version: null,
      color: 'Rojo',
      chassisNumber: 'CH-301',
      engineNumber: 'MO-301',
      remitoNumber: 'R-55',
      ingresoTipo: 'blanco',
      costPrice: '0',
      sellPrice: '0',
      status: 'disponible',
    }])
  })
})
