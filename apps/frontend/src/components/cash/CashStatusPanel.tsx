import { useState } from 'react'
import { inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'

interface CashStatusPanelProps {
  summary: any
  isLoading: boolean
  onOpen: (balance: number) => void
  onClose: (notes: string, counted: number | undefined) => void
  isPendingOpen: boolean
  isPendingClose: boolean
}

export function CashStatusPanel({ summary, isLoading, onOpen, onClose, isPendingOpen, isPendingClose }: CashStatusPanelProps) {
  const [openingBalance, setOpeningBalance] = useState('0')
  const [closeNotes, setCloseNotes] = useState('')
  const [countedBalance, setCountedBalance] = useState('')

  const isOpen = !!summary?.session
  const expected = isOpen ? summary.currentBalance : 0
  const counted = countedBalance !== '' ? Number(countedBalance) : null
  const diff = counted !== null ? counted - expected : null

  function handleClose() {
    if (confirm('¿Cerrar la caja?')) {
      onClose(closeNotes || '', countedBalance !== '' ? Number(countedBalance) : undefined)
      setCloseNotes('')
      setCountedBalance('')
    }
  }

  return (
    <div style={{ background: isOpen ? 'linear-gradient(135deg,#0f172a,#1e3a5f)' : 'white', borderRadius: '16px', padding: '28px', marginBottom: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', border: isOpen ? 'none' : '1px solid #f1f5f9' }}>
      {isLoading ? (
        <div style={{ color: '#94a3b8' }}>Cargando...</div>
      ) : isOpen ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80' }} />
                <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>CAJA ABIERTA</span>
              </div>
              <div style={{ color: 'white', fontSize: '13px' }}>
                Desde {new Date(summary.session.openedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#94a3b8', fontSize: '12px' }}>Balance actual</div>
              <div style={{ color: 'white', fontSize: '28px', fontWeight: 700 }}>
                ${Number(summary.currentBalance).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            {[
              { label: 'Saldo inicial', value: summary.session.openingBalance, icon: '💰' },
              { label: `Ventas (${summary.salesCount})`, value: summary.salesTotal.toFixed(2), icon: '📈', positive: true },
              { label: `Gastos (${summary.expensesCount})`, value: summary.expensesTotal.toFixed(2), icon: '📉', negative: true },
              { label: 'Depósitos', value: summary.depositos?.toFixed(2) || '0.00', icon: '⬆️', positive: true },
              { label: 'Retiros', value: summary.retiros?.toFixed(2) || '0.00', icon: '⬇️', negative: true },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '12px 14px' }}>
                <div style={{ fontSize: '18px', marginBottom: '4px' }}>{s.icon}</div>
                <div style={{ color: '#94a3b8', fontSize: '10px', marginBottom: '3px' }}>{s.label}</div>
                <div style={{ color: s.positive ? '#4ade80' : s.negative ? '#f87171' : 'white', fontSize: '14px', fontWeight: 700 }}>
                  ${Number(s.value).toLocaleString('es-AR')}
                </div>
              </div>
            ))}
          </div>

          {summary.depositsByRubro?.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
              <div style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase' }}>Ingresos por rubro</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {summary.depositsByRubro.map((r: { rubro: string; total: number }) => (
                  <div key={r.rubro} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '8px', padding: '8px 12px' }}>
                    <div style={{ color: '#94a3b8', fontSize: '10px', marginBottom: '2px' }}>{r.rubro}</div>
                    <div style={{ color: '#4ade80', fontSize: '14px', fontWeight: 700 }}>${Number(r.total).toLocaleString('es-AR')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {summary.movements?.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
              <div style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase' }}>Movimientos manuales</div>
              {summary.movements.map((m: any) => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'white', paddingBottom: '6px', marginBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ color: '#94a3b8' }}>{new Date(m.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} · {m.reason || m.type}</span>
                  <span style={{ color: m.type === 'deposito' ? '#4ade80' : '#f87171', fontWeight: 700 }}>
                    {m.type === 'deposito' ? '+' : '-'}${Number(m.amount).toLocaleString('es-AR')}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>Efectivo contado ($)</label>
              <input type="number" placeholder="Opcional — para arqueo"
                value={countedBalance} onChange={e => setCountedBalance(e.target.value)}
                style={{ ...inputStyle, background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.1)', color: 'white', width: '100%' }} />
              {diff !== null && (
                <div style={{ fontSize: '11px', marginTop: '4px', fontWeight: 600, color: Math.abs(diff) < 1 ? '#4ade80' : diff > 0 ? '#4ade80' : '#f87171' }}>
                  {diff >= 0 ? `Sobrante: +$${diff.toFixed(2)}` : `Faltante: -$${Math.abs(diff).toFixed(2)}`}
                </div>
              )}
            </div>
            <input placeholder="Notas de cierre (opcional)"
              value={closeNotes} onChange={e => setCloseNotes(e.target.value)}
              style={{ ...inputStyle, background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }} />
            <button onClick={handleClose} style={{ ...btnSecondary, background: '#fef2f2', color: '#dc2626', whiteSpace: 'nowrap' }} disabled={isPendingClose}>
              Cerrar caja
            </button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔒</div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>Caja cerrada</h3>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>Abrí la caja para empezar a registrar ventas del día</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Saldo inicial ($)</label>
              <input type="number" value={openingBalance} onChange={e => setOpeningBalance(e.target.value)} style={{ ...inputStyle, width: '160px' }} />
            </div>
            <button onClick={() => onOpen(Number(openingBalance))} style={{ ...btnPrimary, marginTop: '16px' }} disabled={isPendingOpen}>
              Abrir caja
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
