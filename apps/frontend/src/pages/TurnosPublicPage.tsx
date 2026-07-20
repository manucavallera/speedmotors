import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api, apiError } from '../lib/api'

// Página pública del cliente (sin login). Entra por link de WhatsApp, se identifica
// con su teléfono y reserva su turno de botadura. No ve datos de otros clientes.

type Unit = { id: number; description: string; spotCode: string | null; launchRate?: string | null }
type SlotItem = { concept: string; amount: string }
type Slot = { id: number; boatName: string | null; date: string; startTime: string; endTime: string; status: string; items: SlotItem[] }
type Ficha = { client: { id: number; name: string }; units: Unit[]; slots: Slot[] }
type Config = { intervalMin: number; dayStart: string; dayEnd: string; whatsapp?: string | null }
type Service = { id: number; name: string; price: string }

const BLUE = '#2563eb'
const card: React.CSSProperties = { background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,.08)', border: '1px solid #eef2f7' }
const bigBtn: React.CSSProperties = { width: '100%', padding: '15px', fontSize: 16, fontWeight: 700, borderRadius: 12, border: 'none', background: BLUE, color: '#fff', cursor: 'pointer' }
const input: React.CSSProperties = { width: '100%', padding: '14px', fontSize: 16, borderRadius: 12, border: '1.5px solid #e2e8f0', boxSizing: 'border-box' }
const money = (n: number) => '$' + n.toLocaleString('es-AR')

// Genera todas las franjas del día según la config
function buildTimes(cfg: Config): string[] {
  const [sh, sm] = cfg.dayStart.split(':').map(Number)
  const [eh, em] = cfg.dayEnd.split(':').map(Number)
  const start = sh * 60 + sm, end = eh * 60 + em
  const out: string[] = []
  for (let t = start; t + cfg.intervalMin <= end; t += cfg.intervalMin) {
    out.push(`${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`)
  }
  return out
}

// El próximo domingo (día fuerte de la marina)
function nextSunday(): string {
  const d = new Date()
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7))
  return d.toISOString().slice(0, 10)
}

