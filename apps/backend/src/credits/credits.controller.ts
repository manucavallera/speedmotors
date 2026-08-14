import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, ParseIntPipe, Request } from '@nestjs/common'
import { CreditsService } from './credits.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AdminGuard } from '../auth/roles.guard'
import { CreateCreditDto, UpdateCreditDto, CreatePaymentDto, PayInstallmentDto } from './credit.dto'
import { ListCreditsQueryDto } from './list-credits.dto'

@UseGuards(JwtAuthGuard)
@Controller('credits')
export class CreditsController {
  constructor(private creditsService: CreditsService) {}

  @Get() findAll(@Query() query: ListCreditsQueryDto) { return this.creditsService.findAll(query) }
  @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) { return this.creditsService.findOne(id) }

  @Post()
  create(@Body() body: CreateCreditDto, @Request() req: { user: { id: number } }) {
    return this.creditsService.create({ ...body, userId: req.user.id })
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateCreditDto) {
    return this.creditsService.update(id, body)
  }

  @Delete(':id') @UseGuards(AdminGuard)
  remove(@Param('id', ParseIntPipe) id: number) { return this.creditsService.remove(id) }

  @Post(':id/payments')
  addPayment(@Param('id', ParseIntPipe) id: number, @Body() body: CreatePaymentDto, @Request() req: { user: { id: number } }) {
    return this.creditsService.addPayment(id, body, req.user.id)
  }

  @Delete('payments/:paymentId') @UseGuards(AdminGuard)
  removePayment(@Param('paymentId', ParseIntPipe) paymentId: number) {
    return this.creditsService.removePayment(paymentId)
  }

  @Post('installments/:installmentId/pay')
  payInstallment(@Param('installmentId', ParseIntPipe) installmentId: number, @Body() body: PayInstallmentDto, @Request() req: { user: { id: number } }) {
    return this.creditsService.payInstallment(installmentId, body.paymentDate, req.user.id)
  }

  @Post('installments/:installmentId/unpay') @UseGuards(AdminGuard)
  unpayInstallment(@Param('installmentId', ParseIntPipe) installmentId: number) {
    return this.creditsService.unpayInstallment(installmentId)
  }
}
