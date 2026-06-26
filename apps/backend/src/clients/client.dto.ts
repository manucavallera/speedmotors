import { IsString, IsOptional, IsEmail, IsIn } from 'class-validator'

export class CreateClientDto {
  @IsString() name: string
  @IsOptional() @IsIn(['concesionaria', 'guarderia']) type?: 'concesionaria' | 'guarderia'
  @IsOptional() @IsString() phone?: string
  @IsOptional() @IsEmail() email?: string
  @IsOptional() @IsString() dni?: string
  @IsOptional() @IsString() cuit?: string
  @IsOptional() @IsIn(['consumidor_final', 'monotributo', 'responsable_inscripto', 'exento']) condicionIva?: string
  @IsOptional() @IsString() address?: string
  @IsOptional() @IsString() notes?: string
}

export class UpdateClientDto extends CreateClientDto {}
