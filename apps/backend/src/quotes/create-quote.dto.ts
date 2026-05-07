export interface QuoteItemDto {
  productId?: number
  vehicleId?: number
  description: string
  quantity: number
  unitPrice: number
}

export interface CreateQuoteDto {
  clientId?: number
  userId: number
  discount?: number
  notes?: string
  items: QuoteItemDto[]
}
