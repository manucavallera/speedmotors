import { IsString, IsOptional, IsNumber, IsIn, IsDateString, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateExpenseDto {
  @IsIn(['alquiler', 'servicios', 'compras', 'sueldos', 'impuestos', 'otros']) category: string
  @IsString() description: string
  @IsNumber() @Min(0) @Type(() => Number) amount: number
  @IsOptional() @IsDateString() date?: string
  @IsOptional() @IsString() notes?: string
}

export class UpdateExpenseDto extends CreateExpenseDto {}
