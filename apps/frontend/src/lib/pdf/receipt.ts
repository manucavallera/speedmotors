import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getSettings } from './helpers'

export function generateInstallmentReceipt(inst: any, paidAmount: number, surcharge: number, paymentDate: Date) {
  const doc = new jsPDF({ format: 'a5', unit: 'mm' })
  const w = doc.internal.pageSize.getWidth()
  const cfg = getSettings()
  const sym = '$'
  const fmt = (n: number) => `${sym}${n.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
  const fmtDate = (d: Date | string) => new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
  const isEarly = surcharge === 0 && Number(inst.amount) > paidAmount + 0.01

  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, w, 34, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(17); doc.setFont('helvetica', 'bold')
  doc.text(cfg.businessName, 10, 12)
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(148, 163, 184)
  doc.text('RECIBO DE PAGO DE CUOTA', 10, 20)
  doc.text(fmtDate(paymentDate), w - 10, 20, { align: 'right' })

  let y = 44
  doc.setTextColor(15, 23, 42)
  doc.setFontSize(13); doc.setFont('helvetica', 'bold')
  doc.text(inst.clientName || 'Sin cliente', 10, y); y += 8

  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139)
  doc.text(`Venta N° ${inst.saleId}  ·  Cuota ${inst.number}  ·  Vto: ${fmtDate(inst.dueDate)}`, 10, y); y += 10

  doc.setDrawColor(226, 232, 240); doc.line(10, y, w - 10, y); y += 8

  autoTable(doc, {
    startY: y,
    body: [
      ...(surcharge > 0 ? [['Cuota base', fmt(Number(inst.amount))], ['Recargo por mora', fmt(surcharge)]] : [['Importe cuota', fmt(Number(inst.amount))]]),
      ...(isEarly ? [['Bonif. pago anticipado', `-${fmt(Number(inst.amount) - paidAmount)}`]] : []),
    ],
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: 'bold', textColor: [100, 116, 139] }, 1: { halign: 'right' } },
    margin: { left: 10, right: 10 },
    theme: 'plain',
  })
  y = (doc as any).lastAutoTable.finalY + 4

  doc.setDrawColor(15, 23, 42); doc.line(w - 65, y, w - 10, y); y += 6
  doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42)
  doc.text('TOTAL COBRADO:', 10, y)
  doc.text(fmt(paidAmount), w - 10, y, { align: 'right' })

  if (isEarly) {
    y += 7
    doc.setFontSize(8); doc.setFont('helvetica', 'italic'); doc.setTextColor(22, 163, 74)
    doc.text('Pago anticipado — sin interés aplicado', 10, y)
  }

  const pageH = doc.internal.pageSize.getHeight()
  doc.setFontSize(7); doc.setTextColor(148, 163, 184); doc.setFont('helvetica', 'normal')
  const footerParts = [cfg.businessName, cfg.cuit ? `CUIT ${cfg.cuit}` : '', cfg.phone].filter(Boolean)
  doc.text(footerParts.join(' · '), w / 2, pageH - 8, { align: 'center' })

  doc.save(`recibo-cuota-${inst.saleId}-${inst.number}.pdf`)
}

// Recibo de pago parcial de cuenta corriente / saldo
export function generateAccountPaymentReceipt(p: {
  clientName: string
  amount: number
  paymentDate: Date | string
  balanceAfter: number
  currency?: 'pesos' | 'usd' | string
  notes?: string | null
}) {
  const doc = new jsPDF({ format: 'a5', unit: 'mm' })
  const w = doc.internal.pageSize.getWidth()
  const cfg = getSettings()
  const sym = p.currency === 'usd' ? 'US$' : '$'
  const fmt = (n: number) => `${sym}${n.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
  const fmtDate = (d: Date | string) => new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
  const balanceBefore = p.balanceAfter + p.amount

  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, w, 34, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(17); doc.setFont('helvetica', 'bold')
  doc.text(cfg.businessName, 10, 12)
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(148, 163, 184)
  doc.text('RECIBO DE PAGO CUENTA CORRIENTE', 10, 20)
  doc.text(fmtDate(p.paymentDate), w - 10, 20, { align: 'right' })

  let y = 44
  doc.setTextColor(15, 23, 42)
  doc.setFontSize(13); doc.setFont('helvetica', 'bold')
  doc.text(p.clientName || 'Sin cliente', 10, y); y += 10

  doc.setDrawColor(226, 232, 240); doc.line(10, y, w - 10, y); y += 8

  autoTable(doc, {
    startY: y,
    body: [
      ['Saldo anterior', fmt(balanceBefore)],
      ['Pago recibido', `-${fmt(p.amount)}`],
      ['Saldo restante', fmt(p.balanceAfter)],
    ],
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: 'bold', textColor: [100, 116, 139] }, 1: { halign: 'right' } },
    margin: { left: 10, right: 10 },
    theme: 'plain',
  })
  y = (doc as any).lastAutoTable.finalY + 4

  doc.setDrawColor(15, 23, 42); doc.line(w - 65, y, w - 10, y); y += 6
  doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42)
  doc.text('TOTAL RECIBIDO:', 10, y)
  doc.text(fmt(p.amount), w - 10, y, { align: 'right' })

  if (p.notes) {
    y += 8
    doc.setFontSize(8); doc.setFont('helvetica', 'italic'); doc.setTextColor(100, 116, 139)
    doc.text(p.notes, 10, y)
  }

  const pageH = doc.internal.pageSize.getHeight()
  doc.setFontSize(7); doc.setTextColor(148, 163, 184); doc.setFont('helvetica', 'normal')
  const footerParts = [cfg.businessName, cfg.cuit ? `CUIT ${cfg.cuit}` : '', cfg.phone].filter(Boolean)
  doc.text(footerParts.join(' · '), w / 2, pageH - 8, { align: 'center' })

  doc.save(`recibo-pago-${(p.clientName || 'cliente').replace(/\s+/g, '-').toLowerCase()}-${new Date(p.paymentDate).toISOString().slice(0, 10)}.pdf`)
}

