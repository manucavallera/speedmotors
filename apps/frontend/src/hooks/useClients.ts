import { toast } from '../lib/toast'
// @file: useClients.ts | Query y mutations para ClientsPage. AccountModal es self-contained.
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, apiError } from '../lib/api'
import { type Client, type PaginatedResponse } from '../types/api.types'
import { type ClientForm } from '../types/clients.types'

export function useClients() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Client | null>(null)
  const [accountClient, setAccountClient] = useState<Client | null>(null)

  function handleSetSearch(v: string) { setSearch(v); setPage(1) }

  const { data: clientsData, isLoading } = useQuery<PaginatedResponse<Client>>({
    queryKey: ['clients', { search, page }],
    queryFn: () => api.get('/clients', { params: { search: search || undefined, page, limit: 50 } }).then(r => r.data),
    placeholderData: prev => prev,
  })
  const clients = clientsData?.items ?? []
  const total = clientsData?.total ?? 0
  const pages = clientsData?.pages ?? 1

  const create = useMutation({
    mutationFn: (data: ClientForm) => api.post('/clients', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); setModal(null) },
    onError: (err: any) => toast.error(apiError(err)),
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ClientForm }) => api.put(`/clients/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); setModal(null) },
    onError: (err: any) => toast.error(apiError(err)),
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/clients/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
    onError: (err: any) => toast.error(apiError(err)),
  })

  function openCreate() { setEditing(null); setModal('create') }
  function openEdit(c: Client) { setEditing(c); setModal('edit') }

  return {
    clients, isLoading,
    search, setSearch: handleSetSearch,
    total, page, pages, setPage,
    modal, setModal, editing, openCreate, openEdit,
    accountClient, setAccountClient,
    create, update, remove,
  }
}
