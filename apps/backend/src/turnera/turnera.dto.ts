import { IsString, IsOptional, IsInt, IsNumber, Min, Matches } from 'class-validator'

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

  // Servicio opcional asociado a la botadura (ej: puesta en marcha)
  @IsOptional()
  @IsInt()
  serviceId?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number

  @IsOptional()
  @IsString()
  notes?: string
}
