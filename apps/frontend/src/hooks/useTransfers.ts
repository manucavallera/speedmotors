import { toast } from '../lib/toast'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, apiError } from '../lib/api'

export interface Transfer {
  id: number
  transferNumber: string | null
  vehicleId: number | null
  clientId: number | null
  clientName: string
  clientDni: string | null
  date: string
  notaryName: string | null
  notaryRegistry: string | null
  rnpNumber: string | null
  dnrpaNumber: string | null
  transferFee: string | null
  taxAmount: string | null
  totalCost: string | null
  status: 'pendiente' | 'en_tramite' | 'completada' | 'cancelada'
  notes: string | null
  createdAt: string
  vehicleLabel?: string | null
  chassisNumber?: string | null
  engineNumber?: string | null
  clientNameResolved?: string
}

export interface CreateTransferData {
  vehicleId?: number
  clientId?: number
  clientName: string
  clientDni?: string
  date?: string
  notaryName?: string
  notaryRegistry?: string
  rnpNumber?: string
  dnrpaNumber?: string
  transferFee?: number
  taxAmount?: number
  totalCost?: number
  status?: Transfer['status']
  notes?: string
}

export function useTransfers() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const inv = () => qc.invalidateQueries({ queryKey: ['transfers'] })

  const list = useQuery<{ items: Transfer[]; total: number; page: number; limit: number; pages: number }>({
    queryKey: ['transfers', page],
    queryFn: () => api.get('/transfers', { params: { page, limit: 50 } }).then(r => r.data),
    placeholderData: prev => prev,
  })
  const total = list.data?.total ?? 0
  const pages = list.data?.pages ?? 1

  const create = useMutation({
    mutationFn: (data: CreateTransferData) => api.post('/transfers', data).then(r => r.data),
    onSuccess: inv,
    onError: (err: any) => toast.error(apiError(err)),
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateTransferData> }) =>
      api.put(`/transfers/${id}`, data).then(r => r.data),
    onSuccess: inv,
    onError: (err: any) => toast.error(apiError(err)),
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/transfers/${id}`).then(r => r.data),
    onSuccess: inv,
    onError: (err: any) => toast.error(apiError(err)),
  })

  return { list, total, page, pages, setPage, create, update, remove }
}
