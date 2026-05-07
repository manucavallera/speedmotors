import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getSettings } from './helpers'

export function generateRemito(sale: any, client?: any) {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' })
  const w = doc.internal.pageSize.getWidth()
  const h = doc.internal.pageSize.getHeight()
  const cfg = getSettings()
  const compNum = sale.saleNumber || `#${sale.id}`
  const fecha = new Date(sale.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, w, 38, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(cfg.businessName, 14, 16)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)
  doc.text(cfg.tagline, 14, 23)
  const contactLine = [cfg.phone, cfg.address].filter(Boolean).join('  ·  ')
  if (contactLine) doc.text(contactLine, 14, 29)

  doc.setFillColor(30, 41, 59)
  doc.rect(w - 68, 8, 56, 24, 'F')
  doc.setTextColor(148, 163, 184)
  doc.setFontSize(8); doc.setFont('helvetica', 'bold')
  doc.text('REMITO', w - 12, 16, { align: 'right' })
  doc.setTextColor(255, 255, 255); doc.setFontSize(14)
  doc.text(`R-${compNum}`, w - 12, 24, { align: 'right' })
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(148, 163, 184)
  doc.text(`Fecha: ${fecha}`, w - 12, 30, { align: 'right' })

  let y = 50
  doc.setFontSize(8); doc.setTextColor(100, 116, 139); doc.setFont('helvetica', 'bold')
  doc.text('DESTINATARIO', 14, y); y += 5
  doc.setTextColor(15, 23, 42)
  if (client) {
    doc.setFontSize(11); doc.setFont('helvetica', 'bold')
    doc.text(client.name, 14, y); y += 5
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
    if (client.cuit) { doc.text(`CUIT: ${client.cuit}`, 14, y); y += 5 }
    else if (client.dni) { doc.text(`DNI: ${client.dni}`, 14, y); y += 5 }
    if (client.address) { doc.text(`Domicilio: ${client.address}`, 14, y); y += 5 }
    if (client.phone) { doc.text(`Teléfono: ${client.phone}`, 14, y); y += 5 }
  } else {
    doc.setFontSize(10); doc.text('Consumidor Final', 14, y); y += 5
  }

  y += 4
  doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.5)
  doc.line(14, y, w - 14, y); y += 8

  autoTable(doc, {
    startY: y,
    head: [['Descripción', 'Cantidad', 'Unidad', 'Observaciones']],
    body: sale.items?.map((it: any) => [it.description, String(it.quantity), 'U', '']) || [],
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 'auto' }, 1: { halign: 'center', cellWidth: 25 }, 2: { halign: 'center', cellWidth: 25 }, 3: { cellWidth: 55 } },
    margin: { left: 14, right: 14 },
  })

  y = (doc as any).lastAutoTable.finalY + 16
  const sigY = Math.max(y, h - 60)
  doc.setDrawColor(15, 23, 42); doc.setLineWidth(0.5)

  doc.line(14, sigY + 20, 80, sigY + 20)
  doc.setFontSize(8); doc.setTextColor(100, 116, 139)
  doc.text('Firma y aclaración (receptor)', 14, sigY + 25)
  doc.setFontSize(7)
  doc.text('Aclaración: ________________________', 14, sigY + 31)
  doc.text('DNI: ________________________________', 14, sigY + 37)

  doc.line(w - 80, sigY + 20, w - 14, sigY + 20)
  doc.setFontSize(8); doc.text('Firma y sello (emisor)', w - 80, sigY + 25)

  doc.setFontSize(7); doc.setTextColor(148, 163, 184)
  const footerParts = [cfg.businessName, cfg.cuit ? `CUIT ${cfg.cuit}` : '', cfg.address].filter(Boolean)
  doc.text(footerParts.join('  ·  '), w / 2, h - 10, { align: 'center' })

  doc.save(`remito-${compNum}.pdf`)
}
