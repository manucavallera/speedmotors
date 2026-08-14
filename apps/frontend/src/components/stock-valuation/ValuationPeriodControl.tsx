export type ValuationPeriodStatusTone = 'neutral' | 'closed' | 'dirty' | 'preview'

interface Props {
  period: string
  status: string
  statusTone: ValuationPeriodStatusTone
  onPeriodChange: (period: string) => void
}

const statusColors: Record<ValuationPeriodStatusTone, string> = {
  neutral: '#475569',
  closed: '#9a3412',
  dirty: '#a16207',
  preview: '#166534',
}

export function ValuationPeriodControl({ period, status, statusTone, onPeriodChange }: Props) {
  return (
    <div role="group" aria-label="Período de valuación" style={{ display: 'flex', alignItems: 'end', gap: '12px', flexWrap: 'wrap' }}>
      <label style={{ color: '#475569', fontSize: '12px', fontWeight: 700 }}>
        Período
        <input type="month" value={period} onChange={(event) => onPeriodChange(event.target.value)} style={{ display: 'block', marginTop: '5px', padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: '9px', color: '#0f172a' }} />
      </label>
      <div role="status" style={{ paddingBottom: '9px', color: statusColors[statusTone], fontSize: '13px', fontWeight: 700 }}>{status}</div>
    </div>
  )
}
