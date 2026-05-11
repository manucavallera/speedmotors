import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getSettings } from './helpers'

const IVA_LABELS: Record<string, string> = {
  resp_inscripto: 'Resp. Inscripto',
  monotributo: 'Resp. Monotributo',
  exento: 'Exento',
  no_responsable: 'No Responsable',
  consumidor_final: 'Consumidor Final',
}

export function generateRemito(sale: any, client?: any) {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' })
  const w = doc.internal.pageSize.getWidth()
  const h = doc.internal.pageSize.getHeight()
  const cfg = getSettings()
  const compNum = sale.saleNumber || `#${sale.id}`
  const fecha = new Date(sale.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  // Header emisor
  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, w, 38, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20); doc.setFont('helvetica', 'bold')
  doc.text(cfg.businessName, 14, 16)
  doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)
  if (cfg.tagline) doc.text(cfg.tagline, 14, 23)
  const contactLine = [cfg.phone, cfg.address].filter(Boolean).join('  ·  ')
  if (contactLine) doc.text(contactLine, 14, 29)
  if (cfg.cuit) doc.text(`CUIT: ${cfg.cuit}  ·  IVA Responsable Inscripto`, 14, 34)

  // Badge REMITO
  doc.setFillColor(30, 41, 59)
  doc.rect(w - 68, 8, 56, 24, 'F')
  doc.setTextColor(148, 163, 184); doc.setFontSize(8); doc.setFont('helvetica', 'bold')
  doc.text('REMITO', w - 12, 16, { align: 'right' })
  doc.setTextColor(255, 255, 255); doc.setFontSize(14)
  doc.text(`R-${compNum}`, w - 12, 24, { align: 'right' })
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(148, 163, 184)
  doc.text(`Fecha: ${fecha}`, w - 12, 30, { align: 'right' })

  let y = 46

  // Destinatario + condición IVA
  doc.setFontSize(8); doc.setTextColor(100, 116, 139); doc.setFont('helvetica', 'bold')
  doc.text('DESTINATARIO', 14, y); y += 5
  doc.setTextColor(15, 23, 42)
  if (client) {
    doc.setFontSize(11); doc.setFont('helvetica', 'bold')
    doc.text(client.name, 14, y); y += 5
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
    if (client.cuit) { doc.text(`CUIT: ${client.cuit}`, 14, y); y += 4 }
    else if (client.dni) { doc.text(`DNI: ${client.dni}`, 14, y); y += 4 }
    if (client.address) { doc.text(`Domicilio: ${client.address}`, 14, y); y += 4 }
    if (client.phone) { doc.text(`Teléfono: ${client.phone}`, 14, y); y += 4 }
    // Condición IVA con checkboxes visuales
    const ivaLabel = IVA_LABELS[client.condicionIva] || client.condicionIva || 'Consumidor Final'
    const ivaOptions = ['Resp. Inscripto', 'Resp. Monotributo', 'No Responsable', 'Exento', 'Consumidor Final']
    y += 2
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139)
    doc.text('IVA:', 14, y)
    let xIva = 26
    ivaOptions.forEach(opt => {
      const checked = opt === ivaLabel
      doc.setDrawColor(100, 116, 139); doc.setLineWidth(0.3)
      doc.rect(xIva, y - 3.5, 3.5, 3.5)
      if (checked) {
        doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42)
        doc.text('x', xIva + 0.5, y - 0.5)
      }
      doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 23, 42)
      doc.text(opt, xIva + 4.5, y)
      xIva += doc.getTextWidth(opt) + 9
    })
    y += 5
  } else {
    doc.setFontSize(10); doc.text('Consumidor Final', 14, y); y += 5
  }

  doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.5)
  doc.line(14, y, w - 14, y); y += 6

  // Tabla items
  autoTable(doc, {
    startY: y,
    head: [['Descripción', 'Cantidad', 'Unidad', 'Observaciones']],
    body: sale.items?.map((it: any) => [it.description, String(it.quantity), 'U', '']) || [],
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'center', cellWidth: 22 },
      3: { cellWidth: 52 },
    },
    margin: { left: 14, right: 14 },
  })

  y = (doc as any).lastAutoTable.finalY + 8

  // Firma recepción
  const sigY = Math.max(y + 4, h - 80)
  doc.setFontSize(8); doc.setTextColor(100, 116, 139); doc.setFont('helvetica', 'bold')
  doc.text('RECEPCIÓN', 14, sigY)
  doc.setDrawColor(15, 23, 42); doc.setLineWidth(0.4)
  doc.line(14, sigY + 14, 90, sigY + 14)
  doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139)
  doc.text('Firma y aclaración (receptor)', 14, sigY + 18)
  doc.text('Aclaración: ________________________________', 14, sigY + 23)
  doc.text('DNI: _______________________________________', 14, sigY + 28)

  doc.line(w - 80, sigY + 14, w - 14, sigY + 14)
  doc.setFontSize(8); doc.text('Firma y sello (emisor)', w - 80, sigY + 18)

  // Sección transporte
  const tY = sigY + 36
  doc.setFillColor(248, 250, 252)
  doc.rect(14, tY - 4, w - 28, 36, 'F')
  doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.3)
  doc.rect(14, tY - 4, w - 28, 36)

  doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139)
  doc.text('TRANSPORTE', 16, tY)

  const tp = sale.transportPropio
  doc.setTextColor(15, 23, 42); doc.setFont('helvetica', 'normal')
  doc.text('Transporte Propio:', 16, tY + 6)
  doc.rect(46, tY + 2.5, 3, 3); if (tp) doc.text('x', 46.5, tY + 5)
  doc.text('Sí', 50, tY + 6)
  doc.rect(56, tY + 2.5, 3, 3); if (tp === false && tp !== undefined) doc.text('x', 56.5, tY + 5)
  doc.text('No  —  Art. 12 RG 3434', 60, tY + 6)

  const field = (label: string, val: string | undefined, x: number, fy: number, maxW = 60) => {
    doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139)
    doc.text(`${label}:`, x, fy)
    doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 23, 42)
    doc.text(val || '______________________________'.slice(0, Math.floor(maxW / 1.8)), x + doc.getTextWidth(label) + 2, fy)
  }

  field('Transportista', sale.transportistaNombre, 16, tY + 13, 70)
  field('CUIT', sale.transportistaCuit, 110, tY + 13, 40)
  field('Domicilio', sale.transportistaDomicilio, 16, tY + 19, 90)
  field('Conductor', sale.conductorNombre, 16, tY + 25, 60)
  field('DNI', sale.conductorDni, 90, tY + 25, 30)
  field('Reg.Nº', sale.conductorRegNum, 130, tY + 25, 30)
  field('Dom. Camión', sale.dominioVehiculo, 16, tY + 31, 30)
  field('Dom. Acoplado', sale.dominioAcoplado, 80, tY + 31, 30)

  // Footer
  doc.setFontSize(7); doc.setTextColor(148, 163, 184)
  const footerParts = [cfg.businessName, cfg.cuit ? `CUIT ${cfg.cuit}` : '', cfg.address].filter(Boolean)
  doc.text(footerParts.join('  ·  '), w / 2, h - 6, { align: 'center' })

  doc.save(`remito-${compNum}.pdf`)
}
