import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, apiError } from '../lib/api'
import { toast } from '../lib/toast'
import { creditListParams, creditSearchSettled, type CreditStatusFilter, type DebtTypeFilter } from '../lib/creditFilters'
import { useDebouncedValue } from './useDebouncedValue'

export interface Credit {
  id: number
  clientId: number
  client?: { id: number; name: string }
  creditType: 'saldo_compuesto' | 'cuotas_simples'
  currency: 'pesos' | 'usd'
  originalAmount: string
  interestRate: string
  startDate: string
  firstDueDate?: string | null
  installmentsCount?: number | null
  status: 'activo' | 'pagado' | 'cancelado'
  notes?: string | null
  balance: number
}

export interface CreditPayment { id: number; creditId: number; amount: string; paymentDate: string; notes?: string | null }
export interface CreditCapitalAddition { id: number; creditId: number; amount: string; effectiveDate: string; notes?: string | null }
export interface CreditInterestCharge { id: number; creditId: number; chargeDate: string; balanceBefore: string; amount: string }
export interface CreditInstallment {
  id: number
  creditId: number
  number: number
  dueDate: string
  amount: string
  principalAmount: string | null
  surcharge: string
  paidAt: string | null
  paidAmount: string | null
}

export interface CreditDetail extends Credit {
  payments: CreditPayment[]
  capitalAdditions?: CreditCapitalAddition[]
  charges: CreditInterestCharge[]
  installments: CreditInstallment[]
}

export interface PaginatedCreditsResponse {
  items: Credit[]
  total: number
  page: number
  pages: number
}

export function useCredits() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Credit | null>(null)
  const [detailId, setDetailId] = useState<number | null>(null)
  const [statusFilter, setStatusFilterState] = useState<CreditStatusFilter>('todos')
  const [debtTypeFilter, setDebtTypeFilterState] = useState<DebtTypeFilter>('todos')
  const [search, setSearchState] = useState('')
  const deferredSearch = useDebouncedValue(search, 300)
  const [page, setPage] = useState(1)
  const limit = 50

  const setStatusFilter = (status: CreditStatusFilter) => { setStatusFilterState(status); setPage(1) }
  const setDebtTypeFilter = (debtType: DebtTypeFilter) => { setDebtTypeFilterState(debtType); setPage(1) }
  const setSearch = (value: string) => { setSearchState(value); setPage(1) }

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery<PaginatedCreditsResponse>({
    queryKey: ['credits', { statusFilter, debtTypeFilter, search: deferredSearch.trim(), page, limit }],
    queryFn: () => api.get('/credits', {
      params: creditListParams({ status: statusFilter, debtType: debtTypeFilter, search: deferredSearch, page, limit }),
    }).then(r => r.data),
    enabled: creditSearchSettled(search, deferredSearch),
    placeholderData: previous => previous,
  })
  const credits = data?.items ?? []
  const total = data?.total ?? 0
  const pages = data?.pages ?? 0

  useEffect(() => {
    if (total > 0 && pages > 0 && page > pages) setPage(pages)
  }, [total, pages, page])

  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.get('/clients', { params: { limit: 500, type: 'concesionaria' } }).then(r => r.data),
  })
  const clients = clientsData?.items ?? []

  const { data: detail, isLoading: detailLoading } = useQuery<CreditDetail>({
    queryKey: ['credit', detailId],
    queryFn: () => api.get(`/credits/${detailId}`).then(r => r.data),
    enabled: !!detailId,
  })

  const create = useMutation({
    mutationFn: (data: any) => api.post('/credits', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['credits'] }); setModal(false); toast.success('Crédito creado') },
    onError: (e: any) => toast.error(apiError(e)),
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.put(`/credits/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['credits'] }); qc.invalidateQueries({ queryKey: ['credit'] }); setEditing(null); toast.success('Crédito actualizado') },
    onError: (e: any) => toast.error(apiError(e)),
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/credits/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['credits'] }); setDetailId(null); toast.success('Crédito eliminado') },
    onError: (e: any) => toast.error(apiError(e)),
  })

  const addPayment = useMutation({
    mutationFn: ({ creditId, data }: { creditId: number; data: any }) => api.post(`/credits/${creditId}/payments`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['credits'] }); qc.invalidateQueries({ queryKey: ['credit'] }); toast.success('Pago registrado') },
    onError: (e: any) => toast.error(apiError(e)),
  })

  const addCapital = useMutation({
    mutationFn: ({ creditId, data }: { creditId: number; data: { amount: number; effectiveDate: string; notes?: string } }) => api.post(`/credits/${creditId}/capital`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['credits'] }); qc.invalidateQueries({ queryKey: ['credit'] }); toast.success('Capital agregado a la deuda') },
    onError: (e: any) => toast.error(apiError(e)),
  })

  const removePayment = useMutation({
    mutationFn: (paymentId: number) => api.delete(`/credits/payments/${paymentId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['credits'] }); qc.invalidateQueries({ queryKey: ['credit'] }); toast.success('Pago eliminado') },
    onError: (e: any) => toast.error(apiError(e)),
  })

  const payInstallment = useMutation({
    mutationFn: ({ installmentId, paymentDate }: { installmentId: number; paymentDate: string }) =>
      api.post(`/credits/installments/${installmentId}/pay`, { paymentDate }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['credits'] }); qc.invalidateQueries({ queryKey: ['credit'] }); toast.success('Cuota marcada como pagada') },
    onError: (e: any) => toast.error(apiError(e)),
  })

  const unpayInstallment = useMutation({
    mutationFn: (installmentId: number) => api.post(`/credits/installments/${installmentId}/unpay`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['credits'] }); qc.invalidateQueries({ queryKey: ['credit'] }); toast.success('Cuota desmarcada') },
    onError: (e: any) => toast.error(apiError(e)),
  })

  return {
    credits, clients, isLoading, isFetching, isError, error, refetch,
    modal, setModal,
    editing, setEditing,
    detailId, setDetailId, detail, detailLoading,
    statusFilter, setStatusFilter,
    search, setSearch,
    debtTypeFilter, setDebtTypeFilter,
    page, setPage, total, pages,
    create, update, remove, addPayment, addCapital, removePayment,
    payInstallment, unpayInstallment,
  }
}
