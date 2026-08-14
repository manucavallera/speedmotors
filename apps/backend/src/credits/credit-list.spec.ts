import { creditMatchesDebtType, normalizeCreditSearch } from './credit-list'

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
})
