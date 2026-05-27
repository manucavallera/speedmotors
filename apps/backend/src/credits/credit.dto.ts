import { IsString, IsOptional, IsNumber, IsIn, IsDateString, Min, IsInt } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateCreditDto {
  @IsInt() @Type(() => Number) clientId: number
  @IsIn(['pesos', 'usd']) currency: 'pesos' | 'usd'
  @IsNumber() @Min(0) @Type(() => Number) originalAmount: number
  @IsNumber() @Min(0) @Type(() => Number) interestRate: number
  @IsDateString() startDate: string
  @IsOptional() @IsString() notes?: string
}

export class UpdateCreditDto {
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) originalAmount?: number
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) interestRate?: number
  @IsOptional() @IsDateString() startDate?: string
  @IsOptional() @IsIn(['activo', 'pagado', 'cancelado']) status?: 'activo' | 'pagado' | 'cancelado'
  @IsOptional() @IsString() notes?: string
}

export class CreatePaymentDto {
  @IsNumber() @Min(0.01) @Type(() => Number) amount: number
  @IsDateString() paymentDate: string
  @IsOptional() @IsString() notes?: string
}
