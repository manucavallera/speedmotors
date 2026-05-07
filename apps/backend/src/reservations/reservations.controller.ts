import { Controller, Get, Post, Put, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common'
import { ReservationsService } from './reservations.service'
import type { CreateReservationDto } from './create-reservation.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@UseGuards(JwtAuthGuard)
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly svc: ReservationsService) {}

  @Get()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) { return this.svc.findAll({ page: page ? +page : undefined, limit: limit ? +limit : undefined }) }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.svc.findOne(Number(id)) }

  @Post()
  create(@Body() dto: CreateReservationDto, @Request() req: any) {
    return this.svc.create(dto, req.user.id)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: CreateReservationDto) {
    return this.svc.update(Number(id), dto)
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: 'vigente' | 'concretada' | 'cancelada' }) {
    return this.svc.updateStatus(Number(id), body.status)
  }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.svc.remove(Number(id)) }
}
