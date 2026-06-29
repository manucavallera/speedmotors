import { Controller, Get, Post, Put, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common'
import { GuarderiaService } from './guarderia.service'
import { CreateSpotsDto, CreateUnitDto, ChargeDto, ServiceDto } from './guarderia.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@UseGuards(JwtAuthGuard)
@Controller('guarderia')
export class GuarderiaController {
  constructor(private readonly svc: GuarderiaService) {}

  @Get('mapa')
  mapa() { return this.svc.mapa() }

  @Get('stats')
  stats() { return this.svc.stats() }

  @Get('spots')
  listSpots() { return this.svc.listSpots() }

  @Post('spots')
  createSpots(@Body() dto: CreateSpotsDto) { return this.svc.createSpots(dto) }

  @Get('units')
  listUnits(@Query('status') status?: string) { return this.svc.listUnits(status) }

  @Get('units/:id')
  getUnit(@Param('id') id: string) { return this.svc.getUnit(Number(id)) }

  @Post('units')
  createUnit(@Body() dto: CreateUnitDto) { return this.svc.createUnit(dto) }

  @Patch('units/:id/retire')
  retire(@Param('id') id: string) { return this.svc.retireUnit(Number(id)) }

  @Post('units/:id/charge')
  charge(@Param('id') id: string, @Body() dto: ChargeDto, @Request() req: any) {
    return this.svc.charge(Number(id), dto, req.user.id)
  }

  @Patch('charges/:id/pay')
  payCharge(@Param('id') id: string, @Request() req: any) { return this.svc.payCharge(Number(id), req.user.id) }

  @Get('services')
  listServices(@Query('all') all?: string) { return this.svc.listServices(all === '1' || all === 'true') }

  @Post('services')
  createService(@Body() dto: ServiceDto) { return this.svc.createService(dto) }

  @Put('services/:id')
  updateService(@Param('id') id: string, @Body() dto: ServiceDto) { return this.svc.updateService(Number(id), dto) }

  @Delete('services/:id')
  removeService(@Param('id') id: string) { return this.svc.removeService(Number(id)) }
}
