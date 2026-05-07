export function StockBadge({ stock, minStock }: { stock: number; minStock: number }) {
  const low = stock <= minStock
  return (
    <span style={{
      padding: '2px 9px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
      background: low ? '#fef2f2' : '#f0fdf4',
      color: low ? '#dc2626' : '#16a34a',
    }}>
      {stock}
    </span>
  )
}

export function GainBadge({ cost, sell }: { cost: number; sell: number }) {
  if (!cost || cost === 0) return <span style={{ color: '#94a3b8', fontSize: '13px' }}>—</span>
  const pct = (sell - cost) / cost * 100
  const color = pct >= 30 ? '#16a34a' : pct >= 10 ? '#d97706' : '#dc2626'
  const bg = pct >= 30 ? '#f0fdf4' : pct >= 10 ? '#fffbeb' : '#fef2f2'
  return (
    <span style={{ padding: '2px 9px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: bg, color }}>
      {pct.toFixed(1)}%
    </span>
  )
}
