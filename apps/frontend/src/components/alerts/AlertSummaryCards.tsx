interface Summary { critical: number; upcoming: number; total: number }

export function AlertSummaryCards({ summary: s }: { summary: Summary }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' }}>
      {[
        { label: 'Urgentes / Vencidos', value: s.critical, bg: '#fef2f2', border: '#fecaca', color: '#dc2626', dot: '#dc2626' },
        { label: 'Próximos 7 días',     value: s.upcoming, bg: '#fffbeb', border: '#fde68a', color: '#d97706', dot: '#d97706' },
        { label: 'Total activos',        value: s.total,    bg: '#f0f9ff', border: '#bae6fd', color: '#0284c7', dot: '#0284c7' },
      ].map(k => (
        <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.border}`, borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: k.dot, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px', fontWeight: 500 }}>{k.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
