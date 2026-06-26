import { Module } from '@nestjs/common'
import { GuarderiaService } from './guarderia.service'
import { GuarderiaController } from './guarderia.controller'
import { DbModule } from '../db/db.module'

@Module({
  imports: [DbModule],
  controllers: [GuarderiaController],
  providers: [GuarderiaService],
})
export class GuarderiaModule {}
