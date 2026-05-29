import { useState } from 'react'
import { Modal } from '../ui/Modal'
import type { CreditDetail } from '../../hooks/useCredits'
import { generateCreditStatement } from '../../lib/pdf/credit'

interface Props {
  detail: CreditDetail
  onClose: () => void
  onAddPayment: () => void
  onEdit: () => void
  onDelete: () => void
  onRemovePayment: (paymentId: number) => void
  onPayInstallment: (installmentId: number, paymentDate: string) => void
  onUnpayInstallment: (installmentId: number) => void
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

export function CreditDetailModal({ detail, onClose, onAddPayment, onEdit, onDelete, onRemovePayment, onPayInstallment, onUnpayInstallment, isAdmin }: Props) {
  const [showHistory, setShowHistory] = useState(true)
  const sym = detail.currency === 'usd' ? 'US$' : '$'
  const isCuotas = detail.creditType === 'cuotas_simples'

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

  const fmt = (n: number) => `${sym}${n.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
  const today = new Date()

  return (
    <Modal title={`Crédito · ${detail.client?.name || ''}`} onClose={onClose} width={720}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
          <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{isCuotas ? 'Capital' : 'Monto original'}</div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>{fmt(Number(detail.originalAmount))}</div>
          </div>
          <div style={{ background: detail.balance > 0 ? '#fef2f2' : '#f0fdf4', padding: '12px 14px', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Saldo actual</div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: detail.balance > 0 ? '#dc2626' : '#16a34a', marginTop: '4px' }}>{fmt(detail.balance)}</div>
          </div>
          <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Tasa mensual</div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>{detail.interestRate}%</div>
          </div>
          <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{isCuotas ? 'Primera cuota' : 'Inicio'}</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>{new Date(isCuotas && detail.firstDueDate ? detail.firstDueDate : detail.startDate).toLocaleDateString('es-AR')}</div>
          </div>
          {isCuotas && (
            <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Cuotas</div>
              <div style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                {detail.installments.filter(i => i.paidAt).length}/{detail.installmentsCount}
              </div>
            </div>
          )}
        </div>

        {detail.notes && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', color: '#78350f' }}>
            {detail.notes}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {detail.status === 'activo' && !isCuotas && (
            <button onClick={onAddPayment} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600, background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              + Registrar pago
            </button>
          )}
          <button onClick={() => generateCreditStatement(detail)} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '8px', cursor: 'pointer' }}>
            PDF estado de cuenta
          </button>
          <button onClick={onEdit} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600, background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            Editar
          </button>
          {isAdmin && (
            <button onClick={onDelete} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600, background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              Eliminar crédito
            </button>
          )}
        </div>

        {isCuotas && detail.installments.length > 0 && (
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
              Plan de cuotas
            </div>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '40px 1.2fr 1fr 1fr 80px 110px', background: '#f8fafc', padding: '8px 12px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                <div>Nro</div>
                <div>Vencimiento</div>
                <div>Monto</div>
                <div>Recargo</div>
                <div>Pagada</div>
                <div style={{ textAlign: 'right' }}>Acción</div>
              </div>
              {detail.installments.map(inst => {
                const due = new Date(inst.dueDate)
                const overdue = !inst.paidAt && due < today
                const surcharge = Number(inst.surcharge)
                const alertDate = new Date(due); alertDate.setDate(alertDate.getDate() - 10)
                const soon = !inst.paidAt && today >= alertDate && today <= due
                return (
                  <div key={inst.id} style={{
                    display: 'grid', gridTemplateColumns: '40px 1.2fr 1fr 1fr 80px 110px',
                    padding: '10px 12px', fontSize: '13px', borderTop: '1px solid #f1f5f9',
                    background: inst.paidAt ? '#f0fdf4' : overdue ? '#fef2f2' : soon ? '#fffbeb' : 'white',
                    alignItems: 'center',
                  }}>
                    <div style={{ fontWeight: 600, color: '#475569' }}>{inst.number}</div>
                    <div>
                      <div style={{ color: '#0f172a' }}>{due.toLocaleDateString('es-AR')}</div>
                      {inst.paidAt && <div style={{ fontSize: '11px', color: '#16a34a' }}>Pagada: {new Date(inst.paidAt).toLocaleDateString('es-AR')}</div>}
                      {overdue && !inst.paidAt && <div style={{ fontSize: '11px', color: '#dc2626' }}>Vencida</div>}
                      {soon && <div style={{ fontSize: '11px', color: '#d97706' }}>Vence pronto</div>}
                    </div>
                    <div style={{ fontWeight: 600 }}>{fmt(Number(inst.amount))}</div>
                    <div style={{ color: surcharge > 0 ? '#dc2626' : '#94a3b8' }}>
                      {surcharge > 0 ? fmt(surcharge) : '—'}
                    </div>
                    <div>
                      {inst.paidAt ? (
                        <span style={{ display: 'inline-block', padding: '2px 8px', fontSize: '11px', fontWeight: 600, background: '#dcfce7', color: '#166534', borderRadius: '12px' }}>SI</span>
                      ) : (
                        <span style={{ display: 'inline-block', padding: '2px 8px', fontSize: '11px', fontWeight: 600, background: '#f1f5f9', color: '#64748b', borderRadius: '12px' }}>NO</span>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {!inst.paidAt && detail.status === 'activo' && (
                        <button onClick={() => {
                          const d = prompt('Fecha de pago (YYYY-MM-DD)', new Date().toISOString().slice(0, 10))
                          if (d) onPayInstallment(inst.id, new Date(d).toISOString())
                        }} style={{ padding: '5px 10px', fontSize: '11px', fontWeight: 600, background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                          Marcar pagada
                        </button>
                      )}
                      {inst.paidAt && isAdmin && (
                        <button onClick={() => { if (confirm('¿Desmarcar esta cuota?')) onUnpayInstallment(inst.id) }} style={{ padding: '5px 10px', fontSize: '11px', fontWeight: 600, background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                          Desmarcar
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

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
                        {it.type === 'pago' ? '-' : '+'}{fmt(it.amount)}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>Saldo: {fmt(it.balanceAfter || 0)}</div>
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
