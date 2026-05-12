import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, ParseIntPipe, Request } from '@nestjs/common'
import { SalesService } from './sales.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AdminGuard } from '../auth/roles.guard'
import { CreateSaleDto } from './create-sale.dto'

@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SalesController {
  constructor(private salesService: SalesService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('invoiceType') invoiceType?: string,
    @Request() req?: any,
  ) {
    const isVendedor = req?.user?.role === 'vendedor'
    return this.salesService.findAll({
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      search: search || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      invoiceType: invoiceType || undefined,
      userId: isVendedor ? req.user.id : undefined,
    })
  }

  @Get('installments/pending')
  getPendingInstallments(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('clientId') clientId?: string,
    @Query('overdue') overdue?: string,
  ) {
    return this.salesService.getPendingInstallments({
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      clientId: clientId ? +clientId : undefined,
      overdue: overdue === 'true',
    })
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.findOne(id)
  }

  @Post()
  create(@Body() body: CreateSaleDto, @Request() req: any) {
    return this.salesService.create({ ...body, userId: req.user.id })
  }

  @Patch(':id/transport')
  updateTransport(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.salesService.updateTransport(id, body)
  }

  @Post(':id/cancel')
  @UseGuards(AdminGuard)
  cancelSale(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.cancelSale(id)
  }

  @Post('installments/:id/pay')
  payInstallment(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.payInstallment(id)
  }
}
