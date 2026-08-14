import type { Credit } from '../hooks/useCredits'

export type CreditStatusFilter = 'todos' | 'activo' | 'pagado' | 'cancelado'
export type DebtTypeFilter = 'todos' | 'fija' | 'libre' | 'cuenta_corriente'

interface CreditListFilters {
  status: CreditStatusFilter
  debtType: DebtTypeFilter
  search: string
  page: number
  limit: number
}

export function creditListParams(filters: CreditListFilters) {
  const search = filters.search.trim()
  return {
    ...(filters.status !== 'todos' ? { status: filters.status } : {}),
    ...(filters.debtType !== 'todos' ? { debtType: filters.debtType } : {}),
    ...(search ? { search } : {}),
    page: filters.page,
    limit: filters.limit,
  }
}

export function creditSearchSettled(search: string, deferredSearch: string): boolean {
  return search.trim() === deferredSearch.trim()
}

export function creditDebtLabel(credit: Pick<Credit, 'creditType' | 'interestRate'>) {
  if (credit.creditType === 'cuotas_simples') return 'Financiación fija'
  return Number(credit.interestRate) > 0 ? 'Cuota libre' : 'Cuenta corriente'
}
