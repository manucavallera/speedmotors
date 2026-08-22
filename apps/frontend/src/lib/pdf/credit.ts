import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getSettings } from './helpers'
import { formatDateOnly } from '../date'

const fmt = (n: number, sym: string) => `${sym}${n.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
const fmtDate = (d: string | Date) => formatDateOnly(d, { day: '2-digit', month: '2-digit', year: 'numeric' })

export function generateCreditStatement(credit: any) {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' })
  const w = doc.internal.pageSize.getWidth()
  const cfg = getSettings()
  const sym = credit.currency === 'usd' ? 'US$' : '$'
  const isCuotas = credit.creditType === 'cuotas_simples'
  const fecha = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })

  // Header
  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, w, 38, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20); doc.setFont('helvetica', 'bold')
  doc.text(cfg.businessName, 14, 16)
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(148, 163, 184)
  doc.text(isCuotas ? 'PLAN DE CUOTAS' : 'ESTADO DE FINANCIACIÓN', 14, 24)
  doc.text(`Emitido: ${fecha}`, w - 14, 24, { align: 'right' })

  let y = 50

  // Cliente
  doc.setFontSize(8); doc.setTextColor(100, 116, 139); doc.setFont('helvetica', 'bold')
  doc.text('CLIENTE', 14, y); y += 5
  doc.setFontSize(14); doc.setTextColor(15, 23, 42); doc.setFont('helvetica', 'bold')
  doc.text(credit.client?.name || '—', 14, y); y += 7
  doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  if (credit.client?.cuit) { doc.text(`CUIT: ${credit.client.cuit}`, 14, y); y += 5 }
  else if (credit.client?.dni) { doc.text(`DNI: ${credit.client.dni}`, 14, y); y += 5 }
  if (credit.client?.phone) { doc.text(`Tel: ${credit.client.phone}`, 14, y); y += 5 }

  y += 4
  doc.setDrawColor(226, 232, 240); doc.line(14, y, w - 14, y); y += 8

  // Datos del crédito
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139)
  doc.text('CONDICIONES DE FINANCIACIÓN', 14, y); y += 6

  const typeLabel = isCuotas ? 'Cuotas fijas (interés simple)'
    : Number(credit.interestRate) === 0 ? 'Cuenta corriente (sin interés)'
    : 'Cuota libre (interés compuesto mensual)'

  const summaryLeft = [
    ['Tipo', typeLabel],
    ['Capital original', fmt(Number(credit.originalAmount), sym)],
    ['Tasa mensual', `${credit.interestRate}%`],
  ]
  const summaryRight: [string, string][] = [
    ['Moneda', credit.currency === 'usd' ? 'Dólares USD' : 'Pesos AR'],
    ['Inicio', fmtDate(credit.startDate)],
  ]
  if (isCuotas && credit.firstDueDate) summaryRight.push(['Primera cuota', fmtDate(credit.firstDueDate)])
  if (isCuotas && credit.installmentsCount) summaryRight.push(['Cuotas', String(credit.installmentsCount)])

  autoTable(doc, {
    startY: y,
    body: summaryLeft,
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 44, textColor: [100, 116, 139] }, 1: { cellWidth: 70 } },
    margin: { left: 14, right: w / 2 + 4 },
    theme: 'plain',
  })
  const leftBottom = (doc as any).lastAutoTable.finalY

  autoTable(doc, {
    startY: y,
    body: summaryRight,
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 44, textColor: [100, 116, 139] }, 1: { cellWidth: 60 } },
    margin: { left: w / 2 + 4, right: 14 },
    theme: 'plain',
  })

  y = Math.max(leftBottom, (doc as any).lastAutoTable.finalY) + 6

  // Saldo actual — caja destacada
  const balanceColor: [number, number, number] = credit.balance > 0 ? [220, 38, 38] : [22, 163, 74]
  doc.setFillColor(...balanceColor)
  doc.roundedRect(14, y, w - 28, 18, 4, 4, 'F')
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(credit.balance > 0 ? 'SALDO PENDIENTE' : 'CRÉDITO CANCELADO', 22, y + 7)
  doc.setFontSize(15)
  doc.text(fmt(credit.balance, sym), w - 22, y + 11, { align: 'right' })
  y += 26

  // Cuotas fijas
  if (isCuotas && credit.installments?.length > 0) {
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139)
    doc.text('PLAN DE CUOTAS', 14, y); y += 4

    const today = new Date()
    autoTable(doc, {
      startY: y,
      head: [['N°', 'Vencimiento', 'Monto cuota', 'Recargo', 'Estado', 'Pago']],
      body: credit.installments.map((inst: any) => {
        const due = new Date(inst.dueDate)
        const overdue = !inst.paidAt && due < today
        const estado = inst.paidAt ? 'PAGADA' : overdue ? 'VENCIDA' : 'PENDIENTE'
        const recargo = Number(inst.surcharge) > 0 ? fmt(Number(inst.surcharge), sym) : '—'
        return [
          inst.number,
          fmtDate(inst.dueDate),
          fmt(Number(inst.amount), sym),
          recargo,
          estado,
          inst.paidAt ? fmtDate(inst.paidAt) : '—',
        ]
      }),
      styles: { fontSize: 8.5, cellPadding: 3 },
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      bodyStyles: { textColor: [15, 23, 42] },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 30 },
        2: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
        3: { cellWidth: 24, halign: 'right' },
        4: { cellWidth: 24, fontStyle: 'bold' },
        5: { cellWidth: 28 },
      },
      willDrawCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 4) {
          const v = data.cell.text[0]
          if (v === 'PAGADA') data.cell.styles.textColor = [22, 163, 74]
          else if (v === 'VENCIDA') data.cell.styles.textColor = [220, 38, 38]
          else data.cell.styles.textColor = [100, 116, 139]
        }
      },
      margin: { left: 14, right: 14 },
    })
    y = (doc as any).lastAutoTable.finalY + 10
  }

  // Historial (saldo_compuesto / cuenta corriente)
  const histItems: { date: string; type: string; amount: number; balance: number; notes?: string | null }[] = []
  let running = 0
  const allEvents = [
    { date: credit.startDate, type: 'carga', amount: Number(credit.originalAmount), notes: credit.notes },
    ...(credit.payments || []).map((p: any) => ({ date: p.paymentDate, type: 'pago', amount: Number(p.amount), notes: p.notes })),
    ...(credit.charges || []).map((c: any) => ({ date: c.chargeDate, type: 'interes', amount: Number(c.amount), notes: null })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  for (const e of allEvents) {
    running = e.type === 'pago' ? running - e.amount : running + e.amount
    histItems.push({ ...e, balance: running })
  }

  if (histItems.length > 0) {
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139)
    doc.text('HISTORIAL DE MOVIMIENTOS', 14, y); y += 4

    autoTable(doc, {
      startY: y,
      head: [['Fecha', 'Tipo', 'Importe', 'Saldo', 'Nota']],
      body: histItems.map(it => [
        fmtDate(it.date),
        it.type === 'pago' ? 'Pago' : it.type === 'interes' ? 'Interés' : 'Carga inicial',
        (it.type === 'pago' ? '-' : '+') + fmt(it.amount, sym),
        fmt(it.balance, sym),
        it.notes || '—',
      ]),
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 24 },
        1: { cellWidth: 24, fontStyle: 'bold' },
        2: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
        3: { cellWidth: 32, halign: 'right' },
        4: { cellWidth: 'auto' },
      },
      willDrawCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 1) {
          const v = data.cell.text[0]
          if (v === 'Pago') data.cell.styles.textColor = [22, 163, 74]
          else if (v === 'Interés') data.cell.styles.textColor = [217, 119, 6]
          else data.cell.styles.textColor = [71, 85, 105]
        }
        if (data.section === 'body' && data.column.index === 2) {
          const v = data.cell.text[0] as string
          if (v.startsWith('-')) data.cell.styles.textColor = [22, 163, 74]
        }
      },
      margin: { left: 14, right: 14 },
    })
  }

  // Footer
  const pageH = doc.internal.pageSize.getHeight()
  doc.setFontSize(7); doc.setTextColor(148, 163, 184); doc.setFont('helvetica', 'normal')
  const footerParts = [cfg.businessName, cfg.cuit ? `CUIT ${cfg.cuit}` : '', cfg.phone, cfg.address].filter(Boolean)
  doc.text(footerParts.join('  ·  '), w / 2, pageH - 10, { align: 'center' })

  const clientSlug = (credit.client?.name || 'credito').replace(/\s+/g, '-').toLowerCase()
  doc.save(`financiacion-${clientSlug}.pdf`)
}
