import { Module } from '@nestjs/common'
import { TransfersService } from './transfers.service'
import { TransfersController } from './transfers.controller'
import { DbModule } from '../db/db.module'

@Module({
  imports: [DbModule],
  controllers: [TransfersController],
  providers: [TransfersService],
})
export class TransfersModule {}
