// Lista TODAS las cuotas pendientes del cliente (próximas + vencidas). Vencidas en rojo con botón Cobrar.
interface OverdueInstallmentsProps {
  items: any[]
  onPay: (inst: any) => void
}

export function OverdueInstallments({ items, onPay }: OverdueInstallmentsProps) {
  if (items.length === 0) return null
  const now = new Date()
  const isOverdue = (i: any) => new Date(i.dueDate) < now
  const overdueCount = items.filter(isOverdue).length

  return (
    <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px 16px', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>
        Cuotas pendientes ({items.length}){overdueCount > 0 && <span style={{ color: '#dc2626', marginLeft: '6px' }}>· {overdueCount} vencida{overdueCount > 1 ? 's' : ''}</span>}
      </div>
      {items.map((inst: any) => {
        const overdue = isOverdue(inst)
        return (
          <div key={inst.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', paddingBottom: '6px', marginBottom: '6px', borderBottom: '1px solid #e2e8f0' }}>
            <span style={{ color: overdue ? '#dc2626' : '#374151' }}>
              Cuota {inst.number} · {overdue ? 'Vencida el' : 'Vence'} {new Date(inst.dueDate).toLocaleDateString('es-AR', { timeZone: 'UTC' })} · Venta #{inst.saleId}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, color: overdue ? '#dc2626' : '#0f172a' }}>${Number(inst.amount).toLocaleString('es-AR')}</span>
              <button onClick={() => onPay(inst)}
                style={{ padding: '3px 10px', fontSize: '11px', fontWeight: 600, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', cursor: 'pointer' }}>
                Cobrar
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
