import { buildDebtorsWorksheetRows } from './debtorsExport'

describe('exportación de deudores', () => {
  it('genera columnas por financiación y agrega el total de deuda', () => {
    expect(buildDebtorsWorksheetRows([
      {
        clientName: 'María López', phone: '0343', dniOrCuit: '30111222', financingType: 'Fija', currency: 'Pesos',
        balance: 250000, lastPaymentAmount: 125000, lastPaymentDate: '2026-09-10T00:00:00.000Z', installmentProgress: '3 de 12',
      },
      {
        clientName: 'Juan Pérez', phone: null, dniOrCuit: '20-33333333-9', financingType: 'Libre', currency: 'USD',
        balance: 1000.5, lastPaymentAmount: null, lastPaymentDate: null, installmentProgress: '',
      },
    ])).toEqual([
      ['Cliente', 'DNI / CUIT', 'Teléfono', 'Tipo de financiación', 'Moneda', 'Saldo', 'Última entrega', 'Fecha última entrega', 'Cuotas'],
      ['María López', '30111222', '0343', 'Fija', 'Pesos', 250000, 125000, '10/09/2026', '3 de 12'],
      ['Juan Pérez', '20-33333333-9', '', 'Libre', 'USD', 1000.5, '', '', ''],
      [],
      ['TOTAL DEUDA PESOS', '', '', '', '', 250000, '', '', ''],
      ['TOTAL DEUDA USD', '', '', '', '', 1000.5, '', '', ''],
    ])
  })
})
