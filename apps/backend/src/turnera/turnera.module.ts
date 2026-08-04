import { Module } from '@nestjs/common'
import { TurneraService } from './turnera.service'
import { TurneraController } from './turnera.controller'
import { PublicTurneraController } from './public-turnera.controller'
import { DbModule } from '../db/db.module'

@Module({
  imports: [DbModule],
  controllers: [TurneraController, PublicTurneraController],
  providers: [TurneraService],
})
export class TurneraModule {}
