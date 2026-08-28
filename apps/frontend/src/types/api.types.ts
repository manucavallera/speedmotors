export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  pages: number
}

export interface Client {
  id: number
  name: string
  phone: string | null
  email: string | null
  dni: string | null
  cuit: string | null
  condicionIva: string | null
  address: string | null
  notes: string | null
  createdAt: string
  updatedAt: string | null
}

export interface Product {
  id: number
  code: string
  name: string
  brand: string | null
  costPrice: string
  sellPrice: string
  stock: number
  minStock: number
  unit: string
  photoUrl: string | null
  serialNumber: string | null
  ingresoTipo: string | null
  active: boolean
  createdAt: string
  updatedAt: string | null
}

export interface Sale {
  id: number
  saleNumber: string
  clientId: number | null
  userId: number
  type: 'contado' | 'cuotas' | 'cuenta_corriente' | 'financiado_tercero'
  invoiceType: 'A' | 'B' | 'X' | 'mixto'
  paymentMethod: 'efectivo' | 'transferencia' | 'tarjeta' | 'mixto'
  subtotal: string
  discount: string
  interestRate: string
  total: string
  amountFormal: string
  amountInformal: string
  financingCurrency: string | null
  financingProvider: string | null
  notes: string | null
  status: 'activa' | 'cancelado'
  createdAt: string
  updatedAt: string | null
}

export interface Vehicle {
  id: number
  type: 'moto' | 'lancha'
  brand: string
  model: string | null
  vesselNumber?: string | null
  displacement: number | null
  version: string | null
  year: number | null
  color: string | null
  chassisNumber: string | null
  engineNumber: string | null
  internalCode: string | null
  importCode: string | null
  status: 'disponible' | 'reservado' | 'vendido'
  sellPrice: string | null
  costPrice: string | null
  notes: string | null
  photoUrl: string | null
  createdAt: string
  updatedAt: string | null
}

export interface Expense {
  id: number
  userId: number
  category: string
  description: string
  amount: string
  date: string
  createdAt: string
}

export interface Reservation {
  id: number
  reservationNumber: string | null
  clientId: number | null
  clientName: string
  clientDni: string | null
  clientAddress: string | null
  clientPhone: string | null
  spouseName: string | null
  spouseDni: string | null
  vehicleType: 'moto' | 'lancha'
  brand: string
  model: string | null
  year: number | null
  color: string | null
  motorNumber: string | null
  chassisNumber: string | null
  price: string | null
  depositAmount: string | null
  notes: string | null
  status: 'vigente' | 'concretada' | 'cancelada'
  date: string | null
  createdAt: string
}
