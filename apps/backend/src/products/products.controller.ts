import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, ParseIntPipe } from '@nestjs/common'
import { ProductsService } from './products.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('ingresoTipo') ingresoTipo?: string,
    @Query('priceSort') priceSort?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.productsService.findAll({
      search,
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      ingresoTipo,
      priceSort,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    })
  }

  @Get('low-stock')
  findLowStock() {
    return this.productsService.findLowStock()
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id)
  }

  @Post()
  create(@Body() body: any) {
    return this.productsService.create(body)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.productsService.update(id, body)
  }

  @Put(':id/stock')
  updateStock(@Param('id', ParseIntPipe) id: number, @Body('quantity') quantity: number) {
    return this.productsService.updateStock(id, quantity)
  }

  @Post('import')
  importProducts(@Body() body: { products: any[] }) {
    return this.productsService.importProducts(body.products)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id)
  }
}
