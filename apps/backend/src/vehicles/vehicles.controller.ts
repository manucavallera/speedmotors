import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, ParseIntPipe } from '@nestjs/common'
import { VehiclesService } from './vehicles.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AdminGuard } from '../auth/roles.guard'

@UseGuards(JwtAuthGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private vehiclesService: VehiclesService) {}

  @Get()
  findAll(
    @Query('type') type?: 'moto' | 'lancha',
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.vehiclesService.findAll({ type, status, search, page: page ? +page : undefined, limit: limit ? +limit : undefined })
  }

  @Get('chassis/:chassisNumber')
  findByChassis(@Param('chassisNumber') chassisNumber: string) {
    return this.vehiclesService.findByChassis(chassisNumber)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.findOne(id)
  }

  @Post()
  create(@Body() body: any) {
    return this.vehiclesService.create(body)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.vehiclesService.update(id, body)
  }

  @Put(':id/status')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: 'disponible' | 'reservado' | 'vendido') {
    return this.vehiclesService.updateStatus(id, status)
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.remove(id)
  }
}
