import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/roles.guard';
import {
  CreateConsignmentDto,
  CreateResellerDto,
  RegisterResaleDto,
  UpdateConsignmentDto,
  UpdateResellerDto,
} from './resales.dto';
import { ResalesService } from './resales.service';

@UseGuards(JwtAuthGuard)
@Controller('resales')
export class ResalesController {
  constructor(private readonly service: ResalesService) {}
  @Get() list() {
    return this.service.list();
  }
  @Post('resellers') @UseGuards(AdminGuard) createReseller(
    @Body() body: CreateResellerDto,
  ) {
    return this.service.createReseller(body);
  }
  @Patch('resellers/:id') @UseGuards(AdminGuard) updateReseller(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateResellerDto,
  ) {
    return this.service.updateReseller(id, body);
  }
  @Delete('resellers/:id') @UseGuards(AdminGuard) deleteReseller(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.deleteReseller(id);
  }
  @Post('consignments') @UseGuards(AdminGuard) consign(
    @Body() body: CreateConsignmentDto,
  ) {
    return this.service.consign(body);
  }
  @Patch('consignments/:id') @UseGuards(AdminGuard) updateConsignment(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateConsignmentDto,
  ) {
    return this.service.updateConsignment(id, body);
  }
  @Delete('consignments/:id') @UseGuards(AdminGuard) removeConsignment(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.removeConsignment(id);
  }
  @Post('consignments/:id/sold') @UseGuards(AdminGuard) sold(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: RegisterResaleDto,
  ) {
    return this.service.registerSale(id, body);
  }
}
