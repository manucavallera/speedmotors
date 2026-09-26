import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateResellerDto {
  @IsString() name: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateResellerDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() notes?: string;
}

export class CreateConsignmentDto {
  @IsNumber() resellerId: number;
  @IsNumber() vehicleId: number;
  @IsOptional() @IsNumber() @Min(0) agreedPrice?: number;
  @IsOptional() @IsDateString() deliveredAt?: string;
}

export class UpdateConsignmentDto {
  @IsOptional() @IsNumber() resellerId?: number;
  @IsOptional() @IsNumber() vehicleId?: number;
  @IsOptional() @IsDateString() deliveredAt?: string;
}

export class RegisterResaleDto {
  @IsOptional() @IsDateString() soldAt?: string;
}
