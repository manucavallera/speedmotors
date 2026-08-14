import { Type } from 'class-transformer'
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'
import type { DebtTypeFilter } from './credit-list'

export type CreditStatus = 'activo' | 'pagado' | 'cancelado'

export class ListCreditsQueryDto {
  @IsOptional()
  @IsIn(['activo', 'pagado', 'cancelado'])
  status?: CreditStatus

  @IsOptional()
  @IsString()
  @MaxLength(150)
  search?: string

  @IsOptional()
  @IsIn(['fija', 'libre', 'cuenta_corriente'])
  debtType?: DebtTypeFilter

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50
}
