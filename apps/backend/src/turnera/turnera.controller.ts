import { Controller, Get, Post, Put, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common'
import { TurneraService } from './turnera.service'
import { CreateSlotDto, TurneraConfigDto } from './turnera.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@UseGuards(JwtAuthGuard)
@Controller('turnera')
export class TurneraController {
  constructor(private readonly svc: TurneraService) {}

  @Get('config')
  getConfig() { return this.svc.getConfig() }

  @Put('config')
  setConfig(@Body() dto: TurneraConfigDto) { return this.svc.setConfig(dto) }

  @Get('slots')
  listSlots(@Query('date') date: string) { return this.svc.listSlots(date) }

  @Get('month')
  monthSummary(@Query('month') month: string) { return this.svc.monthSummary(month) }

  @Post('slots')
  createSlot(@Body() dto: CreateSlotDto, @Request() req: any) { return this.svc.createSlot(dto, req.user.id) }

  @Patch('slots/:id/status')
  setStatus(@Param('id') id: string, @Body() body: { status: 'reservado' | 'cancelado' | 'completado' }) {
    return this.svc.setStatus(Number(id), body.status)
  }

  @Post('slots/:id/charge')
  charge(@Param('id') id: string, @Request() req: any) { return this.svc.chargeSlot(Number(id), req.user.id) }

  @Delete('slots/:id')
  removeSlot(@Param('id') id: string) { return this.svc.removeSlot(Number(id)) }
}
