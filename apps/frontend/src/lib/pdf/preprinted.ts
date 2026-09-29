import jsPDF from 'jspdf'
import { toast } from '../toast'
import { composePreprintedForm, PrintedFormOverflowError } from './preprinted/compose'
import { getPrintedFormLayout } from './preprinted/layouts'
import { loadPrintOffset } from './preprinted/settings'
import type { PrintClient, PrintOffset, PrintSale, PrintedFormKind, PrintTextCommand } from './preprinted/types'

function generate(kind: PrintedFormKind, sale: PrintSale, client?: PrintClient): void {
  const layout = getPrintedFormLayout(kind)
  const doc = new jsPDF({ unit: 'mm', format: [...layout.pageSizeMm], orientation: 'portrait' })
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  let commands: PrintTextCommand[]
  try {
    commands = composePreprintedForm(kind, sale, client, loadPrintOffset(kind))
  } catch (error) {
    if (error instanceof PrintedFormOverflowError) {
      toast.error(error.message)
      return
    }
    throw error
  }
  commands.forEach(command => {
    doc.setFontSize(command.fontSize)
    doc.text(command.text, command.x, command.y, { maxWidth: command.width, align: command.align })
  })
  doc.autoPrint()
  doc.output('dataurlnewwindow')
}

export function generatePreprintedInvoice(sale: PrintSale, client?: PrintClient): void {
  generate('invoice', sale, client)
}

export function generatePreprintedRemito(sale: PrintSale, client?: PrintClient): void {
  generate('remito', sale, client)
}

export function generatePreprintedCalibration(kind: PrintedFormKind, offset: PrintOffset = loadPrintOffset(kind)): void {
  const layout = getPrintedFormLayout(kind)
  const doc = new jsPDF({ unit: 'mm', format: [...layout.pageSizeMm], orientation: 'portrait' })
  doc.setTextColor(100, 116, 139)
  doc.setFontSize(9)
  doc.text(`Prueba de calibración — ${kind === 'invoice' ? 'Factura A4' : 'Remito Carta'}`, 10, 10)
  doc.setFontSize(6)
  for (let x = 0; x <= layout.pageSizeMm[0]; x += 10) doc.line(x, 15, x, layout.pageSizeMm[1])
  for (let y = 15; y <= layout.pageSizeMm[1]; y += 10) doc.line(0, y, layout.pageSizeMm[0], y)
  Object.entries(layout.fields).forEach(([name, field]) => {
    const x = field.x + offset.x
    const y = field.y + offset.y
    doc.text(name, x, y)
    doc.line(x, y + 1, x + field.width, y + 1)
  })
  doc.autoPrint()
  doc.output('dataurlnewwindow')
}
