import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getSettings } from './helpers'

export function generateAccountStatement(client: any, account: any) {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' })
  const w = doc.internal.pageSize.getWidth()
  const cfg = getSettings()
  const fecha = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })

  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, w, 38, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20); doc.setFont('helvetica', 'bold')
  doc.text(cfg.businessName, 14, 16)
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(148, 163, 184)
  doc.text('ESTADO DE CUENTA', 14, 23)
  doc.text(`Emitido: ${fecha}`, w - 14, 23, { align: 'right' })

  let y = 50
  doc.setFontSize(8); doc.setTextColor(100, 116, 139); doc.setFont('helvetica', 'bold')
  doc.text('CLIENTE', 14, y); y += 5
  doc.setTextColor(15, 23, 42)
  doc.setFontSize(13); doc.setFont('helvetica', 'bold')
  doc.text(client.name, 14, y); y += 6
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  if (client.cuit) { doc.text(`CUIT: ${client.cuit}`, 14, y); y += 5 }
  else if (client.dni) { doc.text(`DNI: ${client.dni}`, 14, y); y += 5 }
  if (client.address) { doc.text(`Domicilio: ${client.address}`, 14, y); y += 5 }
  if (client.phone) { doc.text(`Teléfono: ${client.phone}`, 14, y); y += 5 }

  y += 4
  doc.setDrawColor(226, 232, 240)
  doc.line(14, y, w - 14, y); y += 8

  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139)
  doc.text('RESUMEN', 14, y); y += 6

  const hasPending = account.totalPending > 0
  const hasOverdue = account.totalOverdue > 0
  const summaryData = [
    ['Total comprado', `$${Number(account.totalPurchased).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
    ['Deuda pendiente', `$${Number(account.totalPending).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
    ['Deuda vencida', `$${Number(account.totalOverdue).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
  ]

  autoTable(doc, {
    startY: y,
    body: summaryData,
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { halign: 'right', fontStyle: 'bold', cellWidth: 40,
           textColor: hasOverdue && summaryData[2][1] !== '$0,00' ? [220, 38, 38] : hasPending ? [217, 119, 6] : [22, 163, 74] },
    },
    margin: { left: 14, right: w - 120 },
    theme: 'plain',
  })

  y = (doc as any).lastAutoTable.finalY + 10

  if (account.sales?.length > 0) {
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139)
    doc.text('HISTORIAL DE COMPRAS', 14, y); y += 4

    autoTable(doc, {
      startY: y,
      head: [['N° Venta', 'Fecha', 'Tipo pago', 'Cuotas', 'Total']],
      body: account.sales.map((s: any) => [
        s.saleNumber || `#${s.id}`,
        new Date(s.createdAt).toLocaleDateString('es-AR'),
        s.paymentMethod || '—',
        s.installmentCount > 0 ? `${s.paidCount}/${s.installmentCount} pagas` : 'Contado',
        `$${Number(s.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
      ]),
      styles: { fontSize: 8.5, cellPadding: 3 },
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 0: { cellWidth: 32, fontStyle: 'bold' }, 1: { cellWidth: 28 }, 2: { cellWidth: 36 }, 3: { cellWidth: 32 }, 4: { halign: 'right', fontStyle: 'bold', cellWidth: 36 } },
      margin: { left: 14, right: 14 },
    })
    y = (doc as any).lastAutoTable.finalY + 10
  }

  const pendingInst = account.overdueInstallments || []
  const allPending = account.sales?.flatMap((s: any) => (s.installments || []).filter((i: any) => i.status === 'pendiente')) || []
  const instToShow = pendingInst.length > 0 ? pendingInst : allPending

  if (instToShow.length > 0) {
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139)
    doc.text('CUOTAS PENDIENTES', 14, y); y += 4

    autoTable(doc, {
      startY: y,
      head: [['Venta', 'N° Cuota', 'Vencimiento', 'Estado', 'Importe']],
      body: instToShow.map((i: any) => {
        const vencida = new Date(i.dueDate) < new Date()
        return [`#${i.saleId}`, `Cuota ${i.number}`, new Date(i.dueDate).toLocaleDateString('es-AR'), vencida ? 'VENCIDA' : 'Pendiente', `$${Number(i.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`]
      }),
      styles: { fontSize: 8.5, cellPadding: 3 },
      headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [254, 242, 242] },
      columnStyles: { 0: { cellWidth: 24 }, 1: { cellWidth: 26 }, 2: { cellWidth: 32 }, 3: { cellWidth: 28, fontStyle: 'bold' }, 4: { halign: 'right', fontStyle: 'bold', cellWidth: 36 } },
      margin: { left: 14, right: 14 },
    })
  }

  const pageH = doc.internal.pageSize.getHeight()
  doc.setFontSize(7); doc.setTextColor(148, 163, 184)
  const footerParts = [cfg.businessName, cfg.cuit ? `CUIT ${cfg.cuit}` : '', cfg.phone].filter(Boolean)
  doc.text(footerParts.join('  ·  '), w / 2, pageH - 10, { align: 'center' })

  doc.save(`estado-cuenta-${client.name.replace(/\s+/g, '-')}.pdf`)
}

export function generatePriceList(products: any[], _categories: any[]) {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' })
  const w = doc.internal.pageSize.getWidth()

  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, w, 32, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20); doc.setFont('helvetica', 'bold')
  doc.text('Speed Motors', 14, 14)
  doc.setFontSize(10); doc.setFont('helvetica', 'normal')
  doc.text('Lista de precios', 14, 22)
  doc.text(`Actualizada: ${new Date().toLocaleDateString('es-AR')}`, w - 14, 22, { align: 'right' })

  autoTable(doc, {
    startY: 40,
    head: [['Código', 'Descripción', 'Marca', 'Precio']],
    body: products.map(p => [p.code, p.name, p.brand || '—', `$${Number(p.sellPrice).toLocaleString('es-AR')}`]),
    styles: { fontSize: 7.5, cellPadding: 2.5 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 22, fontStyle: 'bold' }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 28 }, 3: { halign: 'right', cellWidth: 28, fontStyle: 'bold' } },
    margin: { left: 14, right: 14 },
    didDrawPage: () => {
      const pg = doc.internal.pages.length - 1
      doc.setFontSize(7); doc.setTextColor(148, 163, 184)
      doc.text(`Speed Motors — Página ${pg}`, w / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' })
    },
  })

  doc.save(`lista-precios-${new Date().toISOString().split('T')[0]}.pdf`)
}
