import { toast } from '../lib/toast'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { InfoBanner } from '../components/ui/InfoBanner'
import { btnPrimary } from '../components/ui/FormField'
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

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['purchase-orders', page],
    queryFn: () => api.get('/purchase-orders', { params: { page, limit: 50 } }).then(r => r.data),
  })
  const orders = ordersData?.items ?? []
  const total = ordersData?.total ?? 0
  const pages = ordersData?.pages ?? 1

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get('/suppliers').then(r => r.data),
  })

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then(r => r.data),
  })

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Órdenes de compra</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '2px' }}>{orders.length} órdenes</p>
        </div>
        <button onClick={() => { setEditing(null); setModal('new') }} style={btnPrimary}>+ Nueva orden</button>
      </div>

      <InfoBanner title="Compras a proveedores">
        Pedidos de mercadería que le hacés a tus proveedores. Pasan por <strong>borrador → enviada → recibida</strong>. Al marcar "recibida", el stock de los productos sube automáticamente. Te sirve para controlar qué le debés a cada proveedor y verificar que llegue todo lo que pediste.
      </InfoBanner>

      <PurchaseOrdersTable
        orders={orders}
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
