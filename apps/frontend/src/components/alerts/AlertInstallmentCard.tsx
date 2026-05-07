interface InstallmentItem {
  id: number; saleId: number; number: number; amount: string
  dueDate: string; clientName: string | null; saleNumber: string | null
}

interface Props {
  item: InstallmentItem
  variant: 'overdue' | 'upcoming'
  onPay: (id: number) => void
  isPaying: boolean
}

function fmt(n: string) { return '$' + Number(n).toLocaleString('es-AR') }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) }

export function AlertInstallmentCard({ item: i, variant, onPay, isPaying }: Props) {
  const days = Math.ceil((new Date(i.dueDate).getTime() - Date.now()) / 86400000)
  const isOverdue = variant === 'overdue'
  const accent = isOverdue ? '#dc2626' : '#d97706'
  const bg     = isOverdue ? '#fef2f2' : '#fffbeb'
  const border = isOverdue ? '#fecaca' : '#fde68a'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: bg, borderRadius: '8px', border: `1px solid ${border}` }}>
      <div style={{ width: '36px', height: '36px', background: accent, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '15px', flexShrink: 0 }}>
        {isOverdue ? '⚠' : '📅'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#0f172a' }}>{i.clientName || '—'} · Cuota {i.number}</div>
        <div style={{ fontSize: '12px', color: '#64748b' }}>
          Venta {i.saleNumber || '#' + i.saleId} ·{' '}
          {isOverdue ? `Venció ${fmtDate(i.dueDate)} (hace ${Math.abs(days)} días)` : `Vence ${fmtDate(i.dueDate)} (en ${days} días)`}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontWeight: 700, color: accent, fontSize: '14px' }}>{fmt(i.amount)}</div>
      </div>
      <button
        onClick={() => { if (confirm(`¿Marcar cuota ${i.number} como pagada?`)) onPay(i.id) }}
        disabled={isPaying}
        style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 600, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '7px', cursor: isPaying ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
        ✓ Cobrar
      </button>
    </div>
  )
}
