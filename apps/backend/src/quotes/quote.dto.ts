import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class QuoteItemDto {
  @IsOptional() @IsNumber() @Type(() => Number) productId?: number
  @IsOptional() @IsNumber() @Type(() => Number) vehicleId?: number
  @IsString() description: string
  @IsNumber() @Min(1) @Type(() => Number) quantity: number
  @IsNumber() @Min(0) @Type(() => Number) unitPrice: number
}

export class CreateQuoteDto {
  @IsOptional() @IsNumber() @Type(() => Number) clientId?: number
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) discount?: number
  @IsOptional() @IsString() notes?: string
  @IsArray() @ValidateNested({ each: true }) @Type(() => QuoteItemDto) items: QuoteItemDto[]
}

export class UpdateQuoteDto extends CreateQuoteDto {}
