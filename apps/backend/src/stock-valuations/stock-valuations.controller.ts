import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AdminGuard } from '../auth/roles.guard'
import { CloseStockValuationDto, PreviewStockValuationDto } from './stock-valuations.dto'
import { StockValuationsService } from './stock-valuations.service'

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('stock-valuations')
export class StockValuationsController {
  constructor(private readonly stockValuationsService: StockValuationsService) {}

  @Get('preview')
  current(@Query('period') period: string) {
    return this.stockValuationsService.current(period)
  }

  @Post('preview')
  preview(@Body() dto: PreviewStockValuationDto) {
    return this.stockValuationsService.preview(dto)
  }

  @Post('close')
  close(@Body() dto: CloseStockValuationDto) {
    return this.stockValuationsService.close(dto)
  }

  @Get()
  list() {
    return this.stockValuationsService.list()
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.stockValuationsService.findOne(id)
  }
}
