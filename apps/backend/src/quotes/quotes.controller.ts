import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, ParseIntPipe, Request } from '@nestjs/common'
import { QuotesService } from './quotes.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@UseGuards(JwtAuthGuard)
@Controller('quotes')
export class QuotesController {
  constructor(private quotesService: QuotesService) {}

  @Get() findAll(@Query('page') page?: string, @Query('limit') limit?: string) { return this.quotesService.findAll({ page: page ? +page : undefined, limit: limit ? +limit : undefined }) }
  @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) { return this.quotesService.findOne(id) }

  @Post()
  create(@Body() body: any, @Request() req: any) {
    return this.quotesService.create({ ...body, userId: req.user.id })
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.quotesService.update(id, body)
  }

  @Put(':id/status')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: string) {
    return this.quotesService.updateStatus(id, status)
  }

  @Post(':id/convert')
  convertToSale(@Param('id', ParseIntPipe) id: number, @Body() body: any, @Request() req: any) {
    return this.quotesService.convertToSale(id, req.user.id, body.paymentMethod || 'efectivo', body.type || 'contado', body.installmentCount || 1)
  }

  @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) { return this.quotesService.remove(id) }
}
