export type PrintedFormKind = 'invoice' | 'remito'

export interface PrintOffset {
  x: number
  y: number
}

export interface PrintField {
  x: number
  y: number
  width: number
  align?: 'left' | 'right' | 'center'
  fontSize?: number
  bold?: boolean
}

export interface DetailGrid {
  startY: number
  lineHeight: number
  maxLines: number
  description: PrintField
  quantity: PrintField
  unitPrice?: PrintField
  subtotal?: PrintField
}

export interface PrintedFormLayout {
  kind: PrintedFormKind
  pageSizeMm: readonly [number, number]
  fields: Readonly<Record<string, PrintField>>
  detail: DetailGrid
}

export interface PrintItem {
  description: string
  quantity: number
  unitPrice: string | number
  subtotal: string | number
  ingresoTipo?: 'blanco' | 'negro' | null
}

export interface PrintSale {
  id: number
  saleNumber?: string | null
  invoiceType?: 'A' | 'B' | 'X' | 'mixto'
  createdAt: string | Date
  total: string | number
  subtotal?: string | number
  discount?: string | number
  amountFormal?: string | number | null
  paymentMethod?: string | null
  items: PrintItem[]
  transportPropio?: boolean | null
  transportistaNombre?: string | null
  transportistaCuit?: string | null
  transportistaDomicilio?: string | null
  conductorNombre?: string | null
  conductorDni?: string | null
  conductorRegNum?: string | null
  dominioVehiculo?: string | null
  dominioAcoplado?: string | null
}

export interface PrintClient {
  name?: string | null
  cuit?: string | null
  dni?: string | null
  address?: string | null
  condicionIva?: string | null
}

export interface PrintTextCommand {
  field: string
  text: string
  x: number
  y: number
  width: number
  align: 'left' | 'right' | 'center'
  fontSize: number
  bold?: boolean
}

export interface PrintIssuerSettings {
  businessName: string
  tagline: string
  address: string
  phone: string
  email: string
  cuit: string
  condicionIva: string
}
