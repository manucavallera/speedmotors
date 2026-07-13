import { toast } from '../lib/toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, apiError } from '../lib/api'
import { type MapSpot, type CreateUnitForm, type ChargeForm, type StorageService, type ServiceForm, type GuarderiaStats, type StorageCategory, type CategoryForm, type UnitRow } from '../types/guarderia.types'

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

  // Embarcaciones en guardería. Las que no tienen cuna están sueltas sobre trailer.
  const unitsQuery = useQuery<UnitRow[]>({
    queryKey: ['guarderia', 'units'],
    queryFn: () => api.get('/guarderia/units', { params: { status: 'en_guarderia' } }).then(r => r.data),
  })
  const units = unitsQuery.data ?? []
  const looseUnits = units.filter(u => u.spotId == null)

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

  // Alta de lancha: crea la unidad y, si contrató seguros, los deja como servicios fijos
  const createUnit = useMutation({
    mutationFn: async (data: CreateUnitForm) => {
      const { fixedServiceIds, ...unit } = data
      const res = await api.post('/guarderia/units', unit)
      if (fixedServiceIds?.length) {
        await api.put(`/guarderia/units/${res.data.id}/services`, { serviceIds: fixedServiceIds })
      }
      return res.data
    },
    onSuccess: () => { invalidate(); toast.success('Embarcación guardada') },
    onError: (err: any) => toast.error(apiError(err)),
  })

  const setUnitServices = useMutation({
    mutationFn: ({ unitId, serviceIds }: { unitId: number; serviceIds: number[] }) =>
      api.put(`/guarderia/units/${unitId}/services`, { serviceIds }),
    onSuccess: () => { invalidate(); toast.success('Servicios fijos actualizados') },
    onError: (err: any) => toast.error(apiError(err)),
  })

  // Cobro masivo del mes: deja la deuda cargada de todas las lanchas de una sola vez
  const generateMonth = useMutation({
    mutationFn: (periodLabel: string) => api.post('/guarderia/month/generate', { periodLabel }),
    onSuccess: (res) => {
      invalidate()
      const { created, total } = res.data
      toast.success(created ? `${created} cobros generados por $${Number(total).toLocaleString('es-AR')}` : 'No había nada para generar')
    },
    onError: (err: any) => toast.error(apiError(err)),
  })

  const retireUnit = useMutation({
    mutationFn: (unitId: number) => api.patch(`/guarderia/units/${unitId}/retire`),
    onSuccess: () => { invalidate(); toast.success('Embarcación retirada') },
    onError: (err: any) => toast.error(apiError(err)),
  })

  // Cambiar de cuna: spotId null la deja suelta sobre trailer
  const moveUnit = useMutation({
    mutationFn: ({ unitId, spotId }: { unitId: number; spotId: number | null }) =>
      api.patch(`/guarderia/units/${unitId}/move`, { spotId }),
    onSuccess: () => { invalidate(); toast.success('Embarcación movida de cuna') },
    onError: (err: any) => toast.error(apiError(err)),
  })

  const categoriesQuery = useQuery<StorageCategory[]>({
    queryKey: ['guarderia', 'categories'],
    queryFn: () => api.get('/guarderia/categories').then(r => r.data),
  })
  const categories = categoriesQuery.data ?? []

  const createCategory = useMutation({
    mutationFn: (data: CategoryForm) => api.post('/guarderia/categories', data),
    onSuccess: () => { invalidate(); toast.success('Categoría agregada') },
    onError: (err: any) => toast.error(apiError(err)),
  })
  const updateCategory = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CategoryForm }) => api.put(`/guarderia/categories/${id}`, data),
    onSuccess: () => { invalidate(); toast.success('Categoría actualizada') },
    onError: (err: any) => toast.error(apiError(err)),
  })
  const removeCategory = useMutation({
    mutationFn: (id: number) => api.delete(`/guarderia/categories/${id}`),
    onSuccess: () => { invalidate(); toast.success('Categoría eliminada') },
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

  return {
    mapaQuery, spots, stats, services, servicesQuery, createService, updateService, removeService,
    createSpots, createUnit, retireUnit, moveUnit, charge, payCharge,
    units, unitsQuery, looseUnits, setUnitServices, generateMonth,
    categories, categoriesQuery, createCategory, updateCategory, removeCategory,
  }
}
