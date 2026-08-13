import { toast } from '../lib/toast'
import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { directEditAction, directEditFailurePlan, directEditReturnTo } from '../lib/vehicleDirectEdit'
import { InfoBanner } from '../components/ui/InfoBanner'
import { btnPrimary, btnSecondary } from '../components/ui/FormField'
import { VehiclesGrid } from '../components/vehicles/VehiclesGrid'
import { VehicleFormModal, type VehicleFormData } from '../components/vehicles/VehicleFormModal'
import { RemitoImportModal } from '../components/vehicles/RemitoImportModal'
import { Pagination } from '../components/ui/Pagination'
import { useAuth } from '../hooks/useAuth'
import { QRScannerField } from '../components/ui/QRScannerField'

export function VehiclesPage() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const requestedEditId = Number(searchParams.get('edit'))
  const fallbackSearch = searchParams.get('search') ?? ''
  const returnTo = directEditReturnTo(searchParams.get('returnTo'))
  const hasDirectEdit = Number.isInteger(requestedEditId) && requestedEditId > 0
  const [modal, setModal] = useState<'create' | 'edit' | 'remito' | null>(null)
  const [editing, setEditing] = useState<any>(null)
  const [openedDirectId, setOpenedDirectId] = useState<number | null>(null)
  const handledDirectId = useRef<number | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data: vehiclesData, isLoading } = useQuery({
    queryKey: ['vehicles', page, search],
    queryFn: () => api.get('/vehicles', { params: { page, limit: 50, search: search || undefined } }).then(r => r.data),
    placeholderData: (prev: any) => prev,
  })

  const {
    data: directVehicle,
    isError: isDirectVehicleError,
    isFetching: isDirectVehicleFetching,
    isRefetchError: isDirectVehicleRefetchError,
  } = useQuery({
    queryKey: ['vehicles', 'detail', requestedEditId],
    queryFn: () => api.get(`/vehicles/${requestedEditId}`).then(r => r.data),
    enabled: isAdmin && hasDirectEdit,
  })

  const directAction = directEditAction({
    isAdmin,
    requestedId: requestedEditId,
    vehicle: directVehicle,
    isFetching: isDirectVehicleFetching,
    isError: isDirectVehicleError,
    isRefetchError: isDirectVehicleRefetchError,
    handledId: handledDirectId.current,
  })

  useEffect(() => {
    if (directAction !== 'open' || openedDirectId === requestedEditId) return
    handledDirectId.current = requestedEditId
    setEditing(directVehicle)
    setModal('edit')
    setOpenedDirectId(requestedEditId)
  }, [directAction, directVehicle, openedDirectId, requestedEditId])

  useEffect(() => {
    if (directAction !== 'error' || openedDirectId === requestedEditId) return
    const failure = directEditFailurePlan(fallbackSearch)
    handledDirectId.current = requestedEditId
    setOpenedDirectId(requestedEditId)
    toast.error(failure.message)
    setSearch(failure.search)
    setPage(1)
    navigate(failure.replaceTo, { replace: true })
  }, [directAction, fallbackSearch, navigate, openedDirectId, requestedEditId])

  const vehicles = vehiclesData?.items ?? []
  const total = vehiclesData?.total ?? 0
  const pages = vehiclesData?.pages ?? 1

  const finishEditing = () => {
    setModal(null)
    setEditing(null)
    if (returnTo) navigate(returnTo)
  }

  const create = useMutation({
    mutationFn: (data: VehicleFormData) => api.post('/vehicles', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vehicles'] }); setModal(null) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error inesperado'),
  })

  const update = useMutation({
    mutationFn: (data: VehicleFormData) => api.put(`/vehicles/${editing.id}`, data),
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['vehicles'] }); finishEditing() },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error inesperado'),
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/vehicles/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error inesperado'),
  })

  const bulkCreate = useMutation({
    mutationFn: (items: any[]) => api.post('/vehicles/bulk', { items }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['vehicles'] })
      setModal(null)
      toast.success(`${res.data.length} vehículo${res.data.length !== 1 ? 's' : ''} importado${res.data.length !== 1 ? 's' : ''}`)
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error al importar'),
  })

  function openEdit(v: any) { setEditing(v); setModal('edit') }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Motos y Lanchas</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '2px' }}>{vehicles.length} vehículos</p>
        </div>
        {isAdmin && (
          <div className="page-header-actions">
            <button onClick={() => setModal('remito')} style={{ ...btnSecondary, fontSize: '14px' }}>📄 Carga masiva</button>
            <button onClick={() => { setEditing(null); setModal('create') }} style={btnPrimary}>+ Nuevo vehículo</button>
          </div>
        )}
      </div>

      <InfoBanner title="Motos y lanchas en venta">
        Inventario de todos los vehículos: marca, modelo, año, colores, números de motor y chasis, precio de costo y venta, y fotos. Cuando registrás una venta, el vehículo <strong>pasa automáticamente a "vendido"</strong> y deja de aparecer como disponible — así no lo vendés dos veces por error.
        <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '8px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <span><strong>Disponible</strong> — en stock, listo para vender o reservar</span>
          <span><strong>Reservado</strong> — tiene una reserva activa</span>
          <span><strong>Vendido</strong> — ya fue vendido, no aparece en el formulario de ventas</span>
          <span>Cargá varias motos desde un <strong>remito, una plantilla Excel o manualmente</strong></span>
        </div>
      </InfoBanner>

      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px' }}>
        <div style={{ width: '100%', maxWidth: '520px' }}>
          <QRScannerField
            value={search}
            onChange={value => { setSearch(value); setPage(1) }}
            onScan={value => { setSearch(value); setPage(1) }}
            placeholder="Buscar o escanear código interno, marca, modelo, chasis, motor..."
            label="Buscar vehículo"
          />
        </div>
      </div>

      <VehiclesGrid
        vehicles={vehicles}
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={isAdmin ? (id: number) => { if (window.confirm('¿Eliminar este vehículo?')) remove.mutate(id) } : undefined}
      />
      <Pagination page={page} pages={pages} total={total} onPage={setPage} />

      {(modal === 'create' || modal === 'edit') && (
        <VehicleFormModal
          mode={modal}
          editing={editing}
          onClose={finishEditing}
          onSubmit={(data) => modal === 'edit' ? update.mutate(data) : create.mutate(data)}
          isPending={create.isPending || update.isPending}
        />
      )}
      {modal === 'remito' && (
        <RemitoImportModal
          onClose={() => setModal(null)}
          onImport={(items) => bulkCreate.mutate(items)}
          isPending={bulkCreate.isPending}
        />
      )}
    </div>
  )
}
