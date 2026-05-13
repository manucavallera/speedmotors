import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, ParseIntPipe, Request } from '@nestjs/common'
import { QuotesService } from './quotes.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CreateQuoteDto, UpdateQuoteDto } from './quote.dto'

@UseGuards(JwtAuthGuard)
@Controller('quotes')
export class QuotesController {
  constructor(private quotesService: QuotesService) {}

  @Get() findAll(@Query('page') page?: string, @Query('limit') limit?: string) { return this.quotesService.findAll({ page: page ? +page : undefined, limit: limit ? +limit : undefined }) }
  @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) { return this.quotesService.findOne(id) }

  @Post()
  create(@Body() body: CreateQuoteDto, @Request() req: any) {
    return this.quotesService.create({ ...body, userId: req.user.id })
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateQuoteDto) {
    return this.quotesService.update(id, body as any)
  }

  @Put(':id/status')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: string) {
    return this.quotesService.updateStatus(id, status)
  }

  @Post(':id/convert')
  convertToSale(@Param('id', ParseIntPipe) id: number, @Body() body: any, @Request() req: any) {
    return this.quotesService.convertToSale(id, req.user.id, {
      paymentMethod: body.paymentMethod || 'efectivo',
      type: body.type || 'contado',
      installmentCount: body.installmentCount || 1,
      financingCurrency: body.financingCurrency,
      downPaymentMethod: body.downPaymentMethod,
      downPayment: body.downPayment,
      interestRate: body.interestRate,
      firstInstallmentDate: body.firstInstallmentDate,
    })
  }

  @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) { return this.quotesService.remove(id) }
}
