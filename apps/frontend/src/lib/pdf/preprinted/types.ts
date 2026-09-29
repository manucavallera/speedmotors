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
}

export interface DetailGrid {
  startY: number
  lineHeight: number
  maxLines: number
  description: PrintField
  quantity: PrintField
  unitPrice?: PrintField
  discount?: PrintField
  subtotal?: PrintField
}

export interface PrintedFormLayout {
  kind: PrintedFormKind
  pageSizeMm: readonly [number, number]
  fields: Readonly<Record<string, PrintField>>
  detail: DetailGrid
}
