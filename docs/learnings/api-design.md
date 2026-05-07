# API Design -- NestJS SpeedMotors
~350 tokens

## Estructura de modulo
src/nombre/
  nombre.module.ts      -- imports, controllers, providers
  nombre.controller.ts  -- rutas, decorators, validacion HTTP
  nombre.service.ts     -- logica de negocio, acceso a DB

## Controller tipico
@Controller('recursos')
@UseGuards(JwtAuthGuard)
export class RecursosController {
  constructor(private readonly service: RecursosService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.service.findAll({ search })
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id)
  }

  @Post()
  create(@Body() data: CreateDto) {
    return this.service.create(data)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateDto) {
    return this.service.update(id, data)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }
}

## Endpoints existentes
GET/POST   /auth/login
GET/POST   /clients
GET/POST   /products, /products/import
GET/POST   /vehicles
GET/POST   /sales, /sales/:id/cancel
GET        /installments
GET/POST   /quotes
GET/POST   /cash/sessions, /cash/movements
GET/POST   /expenses
GET/POST   /purchase-orders
GET        /reports/summary
POST       /upload

## Errores HTTP estandar
throw new NotFoundException('mensaje')
throw new BadRequestException('mensaje')
throw new UnauthorizedException('mensaje')
-- NestJS los convierte a JSON automaticamente

## Registrar modulo nuevo
-- En app.module.ts, agregar a imports[]:
NuevoModule
