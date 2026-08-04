import { IsString, IsOptional, IsNumber, IsIn, IsArray, ValidateNested, IsInt, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateVehicleDto {
  @IsIn(['moto', 'lancha'])
  type: 'moto' | 'lancha'

  @IsString()
  brand: string

  @IsString()
  model: string

  @IsOptional() @IsInt() @Min(0) @Type(() => Number) displacement?: number
  @IsOptional() @IsString() version?: string
  @IsOptional() @IsNumber() @Type(() => Number) year?: number
  @IsOptional() @IsString() color?: string
  @IsOptional() @IsString() chassisNumber?: string
  @IsOptional() @IsString() engineNumber?: string
  @IsOptional() @IsString() internalCode?: string
  @IsOptional() @IsString() importCode?: string
  @IsOptional() @IsString() remitoNumber?: string
  @IsOptional() @IsIn(['blanco', 'negro', 'mixto']) ingresoTipo?: string

  @IsString() costPrice: string
  @IsString() sellPrice: string

  @IsOptional() @IsIn(['disponible', 'reservado', 'vendido']) status?: 'disponible' | 'reservado' | 'vendido'
  @IsOptional() @IsArray() @IsString({ each: true }) photos?: string[]
  @IsOptional() @IsString() notes?: string
}

export class UpdateVehicleDto extends CreateVehicleDto {}

export class BulkCreateVehiclesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVehicleDto)
  items: CreateVehicleDto[]
}
