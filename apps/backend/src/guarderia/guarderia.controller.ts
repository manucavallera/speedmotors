import { Controller, Get, Post, Put, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common'
import { GuarderiaService } from './guarderia.service'
import { CreateSpotsDto, CreateUnitDto, ChargeDto, ServiceDto, CategoryDto, MoveUnitDto, UnitServicesDto, GenerateMonthDto } from './guarderia.dto'
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

  @Patch('units/:id/move')
  move(@Param('id') id: string, @Body() dto: MoveUnitDto) {
    return this.svc.moveUnit(Number(id), dto.spotId ?? null)
  }

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

  // Ficha del cliente: sus lanchas, deuda, historial de cobros y salidas al agua
  @Get('clients/:id')
  clientFile(@Param('id') id: string) { return this.svc.clientFile(Number(id)) }

  // Servicios fijos de una lancha (seguros): se cobran todos los meses con la cuna
  @Put('units/:id/services')
  setUnitServices(@Param('id') id: string, @Body() dto: UnitServicesDto) {
    return this.svc.setUnitServices(Number(id), dto.serviceIds)
  }

  // Cobro masivo del mes: primero se previsualiza, después se genera
  @Get('month/preview')
  previewMonth(@Query('period') period: string) { return this.svc.previewMonth(period) }

  @Post('month/generate')
  generateMonth(@Body() dto: GenerateMonthDto, @Request() req: any) {
    return this.svc.generateMonth(dto.periodLabel, req.user.id)
  }

  @Get('categories')
  listCategories(@Query('all') all?: string) { return this.svc.listCategories(all === '1' || all === 'true') }

  @Post('categories')
  createCategory(@Body() dto: CategoryDto) { return this.svc.createCategory(dto) }

  @Put('categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: CategoryDto) { return this.svc.updateCategory(Number(id), dto) }

  @Delete('categories/:id')
  removeCategory(@Param('id') id: string) { return this.svc.removeCategory(Number(id)) }
}
