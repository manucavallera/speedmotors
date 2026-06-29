// Config de la grilla de turnos de la turnera (persistida en localStorage, sin backend)
export interface TurneraConfig {
  intervalMin: number   // cada cuántos minutos es un turno
  dayStart: string      // 'HH:MM'
  dayEnd: string        // 'HH:MM'
}

const KEY = 'speedmotors_turnera_cfg'
export const DEFAULT_CFG: TurneraConfig = { intervalMin: 30, dayStart: '08:00', dayEnd: '20:00' }

export function loadTurneraConfig(): TurneraConfig {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_CFG
    const c = JSON.parse(raw)
    return {
      intervalMin: Number(c.intervalMin) > 0 ? Number(c.intervalMin) : DEFAULT_CFG.intervalMin,
      dayStart: /^\d{2}:\d{2}$/.test(c.dayStart) ? c.dayStart : DEFAULT_CFG.dayStart,
      dayEnd: /^\d{2}:\d{2}$/.test(c.dayEnd) ? c.dayEnd : DEFAULT_CFG.dayEnd,
    }
  } catch { return DEFAULT_CFG }
}

export function saveTurneraConfig(cfg: TurneraConfig) {
  localStorage.setItem(KEY, JSON.stringify(cfg))
}

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
