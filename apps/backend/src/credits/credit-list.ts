export type DebtTypeFilter = 'fija' | 'libre' | 'cuenta_corriente'

interface CreditDebtFields {
  creditType: 'saldo_compuesto' | 'cuotas_simples'
  interestRate: string
}

export function normalizeCreditSearch(value?: string): string | undefined {
  return value
    ?.trim()
    .toLocaleLowerCase('es-AR')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '') || undefined
}

export function creditMatchesDebtType(
  credit: CreditDebtFields,
  debtType: DebtTypeFilter,
): boolean {
  if (debtType === 'fija') return credit.creditType === 'cuotas_simples'
  if (credit.creditType !== 'saldo_compuesto') return false
  return debtType === 'libre'
    ? Number(credit.interestRate) > 0
    : Number(credit.interestRate) === 0
}
