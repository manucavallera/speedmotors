import type { Reminder } from '../../hooks/useAlerts'

const typeLabel: Record<string, string> = { impuesto: 'Impuesto', factura: 'Factura', vencimiento: 'Vencimiento', otro: 'Otro' }
const typeColor: Record<string, { bg: string; color: string }> = {
  impuesto:    { bg: '#fef3c7', color: '#d97706' },
  factura:     { bg: '#ede9fe', color: '#7c3aed' },
  vencimiento: { bg: '#dbeafe', color: '#2563eb' },
  otro:        { bg: '#f1f5f9', color: '#475569' },
}
const recLabel: Record<string, string> = { ninguna: '', mensual: '· Mensual', trimestral: '· Trimestral', anual: '· Anual' }

function fmtDate(d: string) { return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) }

interface Props {
  item: Reminder
  onEdit: (r: Reminder) => void
  onMarkDone: (id: number) => void
  onDelete: (id: number) => void
}

export function AlertReminderCard({ item: r, onEdit, onMarkDone, onDelete }: Props) {
  const tc = typeColor[r.type] || typeColor.otro
  const days = Math.ceil((new Date(r.dueDate).getTime() - Date.now()) / 86400000)
  const isOverdue = r.status === 'vencido'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: isOverdue ? '#fef2f2' : '#f8fafc', borderRadius: '10px', border: `1px solid ${isOverdue ? '#fecaca' : '#f1f5f9'}` }}>
      <span style={{ background: tc.bg, color: tc.color, fontSize: '10.5px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px', flexShrink: 0 }}>
        {typeLabel[r.type]}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
        <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
          {fmtDate(r.dueDate)}
          {isOverdue ? ` · Venció hace ${Math.abs(days)} día${Math.abs(days) !== 1 ? 's' : ''}` : days <= 0 ? ' · Hoy' : ` · en ${days} día${days !== 1 ? 's' : ''}`}
          {r.recurrence !== 'ninguna' && ` ${recLabel[r.recurrence]}`}
        </div>
      </div>
      {r.amount && <div style={{ fontWeight: 700, color: isOverdue ? '#dc2626' : '#0f172a', fontSize: '14px', flexShrink: 0 }}>${Number(r.amount).toLocaleString('es-AR')}</div>}
      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
        <button onClick={() => onMarkDone(r.id)}
          style={{ padding: '4px 10px', fontSize: '11.5px', fontWeight: 600, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', cursor: 'pointer' }}>
          ✓ Pagar
        </button>
        <button onClick={() => onEdit(r)}
          style={{ padding: '4px 10px', fontSize: '11.5px', fontWeight: 600, background: '#f8fafc', color: '#374151', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer' }}>
          Editar
        </button>
        <button onClick={() => { if (confirm('¿Eliminar este recordatorio?')) onDelete(r.id) }}
          style={{ padding: '4px 8px', fontSize: '12px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}>
          ×
        </button>
      </div>
    </div>
  )
}
