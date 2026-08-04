import { Controller, Delete, Get, Post, Put, Param, Body, Query, UseGuards, ParseIntPipe, Request } from '@nestjs/common'
import { StockMovementsService } from './stock-movements.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AdminGuard } from '../auth/roles.guard'
import { UpdateStockMovementDto } from './stock-movement.dto'

@UseGuards(JwtAuthGuard)
@Controller('stock-movements')
export class StockMovementsController {
  constructor(private service: StockMovementsService) {}

  @Get() findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.findAll({ page: page ? +page : undefined, limit: limit ? +limit : undefined })
  }
  @Get('product/:id') findByProduct(@Param('id', ParseIntPipe) id: number) { return this.service.findByProduct(id) }

  @Post()
  create(
    @Body() body: { productId: number; type: 'entrada' | 'salida' | 'ajuste'; quantity: number; reason?: string },
    @Request() req: { user: { id: number } },
  ) {
    return this.service.create(body.productId, req.user.id, body.type, body.quantity, body.reason)
  }

  @Post('bulk')
  bulkCreate(
    @Body() body: { items: { productId: number; quantity: number; reason?: string }[] },
    @Request() req: { user: { id: number } },
  ) {
    return this.service.bulkCreate(body.items, req.user.id)
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateStockMovementDto) {
    return this.service.update(id, body)
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }
}
