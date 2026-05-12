import { toast } from '../lib/toast'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, apiError } from '../lib/api'
import { type Sale, type Client, type Vehicle, type PaginatedResponse } from '../types/api.types'
import { type CreateSaleData } from '../types/sales.types'

export function useSales() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [detail, setDetail] = useState<Sale | null>(null)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [invoiceFilter, setInvoiceFilter] = useState('')
  const [page, setPage] = useState(1)

  function handleSetSearch(v: string) { setSearch(v); setPage(1) }
  function handleSetDateFrom(v: string) { setDateFrom(v); setPage(1) }
  function handleSetDateTo(v: string) { setDateTo(v); setPage(1) }
  function handleSetInvoiceFilter(v: string) { setInvoiceFilter(v); setPage(1) }

  const { data: salesData, isLoading } = useQuery<PaginatedResponse<Sale>>({
    queryKey: ['sales', { search, dateFrom, dateTo, invoiceType: invoiceFilter, page }],
    queryFn: () => api.get('/sales', {
      params: {
        search: search || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        invoiceType: invoiceFilter || undefined,
        page,
        limit: 50,
      },
    }).then(r => r.data),
    placeholderData: prev => prev,
  })
  const sales = salesData?.items ?? []
  const total = salesData?.total ?? 0
  const pages = salesData?.pages ?? 1

  const { data: clientsData } = useQuery<PaginatedResponse<Client>>({
    queryKey: ['clients'],
    queryFn: () => api.get('/clients').then(r => r.data),
  })
  const clients = clientsData?.items ?? []

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then(r => r.data),
  })
  const products = productsData?.items ?? productsData ?? []

  const { data: vehiclesData } = useQuery<PaginatedResponse<Vehicle>>({
    queryKey: ['vehicles', 'disponible'],
    queryFn: () => api.get('/vehicles', { params: { status: 'disponible' } }).then(r => r.data),
  })
  const vehicles = vehiclesData?.items ?? []

  const create = useMutation({
    mutationFn: (data: CreateSaleData) => api.post('/sales', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sales'] }); setModal(false) },
    onError: (err: any) => toast.error(apiError(err)),
  })

  const cancel = useMutation({
    mutationFn: (id: number) => api.post(`/sales/${id}/cancel`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sales'] }); setDetail(null) },
    onError: (err: any) => toast.error(apiError(err)),
  })

  const updateTransport = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.patch(`/sales/${id}/transport`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sales'] }),
    onError: (err: any) => toast.error(apiError(err)),
  })

  return {
    sales, clients, products, vehicles, filtered: sales, isLoading,
    total, page, pages, setPage,
    modal, setModal,
    detail, setDetail,
    search, setSearch: handleSetSearch,
    dateFrom, setDateFrom: handleSetDateFrom,
    dateTo, setDateTo: handleSetDateTo,
    invoiceFilter, setInvoiceFilter: handleSetInvoiceFilter,
    create, cancel, updateTransport,
  }
}
