import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { toast } from '../lib/toast'
import { InfoBanner } from '../components/ui/InfoBanner'
import { btnPrimary, inputStyle } from '../components/ui/FormField'
import { ReservationFormModal } from '../components/reservations/ReservationFormModal'
import { ReservationDetailModal } from '../components/reservations/ReservationDetailModal'
import { SaleFormModal } from '../components/sales/SaleFormModal'
import { useReservations } from '../hooks/useReservations'
import { Pagination } from '../components/ui/Pagination'

const statusColors: Record<string, { bg: string; color: string; label: string }> = {
  vigente:    { bg: '#fffbeb', color: '#d97706', label: 'Vigente' },
  concretada: { bg: '#f0fdf4', color: '#16a34a', label: 'Concretada' },
  cancelada:  { bg: '#fef2f2', color: '#dc2626', label: 'Cancelada' },
}

export function ReservationsPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<'new' | 'edit' | false>(false)
  const [editing, setEditing] = useState<any>(null)
  const [detail, setDetail] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [saleModal, setSaleModal] = useState<{ clientId?: number; vehicleId?: number; downPayment?: number } | null>(null)

  const { list, total, page, pages, setPage, create, update, changeStatus, remove } = useReservations({ search, status: statusFilter })
  const filtered = list.data?.items ?? []

  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.get('/clients').then(r => r.data),
  })
  const clients = clientsData?.items ?? clientsData ?? []

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then(r => r.data),
  })
  const products = productsData?.items ?? productsData ?? []

  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles', 'disponible'],
    queryFn: () => api.get('/vehicles', { params: { status: 'disponible' } }).then(r => r.data),
  })
  const vehicles = vehiclesData?.items ?? []

  const createSale = useMutation({
    mutationFn: (data: any) => api.post('/sales', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sales'] }); setSaleModal(null); toast.success('Venta registrada') },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error inesperado'),
  })

  function openEdit(r: any) { setEditing(r); setDetail(null); setModal('edit') }
  function openSaleFromReservation(r: any) {
    setSaleModal({
      clientId: r.clientId ?? undefined,
      vehicleId: r.vehicleId ?? undefined,
      downPayment: r.depositAmount ? Number(r.depositAmount) : 0,
    })
    setDetail(null)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Solicitudes de Reserva</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '2px' }}>{total} reservas{pages > 1 ? ` · pág. ${page}/${pages}` : ''}</p>
        </div>
        <button onClick={() => { setEditing(null); setModal('new') }} style={btnPrimary}>
          + Nueva reserva
        </button>
      </div>

      <InfoBanner title="Reservas de vehículos">
        Registrá la solicitud de reserva con datos del comprador, cónyuge y vehículo. Generá el documento en <strong>PDF formal</strong> para firma o usá <strong>Imprimir</strong> para obtener una copia en papel.
      </InfoBanner>

      <div className="filter-bar" style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '180px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Buscar cliente</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nombre..." style={{ ...inputStyle }} />
        </div>
        <div className="filter-sep" style={{ width: '1px', background: '#e2e8f0', alignSelf: 'stretch' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Estado</span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {([['', 'Todos'], ['vigente', 'Vigente'], ['concretada', 'Concretada'], ['cancelada', 'Cancelada']] as [string, string][]).map(([val, lbl]) => (
              <button key={val} onClick={() => setStatusFilter(val)}
                style={{ padding: '7px 14px', borderRadius: '9px', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer', background: statusFilter === val ? '#1d4ed8' : '#f1f5f9', color: statusFilter === val ? 'white' : '#374151' }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
        {list.isLoading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Sin reservas registradas</div>
        ) : (
          <div className="table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                {['N°', 'Fecha', 'Comprador', 'Vehículo', 'Seña', 'Estado', ''].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r: any) => {
                const st = statusColors[r.status] || statusColors.vigente
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f8fafc', cursor: 'pointer' }}
                    onClick={() => setDetail(r)}>
                    <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#7c3aed' }}>{r.reservationNumber || `#${r.id}`}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#374151' }}>{new Date(r.date || r.createdAt).toLocaleDateString('es-AR')}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#0f172a' }}>{r.clientName}</div>
                      {r.clientDni && <div style={{ fontSize: '12px', color: '#94a3b8' }}>DNI {r.clientDni}</div>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 500, fontSize: '13.5px', color: '#0f172a' }}>{r.brand} {r.model || ''}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{r.vehicleType === 'lancha' ? 'Lancha' : 'Moto'}{r.year ? ` · ${r.year}` : ''}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#16a34a' }}>
                      {r.depositAmount ? `$${Number(r.depositAmount).toLocaleString('es-AR')}` : '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: st.bg, color: st.color, fontWeight: 600, fontSize: '11px', padding: '3px 10px', borderRadius: '20px' }}>
                        {st.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {r.status === 'vigente' && (
                          <button onClick={() => openSaleFromReservation(r)}
                            style={{ padding: '4px 10px', fontSize: '12px', background: '#f0fdf4', color: '#16a34a', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                            Registrar venta
                          </button>
                        )}
                        <button onClick={() => { if (window.confirm('¿Eliminar esta reserva?')) remove.mutate(r.id) }}
                          style={{ padding: '4px 10px', fontSize: '12px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                          ×
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>
      <Pagination page={page} pages={pages} total={total} onPage={setPage} />

      {detail && (
        <ReservationDetailModal
          detail={detail}
          onClose={() => setDetail(null)}
          onEdit={() => openEdit(detail)}
          onChangeStatus={(id, status) => { changeStatus.mutate({ id, status }); setDetail(null) }}
          isPending={changeStatus.isPending}
        />
      )}

      {saleModal && (
        <SaleFormModal
          clients={clients}
          products={products}
          vehicles={vehicles}
          initialData={saleModal}
          onClose={() => setSaleModal(null)}
          onSubmit={(data) => createSale.mutate(data)}
          isPending={createSale.isPending}
        />
      )}

      {modal && (
        <ReservationFormModal
          mode={modal}
          editing={editing}
          clients={clients}
          onClose={() => { setModal(false); setEditing(null) }}
          onSubmit={(data) => {
            if (modal === 'edit') {
              update.mutate({ id: editing.id, data }, { onSuccess: () => { setModal(false); setEditing(null) } })
            } else {
              create.mutate(data, { onSuccess: () => setModal(false) })
            }
          }}
          isPending={create.isPending || update.isPending}
        />
      )}
    </div>
  )
}
