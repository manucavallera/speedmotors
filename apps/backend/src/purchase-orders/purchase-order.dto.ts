import { IsString, IsOptional, IsNumber, IsArray, IsIn, IsDateString, ValidateNested, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class PurchaseOrderItemDto {
  @IsOptional() @IsNumber() @Type(() => Number) productId?: number
  @IsString() description: string
  @IsNumber() @Min(1) @Type(() => Number) quantity: number
  @IsNumber() @Min(0) @Type(() => Number) unitPrice: number
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) subtotal?: number
}

export class CreatePurchaseOrderDto {
  @IsOptional() @IsNumber() @Type(() => Number) supplierId?: number
  @IsOptional() @IsIn(['borrador', 'enviada', 'recibida', 'cancelada']) status?: string
  @IsOptional() @IsString() notes?: string
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) amountFormal?: number
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) amountInformal?: number
  @IsOptional() @IsDateString() expectedDate?: string
  @IsArray() @ValidateNested({ each: true }) @Type(() => PurchaseOrderItemDto) items: PurchaseOrderItemDto[]
}

export class UpdatePurchaseOrderDto extends CreatePurchaseOrderDto {}
