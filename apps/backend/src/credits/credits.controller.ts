import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, ParseIntPipe, Request } from '@nestjs/common'
import { CreditsService } from './credits.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AdminGuard } from '../auth/roles.guard'
import { CreateCreditDto, UpdateCreditDto, CreatePaymentDto } from './credit.dto'

@UseGuards(JwtAuthGuard)
@Controller('credits')
export class CreditsController {
  constructor(private creditsService: CreditsService) {}

  @Get() findAll(@Query('status') status?: string) { return this.creditsService.findAll(status) }
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
}
