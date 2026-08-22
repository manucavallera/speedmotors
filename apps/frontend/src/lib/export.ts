import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { getSettings } from './pdf/helpers'

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\n')
}

function downloadBlob(content: string, filename: string, mime = 'text/csv;charset=utf-8;') {
  const blob = new Blob(['﻿' + content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function pdfHeader(doc: jsPDF, title: string) {
  const cfg = getSettings()
  const w = doc.internal.pageSize.getWidth()
  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, w, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14); doc.setFont('helvetica', 'bold')
  doc.text(cfg.businessName, 14, 12)
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(148, 163, 184)
  doc.text(title, 14, 20)
  doc.setFontSize(8)
  doc.text(new Date().toLocaleDateString('es-AR'), w - 14, 20, { align: 'right' })
  return 34
}

export function exportSalesCsv(sales: any[], clients: any[]) {
  const clientMap = Object.fromEntries(clients.map((c: any) => [c.id, c.name]))
  const rows = sales.map(s => ({
    'Comprobante': s.saleNumber || s.id,
    'Fecha': new Date(s.createdAt).toLocaleDateString('es-AR'),
    'Cliente': clientMap[s.clientId] || '',
    'Tipo': s.type,
    'Pago': s.paymentMethod,
    'Fctura': s.invoiceType || 'X',
    'Subtotal': Number(s.subtotal).toFixed(2),
    'Descuento': Number(s.discount || 0).toFixed(2),
    'Total': Number(s.total).toFixed(2),
    'Estado': s.status,
  }))
  downloadBlob(toCsv(rows), `ventas-${new Date().toISOString().slice(0, 10)}.csv`)
}

export function exportSalesPdf(sales: any[], clients: any[]) {
  const clientMap = Object.fromEntries(clients.map((c: any) => [c.id, c.name]))
  const doc = new jsPDF({ format: 'a4', unit: 'mm', orientation: 'landscape' })
  const startY = pdfHeader(doc, `Listado de Ventas — ${sales.length} registros`)
  autoTable(doc, {
    startY,
    head: [['Comprobante', 'Fecha', 'Cliente', 'Tipo', 'Pago', 'Fctura', 'Subtotal', 'Desc.', 'Total', 'Estado']],
    body: sales.map(s => [
      s.saleNumber || s.id,
      new Date(s.createdAt).toLocaleDateString('es-AR'),
      clientMap[s.clientId] || '',
      s.type, s.paymentMethod, s.invoiceType || 'X',
      `$${Number(s.subtotal).toLocaleString('es-AR')}`,
      `$${Number(s.discount || 0).toLocaleString('es-AR')}`,
      `$${Number(s.total).toLocaleString('es-AR')}`,
      s.status,
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 6: { halign: 'right' }, 7: { halign: 'right' }, 8: { halign: 'right' } },
    margin: { left: 10, right: 10 },
  })
  doc.save(`ventas-${new Date().toISOString().slice(0, 10)}.pdf`)
}

export function exportProductsCsv(products: any[]) {
  const rows = products.map((p: any) => ({
    'Nombre': p.name,
    'Código': p.code || '',
    'Categoría': p.category || '',
    'Stock': p.stock,
    'Precio': Number(p.price).toFixed(2),
    'Costo': Number(p.cost || 0).toFixed(2),
  }))
  downloadBlob(toCsv(rows), `productos-${new Date().toISOString().slice(0, 10)}.csv`)
}

export function exportProductsXlsx(products: any[]) {
  const rows = products.map((p: any) => ({
    'Código': p.code || '',
    'Nombre': p.name || '',
    'Marca': p.brand || '',
    'Stock': Number(p.stock || 0),
    'Stock mínimo': Number(p.minStock || 0),
    'Costo': Number(p.costPrice || 0),
    'Precio venta': Number(p.sellPrice || 0),
    'Ingreso': p.ingresoTipo || '',
  }))
  const sheet = XLSX.utils.json_to_sheet(rows)
  sheet['!cols'] = [
    { wch: 18 }, { wch: 34 }, { wch: 20 }, { wch: 10 },
    { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 12 },
  ]
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Stock actual')
  XLSX.writeFile(workbook, `stock-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

export function exportProductsPdf(products: any[]) {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' })
  const startY = pdfHeader(doc, `Stock de Productos — ${products.length} ítems`)
  autoTable(doc, {
    startY,
    head: [['Nombre', 'Código', 'Categoría', 'Stock', 'Precio', 'Costo']],
    body: products.map((p: any) => [
      p.name, p.code || '', p.category || '', p.stock,
      `$${Number(p.price).toLocaleString('es-AR')}`,
      `$${Number(p.cost || 0).toLocaleString('es-AR')}`,
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 3: { halign: 'center' }, 4: { halign: 'right' }, 5: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  })
  doc.save(`productos-${new Date().toISOString().slice(0, 10)}.pdf`)
}
