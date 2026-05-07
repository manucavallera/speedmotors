// @file: presets.ts | Rangos de fecha predefinidos y labels de métodos de pago para Reportes.
export const METHOD_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
  mixto: 'Mixto',
}

export const PRESET_RANGES = [
  { label: 'Este mes', getValue: () => { const n = new Date(); return { from: new Date(n.getFullYear(), n.getMonth(), 1).toISOString().slice(0, 10), to: n.toISOString().slice(0, 10) } } },
  { label: 'Mes pasado', getValue: () => { const n = new Date(); const s = new Date(n.getFullYear(), n.getMonth() - 1, 1); const e = new Date(n.getFullYear(), n.getMonth(), 0); return { from: s.toISOString().slice(0, 10), to: e.toISOString().slice(0, 10) } } },
  { label: 'Este año', getValue: () => { const n = new Date(); return { from: new Date(n.getFullYear(), 0, 1).toISOString().slice(0, 10), to: n.toISOString().slice(0, 10) } } },
  { label: 'Últimos 30 días', getValue: () => { const n = new Date(); const s = new Date(n); s.setDate(s.getDate() - 30); return { from: s.toISOString().slice(0, 10), to: n.toISOString().slice(0, 10) } } },
]

export function getDefaultRange() {
  const n = new Date()
  return {
    from: new Date(n.getFullYear(), n.getMonth(), 1).toISOString().slice(0, 10),
    to: n.toISOString().slice(0, 10),
  }
}
