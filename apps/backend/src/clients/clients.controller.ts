import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, ParseIntPipe, Request, UseInterceptors, UploadedFile } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { ClientsService } from './clients.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AdminGuard } from '../auth/roles.guard'
import { CreateClientDto, UpdateClientDto } from './client.dto'

@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Post('parse-comprobante')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    fileFilter: (_, file, cb) => {
      if (!file.mimetype.startsWith('image/')) return cb(new Error('Solo imágenes'), false)
      cb(null, true)
    },
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  parseComprobante(@UploadedFile() file: Express.Multer.File) {
    return this.clientsService.parseComprobante(file)
  }

  @Post('parse-dni')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    fileFilter: (_, file, cb) => {
      if (!file.mimetype.startsWith('image/')) return cb(new Error('Solo imágenes'), false)
      cb(null, true)
    },
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  parseDni(@UploadedFile() file: Express.Multer.File) {
    return this.clientsService.parseDni(file)
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.clientsService.findAll({ search, page: page ? +page : undefined, limit: limit ? +limit : undefined })
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.findOne(id)
  }

  @Get(':id/sales')
  findSales(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.findSales(id)
  }

  @Get(':id/account')
  getAccount(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.getAccount(id)
  }

  @Post(':id/payments')
  addPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { type: 'pago_cuenta' | 'nota_credito' | 'nota_debito'; amount: number; description: string; date?: string; notes?: string },
    @Request() req: { user: { id: number } },
  ) {
    return this.clientsService.addPayment(id, req.user.id, body)
  }

  @Delete(':id/payments/:paymentId')
  @UseGuards(AdminGuard)
  removePayment(@Param('paymentId', ParseIntPipe) paymentId: number) {
    return this.clientsService.removePayment(paymentId)
  }

  @Post()
  create(@Body() body: CreateClientDto) {
    return this.clientsService.create(body)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateClientDto) {
    return this.clientsService.update(id, body)
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.remove(id)
  }
}
