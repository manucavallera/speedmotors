import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Modal } from '../ui/Modal'
import { type ClientFile } from '../../types/guarderia.types'

interface Props {
  clientId: number
  onClose: () => void
  onSaldar: (chargeId: number) => void
}

const fmt = (n: number) => '$' + n.toLocaleString('es-AR')
const fmtDate = (s: string) => new Date(s).toLocaleDateString('es-AR')

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '8px' }}>{title}</div>
      {children}
    </div>
  )
}

const card: React.CSSProperties = {
  background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 12px',
}

// Todo lo del cliente en un solo lugar: sus lanchas, lo que debe, qué pagó y cuándo navegó
export function ClientFileModal({ clientId, onClose, onSaldar }: Props) {
  const { data, isLoading } = useQuery<ClientFile>({
    queryKey: ['guarderia', 'clientFile', clientId],
    queryFn: () => api.get(`/guarderia/clients/${clientId}`).then(r => r.data),
  })

  if (isLoading || !data) {
    return <Modal title="Ficha del cliente" onClose={onClose}><div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Cargando...</div></Modal>
  }

  const { client, debt, units, charges, salidas } = data
  const activas = units.filter(u => u.status === 'en_guarderia')

  return (
    <Modal title={`Ficha — ${client.name}`} onClose={onClose} width={640}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <div style={{ ...card, flex: 1, minWidth: '130px' }}>
          <div style={{ fontSize: '19px', fontWeight: 700, color: '#0f172a' }}>{activas.length}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>lancha{activas.length === 1 ? '' : 's'} en guardería</div>
        </div>
        <div style={{ ...card, flex: 1, minWidth: '130px', background: debt > 0 ? '#fef2f2' : '#f0fdf4', borderColor: debt > 0 ? '#fecaca' : '#bbf7d0' }}>
          <div style={{ fontSize: '19px', fontWeight: 700, color: debt > 0 ? '#dc2626' : '#16a34a' }}>{fmt(debt)}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{debt > 0 ? 'debe' : 'al día'}</div>
        </div>
        {client.phone && (
          <a
            href={`https://wa.me/${client.phone.replace(/\D/g, '')}`}
            target="_blank"
            rel="noreferrer"
            style={{ ...card, display: 'flex', alignItems: 'center', fontSize: '13px', fontWeight: 600, color: '#16a34a', background: '#f0fdf4', borderColor: '#bbf7d0', textDecoration: 'none' }}
          >
            WhatsApp · {client.phone}
          </a>
        )}
      </div>

      <Block title="SUS LANCHAS">
        {units.length === 0 && <div style={{ ...card, color: '#94a3b8', fontSize: '13px' }}>No tiene lanchas cargadas.</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {units.map(u => (
            <div key={u.id} style={{ ...card, opacity: u.status === 'en_guarderia' ? 1 : 0.55 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#0f172a' }}>{u.description}</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{fmt(Number(u.rate))}/mes</span>
              </div>
              <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                {u.status === 'en_guarderia' ? (u.spotCode ? `Cuna ${u.spotCode}` : 'Sobre trailer') : 'Retirada'}
                {u.categoryName && ` · ${u.categoryName}`}
                {u.hp != null && ` · ${u.hp} HP`}
                {u.lengthM != null && ` · ${Number(u.lengthM)} m`}
                {` · desde ${fmtDate(u.entryDate)}`}
              </div>
            </div>
          ))}
        </div>
      </Block>

      <Block title="COBROS">
        {charges.length === 0 && <div style={{ ...card, color: '#94a3b8', fontSize: '13px' }}>Todavía no se le cobró nada.</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
          {charges.map(c => (
            <div key={c.id} style={{ ...card, background: c.paidAt ? '#f8fafc' : '#fef2f2', borderColor: c.paidAt ? '#e2e8f0' : '#fecaca' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: 600 }}>
                  {c.periodLabel ?? fmtDate(c.chargeDate)}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: c.paidAt ? '#16a34a' : '#dc2626' }}>
                    {fmt(Number(c.amount))} {c.paidAt ? '✓' : ''}
                  </span>
                  {!c.paidAt && (
                    <button
                      onClick={() => onSaldar(c.id)}
                      style={{ fontSize: '11px', fontWeight: 600, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '3px 8px', cursor: 'pointer' }}
                    >Saldar</button>
                  )}
                </span>
              </div>
              {c.items.length > 0 && (
                <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                  {c.items.map(it => `${it.concept} ${fmt(Number(it.amount))}`).join(' · ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </Block>

      <Block title="SALIDAS AL AGUA">
        {salidas.length === 0 && <div style={{ ...card, color: '#94a3b8', fontSize: '13px' }}>Nunca reservó una salida.</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
          {salidas.map(s => (
            <div key={s.id} style={{ ...card, display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
              <span style={{ fontSize: '12.5px', color: '#0f172a' }}>
                {fmtDate(s.date)} · {s.startTime}
                <span style={{ color: '#94a3b8' }}> — {s.boatName ?? ''}</span>
              </span>
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: s.paidAt ? '#16a34a' : '#94a3b8' }}>
                {Number(s.price) > 0 ? fmt(Number(s.price)) : '—'}
              </span>
            </div>
          ))}
        </div>
      </Block>
    </Modal>
  )
}
