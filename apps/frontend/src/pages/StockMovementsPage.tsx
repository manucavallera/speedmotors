import { toast } from '../lib/toast'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { InfoBanner } from '../components/ui/InfoBanner'
import { btnPrimary } from '../components/ui/FormField'
import { StockMovementsTable } from '../components/stock-movements/StockMovementsTable'
import { StockMovementFormModal, type StockMovementFormData } from '../components/stock-movements/StockMovementFormModal'
import { ProductFormModal } from '../components/products/ProductFormModal'
import { Pagination } from '../components/ui/Pagination'
import { useAuth } from '../hooks/useAuth'

export function StockMovementsPage() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [page, setPage] = useState(1)
  const [newProductBarcode, setNewProductBarcode] = useState<string | null>(null)

  const createProduct = useMutation({
    mutationFn: (d: any) => api.post('/products', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); setNewProductBarcode(null) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error al crear producto'),
  })

  const { data: movementsData, isLoading } = useQuery({
    queryKey: ['stock-movements', page],
    queryFn: () => api.get('/stock-movements', { params: { page, limit: 50 } }).then(r => r.data),
    placeholderData: (prev: any) => prev,
  })
  const movements = movementsData?.items ?? []
  const total = movementsData?.total ?? 0
  const pages = movementsData?.pages ?? 1

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products', { params: { limit: 50000 } }).then(r => r.data),
  })
  const products = productsData?.items ?? productsData ?? []

  const create = useMutation({
    mutationFn: (d: StockMovementFormData) => api.post('/stock-movements', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stock-movements'] }); qc.invalidateQueries({ queryKey: ['products'] }); setModal(false) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error inesperado'),
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: StockMovementFormData }) => api.put(`/stock-movements/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock-movements'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      setEditing(null)
      setModal(false)
      toast.success('Movimiento actualizado')
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'No se pudo editar el movimiento'),
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/stock-movements/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock-movements'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Movimiento eliminado')
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'No se pudo eliminar el movimiento'),
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Movimientos de stock</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '2px' }}>{total} movimientos registrados</p>
        </div>
        <button onClick={() => { setEditing(null); setModal(true) }} style={btnPrimary}>+ Registrar movimiento</button>
      </div>

      <InfoBanner title="¿Para qué sirve esta sección?">
        Registrá cambios de stock que <strong>no vienen de ventas ni compras</strong>: roturas, robos, devoluciones, regalos del proveedor, o ajustes después de un inventario físico. Cada movimiento queda con fecha y motivo, así siempre podés saber por qué cambió el stock.
        <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '8px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <span><strong style={{ color: '#16a34a' }}>↑ Entrada</strong> — sumar stock (regalo del proveedor, devolución de cliente)</span>
          <span><strong style={{ color: '#dc2626' }}>↓ Salida</strong> — restar stock (rotura, robo, faltante)</span>
          <span><strong style={{ color: '#2563eb' }}>⇄ Ajuste</strong> — fijar el stock al valor real (después de contar)</span>
        </div>
      </InfoBanner>

      <StockMovementsTable
        movements={movements}
        products={products}
        isLoading={isLoading}
        onEdit={isAdmin ? (movement) => { setEditing(movement); setModal(true) } : undefined}
        onDelete={isAdmin ? (movement) => {
          if (window.confirm('¿Eliminar este movimiento? El stock se recalculará automáticamente.')) remove.mutate(movement.id)
        } : undefined}
      />
      <Pagination page={page} pages={pages} total={total} onPage={setPage} />

      {modal && (
        <StockMovementFormModal
          products={products}
          onClose={() => setModal(false)}
          onSubmit={(data) => editing ? update.mutate({ id: editing.id, data }) : create.mutate(data)}
          isPending={create.isPending || update.isPending}
          onCreateProduct={setNewProductBarcode}
          editing={editing}
        />
      )}
      {newProductBarcode !== null && (
        <ProductFormModal
          mode="create"
          editing={null}
          initialValues={{ barcode: newProductBarcode }}
          onClose={() => setNewProductBarcode(null)}
          onSubmit={d => createProduct.mutate(d)}
          isPending={createProduct.isPending}
        />
      )}
    </div>
  )
}
