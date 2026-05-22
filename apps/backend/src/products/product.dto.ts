import { IsString, IsOptional, IsNumber, IsBoolean, IsIn, IsArray, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateProductDto {
  @IsString() code: string
  @IsString() name: string

  @IsOptional() @IsString() description?: string
  @IsOptional() @IsNumber() @Type(() => Number) categoryId?: number
  @IsOptional() @IsString() brand?: string
  @IsOptional() @IsNumber() @Type(() => Number) supplierId?: number
  @IsOptional() @IsString() costPrice?: string
  @IsOptional() @IsString() sellPrice?: string
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) stock?: number
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) minStock?: number
  @IsOptional() @IsString() unit?: string
  @IsOptional() @IsString() photoUrl?: string
  @IsOptional() @IsArray() @IsString({ each: true }) photos?: string[]
  @IsOptional() @IsString() serialNumber?: string
  @IsOptional() @IsString() barcode?: string
  @IsOptional() @IsIn(['blanco', 'negro', 'mixto']) ingresoTipo?: string
  @IsOptional() @IsBoolean() active?: boolean
}

export class UpdateProductDto extends CreateProductDto {}
