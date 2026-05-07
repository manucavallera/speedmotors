type FilterType = 'todos' | 'cuotas' | 'recordatorios' | 'reservas' | 'ordenes'

interface Props {
  active: FilterType
  onChange: (f: FilterType) => void
  counts: { cuotas: number; recordatorios: number; reservas: number; ordenes: number }
}

const filters: { key: FilterType; label: string }[] = [
  { key: 'todos',         label: 'Todos' },
  { key: 'cuotas',        label: 'Cuotas' },
  { key: 'recordatorios', label: 'Recordatorios' },
  { key: 'reservas',      label: 'Reservas' },
  { key: 'ordenes',       label: 'Órdenes de compra' },
]

export function AlertFilters({ active, onChange, counts }: Props) {
  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
      {filters.map(f => {
        const count = f.key !== 'todos' ? counts[f.key as keyof typeof counts] : undefined
        const isActive = active === f.key
        return (
          <button key={f.key} onClick={() => onChange(f.key)}
            style={{
              padding: '6px 14px', fontSize: '13px', fontWeight: 600, borderRadius: '20px', cursor: 'pointer',
              border: isActive ? '1.5px solid #2563eb' : '1.5px solid #e2e8f0',
              background: isActive ? '#eff6ff' : '#fff',
              color: isActive ? '#2563eb' : '#64748b',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
            {f.label}
            {count !== undefined && count > 0 && (
              <span style={{ background: isActive ? '#2563eb' : '#e2e8f0', color: isActive ? 'white' : '#475569', borderRadius: '10px', fontSize: '11px', fontWeight: 700, padding: '0 6px', lineHeight: '18px' }}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