export function generateReceipt(sale: any, client?: any) {
  const doc = new jsPDF({ format: 'a5', unit: 'mm' })
  const w = doc.internal.pageSize.getWidth()
  const compNum = sale.saleNumber || `#${sale.id}`
  const cfg = getSettings()

  // Header
  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, w, 34, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(17)
  doc.setFont('helvetica', 'bold')
  doc.text(cfg.businessName, 10, 12)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)
  doc.text(cfg.tagline, 10, 19)
  const contactLine = [cfg.phone, cfg.address].filter(Boolean).join(' · ')
  if (contactLine) doc.text(contactLine, 10, 25)

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('COMPROBANTE', w - 10, 11, { align: 'right' })
  doc.setFontSize(13)
  doc.text(compNum, w - 10, 19, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(148, 163, 184)
  doc.text(new Date(sale.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }), w - 10, 26, { align: 'right' })

  doc.setTextColor(15, 23, 42)
  let y = 42
  doc.setFontSize(9)

  if (client) {
    doc.setFont('helvetica', 'bold')
    doc.text('Cliente:', 10, y)
    doc.setFont('helvetica', 'normal')
    doc.text(client.name, 30, y)
    if (client.dni) { y += 5; doc.text(`DNI: ${client.dni}`, 30, y) }
    if (client.phone) { y += 5; doc.text(`Tel: ${client.phone}`, 30, y) }
    y += 4
  }

  doc.setFont('helvetica', 'bold')
  doc.text('Tipo de pago:', 10, y + 5)
  doc.setFont('helvetica', 'normal')
  doc.text(`${sale.type === 'cuotas' ? 'Financiado' : sale.type === 'cuenta_corriente' ? 'Cuenta corriente' : 'Contado'} — ${sale.paymentMethod}`, 40, y + 5)
  y += 12

  autoTable(doc, {
    startY: y,
    head: [['Descripción', 'Cant.', 'Precio unit.', 'Subtotal']],
    body: sale.items?.map((it: any) => [
      it.description,
      it.quantity,
      `$${Number(it.unitPrice).toLocaleString('es-AR')}`,
      `$${Number(it.subtotal).toLocaleString('es-AR')}`,
    ]) || [],
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 'auto' }, 1: { halign: 'center', cellWidth: 15 }, 2: { halign: 'right', cellWidth: 28 }, 3: { halign: 'right', cellWidth: 28 } },
    margin: { left: 10, right: 10 },
  })

  y = (doc as any).lastAutoTable.finalY + 6

  const totals: [string, string][] = []
  if (Number(sale.discount) > 0) totals.push(['Descuento:', `-$${Number(sale.discount).toLocaleString('es-AR')}`])
  if (Number(sale.interestRate) > 0) totals.push([`Interés (${sale.interestRate}%):`, `+$${(Number(sale.total) - (Number(sale.subtotal) - Number(sale.discount))).toLocaleString('es-AR')}`])

  doc.setFontSize(8)
  totals.forEach(([label, val]) => {
    doc.setFont('helvetica', 'normal')
    doc.text(label, w - 50, y)
    doc.text(val, w - 10, y, { align: 'right' })
    y += 5
  })

  doc.setDrawColor(15, 23, 42)
  doc.line(w - 60, y, w - 10, y)
  y += 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('TOTAL:', w - 50, y)
  doc.text(`$${Number(sale.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, w - 10, y, { align: 'right' })

  if (sale.installments?.length > 0) {
    y += 10
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Cuotas:', 10, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    sale.installments.forEach((inst: any) => {
      doc.text(`Cuota ${inst.number} — ${new Date(inst.dueDate).toLocaleDateString('es-AR')}: $${Number(inst.amount).toLocaleString('es-AR')}`, 10, y)
      y += 5
    })
  }

  const pageH = doc.internal.pageSize.getHeight()
  doc.setFontSize(7)
  doc.setTextColor(148, 163, 184)
  const footerParts = [cfg.businessName, cfg.cuit ? `CUIT ${cfg.cuit}` : '', 'Gracias por su compra'].filter(Boolean)
  doc.text(footerParts.join(' · '), w / 2, pageH - 8, { align: 'center' })

  doc.save(`comprobante-${compNum}.pdf`)
}
