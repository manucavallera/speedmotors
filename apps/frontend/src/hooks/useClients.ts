import { toast } from '../lib/toast'
// @file: useClients.ts | Query y mutations para ClientsPage. AccountModal es self-contained.
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, apiError } from '../lib/api'
import { type Client, type PaginatedResponse } from '../types/api.types'
import { type ClientForm } from '../types/clients.types'

export type ClientType = 'concesionaria' | 'guarderia'

export function useClients() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [hasDebt, setHasDebt] = useState(false)
  // Cartera activa: SpeedMotors (concesionaria) o Marina (guardería). Filtra y define el tipo de los nuevos.
  const [clientType, setClientType] = useState<ClientType>('concesionaria')
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Client | null>(null)
  const [accountClient, setAccountClient] = useState<Client | null>(null)

  function handleSetSearch(v: string) { setSearch(v); setPage(1) }
  function handleSetHasDebt(v: boolean) { setHasDebt(v); setPage(1) }
  function handleSetClientType(v: ClientType) { setClientType(v); setPage(1) }

  const { data: clientsData, isLoading } = useQuery<PaginatedResponse<Client>>({
    queryKey: ['clients', { search, page, hasDebt, clientType }],
    queryFn: () => api.get('/clients', { params: { search: search || undefined, page, limit: 50, hasDebt: hasDebt || undefined, type: clientType } }).then(r => r.data),
    placeholderData: prev => prev,
  })
  const clients = clientsData?.items ?? []
  const total = clientsData?.total ?? 0
  const pages = clientsData?.pages ?? 1

  const create = useMutation({
    // Los nuevos entran en la cartera activa (SpeedMotors o Marina)
    mutationFn: (data: ClientForm) => api.post('/clients', { ...data, type: clientType }),
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
    hasDebt, setHasDebt: handleSetHasDebt,
    clientType, setClientType: handleSetClientType,
    total, page, pages, setPage,
    modal, setModal, editing, openCreate, openEdit,
    accountClient, setAccountClient,
    create, update, remove,
  }
}
