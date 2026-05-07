import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getSettings } from './helpers'

export function generateInvoice(sale: any, client?: any) {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' })
  const w = doc.internal.pageSize.getWidth()
  const h = doc.internal.pageSize.getHeight()
  const cfg = getSettings()
  const invType = sale.invoiceType || 'B'
  const compNum = sale.saleNumber || `#${sale.id}`
  const fecha = new Date(sale.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const accentColor: [number, number, number] = invType === 'A' ? [37, 99, 235] : [124, 58, 237]

  doc.setDrawColor(...accentColor)
  doc.setLineWidth(1)
  doc.rect(10, 10, w - 20, h - 20)

  doc.setFillColor(...accentColor)
  doc.rect(10, 10, (w - 20) / 2 - 5, 42, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(cfg.businessName, 18, 26)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(200, 220, 255)
  doc.text(cfg.tagline, 18, 33)
  if (cfg.address) doc.text(cfg.address, 18, 39)
  const emisorContact = [cfg.phone, cfg.email].filter(Boolean).join('  ·  ')
  if (emisorContact) doc.text(emisorContact, 18, 45)

  const midX = w / 2
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(...accentColor)
  doc.setLineWidth(1.5)
  doc.rect(midX - 16, 16, 32, 30, 'FD')
  doc.setTextColor(...accentColor)
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text(invType, midX, 33, { align: 'center' })
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('COD. 0' + (invType === 'A' ? '1' : '6'), midX, 41, { align: 'center' })

  doc.setTextColor(15, 23, 42)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  const rightX = w - 18
  doc.text(`FACTURA ${invType}`, rightX, 22, { align: 'right' })
  doc.setFontSize(15)
  doc.text(compNum, rightX, 32, { align: 'right' })
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.text(`Fecha: ${fecha}`, rightX, 40, { align: 'right' })

  doc.setDrawColor(220, 230, 255)
  doc.setLineWidth(0.5)
  doc.line(18, 56, w - 18, 56)

  let y = 63
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.setFont('helvetica', 'bold')
  doc.text('DATOS DEL EMISOR', 18, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(15, 23, 42)
  if (cfg.cuit) { doc.text(`CUIT: ${cfg.cuit}`, 18, y); y += 5 }
  doc.text(`Condición IVA: ${cfg.condicionIva || 'Responsable Inscripto'}`, 18, y); y += 5
  if (cfg.address) { doc.text(`Domicilio: ${cfg.address}`, 18, y); y += 5 }

  const recX = w / 2 + 2
  let recY = 63
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.setFont('helvetica', 'bold')
  doc.text('DATOS DEL RECEPTOR', recX, recY)
  recY += 5
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(15, 23, 42)

  if (client) {
    doc.setFont('helvetica', 'bold')
    doc.text(client.name, recX, recY); recY += 5
    doc.setFont('helvetica', 'normal')
    if (client.cuit) { doc.text(`CUIT: ${client.cuit}`, recX, recY); recY += 5 }
    else if (client.dni) { doc.text(`DNI: ${client.dni}`, recX, recY); recY += 5 }
    const ivaLabels: Record<string, string> = {
      consumidor_final: 'Consumidor Final',
      monotributista: 'Monotributista',
      responsable_inscripto: 'Responsable Inscripto',
      exento: 'Exento',
    }
    doc.text(`Condición IVA: ${ivaLabels[client.condicionIva] || 'Consumidor Final'}`, recX, recY); recY += 5
    if (client.address) { doc.text(`Domicilio: ${client.address}`, recX, recY); recY += 5 }
  } else {
    doc.text('Consumidor Final', recX, recY)
  }

  y = Math.max(y, recY) + 4
  doc.setDrawColor(220, 230, 255)
  doc.setLineWidth(0.5)
  doc.line(18, y, w - 18, y)
  y += 6

  autoTable(doc, {
    startY: y,
    head: [['Descripción', 'Cant.', 'Precio unit.', 'Subtotal']],
    body: sale.items?.map((it: any) => [
      it.description,
      String(it.quantity),
      `$${Number(it.unitPrice).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
      `$${Number(it.subtotal).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
    ]) || [],
    styles: { fontSize: 9, cellPadding: 3.5 },
    headStyles: { fillColor: accentColor, textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 'auto' }, 1: { halign: 'center', cellWidth: 18 }, 2: { halign: 'right', cellWidth: 36 }, 3: { halign: 'right', cellWidth: 36 } },
    margin: { left: 18, right: 18 },
  })

  y = (doc as any).lastAutoTable.finalY + 8

  const totalNum = Number(sale.total)
  const netoIva = invType === 'A' ? totalNum / 1.21 : null
  const ivaAmt = invType === 'A' ? totalNum - (totalNum / 1.21) : null

  if (Number(sale.discount) > 0) {
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139)
    doc.text('Descuento:', w - 70, y)
    doc.text(`-$${Number(sale.discount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, w - 18, y, { align: 'right' })
    y += 6
  }

  if (invType === 'A' && netoIva !== null && ivaAmt !== null) {
    doc.setFontSize(9); doc.setTextColor(100, 116, 139); doc.setFont('helvetica', 'normal')
    doc.text('Neto gravado (21%):', w - 70, y)
    doc.text(`$${netoIva.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, w - 18, y, { align: 'right' })
    y += 6
    doc.text('IVA 21%:', w - 70, y)
    doc.text(`$${ivaAmt.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, w - 18, y, { align: 'right' })
    y += 6
  }

  doc.setDrawColor(...accentColor); doc.setLineWidth(0.8); doc.line(w - 80, y, w - 18, y); y += 6
  doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(...accentColor)
  doc.text('TOTAL:', w - 70, y)
  doc.text(`$${totalNum.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, w - 18, y, { align: 'right' })

  y += 10
  doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139)
  const pagoLabel: Record<string, string> = { efectivo: 'Efectivo', transferencia: 'Transferencia bancaria', tarjeta: 'Tarjeta', mixto: 'Pago mixto' }
  doc.text(`Forma de pago: ${pagoLabel[sale.paymentMethod] || sale.paymentMethod}`, 18, y)

  const formalAmt = Number(sale.amountFormal ?? 0)
  const informalAmt = Number(sale.amountInformal ?? 0)
  if (formalAmt > 0 && informalAmt > 0) {
    y += 7
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42)
    doc.text('Distribución blanco / negro:', 18, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(22, 163, 74)
    doc.text(`En blanco: $${formalAmt.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 18, y)
    doc.setTextColor(220, 38, 38)
    doc.text(`En negro: $${informalAmt.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, w / 2, y)
  }

  if (sale.installments?.length > 0) {
    y += 8
    doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42)
    doc.text(`Plan de ${sale.installments.length} cuotas:`, 18, y); y += 5
    doc.setFont('helvetica', 'normal')
    sale.installments.forEach((inst: any) => {
      doc.text(`  Cuota ${inst.number} — ${new Date(inst.dueDate).toLocaleDateString('es-AR')}: $${Number(inst.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 18, y)
      y += 5
    })
  }

  y += 6
  doc.setFontSize(7); doc.setTextColor(148, 163, 184)
  doc.text('Este comprobante no es válido como factura electrónica ante AFIP. Documento de uso interno.', 18, y)

  doc.setFontSize(7.5); doc.setTextColor(148, 163, 184)
  const footerParts = [cfg.businessName, cfg.cuit ? `CUIT ${cfg.cuit}` : '', cfg.address, cfg.phone].filter(Boolean)
  doc.text(footerParts.join('  ·  '), w / 2, h - 16, { align: 'center' })

  doc.save(`factura-${invType}-${compNum}.pdf`)
}
