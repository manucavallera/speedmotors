interface OverdueInstallmentsProps {
  items: any[]
  onPay: (inst: any) => void
}

export function OverdueInstallments({ items, onPay }: OverdueInstallmentsProps) {
  if (items.length === 0) return null
  return (
    <div style={{ background: '#fef2f2', borderRadius: '10px', padding: '14px 16px', border: '1px solid #fecaca' }}>
      <div style={{ fontSize: '13px', fontWeight: 700, color: '#dc2626', marginBottom: '10px' }}>
        Cuotas vencidas ({items.length})
      </div>
      {items.map((inst: any) => (
        <div key={inst.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', paddingBottom: '6px', marginBottom: '6px', borderBottom: '1px solid #fecaca' }}>
          <span style={{ color: '#374151' }}>Vencida el {new Date(inst.dueDate).toLocaleDateString('es-AR')} · Venta #{inst.saleId}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 700, color: '#dc2626' }}>${Number(inst.amount).toLocaleString('es-AR')}</span>
            <button onClick={() => onPay(inst)}
              style={{ padding: '3px 10px', fontSize: '11px', fontWeight: 600, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', cursor: 'pointer' }}>
              Cobrar
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
