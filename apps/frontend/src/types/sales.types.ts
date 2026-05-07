// @file: sales.types.ts | Tipos compartidos del dominio ventas. Importar desde acá, no redefinir inline.
export interface SaleItem {
  description: string
  quantity: number
  unitPrice: number
  productId?: number
  vehicleId?: number
  ingresoTipo?: string
}

export interface CreateSaleData {
  clientId?: number
  invoiceType: 'A' | 'B' | 'X' | 'mixto'
  type: 'contado' | 'cuotas'
  paymentMethod: string
  discount: number
  interestRate: number
  installmentCount: number
  notes: string
  items: SaleItem[]
}
