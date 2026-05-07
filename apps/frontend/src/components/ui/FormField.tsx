interface Props {
  label: string
  children: React.ReactNode
}

export function FormField({ label, children }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{label}</label>
      {children}
    </div>
  )
}

export const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', fontSize: '14px',
  border: '1.5px solid #e2e8f0', borderRadius: '9px',
  background: 'white', color: '#0f172a', outline: 'none',
}

export const btnPrimary: React.CSSProperties = {
  padding: '9px 18px', fontSize: '13.5px', fontWeight: 600,
  background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
  color: 'white', border: 'none', borderRadius: '9px', cursor: 'pointer',
}

export const btnSecondary: React.CSSProperties = {
  padding: '9px 18px', fontSize: '13.5px', fontWeight: 600,
  background: '#f1f5f9', color: '#374151', border: 'none',
  borderRadius: '9px', cursor: 'pointer',
}
