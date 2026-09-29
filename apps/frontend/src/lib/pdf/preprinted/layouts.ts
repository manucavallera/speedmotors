import type { PrintedFormKind, PrintedFormLayout } from './types'

const invoiceLayout: PrintedFormLayout = {
  kind: 'invoice',
  pageSizeMm: [210, 297],
  fields: {
    issueDate: { x: 151, y: 40.6, width: 35 },
    customerDocument: { x: 23, y: 72.2, width: 34 },
    customerName: { x: 124.5, y: 71.9, width: 76 },
    customerAddress: { x: 124.5, y: 78, width: 76 },
    customerIva: { x: 46.2, y: 78, width: 52 },
    paymentCondition: { x: 39.9, y: 85.8, width: 30 },
    subtotal: { x: 188, y: 198, width: 17, align: 'right' },
    otherTaxes: { x: 188, y: 204.3, width: 17, align: 'right' },
    total: { x: 188, y: 211, width: 17, align: 'right' },
  },
  detail: {
    startY: 102.9,
    lineHeight: 3.25,
    maxLines: 24,
    description: { x: 20.1, y: 0, width: 49.5 },
    quantity: { x: 85.9, y: 0, width: 22.6, align: 'right' },
    unitPrice: { x: 121.4, y: 0, width: 27.5, align: 'right' },
    discount: { x: 137.8, y: 0, width: 25.8, align: 'right' },
    subtotal: { x: 172.4, y: 0, width: 28.2, align: 'right' },
  },
}

const remitoLayout: PrintedFormLayout = {
  kind: 'remito',
  pageSizeMm: [215.9, 279.4],
  fields: {
    dateDay: { x: 126, y: 23.5, width: 19, align: 'center' },
    dateMonth: { x: 151, y: 23.5, width: 19, align: 'center' },
    dateYear: { x: 180, y: 23.5, width: 28, align: 'center' },
    customerName: { x: 17, y: 52, width: 185 },
    customerAddress: { x: 18, y: 62, width: 112 },
    customerDocument: { x: 145, y: 62, width: 57 },
    ivaResponsible: { x: 38, y: 69.3, width: 3, align: 'center' },
    ivaMonotributo: { x: 89, y: 69.3, width: 3, align: 'center' },
    ivaExempt: { x: 89, y: 73, width: 3, align: 'center' },
    ivaConsumer: { x: 145, y: 73, width: 3, align: 'center' },
    receivedPackages: { x: 56, y: 237.2, width: 20, align: 'center' },
    receiverName: { x: 150, y: 237.2, width: 51 },
    transportOwn: { x: 42, y: 245, width: 3, align: 'center' },
    transportThirdParty: { x: 83, y: 245, width: 3, align: 'center' },
    carrierName: { x: 31, y: 251.2, width: 168 },
    carrierAddress: { x: 29, y: 257.5, width: 104 },
    carrierCuit: { x: 149, y: 257.5, width: 50 },
    driverName: { x: 27, y: 264, width: 91 },
    driverDni: { x: 127, y: 264, width: 31 },
    driverLicense: { x: 177, y: 264, width: 23 },
    truckPlate: { x: 42, y: 271, width: 32 },
    trailerPlate: { x: 104, y: 271, width: 42 },
  },
  detail: {
    startY: 84.3,
    lineHeight: 7.35,
    maxLines: 20,
    description: { x: 46, y: 0, width: 150 },
    quantity: { x: 26, y: 0, width: 15, align: 'right' },
  },
}

const layouts: Record<PrintedFormKind, PrintedFormLayout> = {
  invoice: invoiceLayout,
  remito: remitoLayout,
}

export function getPrintedFormLayout(kind: PrintedFormKind): PrintedFormLayout {
  return layouts[kind]
}
