import { IsOptional, IsString, IsNumber, IsIn, Min } from 'class-validator'

export class CreateTransferDto {
  @IsOptional()
  @IsNumber()
  vehicleId?: number

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
  date?: string

  @IsOptional()
  @IsString()
  notaryName?: string

  @IsOptional()
  @IsString()
  notaryRegistry?: string

  @IsOptional()
  @IsString()
  rnpNumber?: string

  @IsOptional()
  @IsString()
  dnrpaNumber?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  transferFee?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalCost?: number

  @IsOptional()
  @IsIn(['pendiente', 'en_tramite', 'completada', 'cancelada'])
  status?: 'pendiente' | 'en_tramite' | 'completada' | 'cancelada'

  @IsOptional()
  @IsString()
  notes?: string
}
