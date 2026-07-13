import { IsString, IsOptional, IsInt, IsNumber, IsArray, Min, Max, Matches, MaxLength, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

// Un servicio pedido en el turno
export class SlotItemDto {
  @IsOptional()
  @IsInt()
  serviceId?: number

  @IsString()
  @MaxLength(120)
  concept!: string

  @IsNumber()
  @Min(0)
  amount!: number
}

// Grilla de turnos: cada cuántos minutos es un turno y en qué horario abre el día
export class TurneraConfigDto {
  @IsInt()
  @Min(5)
  @Max(120)
  intervalMin!: number

  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  dayStart!: string

  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  dayEnd!: string
}

export class CreateSlotDto {
  // Lancha de guardería (storage_units) que se va a botar
  @IsInt()
  unitId!: number

  // YYYY-MM-DD
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string

  // HH:MM
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  startTime!: string

  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  endTime!: string

  // Servicios pedidos junto con el turno (batería, combustible, parrilla...). El precio es la suma.
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SlotItemDto)
  items?: SlotItemDto[]

  @IsOptional()
  @IsString()
  notes?: string
}
