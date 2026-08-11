import { describe, expect, it } from '@jest/globals'
import * as XLSX from 'xlsx'
import {
  TEMPLATE_HEADERS,
  createVehicleTemplateWorkbook,
  parseVehicleWorkbook,
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
