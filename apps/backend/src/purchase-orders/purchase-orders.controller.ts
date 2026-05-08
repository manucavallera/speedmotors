import { Controller, Get, Post, Put, Patch, Delete, Body, Param, ParseIntPipe, Query, UseGuards, Request } from '@nestjs/common'
import { PurchaseOrdersService } from './purchase-orders.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from './purchase-order.dto'

@UseGuards(JwtAuthGuard)
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly service: PurchaseOrdersService) {}

  @Get()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) { return this.service.findAll({ page: page ? +page : undefined, limit: limit ? +limit : undefined }) }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id) }

  @Post()
  create(@Body() body: CreatePurchaseOrderDto, @Request() req: any) {
    return this.service.create(body, req.user.id)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdatePurchaseOrderDto) {
    return this.service.update(id, body)
  }

  @Patch(':id/status')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: string) {
    return this.service.updateStatus(id, status)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id) }
}
