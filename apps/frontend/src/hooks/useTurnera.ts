import { toast } from '../lib/toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, apiError } from '../lib/api'
import { type RentalSlot, type SlotForm, type GuarderiaUnitOption } from '../types/turnera.types'
import { type StorageService } from '../types/guarderia.types'

export function useTurnera(date: string) {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['turnera'] })

  // Lanchas de guardería disponibles para botar
  const unitsQuery = useQuery<GuarderiaUnitOption[]>({
    queryKey: ['turnera', 'units'],
    queryFn: () => api.get('/guarderia/units', { params: { status: 'en_guarderia' } }).then(r => r.data),
  })
  const units = unitsQuery.data ?? []

  // Servicios anexos (ej: puesta en marcha) para cobrar en la botadura
  const servicesQuery = useQuery<StorageService[]>({
    queryKey: ['guarderia', 'services'],
    queryFn: () => api.get('/guarderia/services').then(r => r.data),
  })
  const services = servicesQuery.data ?? []

  const slotsQuery = useQuery<RentalSlot[]>({
    queryKey: ['turnera', 'slots', date],
    queryFn: () => api.get('/turnera/slots', { params: { date } }).then(r => r.data),
    placeholderData: prev => prev,
  })
  const slots = slotsQuery.data ?? []

  const createSlot = useMutation({
    mutationFn: (data: SlotForm) => api.post('/turnera/slots', data),
    onSuccess: () => { invalidate(); toast.success('Salida agendada') },
    onError: (err: any) => toast.error(apiError(err)),
  })
  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.patch(`/turnera/slots/${id}/status`, { status }),
    onSuccess: invalidate,
    onError: (err: any) => toast.error(apiError(err)),
  })
  const charge = useMutation({
    mutationFn: (id: number) => api.post(`/turnera/slots/${id}/charge`),
    onSuccess: () => { invalidate(); toast.success('Cobrado') },
    onError: (err: any) => toast.error(apiError(err)),
  })
  const removeSlot = useMutation({
    mutationFn: (id: number) => api.delete(`/turnera/slots/${id}`),
    onSuccess: () => { invalidate(); toast.success('Salida eliminada') },
    onError: (err: any) => toast.error(apiError(err)),
  })

  return { units, unitsQuery, services, slots, slotsQuery, createSlot, setStatus, charge, removeSlot }
}
