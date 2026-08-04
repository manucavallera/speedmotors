import { type RentalSlot } from '../types/turnera.types'

// Imprime la lista de botaduras del día, ordenada por hora, para el que baja las lanchas.
// Abre una ventana con HTML autocontenido y dispara el diálogo de impresión.
export function printDayList(dateLabel: string, slots: RentalSlot[]) {
  // Solo salidas vigentes (sin canceladas), ordenadas por hora de inicio
  const rows = slots
    .filter(s => s.status !== 'cancelado')
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  const esc = (s: string) => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string))
  const money = (n: number) => '$' + n.toLocaleString('es-AR')

  const body = rows.map(s => {
    const svc = s.items.map(i => i.concept).join(', ')
    const estado = s.paidAt ? 'Cobrado' : s.status === 'completado' ? 'Completado' : 'Reservado'
    return `<tr>
      <td class="hora">${esc(s.startTime)}</td>
      <td>${esc(s.boatName ?? 'lancha')}</td>
      <td>${esc(s.clientName ?? '-')}</td>
      <td>${esc(svc || '-')}</td>
      <td class="num">${Number(s.price) > 0 ? money(Number(s.price)) : '-'}</td>
      <td>${estado}</td>
    </tr>`
  }).join('')

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Botaduras ${esc(dateLabel)}</title>
  <style>
    body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;margin:28px}
    h1{font-size:19px;margin:0 0 2px}
    .sub{color:#64748b;font-size:13px;margin:0 0 18px;text-transform:capitalize}
    table{width:100%;border-collapse:collapse;font-size:13px}
    th,td{text-align:left;padding:8px 10px;border-bottom:1px solid #e2e8f0}
    th{font-size:11px;text-transform:uppercase;letter-spacing:.4px;color:#64748b}
    .hora{font-weight:700;white-space:nowrap}
    .num{text-align:right;white-space:nowrap}
    tfoot td{font-weight:700;border-top:2px solid #0f172a;border-bottom:none}
    @media print{body{margin:0}}
  </style></head><body>
    <h1>Lista de botaduras</h1>
    <p class="sub">${esc(dateLabel)} · ${rows.length} salida${rows.length === 1 ? '' : 's'}</p>
    <table>
      <thead><tr><th>Hora</th><th>Lancha</th><th>Cliente</th><th>Servicios</th><th class="num">Total</th><th>Estado</th></tr></thead>
      <tbody>${body}</tbody>
    </table>
  </body></html>`

  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(html)
  w.document.close()
  w.focus()
  // Esperar a que renderice antes de imprimir
  setTimeout(() => w.print(), 250)
}
