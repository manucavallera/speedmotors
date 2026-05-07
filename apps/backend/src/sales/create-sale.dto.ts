import { IsOptional, IsNumber, IsString, IsArray, IsIn, ValidateNested, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class SaleItemDto {
  @IsOptional()
  @IsNumber()
  productId?: number

  @IsOptional()
  @IsNumber()
  vehicleId?: number

  @IsString()
  description: string

  @IsNumber()
  @Min(1)
  quantity: number

  @IsNumber()
  @Min(0)
  unitPrice: number

  @IsOptional()
  @IsString()
  ingresoTipo?: string
}

export class CreateSaleDto {
  @IsOptional()
  @IsNumber()
  clientId?: number

  @IsOptional()
  @IsNumber()
  userId?: number

  @IsIn(['contado', 'cuotas'])
  type: 'contado' | 'cuotas'

  @IsOptional()
  @IsIn(['A', 'B', 'X', 'mixto'])
  invoiceType?: 'A' | 'B' | 'X' | 'mixto'

  @IsIn(['efectivo', 'transferencia', 'tarjeta', 'mixto'])
  paymentMethod: 'efectivo' | 'transferencia' | 'tarjeta' | 'mixto'

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  interestRate?: number

  @IsOptional()
  @IsNumber()
  installmentCount?: number

  @IsOptional()
  @IsIn(['pesos', 'usd'])
  financingCurrency?: 'pesos' | 'usd'

  @IsOptional()
  @IsString()
  notes?: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[]
}
