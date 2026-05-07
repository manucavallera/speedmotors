interface PaginationProps {
  page: number
  pages: number
  total: number
  onPage: (p: number) => void
}

export function Pagination({ page, pages, total, onPage }: PaginationProps) {
  if (pages <= 1) return null
  const btn = (disabled: boolean): React.CSSProperties => ({
    padding: '6px 14px', borderRadius: '8px', border: '1px solid #e2e8f0',
    background: disabled ? '#f8fafc' : 'white',
    color: disabled ? '#94a3b8' : '#1d4ed8',
    fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '14px',
  })
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
      <button onClick={() => onPage(page - 1)} disabled={page <= 1} style={btn(page <= 1)}>← Ant</button>
      <span style={{ fontSize: '13px', color: '#64748b', minWidth: '120px', textAlign: 'center' }}>
        Pág. {page} de {pages} · {total} registros
      </span>
      <button onClick={() => onPage(page + 1)} disabled={page >= pages} style={btn(page >= pages)}>Sig →</button>
    </div>
  )
}
