import jsPDF from 'jspdf'
import { getSettings } from './helpers'

const fmt = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 2 })
const line = (doc: jsPDF, y: number, x1 = 18, x2 = 196) => { doc.setDrawColor(220, 230, 240); doc.setLineWidth(0.4); doc.line(x1, y, x2, y) }

export function generateReservationPdf(r: any) {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' })
  const cfg = getSettings()
  const w = doc.internal.pageSize.getWidth()
  const h = doc.internal.pageSize.getHeight()
  const accentColor: [number, number, number] = [15, 23, 42]
  const accentLight: [number, number, number] = [226, 232, 240]

  // Border
  doc.setDrawColor(15, 23, 42); doc.setLineWidth(0.8); doc.rect(10, 10, w - 20, h - 20)

  // Header band
  doc.setFillColor(...accentColor)
  doc.rect(10, 10, w - 20, 38, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16); doc.setFont('helvetica', 'bold')
  doc.text(cfg.businessName, 18, 24)
  doc.setFontSize(8); doc.setFont('helvetica', 'normal')
  doc.setTextColor(180, 200, 220)
  doc.text(cfg.tagline, 18, 31)
  const contact = [cfg.address, cfg.phone, cfg.email].filter(Boolean).join('  ·  ')
  if (contact) doc.text(contact, 18, 37)

  // Title block
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14); doc.setFont('helvetica', 'bold')
  doc.text('SOLICITUD DE RESERVA', w - 18, 22, { align: 'right' })
  doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  doc.setTextColor(180, 200, 220)
  doc.text(r.reservationNumber || `#${r.id}`, w - 18, 30, { align: 'right' })
  const fecha = new Date(r.date || r.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
  doc.text(`Fecha: ${fecha}`, w - 18, 37, { align: 'right' })

  let y = 58

  // Section helper
  function section(label: string) {
    doc.setFillColor(...accentLight)
    doc.rect(18, y - 5, w - 36, 7, 'F')
    doc.setTextColor(15, 23, 42); doc.setFontSize(8); doc.setFont('helvetica', 'bold')
    doc.text(label, 20, y)
    y += 6
  }

  function row(label: string, value: string, x = 18, _colWidth = w - 36) {
    doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139)
    doc.text(label + ':', x, y)
    doc.setTextColor(15, 23, 42); doc.setFont('helvetica', value ? 'normal' : 'italic')
    doc.text(value || '___________________________', x + 35, y)
    y += 6
  }

  function rowDouble(l1: string, v1: string, l2: string, v2: string) {
    const mid = w / 2 + 2
    doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139)
    doc.text(l1 + ':', 18, y)
    doc.setTextColor(15, 23, 42)
    doc.text(v1 || '___________________________', 53, y)
    doc.setTextColor(100, 116, 139)
    doc.text(l2 + ':', mid, y)
    doc.setTextColor(15, 23, 42)
    doc.text(v2 || '___________________________', mid + 35, y)
    y += 6
  }

  // COMPRADOR
  section('DATOS DEL COMPRADOR')
  row('Apellido y Nombre', r.clientName)
  rowDouble('DNI / CUIL', r.clientDni || '', 'Teléfono', r.clientPhone || '')
  row('Domicilio', r.clientAddress || '')
  y += 2; line(doc, y); y += 5

  // CÓNYUGE
  section('DATOS DEL CÓNYUGE')
  row('Apellido y Nombre', r.spouseName || '')
  row('DNI / CUIL', r.spouseDni || '')
  y += 2; line(doc, y); y += 5

  // VEHÍCULO
  section('DATOS DEL VEHÍCULO')
  rowDouble('Tipo', r.vehicleType === 'lancha' ? 'Lancha / Embarcación' : 'Motocicleta', 'Año', r.year ? String(r.year) : '')
  rowDouble('Marca', r.brand, 'Modelo', r.model || '')
  rowDouble('Color', r.color || '', 'Dominio / Patente', '')
  row('Nro. de Motor', r.motorNumber || '')
  row('Nro. de Chasis', r.chassisNumber || '')
  y += 2; line(doc, y); y += 5

  // CONDICIONES
  section('CONDICIONES ECONÓMICAS')
  const price = Number(r.price || 0)
  const deposit = Number(r.depositAmount || 0)
  const saldo = price - deposit
  rowDouble('Precio pactado', price > 0 ? `$${fmt(price)}` : '', 'Moneda', 'Pesos argentinos')
  rowDouble('Seña / Entrega', deposit > 0 ? `$${fmt(deposit)}` : '', 'Saldo', saldo > 0 && price > 0 ? `$${fmt(saldo)}` : '')
  y += 2; line(doc, y); y += 5

  // NOTAS
  if (r.notes) {
    section('OBSERVACIONES')
    doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 23, 42)
    const lines = doc.splitTextToSize(r.notes, w - 40)
    doc.text(lines, 20, y); y += lines.length * 5 + 2
    line(doc, y); y += 5
  }

  // FIRMA SECTION
  y = Math.max(y, h - 65)
  doc.setFontSize(7.5); doc.setTextColor(100, 116, 139); doc.setFont('helvetica', 'normal')
  doc.text('La firma del presente implica la aceptación de las condiciones estipuladas. Documento de uso interno.', 18, y)
  y += 10

  const sigY = y + 18
  const cols = [18, w / 3 + 5, (w / 3) * 2 - 5]
  const labels = ['VENDEDOR', 'COMPRADOR', 'CÓNYUGE']
  cols.forEach((x, i) => {
    doc.setDrawColor(15, 23, 42); doc.setLineWidth(0.4)
    doc.line(x, sigY, x + 52, sigY)
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42)
    doc.text(labels[i], x + 26, sigY + 5, { align: 'center' })
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139)
    doc.text('Aclaración y firma', x + 26, sigY + 9, { align: 'center' })
  })

  // Footer
  doc.setFontSize(7); doc.setTextColor(148, 163, 184)
  const footerParts = [cfg.businessName, cfg.cuit ? `CUIT ${cfg.cuit}` : '', cfg.address, cfg.phone].filter(Boolean)
  doc.text(footerParts.join('  ·  '), w / 2, h - 14, { align: 'center' })

  doc.save(`reserva-${r.reservationNumber || r.id}.pdf`)
}

