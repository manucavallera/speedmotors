import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getSettings } from './helpers'

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
  doc.text(`${sale.type === 'cuotas' ? 'Cuotas' : 'Contado'} — ${sale.paymentMethod}`, 40, y + 5)
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
