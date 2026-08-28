import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AdminGuard } from '../auth/roles.guard'
import { CreateConsignmentDto, CreateResellerDto, RegisterResaleDto } from './resales.dto'
import { ResalesService } from './resales.service'

@UseGuards(JwtAuthGuard)
@Controller('resales')
export class ResalesController {
  constructor(private readonly service: ResalesService) {}
  @Get() list() { return this.service.list() }
  @Post('resellers') @UseGuards(AdminGuard) createReseller(@Body() body: CreateResellerDto) { return this.service.createReseller(body) }
  @Post('consignments') @UseGuards(AdminGuard) consign(@Body() body: CreateConsignmentDto) { return this.service.consign(body) }
  @Post('consignments/:id/sold') @UseGuards(AdminGuard) sold(@Param('id', ParseIntPipe) id: number, @Body() body: RegisterResaleDto) { return this.service.registerSale(id, body) }
}