export function printReservation(r: any) {
  const cfg = (() => {
    try { return JSON.parse(localStorage.getItem('speedmotors_settings') || '{}') } catch { return {} }
  })()
  const biz = cfg.businessName || 'Speed Motors'
  const fmt2 = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 2 })
  const price = Number(r.price || 0)
  const deposit = Number(r.depositAmount || 0)
  const fecha = new Date(r.date || r.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })

  const field = (label: string, val: string) =>
    `<tr><td style="width:160px;color:#666;font-size:12px;padding:4px 0">${label}</td><td style="font-size:13px;padding:4px 0;border-bottom:1px solid #eee"><strong>${val || '&nbsp;'}</strong></td></tr>`

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Solicitud de Reserva ${r.reservationNumber || ''}</title>
  <style>body{font-family:Arial,sans-serif;margin:0;padding:24px;color:#111}
  .header{border-bottom:3px solid #0f172a;padding-bottom:12px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:flex-start}
  .biz{font-size:20px;font-weight:bold;color:#0f172a}.tagline{font-size:11px;color:#666;margin-top:2px}
  .doc-title{text-align:right}.doc-title h2{margin:0;font-size:16px;color:#0f172a}
  .doc-title p{margin:4px 0 0;font-size:12px;color:#666}
  .section{margin:14px 0 6px;background:#f1f5f9;padding:4px 8px;font-size:11px;font-weight:bold;color:#334155;letter-spacing:.5px}
  table{width:100%;border-collapse:collapse}
  .sig-area{margin-top:40px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px}
  .sig{text-align:center}.sig-line{border-top:1px solid #0f172a;margin:0 10px}.sig-label{font-size:11px;font-weight:bold;margin-top:4px}
  .sig-sub{font-size:10px;color:#666}
  .footer{margin-top:20px;border-top:1px solid #ddd;padding-top:8px;font-size:10px;color:#999;text-align:center}
  @media print{body{padding:12px}}</style></head><body>
  <div class="header">
    <div><div class="biz">${biz}</div><div class="tagline">${cfg.tagline || ''}</div></div>
    <div class="doc-title"><h2>SOLICITUD DE RESERVA</h2><p>${r.reservationNumber || '#' + r.id}</p><p>${fecha}</p></div>
  </div>
  <div class="section">DATOS DEL COMPRADOR</div>
  <table>${field('Apellido y Nombre', r.clientName)}${field('DNI / CUIL', r.clientDni || '')}${field('Domicilio', r.clientAddress || '')}${field('Teléfono', r.clientPhone || '')}</table>
  <div class="section">DATOS DEL CÓNYUGE</div>
  <table>${field('Apellido y Nombre', r.spouseName || '')}${field('DNI / CUIL', r.spouseDni || '')}</table>
  <div class="section">DATOS DEL VEHÍCULO</div>
  <table>${field('Tipo', r.vehicleType === 'lancha' ? 'Lancha / Embarcación' : 'Motocicleta')}${field('Marca', r.brand)}${field('Modelo', r.model || '')}${field('Año', r.year ? String(r.year) : '')}${field('Color', r.color || '')}${field('Nro. de Motor', r.motorNumber || '')}${field('Nro. de Chasis', r.chassisNumber || '')}</table>
  <div class="section">CONDICIONES ECONÓMICAS</div>
  <table>${field('Precio pactado', price > 0 ? '$' + fmt2(price) : '')}${field('Seña / Entrega', deposit > 0 ? '$' + fmt2(deposit) : '')}${field('Saldo', price > 0 && deposit > 0 ? '$' + fmt2(price - deposit) : '')}</table>
  ${r.notes ? `<div class="section">OBSERVACIONES</div><p style="font-size:12px;margin:6px 0">${r.notes}</p>` : ''}
  <div class="sig-area">
    <div class="sig"><div class="sig-line"></div><div class="sig-label">VENDEDOR</div><div class="sig-sub">Aclaración y firma</div></div>
    <div class="sig"><div class="sig-line"></div><div class="sig-label">COMPRADOR</div><div class="sig-sub">Aclaración y firma</div></div>
    <div class="sig"><div class="sig-line"></div><div class="sig-label">CÓNYUGE</div><div class="sig-sub">Aclaración y firma</div></div>
  </div>
  <div class="footer">${[biz, cfg.cuit ? 'CUIT ' + cfg.cuit : '', cfg.address, cfg.phone].filter(Boolean).join(' · ')}</div>
  <script>window.onload=()=>{window.print()}</script></body></html>`

  const win = window.open('', '_blank', 'width=800,height=900')
  if (win) { win.document.write(html); win.document.close() }
}
