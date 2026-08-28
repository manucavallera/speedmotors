import { IsOptional, IsNumber, IsString, IsArray, IsIn, ValidateNested, Min, ValidateIf, IsNotEmpty } from 'class-validator'
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

  @IsIn(['contado', 'cuotas', 'cuenta_corriente', 'financiado_tercero'])
  type: 'contado' | 'cuotas' | 'cuenta_corriente' | 'financiado_tercero'

  @ValidateIf(body => body.type === 'financiado_tercero')
  @IsString()
  @IsNotEmpty()
  financingProvider?: string

  @IsOptional()
  @IsIn(['cuotas_simples', 'saldo_compuesto'])
  creditType?: 'cuotas_simples' | 'saldo_compuesto'

  @IsOptional()
  @IsNumber()
  @Min(1)
  daysToExpire?: number

  @IsOptional()
  @IsIn(['A', 'B', 'X', 'mixto'])
  invoiceType?: 'A' | 'B' | 'X' | 'mixto'

  @IsIn(['efectivo', 'transferencia', 'tarjeta', 'mixto', 'usdt', 'cheque'])
  paymentMethod: 'efectivo' | 'transferencia' | 'tarjeta' | 'mixto' | 'usdt' | 'cheque'

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
  @IsNumber()
  @Min(0)
  downPayment?: number

  @IsOptional()
  @IsString()
  downPaymentMethod?: string

  @IsOptional()
  @IsString()
  firstInstallmentDate?: string

  @IsOptional()
  @IsString()
  notes?: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[]
}
