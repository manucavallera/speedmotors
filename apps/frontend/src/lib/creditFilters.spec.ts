import type { Credit } from '../hooks/useCredits'
import { creditDebtLabel, creditListParams } from './creditFilters'

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
