export interface ProvProduct {
  id: number
  name: string
  sellPrice: string
  costPrice: string
  stock: number
  minStock: number
  barcode: string | null
}

export interface CartItem {
  productId: number
  name: string
  price: number
  quantity: number
  stock: number
}

export interface ProvProductForm {
  name: string
  sellPrice: number
  costPrice?: number
  stock?: number
  minStock?: number
  barcode?: string
}
