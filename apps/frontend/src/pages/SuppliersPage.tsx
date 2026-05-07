import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { InfoBanner } from '../components/ui/InfoBanner'
import { btnPrimary, inputStyle } from '../components/ui/FormField'
import { SuppliersTable } from '../components/suppliers/SuppliersTable'
import { SupplierFormModal, type SupplierFormData } from '../components/suppliers/SupplierFormModal'
import { Pagination } from '../components/ui/Pagination'

export function SuppliersPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<any>(null)
  const [page, setPage] = useState(1)

  const { data: suppliersData, isLoading } = useQuery({
    queryKey: ['suppliers', search, page],
    queryFn: () => api.get('/suppliers', { params: { search: search || undefined, page, limit: 50 } }).then(r => r.data),
  })
  const suppliers = suppliersData?.items ?? suppliersData ?? []
  const total = suppliersData?.total ?? 0
  const pages = suppliersData?.pages ?? 1

  const create = useMutation({
    mutationFn: (data: SupplierFormData) => api.post('/suppliers', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); setModal(null) },
    onError: (err: any) => alert(err?.response?.data?.message || 'Error inesperado'),
  })

  const update = useMutation({
    mutationFn: (data: SupplierFormData) => api.put(`/suppliers/${editing.id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); setModal(null) },
    onError: (err: any) => alert(err?.response?.data?.message || 'Error inesperado'),
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/suppliers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
    onError: (err: any) => alert(err?.response?.data?.message || 'Error inesperado'),
  })

  function openEdit(s: any) { setEditing(s); setModal('edit') }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Proveedores</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '2px' }}>{suppliers.length} proveedores</p>
        </div>
        <button onClick={() => { setEditing(null); setModal('create') }} style={btnPrimary}>+ Nuevo proveedor</button>
      </div>

      <InfoBanner title="Proveedores del negocio">
        Empresas o personas a las que les comprás mercadería (Honda, Yamaha, distribuidores, etc.). Asociá <strong>productos y órdenes de compra</strong> a su proveedor para saber a quién le pediste cada cosa y qué le debés.
      </InfoBanner>

      <div style={{ marginBottom: '16px' }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Buscar por nombre..."
          style={{ ...inputStyle, maxWidth: '360px' }} />
      </div>

      <SuppliersTable suppliers={suppliers} isLoading={isLoading} onEdit={openEdit} onDelete={(id) => { if (window.confirm('¿Eliminar este proveedor?')) remove.mutate(id) }} />
      <Pagination page={page} pages={pages} total={total} onPage={setPage} />

      {modal && (
        <SupplierFormModal
          mode={modal}
          editing={editing}
          onClose={() => setModal(null)}
          onSubmit={(data) => modal === 'edit' ? update.mutate(data) : create.mutate(data)}
          isPending={create.isPending || update.isPending}
        />
      )}
    </div>
  )
}
