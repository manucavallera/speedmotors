import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, ParseIntPipe, Request } from '@nestjs/common'
import { ExpensesService } from './expenses.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AdminGuard } from '../auth/roles.guard'

@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Get() findAll(@Query('page') page?: string, @Query('limit') limit?: string) { return this.expensesService.findAll({ page: page ? +page : undefined, limit: limit ? +limit : undefined }) }
  @Get('summary') getSummary() { return this.expensesService.getSummaryByCategory() }

  @Post()
  create(@Body() body: any, @Request() req: any) {
    return this.expensesService.create({ ...body, userId: req.user.id })
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.expensesService.update(id, body)
  }

  @Delete(':id') @UseGuards(AdminGuard) remove(@Param('id', ParseIntPipe) id: number) { return this.expensesService.remove(id) }
}
