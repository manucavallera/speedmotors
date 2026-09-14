import { buildDebtorReportRow } from './debtors-report'

describe('reporte de deudores', () => {
  it('transforma una financiación fija en una fila con sus datos de cobro', () => {
    expect(buildDebtorReportRow({
      clientId: 7,
      creditId: 21,
      clientName: 'María López',
      phone: '0343 555-0101',
      dni: '30111222',
      cuit: null,
      creditType: 'cuotas_simples',
      currency: 'pesos',
      balance: 250000,
      lastPaymentAmount: '125000',
      lastPaymentDate: '2026-09-10T00:00:00.000Z',
      paidInstallments: 3,
      installmentsCount: 12,
    })).toEqual({
      clientId: 7,
      creditId: 21,
      clientName: 'María López',
      phone: '0343 555-0101',
      dniOrCuit: '30111222',
      financingType: 'Fija',
      currency: 'Pesos',
      balance: 250000,
      lastPaymentAmount: 125000,
      lastPaymentDate: '2026-09-10T00:00:00.000Z',
      installmentProgress: '3 de 12',
    })
  })

  it('deja vacíos los datos opcionales de una financiación libre sin pagos', () => {
    expect(buildDebtorReportRow({
      clientId: 8,
      creditId: 22,
      clientName: 'Juan Pérez',
      phone: null,
      dni: null,
      cuit: '20-33333333-9',
      creditType: 'saldo_compuesto',
      currency: 'usd',
      balance: 1000.5,
      lastPaymentAmount: null,
      lastPaymentDate: null,
      paidInstallments: null,
      installmentsCount: null,
    })).toEqual(expect.objectContaining({
      dniOrCuit: '20-33333333-9',
      financingType: 'Libre',
      currency: 'USD',
      balance: 1000.5,
      lastPaymentAmount: null,
      lastPaymentDate: null,
      installmentProgress: '',
    }))
  })
})
