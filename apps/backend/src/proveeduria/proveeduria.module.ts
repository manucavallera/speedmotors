import { Module } from '@nestjs/common'
import { ProveeduriaService } from './proveeduria.service'
import { ProveeduriaController } from './proveeduria.controller'
import { DbModule } from '../db/db.module'

@Module({
  imports: [DbModule],
  controllers: [ProveeduriaController],
  providers: [ProveeduriaService],
})
export class ProveeduriaModule {}
