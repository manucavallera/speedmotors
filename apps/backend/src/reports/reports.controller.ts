import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ReportsService } from './reports.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('dashboard')
  dashboard() {
    return this.reports.getDashboard()
  }

  @Get('summary')
  summary(@Query('from') from?: string, @Query('to') to?: string) {
    const now = new Date()
    const fromDate = from ? new Date(from + 'T00:00:00-03:00') : new Date(now.getFullYear(), now.getMonth(), 1)
    const toDate = to ? new Date(to + 'T23:59:59.999-03:00') : now
    return this.reports.getSummary(fromDate, toDate)
  }

  @Get('full')
  full(@Query('from') from?: string, @Query('to') to?: string) {
    const now = new Date()
    const fromDate = from ? new Date(from + 'T00:00:00-03:00') : new Date(now.getFullYear(), now.getMonth(), 1)
    const toDate = to ? new Date(to + 'T23:59:59.999-03:00') : now
    return this.reports.getFullReport(fromDate, toDate)
  }
}
