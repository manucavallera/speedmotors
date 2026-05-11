import { toast } from '../lib/toast'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, apiError } from '../lib/api'
import { type Reservation, type PaginatedResponse } from '../types/api.types'
import { type CreateReservationDto } from '../types/reservations.types'

export function useReservations() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const invalidate = () => qc.invalidateQueries({ queryKey: ['reservations'] })

  const listQuery = useQuery<PaginatedResponse<Reservation>>({
    queryKey: ['reservations', page],
    queryFn: () => api.get('/reservations', { params: { page, limit: 50 } }).then(r => r.data),
    placeholderData: prev => prev,
  })
  const reservations = listQuery.data?.items ?? []
  const total = listQuery.data?.total ?? 0
  const pages = listQuery.data?.pages ?? 1

  const create = useMutation({
    mutationFn: (data: CreateReservationDto) => api.post('/reservations', data),
    onSuccess: invalidate,
    onError: (err: any) => toast.error(apiError(err)),
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateReservationDto> }) =>
      api.put(`/reservations/${id}`, data),
    onSuccess: invalidate,
    onError: (err: any) => toast.error(apiError(err)),
  })

  const changeStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/reservations/${id}/status`, { status }),
    onSuccess: invalidate,
    onError: (err: any) => toast.error(apiError(err)),
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/reservations/${id}`),
    onSuccess: invalidate,
    onError: (err: any) => toast.error(apiError(err)),
  })

  return { list: listQuery, reservations, total, page, pages, setPage, create, update, changeStatus, remove }
}
