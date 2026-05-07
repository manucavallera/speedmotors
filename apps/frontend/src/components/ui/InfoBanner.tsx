interface InfoBannerProps {
  title: string
  children: React.ReactNode
}

export function InfoBanner({ title, children }: InfoBannerProps) {
  return (
    <div style={{
      background: '#eff6ff',
      border: '1px solid #dbeafe',
      borderRadius: '12px',
      padding: '14px 18px',
      marginBottom: '20px',
    }}>
      <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e40af', marginBottom: '6px' }}>
        {title}
      </div>
      <div style={{ fontSize: '13px', color: '#1e40af', lineHeight: 1.55 }}>
        {children}
      </div>
    </div>
  )
}
