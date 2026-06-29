export interface StorageSpot {
  id: number
  code: string
  label: string | null
  active: boolean
}

export interface MapUnit {
  id: number
  description: string
  rate: number
  entryDate: string
  clientId: number
  clientName: string
  clientPhone: string | null
}

export interface GuarderiaStats {
  ingresosMes: number
}

export interface MapSpot {
  spotId: number
  code: string
  label: string | null
  active: boolean
  occupied: boolean
  debt: number
  unit: MapUnit | null
}

export interface StorageService {
  id: number
  name: string
  price: string
  active: boolean
}

export interface ChargeItem {
  id: number
  chargeId: number
  concept: string
  amount: string
  serviceId: number | null
}

export interface StorageCharge {
  id: number
  storageUnitId: number
  amount: string
  periodLabel: string | null
  chargeDate: string
  paidAt: string | null
  notes: string | null
  items?: ChargeItem[]
}

export interface ServiceForm {
  name: string
  price?: number
  active?: boolean
}

export interface UnitDetail {
  id: number
  description: string
  rate: string
  entryDate: string
  exitDate: string | null
  status: string
  notes: string | null
  clientId: number
  clientName: string | null
  spotId: number | null
  spotCode: string | null
  charges: StorageCharge[]
  debt: number
}

export interface CreateUnitForm {
  clientId: number
  spotId?: number
  description: string
  rate?: number
  entryDate?: string
  notes?: string
}

export interface ChargeItemForm {
  concept: string
  amount: number
  serviceId?: number
}

export interface ChargeForm {
  items: ChargeItemForm[]
  periodLabel?: string
  paid?: boolean
  notes?: string
}
