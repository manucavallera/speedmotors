export interface PurchaseOrderItemDto {
  productId?: number
  description: string
  quantity: number
  unitPrice: number
}

export interface CreatePurchaseOrderDto {
  supplierId?: number
  notes?: string
  expectedDate?: string
  amountFormal?: number
  amountInformal?: number
  items: PurchaseOrderItemDto[]
}
