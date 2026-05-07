import { Controller, Get, Post, Put, Delete, Patch, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common'
import { UsersService } from './users.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AdminGuard } from '../auth/roles.guard'

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly svc: UsersService) {}

  @Get()
  findAll() { return this.svc.findAll() }

  @Post()
  create(@Body() body: { name: string; email: string; password: string; role: 'admin' | 'vendedor' }) {
    return this.svc.create(body)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: { name?: string; email?: string; role?: 'admin' | 'vendedor' }) {
    return this.svc.update(id, body)
  }

  @Patch(':id/password')
  changePassword(@Param('id', ParseIntPipe) id: number, @Body() body: { password: string }) {
    return this.svc.changePassword(id, body.password)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) { return this.svc.remove(id) }
}
