import { IsString, IsOptional, IsInt, IsNumber, IsArray, IsBoolean, MaxLength, Min, ValidateNested, ArrayMinSize } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateSpotsDto {
  // Lista de códigos de lugares a crear (ej: ['A1','A2','B1'])
  @IsArray()
  @IsString({ each: true })
  codes!: string[]
}

export class CreateUnitDto {
  @IsInt()
  clientId!: number

  @IsOptional()
  @IsInt()
  spotId?: number

  @IsString()
  @MaxLength(150)
  description!: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  rate?: number

  @IsOptional()
  @IsString()
  entryDate?: string

  @IsOptional()
  @IsString()
  notes?: string
}

// Servicio del catálogo (seguro, lavado, puesta en marcha, batería, etc.)
export class ServiceDto {
  @IsString()
  @MaxLength(100)
  name!: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number

  @IsOptional()
  @IsBoolean()
  active?: boolean
}

// Un ítem del cobro: cuna mensual o un servicio anexo
export class ChargeItemDto {
  @IsString()
  @MaxLength(120)
  concept!: string

  @IsNumber()
  @Min(0)
  amount!: number

  @IsOptional()
  @IsInt()
  serviceId?: number
}

export class ChargeDto {
  // Cuna mensual + servicios anexos. El total es la suma.
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ChargeItemDto)
  items!: ChargeItemDto[]

  @IsOptional()
  @IsString()
  @MaxLength(40)
  periodLabel?: string

  // Si true, el cobro queda saldado al instante (cobro en efectivo). Si false, queda como deuda en cta cte.
  @IsOptional()
  @IsBoolean()
  paid?: boolean

  @IsOptional()
  @IsString()
  notes?: string
}
