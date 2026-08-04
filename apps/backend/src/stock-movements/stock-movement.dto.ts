import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator'

export class UpdateStockMovementDto {
  @IsOptional()
  @IsIn(['entrada', 'salida', 'ajuste'])
  type?: 'entrada' | 'salida' | 'ajuste'

  @IsOptional()
  @IsInt()
  @Min(0)
  quantity?: number

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string
}
