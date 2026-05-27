import { useState } from 'react'
import { Modal } from '../ui/Modal'
import type { CreditDetail } from '../../hooks/useCredits'

interface Props {
  detail: CreditDetail
  onClose: () => void
  onAddPayment: () => void
  onEdit: () => void
  onDelete: () => void
  onRemovePayment: (paymentId: number) => void
  isAdmin: boolean
}

interface HistoryItem {
  date: string
  type: 'carga' | 'interes' | 'pago'
  amount: number
  balanceAfter?: number
  notes?: string | null
  id?: number
}

export function CreditDetailModal({ detail, onClose, onAddPayment, onEdit, onDelete, onRemovePayment, isAdmin }: Props) {
  const [showHistory, setShowHistory] = useState(true)
  const sym = detail.currency === 'usd' ? 'US$' : '$'

  const items: HistoryItem[] = []
  items.push({ date: detail.startDate, type: 'carga', amount: Number(detail.originalAmount), notes: detail.notes })
  for (const p of detail.payments) items.push({ date: p.paymentDate, type: 'pago', amount: Number(p.amount), notes: p.notes, id: p.id })
  for (const c of detail.charges) items.push({ date: c.chargeDate, type: 'interes', amount: Number(c.amount) })
  items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  let running = 0
  for (const it of items) {
    running = it.type === 'pago' ? running - it.amount : running + it.amount
    it.balanceAfter = running
  }
  const sorted = [...items].reverse()

  return (
    <Modal title={`Crédito · ${detail.client?.name || ''}`} onClose={onClose} width={680}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
          <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Monto original</div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>{sym}{Number(detail.originalAmount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
          </div>
          <div style={{ background: detail.balance > 0 ? '#fef2f2' : '#f0fdf4', padding: '12px 14px', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Saldo actual</div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: detail.balance > 0 ? '#dc2626' : '#16a34a', marginTop: '4px' }}>{sym}{detail.balance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
          </div>
          <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Tasa mensual</div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>{detail.interestRate}%</div>
          </div>
          <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Inicio</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>{new Date(detail.startDate).toLocaleDateString('es-AR')}</div>
          </div>
        </div>

        {detail.notes && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', color: '#78350f' }}>
            {detail.notes}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {detail.status === 'activo' && (
            <button onClick={onAddPayment} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600, background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              + Registrar pago
            </button>
          )}
          <button onClick={onEdit} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600, background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            Editar
          </button>
          {isAdmin && (
            <button onClick={onDelete} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600, background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              Eliminar crédito
            </button>
          )}
        </div>

        <div>
          <button onClick={() => setShowHistory(s => !s)} style={{ fontSize: '13px', fontWeight: 600, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: '8px' }}>
            {showHistory ? '▼' : '▶'} Historial ({items.length} movimientos)
          </button>
          {showHistory && (
            <div style={{ border: '1px solid #f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
              {sorted.map((it, idx) => (
                <div key={idx} style={{ padding: '10px 14px', borderBottom: idx < sorted.length - 1 ? '1px solid #f8fafc' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: it.type === 'pago' ? '#f0fdf4' : it.type === 'interes' ? '#fffbeb' : 'white' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: it.type === 'pago' ? '#16a34a' : it.type === 'interes' ? '#d97706' : '#475569', textTransform: 'uppercase' }}>
                      {it.type === 'pago' ? 'Pago' : it.type === 'interes' ? 'Interés' : 'Carga inicial'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{new Date(it.date).toLocaleDateString('es-AR')}</div>
                    {it.notes && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{it.notes}</div>}
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: it.type === 'pago' ? '#16a34a' : '#0f172a' }}>
                        {it.type === 'pago' ? '-' : '+'}{sym}{it.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>Saldo: {sym}{(it.balanceAfter || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
                    </div>
                    {it.type === 'pago' && isAdmin && it.id !== undefined && (
                      <button onClick={() => { if (confirm('¿Eliminar este pago?')) onRemovePayment(it.id!) }} style={{ padding: '3px 8px', fontSize: '11px', fontWeight: 600, background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>×</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
