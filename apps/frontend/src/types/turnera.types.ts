// Lancha de guardería elegible para botadura (viene de /guarderia/units?status=en_guarderia)
export interface GuarderiaUnitOption {
  id: number
  description: string
  clientId: number
  clientName: string | null
}

export interface RentalSlot {
  id: number
  unitId: number
  boatName: string | null
  clientId: number
  clientName: string | null
  date: string
  startTime: string
  endTime: string
  serviceId: number | null
  price: string
  status: 'reservado' | 'cancelado' | 'completado'
  paidAt: string | null
  notes: string | null
}

// Resumen por día para el calendario del mes
export interface DaySummary {
  date: string
  reserved: number
  cobrado: number
}

export interface SlotForm {
  unitId: number
  date: string
  startTime: string
  endTime: string
  serviceId?: number
  price?: number
  notes?: string
}
