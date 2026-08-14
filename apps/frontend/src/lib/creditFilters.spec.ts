import type { Credit } from '../hooks/useCredits'
import { creditDebtLabel, creditListParams, creditSearchSettled } from './creditFilters'

describe('credit list params', () => {
  it('omits all-filter values and trims search', () => {
    expect(creditListParams({ status: 'todos', debtType: 'todos', search: '  ', page: 1, limit: 50 }))
      .toEqual({ page: 1, limit: 50 })
  })

  it('combines status, type, search and pagination', () => {
    expect(creditListParams({ status: 'activo', debtType: 'libre', search: ' Gómez ', page: 3, limit: 50 }))
      .toEqual({ status: 'activo', debtType: 'libre', search: 'Gómez', page: 3, limit: 50 })
  })

  it('waits until the debounced search matches the entered text', () => {
    expect(creditSearchSettled('Gó', '')).toBe(false)
    expect(creditSearchSettled(' Gómez ', 'Gómez')).toBe(true)
  })

  it.each([
    ['cuotas_simples', '5', 'Financiación fija'],
    ['saldo_compuesto', '5', 'Cuota libre'],
    ['saldo_compuesto', '0', 'Cuenta corriente'],
  ])('labels debt types', (creditType, interestRate, expected) => {
    expect(creditDebtLabel({ creditType, interestRate } as Credit)).toBe(expected)
  })
})
