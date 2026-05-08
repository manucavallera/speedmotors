import { IsString, IsOptional, IsEmail } from 'class-validator'

export class CreateSupplierDto {
  @IsString() name: string
  @IsOptional() @IsString() phone?: string
  @IsOptional() @IsEmail() email?: string
  @IsOptional() @IsString() notes?: string
}

export class UpdateSupplierDto extends CreateSupplierDto {}
