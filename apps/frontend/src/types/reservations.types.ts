export interface CreateReservationDto {
  date?: string
  clientId?: number
  clientName: string
  clientDni?: string
  clientAddress?: string
  clientPhone?: string
  spouseName?: string
  spouseDni?: string
  vehicleType: 'moto' | 'lancha'
  brand: string
  model?: string
  year?: number
  color?: string
  motorNumber?: string
  chassisNumber?: string
  price?: number
  depositAmount?: number
  notes?: string
}
