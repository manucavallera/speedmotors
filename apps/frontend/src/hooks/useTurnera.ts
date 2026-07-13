import { toast } from '../lib/toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, apiError } from '../lib/api'
import { type RentalSlot, type SlotForm, type GuarderiaUnitOption, type DaySummary } from '../types/turnera.types'
import { type StorageService } from '../types/guarderia.types'
import { type TurneraConfig, DEFAULT_CFG } from '../lib/turneraConfig'

export function useTurnera(date: string) {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['turnera'] })

  // La grilla la define el dueño y vive en el server: la misma config la ve el panel y el cliente
  const configQuery = useQuery<TurneraConfig>({
    queryKey: ['turnera', 'config'],
    queryFn: () => api.get('/turnera/config').then(r => r.data),
  })
  const config = configQuery.data ?? DEFAULT_CFG

  const saveConfig = useMutation({
    mutationFn: (cfg: TurneraConfig) => api.put('/turnera/config', cfg),
    onSuccess: () => { invalidate(); toast.success('Grilla actualizada') },
    onError: (err: any) => toast.error(apiError(err)),
  })

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

  // Resumen del mes (para el calendario): días con salidas + cobrado
  const month = date.slice(0, 7)
  const monthQuery = useQuery<DaySummary[]>({
    queryKey: ['turnera', 'month', month],
    queryFn: () => api.get('/turnera/month', { params: { month } }).then(r => r.data),
    placeholderData: prev => prev,
  })
  const monthDays = monthQuery.data ?? []

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

  return { units, unitsQuery, services, slots, slotsQuery, monthDays, monthQuery, createSlot, setStatus, charge, removeSlot, config, configQuery, saveConfig }
}
