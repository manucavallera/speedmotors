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
  hp: number | null
  categoryName: string | null
  entryDate: string
  clientId: number
  clientName: string
  clientPhone: string | null
}

// Escala por HP y/o eslora que define la tarifa mensual de cuna
export interface StorageCategory {
  id: number
  name: string
  minHp: number | null
  maxHp: number | null
  minLength: string | null
  maxLength: string | null
  monthlyRate: string
  launchRate: string
  active: boolean
}

export interface CategoryForm {
  name: string
  minHp?: number
  maxHp?: number
  minLength?: number
  maxLength?: number
  monthlyRate?: number
  launchRate?: number
  active?: boolean
}

export interface GuarderiaStats {
  ingresosMes: number
}

export interface MapSpot {
  spotId: number
  code: string
  // Línea del galpón: A, B, C o D
  line: string
  label: string | null
  active: boolean
  occupied: boolean
  debt: number
  unit: MapUnit | null
}

// Fila del listado de embarcaciones. spotId null = suelta sobre trailer, sin cuna asignada.
export interface UnitRow {
  id: number
  description: string
  rate: string
  hp: number | null
  lengthM: string | null
  categoryId: number | null
  categoryName: string | null
  entryDate: string
  status: string
  clientId: number | null
  clientName: string | null
  spotId: number | null
  spotCode: string | null
  debt: number
}

export interface StorageService {
  id: number
  name: string
  price: string
  active: boolean
  // Dónde se cobra: adherido a la lancha (con la cuna del mes) y/o al reservar un turno
  forUnit: boolean
  forSlot: boolean
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
  forUnit?: boolean
  forSlot?: boolean
}

export interface UnitDetail {
  id: number
  description: string
  rate: string
  hp: number | null
  lengthM: string | null
  categoryId: number | null
  categoryName: string | null
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
  fixedServices: { id: number; name: string; price: string }[]
}

export interface CreateUnitForm {
  clientId: number
  spotId?: number
  categoryId?: number
  description: string
  hp?: number
  lengthM?: number
  rate?: number
  entryDate?: string
  notes?: string
  // Servicios fijos (seguros): se cobran todos los meses junto con la cuna
  fixedServiceIds?: number[]
}

// Editar una lancha ya cargada: solo los campos editables, todo opcional
export interface UpdateUnitForm {
  categoryId?: number | null
  description?: string
  hp?: number | null
  lengthM?: number | null
  rate?: number
  notes?: string
}

// Una lancha del cobro masivo del mes: la cuna + sus servicios fijos
export interface MonthChargeRow {
  unitId: number
  description: string
  clientName: string | null
  spotCode: string | null
  items: { concept: string; amount: number; serviceId: number | null }[]
  total: number
}

// Ficha del cliente de guardería: todo lo suyo en un solo lugar
export interface ClientFile {
  client: { id: number; name: string; phone: string | null; email: string | null }
  debt: number
  units: {
    id: number
    description: string
    hp: number | null
    lengthM: string | null
    rate: string
    status: string
    entryDate: string
    spotCode: string | null
    categoryName: string | null
  }[]
  charges: (StorageCharge & { items: ChargeItem[] })[]
  salidas: {
    id: number
    date: string
    startTime: string
    endTime: string
    price: string
    status: string
    paidAt: string | null
    boatName: string | null
  }[]
}

export interface MonthPreview {
  periodLabel: string
  units: number
  total: number
  alreadyCharged: number
  detail: MonthChargeRow[]
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
