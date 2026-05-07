import { IsOptional, IsString, IsNumber, IsIn, Min } from 'class-validator'

export class CreateReservationDto {
  @IsOptional()
  @IsString()
  date?: string

  @IsOptional()
  @IsNumber()
  clientId?: number

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
  @IsNumber()
  @Min(0)
  price?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  depositAmount?: number

  @IsOptional()
  @IsString()
  notes?: string
}