export function TurnosPublicPage() {
  const [phone, setPhone] = useState('')
  const [ficha, setFicha] = useState<Ficha | null>(null)
  const [step, setStep] = useState<'phone' | 'ficha' | 'reservar' | 'ok'>('phone')

  // Reserva en curso
  const [unitId, setUnitId] = useState<number | null>(null)
  const [date, setDate] = useState(nextSunday())
  const [time, setTime] = useState<string | null>(null)
  const [services, setServices] = useState<number[]>([])

  const { data: config } = useQuery<Config>({
    queryKey: ['pub-config'],
    queryFn: () => api.get('/public/turnera/config').then(r => r.data),
  })
  const { data: catalog = [] } = useQuery<Service[]>({
    queryKey: ['pub-services'],
    queryFn: () => api.get('/public/turnera/services').then(r => r.data),
  })
  const { data: grid } = useQuery<{ taken: { startTime: string; endTime: string }[] }>({
    queryKey: ['pub-slots', date],
    queryFn: () => api.get('/public/turnera/slots', { params: { date } }).then(r => r.data),
    enabled: step === 'reservar' && /^\d{4}-\d{2}-\d{2}$/.test(date),
  })

  const identify = useMutation({
    mutationFn: () => api.post('/public/turnera/identify', { phone }).then(r => r.data),
    onSuccess: (d: Ficha) => { setFicha(d); setUnitId(d.units[0]?.id ?? null); setStep('ficha') },
  })

  const reserve = useMutation({
    mutationFn: () => api.post('/public/turnera/reserve', { phone, unitId, date, startTime: time, serviceIds: services }).then(r => r.data),
    onSuccess: () => setStep('ok'),
  })

  const takenAt = (t: string) => {
    if (!grid || !config) return false
    const [h, m] = t.split(':').map(Number)
    const end = h * 60 + m + config.intervalMin
    return grid.taken.some(k => {
      const toMin = (x: string) => { const [a, b] = x.split(':').map(Number); return a * 60 + b }
      return (h * 60 + m) < toMin(k.endTime) && end > toMin(k.startTime)
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', padding: '16px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', margin: '18px 0 22px' }}>
        <div style={{ fontSize: 30 }}>⚓</div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '6px 0 2px' }}>Turnos de botadura</h1>
        <p style={{ color: '#64748b', fontSize: 13 }}>Reservá tu horario para bajar la lancha al agua</p>
      </div>

      {step === 'phone' && (
        <div style={card}>
          <label style={{ fontSize: 14, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 8 }}>Tu teléfono</label>
          <input style={input} type="tel" inputMode="tel" placeholder="Ej: 3434 11 22 33" value={phone}
            onChange={e => setPhone(e.target.value)} onKeyDown={e => e.key === 'Enter' && phone && identify.mutate()} />
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '8px 0 16px' }}>El mismo que tenés registrado en la marina.</p>
          {identify.isError && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{apiError(identify.error)}</p>}
          <button style={{ ...bigBtn, opacity: phone && !identify.isPending ? 1 : .5 }} disabled={!phone || identify.isPending}
            onClick={() => identify.mutate()}>{identify.isPending ? 'Buscando...' : 'Entrar'}</button>
        </div>
      )}

      {step === 'ficha' && ficha && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={card}>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>Hola {ficha.client.name} 👋</p>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 14px' }}>Tus lanchas</p>
            {ficha.units.map(u => (
              <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid #f1f5f9' }}>
                <span style={{ fontWeight: 600, color: '#334155' }}>{u.description}</span>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>{u.spotCode ?? 'sobre trailer'}</span>
              </div>
            ))}
          </div>

          <div style={card}>
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 10px' }}>Tus próximos turnos</p>
            {ficha.slots.length === 0 && <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>No tenés turnos reservados.</p>}
            {ficha.slots.map(s => (
              <div key={s.id} style={{ padding: '10px 0', borderTop: '1px solid #f1f5f9' }}>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{s.date} · {s.startTime}</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>{s.boatName}{s.items.length ? ' · ' + s.items.map(i => i.concept).join(', ') : ''}</div>
              </div>
            ))}
          </div>

          <button style={bigBtn} onClick={() => setStep('reservar')}>Pedir un turno</button>
          <button style={{ ...bigBtn, background: 'transparent', color: '#64748b' }} onClick={() => { setStep('phone'); setFicha(null) }}>Salir</button>
        </div>
      )}

      {step === 'reservar' && ficha && config && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={card}>
            {ficha.units.length > 1 && (
              <>
                <label style={{ fontSize: 14, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 8 }}>Lancha</label>
                <select style={{ ...input, marginBottom: 16 }} value={unitId ?? ''} onChange={e => setUnitId(Number(e.target.value))}>
                  {ficha.units.map(u => <option key={u.id} value={u.id}>{u.description}</option>)}
                </select>
              </>
            )}
            <label style={{ fontSize: 14, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 8 }}>Día</label>
            <input style={input} type="date" value={date} min={new Date().toISOString().slice(0, 10)}
              onChange={e => { setDate(e.target.value); setTime(null) }} />
          </div>

          <div style={card}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#334155', margin: '0 0 12px' }}>Elegí un horario libre</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {buildTimes(config).map(t => {
                const taken = takenAt(t)
                const sel = time === t
                return (
                  <button key={t} disabled={taken} onClick={() => setTime(t)}
                    style={{ padding: '11px 0', fontSize: 14, fontWeight: 700, borderRadius: 10, cursor: taken ? 'not-allowed' : 'pointer',
                      border: sel ? `2px solid ${BLUE}` : '1.5px solid #e2e8f0',
                      background: taken ? '#f1f5f9' : sel ? '#eff6ff' : '#fff',
                      color: taken ? '#cbd5e1' : sel ? BLUE : '#334155',
                      textDecoration: taken ? 'line-through' : 'none' }}>{t}</button>
                )
              })}
            </div>
          </div>

          {catalog.length > 0 && (
            <div style={card}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#334155', margin: '0 0 12px' }}>¿Querés algún servicio?</p>
              {catalog.map(s => {
                const on = services.includes(s.id)
                return (
                  <div key={s.id} onClick={() => setServices(on ? services.filter(x => x !== s.id) : [...services, s.id])}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 12px', marginBottom: 8, borderRadius: 10, cursor: 'pointer',
                      border: on ? `1.5px solid ${BLUE}` : '1.5px solid #e2e8f0', background: on ? '#eff6ff' : '#fff' }}>
                    <span style={{ fontWeight: 600, color: '#334155' }}>{on ? '☑ ' : '☐ '}{s.name}</span>
                    <span style={{ color: '#64748b', fontSize: 13 }}>{Number(s.price) > 0 ? money(Number(s.price)) : ''}</span>
                  </div>
                )
              })}
            </div>
          )}

          {(() => {
            const u = ficha.units.find(x => x.id === unitId)
            const launch = Number(u?.launchRate ?? 0) || 0
            const svc = catalog.filter(s => services.includes(s.id)).reduce((a, s) => a + Number(s.price), 0)
            const est = launch + svc
            if (est <= 0) return null
            return (
              <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b' }}><span>Salida al agua</span><span>{money(launch)}</span></div>
                {svc > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b', marginTop: 6 }}><span>Servicios</span><span>{money(svc)}</span></div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: '#0f172a', marginTop: 10, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}><span>Total</span><span>{money(est)}</span></div>
              </div>
            )
          })()}

          {reserve.isError && <p style={{ color: '#dc2626', fontSize: 13, textAlign: 'center' }}>{apiError(reserve.error)}</p>}
          <button style={{ ...bigBtn, opacity: time && unitId && !reserve.isPending ? 1 : .5 }} disabled={!time || !unitId || reserve.isPending}
            onClick={() => reserve.mutate()}>{reserve.isPending ? 'Reservando...' : time ? `Reservar ${time}` : 'Elegí un horario'}</button>
          <button style={{ ...bigBtn, background: 'transparent', color: '#64748b' }} onClick={() => setStep('ficha')}>Volver</button>
        </div>
      )}

      {step === 'ok' && (
        <div style={{ ...card, textAlign: 'center' }}>
          <div style={{ fontSize: 44 }}>✅</div>
          <p style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '10px 0 4px' }}>¡Turno reservado!</p>
          <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 20px' }}>{date} a las {time}. Te esperamos en la rampa.</p>
          {config?.whatsapp && (() => {
            // Arma el link de WhatsApp con el resumen del turno para avisarle a la marina
            const boat = ficha?.units.find(u => u.id === unitId)?.description ?? ''
            const svcNames = catalog.filter(s => services.includes(s.id)).map(s => s.name)
            const msg = `Hola! Soy ${ficha?.client.name ?? ''}. Reservé un turno de botadura para el ${date} a las ${time}.`
              + (boat ? ` Lancha: ${boat}.` : '')
              + (svcNames.length ? ` Servicios: ${svcNames.join(', ')}.` : '')
            const href = `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(msg)}`
            return (
              <a href={href} target="_blank" rel="noopener noreferrer"
                style={{ ...bigBtn, background: '#25D366', display: 'block', textDecoration: 'none', marginBottom: 10 }}>
                Avisar a la marina por WhatsApp
              </a>
            )
          })()}
          <button style={bigBtn} onClick={() => { setStep('phone'); setFicha(null); setTime(null); setServices([]) }}>Listo</button>
        </div>
      )}
    </div>
  )
}
