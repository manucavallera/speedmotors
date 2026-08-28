import { Module } from '@nestjs/common'
import { ResalesController } from './resales.controller'
import { ResalesService } from './resales.service'

@Module({ controllers: [ResalesController], providers: [ResalesService] })
export class ResalesModule {}
