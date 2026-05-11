import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { NotificationsService } from './notifications.service'
import { NotificationsController } from './notifications.controller'

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [NotificationsService],
  controllers: [NotificationsController],
})
export class NotificationsModule {}
