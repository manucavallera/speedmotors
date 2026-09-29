import jsPDF from 'jspdf'
import { composePreprintedForm } from './preprinted/compose'
import { getPrintedFormLayout } from './preprinted/layouts'
import { loadPrintOffset } from './preprinted/settings'
import type { PrintClient, PrintSale, PrintedFormKind } from './preprinted/types'

function generate(kind: PrintedFormKind, sale: PrintSale, client?: PrintClient): void {
  const layout = getPrintedFormLayout(kind)
  const doc = new jsPDF({ unit: 'mm', format: [...layout.pageSizeMm], orientation: 'portrait' })
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  composePreprintedForm(kind, sale, client, loadPrintOffset(kind)).forEach(command => {
    doc.setFontSize(command.fontSize)
    doc.text(command.text, command.x, command.y, { maxWidth: command.width, align: command.align })
  })
  doc.save(`${kind}-preimpreso-${sale.saleNumber || sale.id}.pdf`)
}

export function generatePreprintedInvoice(sale: PrintSale, client?: PrintClient): void {
  generate('invoice', sale, client)
}

export function generatePreprintedRemito(sale: PrintSale, client?: PrintClient): void {
  generate('remito', sale, client)
}

export function generatePreprintedCalibration(kind: PrintedFormKind): void {
  const layout = getPrintedFormLayout(kind)
  const doc = new jsPDF({ unit: 'mm', format: [...layout.pageSizeMm], orientation: 'portrait' })
  doc.setTextColor(100, 116, 139)
  doc.setFontSize(9)
  doc.text(`Prueba de calibración — ${kind === 'invoice' ? 'Factura A4' : 'Remito Carta'}`, 10, 10)
  doc.setFontSize(6)
  for (let x = 0; x <= layout.pageSizeMm[0]; x += 10) doc.line(x, 15, x, layout.pageSizeMm[1])
  for (let y = 15; y <= layout.pageSizeMm[1]; y += 10) doc.line(0, y, layout.pageSizeMm[0], y)
  Object.entries(layout.fields).forEach(([name, field]) => doc.text(name, field.x, field.y))
  doc.save(`calibracion-${kind}.pdf`)
}
