import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common'
import { TransfersService } from './transfers.service'
import { CreateTransferDto } from './create-transfer.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AdminGuard } from '../auth/roles.guard'

@UseGuards(JwtAuthGuard)
@Controller('transfers')
export class TransfersController {
  constructor(private readonly svc: TransfersService) {}

  @Get()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) { return this.svc.findAll({ page: page ? +page : undefined, limit: limit ? +limit : undefined }) }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.svc.findOne(Number(id)) }

  @Post()
  create(@Body() dto: CreateTransferDto, @Request() req: any) {
    return this.svc.create(dto, req.user.id)
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  update(@Param('id') id: string, @Body() dto: Partial<CreateTransferDto>) {
    return this.svc.update(Number(id), dto)
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) { return this.svc.remove(Number(id)) }
}
