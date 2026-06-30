import { IsString, IsOptional, IsEmail, IsIn } from 'class-validator'
import { Transform } from 'class-transformer'

export class CreateClientDto {
  @IsString() name: string
  @IsOptional() @IsIn(['concesionaria', 'guarderia']) type?: 'concesionaria' | 'guarderia'
  @IsOptional() @IsString() phone?: string
  // Email vacío = ausente (no es requisito); evita 400 cuando el cliente no tiene mail
  @IsOptional() @Transform(({ value }) => (value === '' ? undefined : value)) @IsEmail() email?: string
  @IsOptional() @IsString() dni?: string
  @IsOptional() @IsString() cuit?: string
  @IsOptional() @IsIn(['consumidor_final', 'monotributo', 'responsable_inscripto', 'exento']) condicionIva?: string
  @IsOptional() @IsString() address?: string
  @IsOptional() @IsString() notes?: string
}

export class UpdateClientDto extends CreateClientDto {}
