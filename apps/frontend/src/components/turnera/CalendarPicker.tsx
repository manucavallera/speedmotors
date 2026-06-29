import { type DaySummary } from '../../types/turnera.types'

interface Props {
  date: string                 // día seleccionado YYYY-MM-DD
  days: DaySummary[]           // resumen del mes
  onSelect: (date: string) => void
}

const DOW = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const pad = (n: number) => String(n).padStart(2, '0')
const todayStr = () => new Date().toISOString().slice(0, 10)

export function CalendarPicker({ date, days, onSelect }: Props) {
  const [y, m] = date.split('-').map(Number)       // m = 1..12
  const byDate = new Map(days.map(d => [d.date, d]))
  // Lunes como primer día de la semana
  const startDow = (new Date(y, m - 1, 1).getDay() + 6) % 7
  const daysInMonth = new Date(y, m, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  // Navegar al mes anterior/siguiente: selecciona el día 1
  function shift(delta: number) {
    const nd = new Date(y, m - 1 + delta, 1)
    onSelect(`${nd.getFullYear()}-${pad(nd.getMonth() + 1)}-01`)
  }

  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <button onClick={() => shift(-1)} style={navBtn}>‹</button>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{MONTHS[m - 1]} {y}</div>
        <button onClick={() => shift(1)} style={navBtn}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
        {DOW.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: '10.5px', fontWeight: 700, color: '#94a3b8', paddingBottom: '4px' }}>{d}</div>
        ))}
        {cells.map((d, i) => {
          if (d == null) return <div key={i} />
          const ds = `${y}-${pad(m)}-${pad(d)}`
          const sum = byDate.get(ds)
          const isSel = ds === date
          const isToday = ds === todayStr()
          const has = (sum?.reserved ?? 0) > 0
          return (
            <button
              key={i}
              onClick={() => onSelect(ds)}
              style={{
                position: 'relative', aspectRatio: '1', border: isToday && !isSel ? '1.5px solid #93c5fd' : '1px solid transparent',
                borderRadius: '8px', cursor: 'pointer', fontSize: '12.5px', fontWeight: isSel ? 700 : 500,
                background: isSel ? 'linear-gradient(135deg,#3b82f6,#1d4ed8)' : has ? '#eff6ff' : 'transparent',
                color: isSel ? 'white' : has ? '#1d4ed8' : '#334155',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {d}
              {has && (
                <span style={{
                  position: 'absolute', bottom: '4px', right: '5px', minWidth: '14px', height: '14px', padding: '0 3px',
                  fontSize: '9px', fontWeight: 700, borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isSel ? 'rgba(255,255,255,.85)' : '#1d4ed8', color: isSel ? '#1d4ed8' : 'white',
                }}>{sum!.reserved}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const navBtn: React.CSSProperties = {
  width: '28px', height: '28px', border: '1px solid #e2e8f0', borderRadius: '7px', background: 'white',
  cursor: 'pointer', fontSize: '16px', color: '#64748b', lineHeight: 1,
}
