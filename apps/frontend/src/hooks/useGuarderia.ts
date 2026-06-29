import { toast } from '../lib/toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, apiError } from '../lib/api'
import { type MapSpot, type CreateUnitForm, type ChargeForm, type StorageService, type ServiceForm, type GuarderiaStats } from '../types/guarderia.types'

export function useGuarderia() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['guarderia'] })

  const mapaQuery = useQuery<MapSpot[]>({
    queryKey: ['guarderia', 'mapa'],
    queryFn: () => api.get('/guarderia/mapa').then(r => r.data),
  })
  const spots = mapaQuery.data ?? []

  const statsQuery = useQuery<GuarderiaStats>({
    queryKey: ['guarderia', 'stats'],
    queryFn: () => api.get('/guarderia/stats').then(r => r.data),
  })
  const stats = statsQuery.data ?? { ingresosMes: 0 }

  const servicesQuery = useQuery<StorageService[]>({
    queryKey: ['guarderia', 'services'],
    queryFn: () => api.get('/guarderia/services').then(r => r.data),
  })
  const services = servicesQuery.data ?? []

  const createService = useMutation({
    mutationFn: (data: ServiceForm) => api.post('/guarderia/services', data),
    onSuccess: () => { invalidate(); toast.success('Servicio agregado') },
    onError: (err: any) => toast.error(apiError(err)),
  })
  const updateService = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ServiceForm }) => api.put(`/guarderia/services/${id}`, data),
    onSuccess: () => { invalidate(); toast.success('Servicio actualizado') },
    onError: (err: any) => toast.error(apiError(err)),
  })
  const removeService = useMutation({
    mutationFn: (id: number) => api.delete(`/guarderia/services/${id}`),
    onSuccess: () => { invalidate(); toast.success('Servicio eliminado') },
    onError: (err: any) => toast.error(apiError(err)),
  })

  const createSpots = useMutation({
    mutationFn: (codes: string[]) => api.post('/guarderia/spots', { codes }),
    onSuccess: () => { invalidate(); toast.success('Lugares creados') },
    onError: (err: any) => toast.error(apiError(err)),
  })

  const createUnit = useMutation({
    mutationFn: (data: CreateUnitForm) => api.post('/guarderia/units', data),
    onSuccess: () => { invalidate(); toast.success('Embarcación guardada') },
    onError: (err: any) => toast.error(apiError(err)),
  })

  const retireUnit = useMutation({
    mutationFn: (unitId: number) => api.patch(`/guarderia/units/${unitId}/retire`),
    onSuccess: () => { invalidate(); toast.success('Embarcación retirada') },
    onError: (err: any) => toast.error(apiError(err)),
  })

  const charge = useMutation({
    mutationFn: ({ unitId, data }: { unitId: number; data: ChargeForm }) =>
      api.post(`/guarderia/units/${unitId}/charge`, data),
    onSuccess: () => { invalidate(); toast.success('Cobro registrado') },
    onError: (err: any) => toast.error(apiError(err)),
  })

  const payCharge = useMutation({
    mutationFn: (chargeId: number) => api.patch(`/guarderia/charges/${chargeId}/pay`),
    onSuccess: () => { invalidate(); toast.success('Deuda saldada') },
    onError: (err: any) => toast.error(apiError(err)),
  })

  return { mapaQuery, spots, stats, services, servicesQuery, createService, updateService, removeService, createSpots, createUnit, retireUnit, charge, payCharge }
}
