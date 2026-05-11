import { useState, useEffect } from 'react'
import { toast } from '../../lib/toast'

interface ToastItem { id: number; msg: string; type: 'error' | 'success' | 'info' }

const BG: Record<string, string> = { error: '#fef2f2', success: '#f0fdf4', info: '#eff6ff' }
const COLOR: Record<string, string> = { error: '#dc2626', success: '#16a34a', info: '#2563eb' }
const ICON: Record<string, string> = { error: '✕', success: '✓', info: 'i' }

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => {
    let id = 0
    toast._subscribe((msg, type) => {
      const item = { id: ++id, msg, type }
      setItems(p => [...p, item])
      setTimeout(() => setItems(p => p.filter(t => t.id !== item.id)), 4000)
    })
    return () => toast._unsubscribe()
  }, [])

  if (!items.length) return null

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 9999 }}>
      {items.map(t => (
        <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: BG[t.type], border: `1px solid ${COLOR[t.type]}33`, borderRadius: '10px', padding: '12px 16px', minWidth: '280px', maxWidth: '400px', boxShadow: '0 4px 16px rgba(0,0,0,0.10)', fontSize: '13.5px', color: '#0f172a' }}>
          <span style={{ fontWeight: 800, color: COLOR[t.type], fontSize: '14px', marginTop: '1px' }}>{ICON[t.type]}</span>
          <span style={{ flex: 1 }}>{t.msg}</span>
          <button onClick={() => setItems(p => p.filter(x => x.id !== t.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '16px', padding: 0, lineHeight: 1 }}>×</button>
        </div>
      ))}
    </div>
  )
}
