import { Controller, Get, Post, Param, Body, UseGuards, ParseIntPipe, Request } from '@nestjs/common'
import { StockMovementsService } from './stock-movements.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@UseGuards(JwtAuthGuard)
@Controller('stock-movements')
export class StockMovementsController {
  constructor(private service: StockMovementsService) {}

  @Get() findAll() { return this.service.findAll() }
  @Get('product/:id') findByProduct(@Param('id', ParseIntPipe) id: number) { return this.service.findByProduct(id) }

  @Post()
  create(@Body() body: any, @Request() req: any) {
    return this.service.create(body.productId, req.user.id, body.type, body.quantity, body.reason)
  }
}
