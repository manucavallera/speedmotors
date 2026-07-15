import { Controller, Get, Post, Delete, Body, Query, UseGuards, Request, Param, ParseIntPipe } from '@nestjs/common'
import { CashService, type CashArea } from './cash.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AdminGuard } from '../auth/roles.guard'

// El área llega por query (?area=marina); por defecto es la caja de SpeedMotors
const toArea = (a?: string): CashArea => (a === 'marina' ? 'marina' : 'speedmotors')

@UseGuards(JwtAuthGuard)
@Controller('cash')
export class CashController {
  constructor(private cashService: CashService) {}

  @Get() findAll(@Query('area') area?: string) { return this.cashService.findAll(area ? toArea(area) : undefined) }
  @Get('session') getSession(@Query('area') area?: string) { return this.cashService.getOpenSession(toArea(area)) }
  @Get('summary') getSummary(@Query('area') area?: string) { return this.cashService.getSessionSummary(toArea(area)) }

  @Get(':sessionId/movements')
  getMovements(@Param('sessionId', ParseIntPipe) sessionId: number) {
    return this.cashService.getMovements(sessionId)
  }

  @Post('open')
  open(@Body() body: { openingBalance?: number; area?: string }, @Request() req: any) {
    return this.cashService.openSession(req.user.id, body.openingBalance || 0, toArea(body.area))
  }

  @Post('close')
  @UseGuards(AdminGuard)
  close(@Body() body: { notes?: string; countedBalance?: number; area?: string }, @Request() req: any) {
    return this.cashService.closeSession(req.user.id, toArea(body.area), body.notes, body.countedBalance)
  }

  @Delete('sessions/:id')
  @UseGuards(AdminGuard)
  removeSession(@Param('id', ParseIntPipe) id: number) {
    return this.cashService.removeSession(id)
  }

  @Post('movement')
  @UseGuards(AdminGuard)
  createMovement(
    @Body() body: { sessionId: number; type: 'retiro' | 'deposito'; amount: number; reason?: string },
    @Request() req: any,
  ) {
    return this.cashService.createMovement(body.sessionId, req.user.id, body.type, body.amount, body.reason)
  }
}
