import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, ParseIntPipe, UseInterceptors, UploadedFile, Request } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { ProductsService } from './products.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AdminGuard } from '../auth/roles.guard'
import { CreateProductDto, UpdateProductDto } from './product.dto'

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
    @Query('supplierId') supplierId?: string,
    @Query('brand') brand?: string,
    @Query('costSort') costSort?: string,
  ) {
    return this.productsService.findAll({
      search,
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      supplierId: supplierId ? parseInt(supplierId) : undefined,
      ingresoTipo,
      brand,
      priceSort,
      costSort,
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
  @UseGuards(AdminGuard)
  create(@Body() body: CreateProductDto) {
    return this.productsService.create(body)
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateProductDto) {
    return this.productsService.update(id, body)
  }

  @Put(':id/stock')
  @UseGuards(AdminGuard)
  updateStock(@Param('id', ParseIntPipe) id: number, @Body('quantity') quantity: number) {
    return this.productsService.updateStock(id, quantity)
  }

  @Post('import')
  @UseGuards(AdminGuard)
  importProducts(@Body() body: { products: any[] }) {
    return this.productsService.importProducts(body.products)
  }

  @Post('receive-remito')
  @UseGuards(AdminGuard)
  receiveRemito(
    @Body() body: { items: { name: string; code: string | null; quantity: number; unitPrice: number | null }[]; remitoNumber: string | null },
    @Request() req: { user: { id: number } },
  ) {
    return this.productsService.receiveRemito(body.items, req.user.id, body.remitoNumber)
  }

  @Post('parse-remito')
  @UseGuards(AdminGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    fileFilter: (_, file, cb) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
      if (!allowed.includes(file.mimetype)) return cb(new Error('Solo imágenes o PDF'), false)
      cb(null, true)
    },
    limits: { fileSize: 10 * 1024 * 1024 },
  }))
  parseRemito(@UploadedFile() file: Express.Multer.File) {
    return this.productsService.parseRemito(file)
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id)
  }
}
