import { Module } from '@nestjs/common'
import { DbModule } from '../db/db.module'
import { AlertsController } from './alerts.controller'
import { AlertsService } from './alerts.service'
import { RemindersService } from './reminders.service'

@Module({
  imports: [DbModule],
  controllers: [AlertsController],
  providers: [AlertsService, RemindersService],
})
export class AlertsModule {}
