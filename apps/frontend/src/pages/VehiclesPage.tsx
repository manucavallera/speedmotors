import { toast } from '../lib/toast'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { InfoBanner } from '../components/ui/InfoBanner'
import { btnPrimary, btnSecondary } from '../components/ui/FormField'
import { VehiclesGrid } from '../components/vehicles/VehiclesGrid'
import { VehicleFormModal, type VehicleFormData } from '../components/vehicles/VehicleFormModal'
import { RemitoImportModal } from '../components/vehicles/RemitoImportModal'
import { Pagination } from '../components/ui/Pagination'
import { useAuth } from '../hooks/useAuth'

export function VehiclesPage() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()
  const [modal, setModal] = useState<'create' | 'edit' | 'remito' | null>(null)
  const [editing, setEditing] = useState<any>(null)
  const [page, setPage] = useState(1)

  const { data: vehiclesData, isLoading } = useQuery({
    queryKey: ['vehicles', page],
    queryFn: () => api.get('/vehicles', { params: { page, limit: 50 } }).then(r => r.data),
  })
  const vehicles = vehiclesData?.items ?? []
  const total = vehiclesData?.total ?? 0
  const pages = vehiclesData?.pages ?? 1

  const create = useMutation({
    mutationFn: (data: VehicleFormData) => api.post('/vehicles', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vehicles'] }); setModal(null) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error inesperado'),
  })

  const update = useMutation({
    mutationFn: (data: VehicleFormData) => api.put(`/vehicles/${editing.id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vehicles'] }); setModal(null) },
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
            <button onClick={() => setModal('remito')} style={{ ...btnSecondary, fontSize: '14px' }}>📄 Importar remito</button>
            <button onClick={() => { setEditing(null); setModal('create') }} style={btnPrimary}>+ Nuevo vehículo</button>
          </div>
        )}
      </div>

      <InfoBanner title="Motos y lanchas en venta">
        Stock de vehículos disponibles, con marca, modelo, año y número de serie. Cuando registrás una venta de un vehículo, <strong>pasa automáticamente a estado "vendido"</strong> y no aparece más como disponible — así no podés venderlo dos veces por error.
      </InfoBanner>

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
          onClose={() => setModal(null)}
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
