import { getPrintedFormLayout } from './layouts'
import type { PrintClient, PrintOffset, PrintSale, PrintedFormKind, PrintTextCommand } from './types'

export class PrintedFormOverflowError extends Error {
  constructor() {
    super('Los ítems no entran en el formulario preimpreso')
  }
}

function money(value: string | number | null | undefined): string {
  return Number(value || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function unitMoney(value: number): string {
  return value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function wrap(text: string, width: number): string[] {
  const maxChars = Math.max(1, Math.floor(width / 1.6))
  const words = text.trim().split(/\s+/).filter(Boolean)
  return words.reduce<string[]>((lines, word) => {
    const current = lines.at(-1) || ''
    if (!current || `${current} ${word}`.length > maxChars) lines.push(word)
    else lines[lines.length - 1] = `${current} ${word}`
    return lines
  }, [])
}

export function composePreprintedForm(kind: PrintedFormKind, sale: PrintSale, client: PrintClient | undefined, offset: PrintOffset): PrintTextCommand[] {
  const layout = getPrintedFormLayout(kind)
  const commands: PrintTextCommand[] = []
  const add = (field: string, text: string | null | undefined, y?: number) => {
    const position = layout.fields[field]
    if (!position || !text) return
    commands.push({ field, text, x: position.x + offset.x, y: (y ?? position.y) + offset.y, width: position.width, align: position.align || 'left', fontSize: position.fontSize || 8 })
  }
  const document = client?.cuit ? `CUIT: ${client.cuit}` : client?.dni ? `DNI: ${client.dni}` : ''
  const iva = client?.condicionIva || 'consumidor_final'
  let invoiceNetAmount: number | undefined

  if (kind === 'remito') {
    const date = new Date(sale.createdAt)
    add('dateDay', String(date.getUTCDate()).padStart(2, '0'))
    add('dateMonth', String(date.getUTCMonth() + 1).padStart(2, '0'))
    add('dateYear', String(date.getUTCFullYear()))
    add('customerName', client?.name)
    add('customerAddress', client?.address)
    add('customerDocument', document)
    const ivaField = iva === 'responsable_inscripto' ? 'ivaResponsible' : iva === 'monotributo' || iva === 'monotributista' ? 'ivaMonotributo' : iva === 'exento' ? 'ivaExempt' : 'ivaConsumer'
    add(ivaField, 'X')
    add(sale.transportPropio ? 'transportOwn' : 'transportThirdParty', 'X')
    add('carrierName', sale.transportistaNombre)
    add('carrierAddress', sale.transportistaDomicilio)
    add('carrierCuit', sale.transportistaCuit)
    add('driverName', sale.conductorNombre)
    add('driverDni', sale.conductorDni)
    add('driverLicense', sale.conductorRegNum)
    add('truckPlate', sale.dominioVehiculo)
    add('trailerPlate', sale.dominioAcoplado)
  } else {
    const date = new Date(sale.createdAt)
    add('issueDate', date.toLocaleDateString('es-AR', { timeZone: 'UTC' }))
    add('customerDocument', document)
    add('customerName', client?.name)
    add('customerAddress', client?.address)
    add('customerIva', client?.condicionIva)
    add('paymentCondition', sale.paymentMethod)
    const total = sale.invoiceType === 'mixto' ? sale.amountFormal : sale.total
    const gross = Number(sale.subtotal ?? sale.items.reduce((sum, item) => sum + Number(item.subtotal), 0))
    const net = sale.invoiceType === 'A' ? Number(total) / 1.21 : sale.invoiceType === 'mixto' ? Number(total) : gross - Number(sale.discount || 0)
    invoiceNetAmount = net
    add('subtotal', money(net))
    if (sale.invoiceType === 'A') add('vat', money(Number(total) - net))
    add('total', money(total))
  }

  const invoiceItems = kind === 'invoice' && sale.invoiceType === 'mixto'
    ? sale.items.filter(item => item.ingresoTipo === 'blanco')
    : sale.items
  const invoiceBase = invoiceItems.reduce((sum, item) => sum + Number(item.subtotal), 0)
  const allItemsBase = Number(sale.subtotal ?? sale.items.reduce((sum, item) => sum + Number(item.subtotal), 0))
  const invoiceDiscount = sale.invoiceType === 'mixto' || allItemsBase <= 0
    ? 0
    : Number(sale.discount || 0) * (invoiceBase / allItemsBase)
  const discountedInvoiceBase = invoiceBase - invoiceDiscount
  const invoiceScale = kind !== 'invoice' || discountedInvoiceBase <= 0
    ? 1
    : sale.invoiceType === 'mixto'
      ? Number(sale.amountFormal || 0) / invoiceBase
      : sale.invoiceType === 'A'
        ? Number(sale.total) / 1.21 / discountedInvoiceBase
        : 1
  const itemDiscounts = invoiceItems.map(item => sale.invoiceType === 'mixto' || allItemsBase <= 0
    ? 0
    : Number(sale.discount || 0) * (Number(item.subtotal) / allItemsBase))
  const detailSubtotals = invoiceItems.map((item, index) => roundMoney((Number(item.subtotal) - itemDiscounts[index]) * invoiceScale))
  if (invoiceNetAmount !== undefined && detailSubtotals.length > 0) {
    const roundedNet = roundMoney(invoiceNetAmount)
    const roundedRows = detailSubtotals.reduce((sum, subtotal) => sum + subtotal, 0)
    detailSubtotals[detailSubtotals.length - 1] = roundMoney(detailSubtotals.at(-1)! + roundedNet - roundedRows)
  }
  const detailLines = invoiceItems.flatMap((item, itemIndex) => {
    const lines = wrap(item.description, layout.detail.description.width)
    return lines.map((line, index) => ({ line, item, itemIndex, first: index === 0 }))
  })
  if (detailLines.length > layout.detail.maxLines) throw new PrintedFormOverflowError()
  detailLines.forEach(({ line, item, itemIndex, first }, index) => {
    const y = layout.detail.startY + index * layout.detail.lineHeight + offset.y
    const addDetail = (field: 'description' | 'quantity' | 'unitPrice' | 'subtotal', text: string) => {
      const position = layout.detail[field]
      if (!position || !text) return
      commands.push({ field, text, x: position.x + offset.x, y, width: position.width, align: position.align || 'left', fontSize: 8 })
    }
    addDetail('description', line)
    if (first) {
      addDetail('quantity', String(item.quantity))
      if (kind === 'invoice') {
        const printedSubtotal = detailSubtotals[itemIndex]
        const quantity = Number(item.quantity)
        const effectiveUnitPrice = quantity > 0 ? printedSubtotal / quantity : Number(item.unitPrice) * invoiceScale
        addDetail('unitPrice', unitMoney(effectiveUnitPrice))
        addDetail('subtotal', money(printedSubtotal))
      }
    }
  })
  return commands
}
