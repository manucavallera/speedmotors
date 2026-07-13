// Config de la grilla de turnos. Vive en el backend (GET/PUT /turnera/config):
// la misma grilla la ve el panel y la página donde el cliente elige su turno.
export interface TurneraConfig {
  intervalMin: number   // cada cuántos minutos es un turno
  dayStart: string      // 'HH:MM'
  dayEnd: string        // 'HH:MM'
}

// Solo se usa mientras la config del server está cargando
export const DEFAULT_CFG: TurneraConfig = { intervalMin: 10, dayStart: '07:00', dayEnd: '20:00' }

export const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
export const toHHMM = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`

// Genera los casilleros [inicio, fin] del día según el intervalo configurado
export function buildSlots(cfg: TurneraConfig): { start: string; end: string }[] {
  const lo = toMin(cfg.dayStart), hi = toMin(cfg.dayEnd), step = cfg.intervalMin
  if (hi <= lo || step <= 0) return []
  const out: { start: string; end: string }[] = []
  for (let t = lo; t + step <= hi; t += step) out.push({ start: toHHMM(t), end: toHHMM(t + step) })
  return out
}
