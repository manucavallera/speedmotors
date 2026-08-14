import { creditMatchesDebtType, creditPageMeta, normalizeCreditSearch } from './credit-list'

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

  it.each([
    [0, 1, 50, { total: 0, page: 1, pages: 0, offset: 0 }],
    [120, 1, 50, { total: 120, page: 1, pages: 3, offset: 0 }],
    [120, 3, 50, { total: 120, page: 3, pages: 3, offset: 100 }],
    [120, 4, 50, { total: 120, page: 4, pages: 3, offset: 150 }],
  ])('builds stable page metadata', (total, page, limit, expected) => {
    expect(creditPageMeta(total, page, limit)).toEqual(expected)
  })
})
