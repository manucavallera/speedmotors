interface PendingMovement {
  id: number
  amount: string | number
  reason: string | null
  createdAt: string
}

interface PendingCashData {
  items: PendingMovement[]
  count: number
  total: number
}

const money = (value: number) => '$' + value.toLocaleString('es-AR')

export function PendingCashPanel({ data }: { data?: PendingCashData }) {
  const count = data?.count ?? 0
  const total = data?.total ?? 0

  if (!count) return (
    <div style={{ marginBottom: '16px', padding: '12px 14px', borderRadius: '10px', border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#166534', fontSize: '13px' }}>
      <strong>Sin cobros pendientes.</strong> Todo lo cobrado por Guardería, Turnera y Proveeduría ya está dentro de una Caja Marina.
    </div>
  )

  return (
    <div style={{ marginBottom: '16px', borderRadius: '12px', border: '1px solid #fbbf24', background: '#fffbeb', overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <div style={{ color: '#92400e', fontWeight: 700, fontSize: '15px' }}>Cobros pendientes de Caja Marina</div>
          <div style={{ color: '#a16207', fontSize: '12.5px', marginTop: '2px' }}>Se incorporarán automáticamente cuando abras la próxima Caja Marina.</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#92400e', fontWeight: 800, fontSize: '20px' }}>{money(total)}</div>
          <div style={{ color: '#a16207', fontSize: '12px' }}>{count} cobro{count === 1 ? '' : 's'}</div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid #fde68a', maxHeight: '220px', overflowY: 'auto', background: '#fffdf5' }}>
        {data?.items.map((movement) => (
          <div key={movement.id} style={{ padding: '10px 16px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', borderBottom: '1px solid #fef3c7', alignItems: 'center' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: '#78350f', fontWeight: 600, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{movement.reason || 'Cobro sin detalle'}</div>
              <div style={{ color: '#a16207', fontSize: '11.5px', marginTop: '2px' }}>{new Date(movement.createdAt).toLocaleString('es-AR')}</div>
            </div>
            <div style={{ color: '#92400e', fontWeight: 700, fontSize: '14px' }}>{money(Number(movement.amount))}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
