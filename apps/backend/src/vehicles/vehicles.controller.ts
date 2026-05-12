import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, ParseIntPipe, UseInterceptors, UploadedFile } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { VehiclesService } from './vehicles.service'
import { CreateVehicleDto, UpdateVehicleDto, BulkCreateVehiclesDto } from './vehicle.dto'
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
  @UseGuards(AdminGuard)
  create(@Body() body: CreateVehicleDto) {
    return this.vehiclesService.create(body)
  }

  @Post('bulk')
  @UseGuards(AdminGuard)
  bulkCreate(@Body() body: BulkCreateVehiclesDto) {
    return this.vehiclesService.bulkCreate(body.items)
  }

  @Post('parse-titulo')
  @UseGuards(AdminGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    fileFilter: (_, file, cb) => {
      if (!file.mimetype.startsWith('image/')) return cb(new Error('Solo imágenes'), false)
      cb(null, true)
    },
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  parseTitulo(@UploadedFile() file: Express.Multer.File) {
    return this.vehiclesService.parseTitulo(file)
  }

  @Post('parse-remito')
  @UseGuards(AdminGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    fileFilter: (_, file, cb) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
      if (!allowed.includes(file.mimetype)) return cb(new Error('Solo imágenes o PDF'), false)
      cb(null, true)
    },
    limits: { fileSize: 10 * 1024 * 1024 },
  }))
  parseRemito(@UploadedFile() file: Express.Multer.File) {
    return this.vehiclesService.parseRemito(file)
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateVehicleDto) {
    return this.vehiclesService.update(id, body)
  }

  @Put(':id/status')
  @UseGuards(AdminGuard)
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: 'disponible' | 'reservado' | 'vendido') {
    return this.vehiclesService.updateStatus(id, status)
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.remove(id)
  }
}
