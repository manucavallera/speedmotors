import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AlertsService } from './alerts.service'
import { RemindersService, CreateReminderDto } from './reminders.service'

@UseGuards(JwtAuthGuard)
@Controller()
export class AlertsController {
  constructor(
    private readonly alertsService: AlertsService,
    private readonly remindersService: RemindersService,
  ) {}

  @Get('alerts')
  getAlerts() {
    return this.alertsService.getAlerts()
  }

  @Get('reminders')
  findAll() {
    return this.remindersService.findAll()
  }

  @Post('reminders')
  create(@Body() dto: CreateReminderDto, @Request() req: { user: { id: number } }) {
    return this.remindersService.create(dto, req.user.id)
  }

  @Put('reminders/:id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateReminderDto>) {
    return this.remindersService.update(Number(id), dto)
  }

  @Patch('reminders/:id/done')
  markDone(@Param('id') id: string) {
    return this.remindersService.markDone(Number(id))
  }

  @Delete('reminders/:id')
  remove(@Param('id') id: string) {
    return this.remindersService.remove(Number(id))
  }
}
