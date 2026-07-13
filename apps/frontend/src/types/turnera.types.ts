// Lancha de guardería elegible para botadura (viene de /guarderia/units?status=en_guarderia)
export interface GuarderiaUnitOption {
  id: number
  description: string
  clientId: number
  clientName: string | null
}

// Un servicio pedido en el turno (batería, combustible, parrilla...)
export interface SlotItem {
  id: number
  slotId: number
  serviceId: number | null
  concept: string
  amount: string
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
  // Total del turno: la suma de los servicios pedidos
  price: string
  status: 'reservado' | 'cancelado' | 'completado'
  paidAt: string | null
  notes: string | null
  items: SlotItem[]
}

// Resumen por día para el calendario del mes
export interface DaySummary {
  date: string
  reserved: number
  cobrado: number
}

export interface SlotItemForm {
  serviceId?: number
  concept: string
  amount: number
}

export interface SlotForm {
  unitId: number
  date: string
  startTime: string
  endTime: string
  items?: SlotItemForm[]
  notes?: string
}
