import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common'
import { ProveeduriaService } from './proveeduria.service'
import { ProveeduriaProductDto, CheckoutDto } from './proveeduria.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@UseGuards(JwtAuthGuard)
@Controller('proveeduria')
export class ProveeduriaController {
  constructor(private readonly svc: ProveeduriaService) {}

  @Get('products')
  listProducts(@Query('search') search?: string) { return this.svc.listProducts(search) }

  @Post('products')
  createProduct(@Body() dto: ProveeduriaProductDto) { return this.svc.createProduct(dto) }

  @Put('products/:id')
  updateProduct(@Param('id') id: string, @Body() dto: ProveeduriaProductDto) { return this.svc.updateProduct(Number(id), dto) }

  @Delete('products/:id')
  removeProduct(@Param('id') id: string) { return this.svc.removeProduct(Number(id)) }

  @Get('sales')
  listSales() { return this.svc.listSales() }

  @Get('stats')
  stats() { return this.svc.stats() }

  @Post('sales')
  checkout(@Body() dto: CheckoutDto, @Request() req: any) { return this.svc.checkout(dto, req.user.id) }
}
