import { IsString, IsOptional, IsInt, IsNumber, IsArray, ValidateNested, Min, MaxLength } from 'class-validator'
import { Type } from 'class-transformer'

export class ProveeduriaProductDto {
  @IsString()
  @MaxLength(255)
  name!: string

  @IsOptional()
  @IsString()
  code?: string

  @IsNumber()
  @Min(0)
  sellPrice!: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  minStock?: number

  @IsOptional()
  @IsString()
  barcode?: string
}

export class SaleItemDto {
  @IsInt()
  productId!: number

  @IsInt()
  @Min(1)
  quantity!: number
}

export class CheckoutDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items!: SaleItemDto[]
}
