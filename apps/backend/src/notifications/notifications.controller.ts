import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AdminGuard } from '../auth/roles.guard'

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Post('test-email')
  sendTestEmail(@Body('to') to: string) {
    return this.notificationsService.sendTestEmail(to)
  }

  @Post('send-overdue')
  triggerOverdue() {
    return this.notificationsService.sendOverdueInstallmentEmails()
  }
}
