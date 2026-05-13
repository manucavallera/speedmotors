import { useState } from 'react'
import { InfoBanner } from '../components/ui/InfoBanner'
import { useTransfers } from '../hooks/useTransfers'
import type { Transfer } from '../hooks/useTransfers'
import { TransferFormModal } from '../components/transfers/TransferFormModal'
import { TransferDetailModal } from '../components/transfers/TransferDetailModal'
import { Pagination } from '../components/ui/Pagination'

const statusStyles: Record<string, { bg: string; color: string; label: string }> = {
  pendiente:  { bg: '#fef3c7', color: '#d97706', label: 'Pendiente' },
  en_tramite: { bg: '#dbeafe', color: '#2563eb', label: 'En trámite' },
  completada: { bg: '#dcfce7', color: '#16a34a', label: 'Completada' },
  cancelada:  { bg: '#fee2e2', color: '#dc2626', label: 'Cancelada' },
}

function fmt(n?: string | null) { return n && Number(n) > 0 ? '$' + Number(n).toLocaleString('es-AR') : null }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) }

export function TransfersPage() {
  const { list, total, page, pages, setPage, create, update, remove } = useTransfers()
  const [modal, setModal] = useState<'new' | 'edit' | 'detail' | null>(null)
  const [selected, setSelected] = useState<Transfer | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const transfers = list.data?.items ?? []
  const filtered = transfers.filter(t => {
    const matchSearch = !search || t.clientName.toLowerCase().includes(search.toLowerCase()) || (t.transferNumber ?? '').toLowerCase().includes(search.toLowerCase()) || (t.vehicleLabel ?? '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || t.status === statusFilter
    return matchSearch && matchStatus
  })

  function openDetail(t: Transfer) { setSelected(t); setModal('detail') }
  function openEdit(t: Transfer) { setSelected(t); setModal('edit') }

  return (
    <div style={{ maxWidth: '960px' }}>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Transferencias de dominio</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '2px' }}>Gestión de trámites de transferencia de vehículos</p>
        </div>
        <button onClick={() => { setSelected(null); setModal('new') }}
          style={{ padding: '9px 18px', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: 'white', border: 'none', borderRadius: '9px', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
          + Nueva transferencia
        </button>
      </div>

      <InfoBanner title="Transferencias de dominio">
        Trámites para pasar la titularidad de un vehículo al comprador. Registrá el número de RNP, los costos del trámite y seguí el estado: <strong>Pendiente → En trámite → Completada</strong>. Así sabés qué transferencias están demoradas y cuánto cobrar por el servicio.
      </InfoBanner>

      <div className="filter-bar" style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div className="filter-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>BUSCAR</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cliente, vehículo o número..."
            style={{ padding: '7px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', minWidth: '180px', flex: 1 }} />
        </div>
        <div className="filter-sep" style={{ width: '1px', background: '#e2e8f0', alignSelf: 'stretch' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>ESTADO</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => setStatusFilter('')}
              style={{ padding: '6px 12px', borderRadius: '9px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: statusFilter === '' ? '1.5px solid #2563eb' : '1.5px solid #e2e8f0', background: statusFilter === '' ? '#eff6ff' : '#fff', color: statusFilter === '' ? '#2563eb' : '#374151' }}>
              Todos
            </button>
            {Object.entries(statusStyles).map(([v, s]) => (
              <button key={v} onClick={() => setStatusFilter(v)}
                style={{ padding: '6px 12px', borderRadius: '9px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: statusFilter === v ? `1.5px solid ${s.color}` : '1.5px solid #e2e8f0', background: statusFilter === v ? s.bg : '#fff', color: statusFilter === v ? s.color : '#374151' }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {list.isLoading && <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>Cargando...</div>}

      {!list.isLoading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#94a3b8' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
          <div style={{ fontSize: '15px', fontWeight: 600 }}>Sin transferencias</div>
          <div style={{ fontSize: '13px', marginTop: '4px' }}>Creá la primera transferencia de dominio</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.map(t => {
          const st = statusStyles[t.status] ?? statusStyles.pendiente
          const cost = fmt(t.totalCost)
          return (
            <div key={t.id} onClick={() => openDetail(t)}
              style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px 20px', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', background: '#f1f5f9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, marginTop: '2px' }}>📄</div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#94a3b8', fontFamily: 'monospace' }}>{t.transferNumber ?? `#${t.id}`}</span>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>{t.clientNameResolved ?? t.clientName}</span>
                    <span style={{ background: st.bg, color: st.color, fontSize: '11px', fontWeight: 700, padding: '2px 9px', borderRadius: '20px' }}>{st.label}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{t.vehicleLabel ?? 'Sin vehículo'}</span>
                    <span style={{ color: '#cbd5e1' }}>·</span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{fmtDate(t.date)}</span>
                    {t.rnpNumber && <>
                      <span style={{ color: '#cbd5e1' }}>·</span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>RNP: {t.rnpNumber}</span>
                    </>}
                    {cost && <>
                      <span style={{ color: '#cbd5e1' }}>·</span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{cost}</span>
                    </>}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => openEdit(t)}
                    style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, background: '#f8fafc', color: '#374151', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}>
                    Editar
                  </button>
                  <button onClick={() => { if (confirm('¿Eliminar transferencia?')) remove.mutate(t.id) }}
                    style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                    Eliminar
                  </button>
                </div>
              </div>

            </div>
          )
        })}
      </div>
      <Pagination page={page} pages={pages} total={total} onPage={setPage} />

      {modal === 'new' && (
        <TransferFormModal editing={null} onClose={() => setModal(null)}
          onSubmit={d => create.mutate(d, { onSuccess: () => setModal(null) })}
          isPending={create.isPending} />
      )}
      {modal === 'edit' && selected && (
        <TransferFormModal editing={selected} onClose={() => setModal(null)}
          onSubmit={d => update.mutate({ id: selected.id, data: d }, { onSuccess: () => setModal(null) })}
          isPending={update.isPending} />
      )}
      {modal === 'detail' && selected && (
        <TransferDetailModal transfer={selected} onClose={() => setModal(null)} onEdit={() => setModal('edit')} />
      )}
    </div>
  )
}
