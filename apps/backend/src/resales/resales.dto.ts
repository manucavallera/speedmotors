import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator'

export class CreateResellerDto {
  @IsString() name: string
  @IsOptional() @IsString() phone?: string
  @IsOptional() @IsString() notes?: string
}

export class CreateConsignmentDto {
  @IsNumber() resellerId: number
  @IsNumber() vehicleId: number
  @IsNumber() @Min(0) agreedPrice: number
  @IsOptional() @IsDateString() deliveredAt?: string
}

export class RegisterResaleDto {
  @IsNumber() @Min(0) soldPrice: number
  @IsOptional() @IsDateString() soldAt?: string
}
