import { IsOptional, IsString, IsNumber, IsIn, Min } from 'class-validator'

export class CreateReservationDto {
  @IsOptional()
  @IsString()
  date?: string

  @IsOptional()
  @IsNumber()
  clientId?: number

  @IsOptional()
  @IsNumber()
  vehicleId?: number

  @IsString()
  clientName: string

  @IsOptional()
  @IsString()
  clientDni?: string

  @IsOptional()
  @IsString()
  clientAddress?: string

  @IsOptional()
  @IsString()
  clientPhone?: string

  @IsOptional()
  @IsString()
  clientEmail?: string

  @IsOptional()
  @IsString()
  clientBirthDate?: string

  @IsOptional()
  @IsString()
  clientLocality?: string

  @IsOptional()
  @IsString()
  clientZip?: string

  @IsOptional()
  @IsString()
  clientProvince?: string

  @IsOptional()
  @IsString()
  clientOccupation?: string

  @IsOptional()
  @IsString()
  patentingName?: string

  @IsOptional()
  @IsString()
  spouseName?: string

  @IsOptional()
  @IsString()
  spouseDni?: string

  @IsIn(['moto', 'lancha'])
  vehicleType: 'moto' | 'lancha'

  @IsString()
  brand: string

  @IsOptional()
  @IsString()
  model?: string

  @IsOptional()
  @IsNumber()
  year?: number

  @IsOptional()
  @IsString()
  color?: string

  @IsOptional()
  @IsString()
  motorNumber?: string

  @IsOptional()
  @IsString()
  chassisNumber?: string

  @IsOptional()
  @IsString()
  hullNumber?: string

  @IsOptional()
  @IsString()
  requestedUnit?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  patentingAmount?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  depositAmount?: number

  @IsOptional()
  @IsString()
  paymentType?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  tradeInValue?: number

  @IsOptional()
  @IsString()
  tradeInBrand?: string

  @IsOptional()
  @IsString()
  tradeInModel?: string

  @IsOptional()
  @IsString()
  tradeInDomain?: string

  @IsOptional()
  @IsString()
  tradeInPlate?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  financingBalance?: number

  @IsOptional()
  @IsString()
  financingType?: string

  @IsOptional()
  @IsString()
  financingMethod?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  financingInstallments?: number

  @IsOptional()
  @IsString()
  notes?: string
}
