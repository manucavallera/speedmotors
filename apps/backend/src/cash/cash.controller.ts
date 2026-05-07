import { Controller, Get, Post, Body, UseGuards, Request, Param, ParseIntPipe } from '@nestjs/common'
import { CashService } from './cash.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@UseGuards(JwtAuthGuard)
@Controller('cash')
export class CashController {
  constructor(private cashService: CashService) {}

  @Get() findAll() { return this.cashService.findAll() }
  @Get('session') getSession() { return this.cashService.getOpenSession() }
  @Get('summary') getSummary() { return this.cashService.getSessionSummary() }

  @Get(':sessionId/movements')
  getMovements(@Param('sessionId', ParseIntPipe) sessionId: number) {
    return this.cashService.getMovements(sessionId)
  }

  @Post('open')
  open(@Body('openingBalance') openingBalance: number, @Request() req: any) {
    return this.cashService.openSession(req.user.id, openingBalance || 0)
  }

  @Post('close')
  close(@Body() body: { notes?: string; countedBalance?: number }, @Request() req: any) {
    return this.cashService.closeSession(req.user.id, body.notes, body.countedBalance)
  }

  @Post('movement')
  createMovement(
    @Body() body: { sessionId: number; type: 'retiro' | 'deposito'; amount: number; reason?: string },
    @Request() req: any,
  ) {
    return this.cashService.createMovement(body.sessionId, req.user.id, body.type, body.amount, body.reason)
  }
}
