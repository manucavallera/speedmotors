import { toast } from '../lib/toast'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { InfoBanner } from '../components/ui/InfoBanner'
import { btnPrimary } from '../components/ui/FormField'
import { QuotesTable } from '../components/quotes/QuotesTable'
import { QuoteFormModal, type QuoteFormData } from '../components/quotes/QuoteFormModal'
import { QuoteDetailModal } from '../components/quotes/QuoteDetailModal'
import { QuoteConvertModal, type QuoteConvertData } from '../components/quotes/QuoteConvertModal'
import { Pagination } from '../components/ui/Pagination'
import { useAuth } from '../hooks/useAuth'

export function QuotesPage() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()
  const [modal, setModal] = useState<'new' | 'edit' | null>(null)
  const [editing, setEditing] = useState<any>(null)
  const [detail, setDetail] = useState<any>(null)
  const [convertModal, setConvertModal] = useState<any>(null)
  const [page, setPage] = useState(1)

  const { data: quotesData, isLoading } = useQuery({
    queryKey: ['quotes', page],
    queryFn: () => api.get('/quotes', { params: { page, limit: 50 } }).then(r => r.data),
  })
  const quotes = quotesData?.items ?? []
  const total = quotesData?.total ?? 0
  const pages = quotesData?.pages ?? 1
  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.get('/clients').then(r => r.data),
  })
  const clients = clientsData?.items ?? clientsData ?? []

  const { data: productsData } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: () => api.get('/products', { params: { limit: 2000 } }).then(r => r.data),
  })
  const products = productsData?.items ?? productsData ?? []

  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles', 'disponible'],
    queryFn: () => api.get('/vehicles', { params: { status: 'disponible' } }).then(r => r.data),
  })
  const vehicles = vehiclesData?.items ?? []

  const create = useMutation({
    mutationFn: (d: QuoteFormData) => api.post('/quotes', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['quotes'] }); setModal(null) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error inesperado'),
  })

  const update = useMutation({
    mutationFn: (d: QuoteFormData) => api.put(`/quotes/${editing.id}`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['quotes'] }); setModal(null); setEditing(null) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error inesperado'),
  })

  const convert = useMutation({
    mutationFn: ({ id, ...d }: { id: number } & QuoteConvertData) => api.post(`/quotes/${id}/convert`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['quotes', 'sales'] }); setConvertModal(null) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error inesperado'),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.put(`/quotes/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotes'] }),
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error inesperado'),
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/quotes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotes'] }),
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error inesperado'),
  })

  function openEdit(q: any) { setEditing(q); setModal('edit') }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Presupuestos</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '2px' }}>{quotes.length} presupuestos</p>
        </div>
        <button onClick={() => { setEditing(null); setModal('new') }} style={btnPrimary}>+ Nuevo presupuesto</button>
      </div>

      <InfoBanner title="Presupuestos para clientes">
        Cotizaciones que le pasás al cliente <strong>antes de cerrar la venta</strong>. Agregá vehículos o productos del stock — el precio se completa automáticamente y lo podés ajustar. Si el cliente acepta, usá <strong>Convertir a venta</strong> con un clic, sin volver a cargar nada.
        <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '8px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <span>Generá el presupuesto en <strong>PDF</strong> para mandárselo por WhatsApp o imprimirlo</span>
          <span>Los presupuestos tienen estado: <strong>Pendiente → Aceptado → Rechazado → Expirado</strong></span>
          <span>Podés editar un presupuesto mientras no fue convertido a venta</span>
        </div>
      </InfoBanner>

      <QuotesTable
        quotes={quotes}
        clients={clients}
        isLoading={isLoading}
        onView={setDetail}
        onEdit={openEdit}
        onConvert={setConvertModal}
        onDelete={isAdmin ? (id: number) => { if (window.confirm('¿Eliminar este presupuesto?')) remove.mutate(id) } : undefined}
      />
      <Pagination page={page} pages={pages} total={total} onPage={setPage} />

      {modal && (
        <QuoteFormModal
          mode={modal}
          editing={editing}
          clients={clients}
          products={products}
          vehicles={vehicles}
          onClose={() => { setModal(null); setEditing(null) }}
          onSubmit={(data) => modal === 'edit' ? update.mutate(data) : create.mutate(data)}
          isPending={create.isPending || update.isPending}
        />
      )}

      {detail && (
        <QuoteDetailModal
          detail={detail}
          onClose={() => setDetail(null)}
          onUpdateStatus={(id, status) => updateStatus.mutate({ id, status })}
        />
      )}

      {convertModal && (
        <QuoteConvertModal
          quote={convertModal}
          onClose={() => setConvertModal(null)}
          onSubmit={(id, data) => convert.mutate({ id, ...data })}
          isPending={convert.isPending}
        />
      )}
    </div>
  )
}
