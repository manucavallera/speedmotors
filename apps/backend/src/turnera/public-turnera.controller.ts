import { Controller, Get, Post, Body, Query } from '@nestjs/common'
import { TurneraService } from './turnera.service'
import { PublicReserveDto } from './turnera.dto'

// Página pública del cliente: SIN login. El cliente entra por un link de WhatsApp,
// se identifica con su teléfono y reserva su turno. No expone datos de otros clientes.
@Controller('public/turnera')
export class PublicTurneraController {
  constructor(private readonly svc: TurneraService) {}

  // Horario y grilla configurados por el dueño (cada cuántos minutos, apertura/cierre)
  @Get('config')
  config() { return this.svc.getConfig() }

  // Catálogo de servicios que se pueden pedir con el turno
  @Get('services')
  services() { return this.svc.publicServices() }

  // Ficha del cliente: sus lanchas y sus próximos turnos (solo lo suyo)
  @Post('identify')
  identify(@Body('phone') phone: string) { return this.svc.publicIdentify(phone) }

  // Grilla del día: qué franjas están ocupadas (anónimo)
  @Get('slots')
  slots(@Query('date') date: string) { return this.svc.publicSlots(date) }

  // Reserva un turno para una lancha del cliente
  @Post('reserve')
  reserve(@Body() dto: PublicReserveDto) { return this.svc.publicReserve(dto) }
}
