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

  @IsOptional()
  @IsInt()
  categoryId?: number

  @IsString()
  @MaxLength(150)
  description!: string

  @IsOptional()
  @IsInt()
  @Min(0)
  hp?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  lengthM?: number

  // Si no viene, se toma la tarifa mensual de la categoría
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

// Categoría de embarcación: escala por HP y/o eslora → tarifa mensual de cuna
export class CategoryDto {
  @IsString()
  @MaxLength(60)
  name!: string

  @IsOptional()
  @IsInt()
  @Min(0)
  minHp?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  maxHp?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  minLength?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxLength?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyRate?: number

  @IsOptional()
  @IsBoolean()
  active?: boolean
}

// Mover una lancha a otra cuna (o dejarla suelta sobre trailer: spotId null)
export class MoveUnitDto {
  @IsOptional()
  @IsInt()
  spotId?: number | null
}

// Servicios fijos mensuales de una lancha (seguros): reemplaza la lista completa
export class UnitServicesDto {
  @IsArray()
  @IsInt({ each: true })
  serviceIds!: number[]
}

// Cobro masivo: 'YYYY-MM' o etiqueta libre del período
export class GenerateMonthDto {
  @IsString()
  @MaxLength(40)
  periodLabel!: string
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
