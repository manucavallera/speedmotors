import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { db } from '../db'
import { stockValuationLines, stockValuations, vehicles } from '../db/schema'
import {
  EligibleVehicle,
  groupEligibleVehicles,
  projectValuation,
  StockValuationValidationError,
  stockFingerprint,
} from './stock-valuation.domain'
import { CloseStockValuationDto, PreviewStockValuationDto } from './stock-valuations.dto'

@Injectable()
export class StockValuationsService {
  constructor(@Inject('DB') private readonly database: typeof db) {}

  private assertPeriod(period: string) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period))
      throw new BadRequestException('El período debe usar el formato YYYY-MM')
  }

  private async eligibleRows(executor: typeof db = this.database, lock = false): Promise<EligibleVehicle[]> {
    const query = executor
      .select()
      .from(vehicles)
      .where(and(eq(vehicles.type, 'moto'), inArray(vehicles.status, ['disponible', 'reservado'])))
    const rows = lock ? await query.for('update') : await query

    const eligible: EligibleVehicle[] = []
    for (const row of rows) {
      if (row.type !== 'moto' || (row.status !== 'disponible' && row.status !== 'reservado')) continue
      eligible.push({
        id: row.id,
        brand: row.brand,
        model: row.model,
        version: row.version,
        status: row.status,
        internalCode: row.internalCode,
        chassisNumber: row.chassisNumber,
        engineNumber: row.engineNumber,
        costPrice: row.costPrice,
        sellPrice: row.sellPrice,
        updatedAt: row.updatedAt,
      })
    }
    return eligible
  }

  private project(rows: EligibleVehicle[], dto: PreviewStockValuationDto) {
    try {
      return projectValuation(rows, dto)
    } catch (error) {
      if (error instanceof StockValuationValidationError)
        throw new BadRequestException({ code: 'INVALID_VALUATION', message: error.message })
      throw error
    }
  }

  private async existingForPeriod(period: string, executor: typeof db = this.database) {
    const [existing] = await executor
      .select()
      .from(stockValuations)
      .where(eq(stockValuations.period, period))
      .limit(1)
    return existing
  }

  async current(period: string) {
    this.assertPeriod(period)
    const [rows, existingValuation] = await Promise.all([
      this.eligibleRows(),
      this.existingForPeriod(period),
    ])
    const groups = groupEligibleVehicles(rows).map(({ vehicles: groupedRows, ...group }) => ({
      ...group,
      units: groupedRows.map((row) => ({
        id: row.id,
        internalCode: row.internalCode,
        brand: row.brand.trim(),
        model: row.model.trim(),
        version: row.version?.trim() || null,
        status: row.status,
        chassisNumber: row.chassisNumber,
        engineNumber: row.engineNumber,
      })),
    }))

    return {
      period,
      stockFingerprint: stockFingerprint(rows),
      groups,
      existingValuation: existingValuation ?? null,
    }
  }

  async preview(dto: PreviewStockValuationDto) {
    const rows = await this.eligibleRows()
    if (stockFingerprint(rows) !== dto.stockFingerprint)
      throw new ConflictException({ code: 'STALE_STOCK', message: 'El stock cambió. Recargá la vista previa antes de continuar' })
    return this.project(rows, dto)
  }

  async close(dto: CloseStockValuationDto) {
    return this.database.transaction(async (transaction) => {
      const executor = transaction as unknown as typeof db
      const rows = await this.eligibleRows(executor, true)
      if (stockFingerprint(rows) !== dto.stockFingerprint)
        throw new ConflictException({ code: 'STALE_STOCK', message: 'El stock cambió. Recargá la vista previa antes de continuar' })

      const projection = this.project(rows, dto)
      const existing = await this.existingForPeriod(dto.period, executor)
      if (existing && !dto.replaceExisting)
        throw new ConflictException({ code: 'PERIOD_EXISTS', message: `Ya existe el cierre ${dto.period}` })

      const now = new Date()
      for (const group of projection.groups) {
        const values: { costPrice: string; sellPrice?: string; updatedAt: Date } = {
          costPrice: group.costPrice.toFixed(2),
          updatedAt: now,
        }
        if (group.saleMode !== 'unchanged' && group.sellPrice !== null)
          values.sellPrice = group.sellPrice.toFixed(2)
        await executor.update(vehicles).set(values).where(inArray(vehicles.id, group.vehicleIds))
      }

      const headerValues = {
        period: dto.period,
        closedAt: now,
        availableUnits: projection.totals.availableUnits,
        reservedUnits: projection.totals.reservedUnits,
        totalUnits: projection.totals.totalUnits,
        totalCost: projection.totals.totalCost.toFixed(2),
        totalSell: projection.totals.totalSell.toFixed(2),
        potentialMargin: projection.totals.potentialMargin.toFixed(2),
        unpricedSaleUnits: projection.totals.unpricedSaleUnits,
        updatedAt: now,
      }

      let header: typeof stockValuations.$inferSelect
      if (existing) {
        ;[header] = await executor
          .update(stockValuations)
          .set(headerValues)
          .where(eq(stockValuations.id, existing.id))
          .returning()
        await executor.delete(stockValuationLines).where(eq(stockValuationLines.valuationId, existing.id))
      } else {
        ;[header] = await executor.insert(stockValuations).values(headerValues).returning()
      }

      const lineValues = projection.groups.map((group) => ({
        valuationId: header.id,
        brand: group.brand,
        model: group.model,
        version: group.version,
        availableUnits: group.availableUnits,
        reservedUnits: group.reservedUnits,
        totalUnits: group.totalUnits,
        costPrice: group.costPrice.toFixed(2),
        sellPrice: group.sellPrice === null ? null : group.sellPrice.toFixed(2),
        totalCost: group.totalCost.toFixed(2),
        totalSell: group.totalSell.toFixed(2),
        potentialMargin: group.potentialMargin.toFixed(2),
      }))
      const lines = await executor.insert(stockValuationLines).values(lineValues).returning()

      return { ...projection, id: header.id, closedAt: header.closedAt, lines }
    })
  }

  async list() {
    return this.database.select().from(stockValuations).orderBy(desc(stockValuations.period))
  }

  async findOne(id: number) {
    const [header] = await this.database
      .select()
      .from(stockValuations)
      .where(eq(stockValuations.id, id))
      .limit(1)
    if (!header) throw new NotFoundException(`Cierre ${id} no encontrado`)
    const lines = await this.database
      .select()
      .from(stockValuationLines)
      .where(eq(stockValuationLines.valuationId, id))
      .orderBy(stockValuationLines.brand, stockValuationLines.model, stockValuationLines.version)
    return { ...header, lines }
  }
}
