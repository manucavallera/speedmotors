import { Type } from 'class-transformer'
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator'
import type { SaleMode } from './stock-valuation.domain'

export class GroupPriceEditDto {
  @IsString()
  groupKey!: string

  @IsNumber()
  @Min(0.01)
  costPrice!: number

  @IsIn(['unchanged', 'manual', 'margin'])
  saleMode!: SaleMode

  @IsOptional()
  @IsNumber()
  @Min(0)
  manualSellPrice?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  marginPercent?: number
}

export class PreviewStockValuationDto {
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  period!: string

  @IsString()
  stockFingerprint!: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  generalMarginPercent?: number

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GroupPriceEditDto)
  groups!: GroupPriceEditDto[]
}

export class CloseStockValuationDto extends PreviewStockValuationDto {
  @IsOptional()
  @IsBoolean()
  replaceExisting?: boolean
}
