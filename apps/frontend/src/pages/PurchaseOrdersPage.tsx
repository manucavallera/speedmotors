import { toast } from '../lib/toast'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { InfoBanner } from '../components/ui/InfoBanner'
import { btnPrimary, inputStyle } from '../components/ui/FormField'
import { PurchaseOrdersTable } from '../components/purchase-orders/PurchaseOrdersTable'
import { PurchaseOrderDetailModal } from '../components/purchase-orders/PurchaseOrderDetailModal'
import { PurchaseOrderFormModal, type PurchaseOrderFormData } from '../components/purchase-orders/PurchaseOrderFormModal'
import { Pagination } from '../components/ui/Pagination'
import { useAuth } from '../hooks/useAuth'

export function PurchaseOrdersPage() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()
  const [modal, setModal] = useState<'new' | 'edit' | false>(false)
  const [editing, setEditing] = useState<any>(null)
  const [detail, setDetail] = useState<any>(null)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['purchase-orders', page],
    queryFn: () => api.get('/purchase-orders', { params: { page, limit: 50 } }).then(r => r.data),
  })
  const orders = ordersData?.items ?? []
  const total = ordersData?.total ?? 0
  const pages = ordersData?.pages ?? 1

  const filtered = orders.filter((o: any) =>
    (!statusFilter || o.status === statusFilter) &&
    (!search || o.supplier?.name?.toLowerCase().includes(search.toLowerCase()))
  )

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get('/suppliers').then(r => r.data),
  })
  const suppliers = suppliersData?.items ?? suppliersData ?? []

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products', { params: { limit: 50000 } }).then(r => r.data),
  })
  const products = productsData?.items ?? productsData ?? []

  const create = useMutation({
    mutationFn: (data: PurchaseOrderFormData) => api.post('/purchase-orders', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase-orders'] }); setModal(false) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error inesperado'),
  })

  const update = useMutation({
    mutationFn: (data: PurchaseOrderFormData) => api.put(`/purchase-orders/${editing.id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase-orders'] }); setModal(false); setEditing(null) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error inesperado'),
  })

  const changeStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/purchase-orders/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      setDetail(null)
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error inesperado'),
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/purchase-orders/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase-orders'] }),
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error inesperado'),
  })

  function openEdit(order: any) { setEditing(order); setModal('edit') }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Órdenes de compra</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '2px' }}>{orders.length} órdenes</p>
        </div>
        <button onClick={() => { setEditing(null); setModal('new') }} style={btnPrimary}>+ Nueva orden</button>
      </div>

      <InfoBanner title="Compras a proveedores">
        Pedidos de mercadería que le hacés a tus proveedores. Cada orden pasa por <strong>Borrador → Enviada → Recibida</strong>. Al marcarla como recibida, el stock de todos los productos incluidos sube automáticamente — sin tener que actualizarlo a mano.
        <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '8px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <span><strong>Borrador</strong> — la estás armando, todavía no la mandaste al proveedor</span>
          <span><strong>Enviada</strong> — ya la mandaste, esperando que llegue la mercadería</span>
          <span><strong>Recibida</strong> — llegó todo, el stock ya subió automáticamente</span>
          <span>Si llegó menos de lo pedido, registrá un <strong>movimiento de stock</strong> manual para ajustar</span>
        </div>
      </InfoBanner>

      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '180px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Buscar proveedor</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nombre..." style={{ ...inputStyle }} />
        </div>

        <div style={{ width: '1px', background: '#e2e8f0', alignSelf: 'stretch' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Estado</span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {([['', 'Todos'], ['draft', 'Borrador'], ['sent', 'Enviada'], ['received', 'Recibida']] as [string, string][]).map(([val, lbl]) => (
              <button key={val} onClick={() => setStatusFilter(val)}
                style={{ padding: '7px 14px', borderRadius: '9px', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer', background: statusFilter === val ? '#1d4ed8' : '#f1f5f9', color: statusFilter === val ? 'white' : '#374151' }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

      </div>

      <PurchaseOrdersTable
        orders={filtered}
        isLoading={isLoading}
        onView={setDetail}
        onEdit={openEdit}
        onDelete={isAdmin ? (id: number) => { if (window.confirm('¿Eliminar esta orden de compra?')) remove.mutate(id) } : undefined}
      />
      <Pagination page={page} pages={pages} total={total} onPage={setPage} />

      {detail && (
        <PurchaseOrderDetailModal
          detail={detail}
          onClose={() => setDetail(null)}
          onChangeStatus={(id, status) => changeStatus.mutate({ id, status })}
          isPending={changeStatus.isPending}
        />
      )}

      {modal && (
        <PurchaseOrderFormModal
          mode={modal}
          editing={editing}
          suppliers={suppliers}
          products={products}
          onClose={() => { setModal(false); setEditing(null) }}
          onSubmit={(data) => modal === 'edit' ? update.mutate(data) : create.mutate(data)}
          isPending={create.isPending || update.isPending}
        />
      )}
    </div>
  )
}
