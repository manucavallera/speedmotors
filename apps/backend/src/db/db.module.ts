import { Module, Global } from '@nestjs/common'
import { db } from './index'

@Global()
@Module({
  providers: [{ provide: 'DB', useValue: db }],
  exports: ['DB'],
})
export class DbModule {}
