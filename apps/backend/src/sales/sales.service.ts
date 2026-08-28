import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common'
import { db } from '../db'
import { sales, saleItems, installments, products, vehicles, clients, stockMovements, credits, creditInstallments } from '../db/schema'
import { eq, desc, sql, asc, and, or, gte, lte, ilike, inArray, isNull } from 'drizzle-orm'
import { CreateSaleDto } from './create-sale.dto'
import { calcCuotasFijas } from '../credits/credit-math'
import { CreditsService } from '../credits/credits.service'

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name)

  constructor(private readonly creditsService: CreditsService) {}

  async findAll(params: { page?: number; limit?: number; search?: string; dateFrom?: string; dateTo?: string; invoiceType?: string; userId?: number } = {}) {
    const page = params.page ?? 1
    const limit = Math.min(200, params.limit ?? 100)
    const offset = (page - 1) * limit

    const conditions = []
    if (params.userId) conditions.push(eq(sales.userId, params.userId))
    if (params.invoiceType) conditions.push(eq(sales.invoiceType, params.invoiceType as 'A' | 'B' | 'X' | 'mixto'))
    if (params.dateFrom) {
      const d = new Date(params.dateFrom)
      if (isNaN(d.getTime())) throw new BadRequestException('dateFrom inválido')
      conditions.push(gte(sales.createdAt, d))
    }
    if (params.dateTo) {
      const to = new Date(params.dateTo)
      if (isNaN(to.getTime())) throw new BadRequestException('dateTo inválido')
      to.setHours(23, 59, 59, 999)
      conditions.push(lte(sales.createdAt, to))
    }
    if (params.search) {
      const clientSubquery = db.select({ id: clients.id }).from(clients).where(ilike(clients.name, `%${params.search}%`))
      conditions.push(or(
        ilike(sales.saleNumber, `%${params.search}%`),
        inArray(sales.clientId, clientSubquery),
      ))
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [items, countResult] = await Promise.all([
      db.select().from(sales).where(where).orderBy(desc(sales.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(sales).where(where),
    ])
    const total = countResult[0]?.count ?? 0
    return { items, total, page, limit, pages: Math.ceil(total / limit) }
  }

  async findOne(id: number) {
    const [sale] = await db.select().from(sales).where(eq(sales.id, id))
    if (!sale) throw new NotFoundException(`Venta ${id} no encontrada`)

    const items = await db.select().from(saleItems).where(eq(saleItems.saleId, id))

    // Cuotas viven en creditInstallments (vía el crédito de la venta), no en la tabla legacy installments
    const [credit] = await db.select().from(credits).where(eq(credits.saleId, id))
    let cuotas: any[] = []
    if (credit) {
      const rows = await db.select().from(creditInstallments)
        .where(eq(creditInstallments.creditId, credit.id))
        .orderBy(asc(creditInstallments.dueDate))
      cuotas = rows.map(r => ({
        id: r.id,
        number: r.number,
        dueDate: r.dueDate,
        amount: r.amount,
        status: r.paidAt ? 'pagado' : 'pendiente',
      }))
    }

    return { ...sale, items, installments: cuotas }
  }

  async create(data: CreateSaleDto) {
    if (!data.items || data.items.length === 0) {
      throw new BadRequestException('La venta debe tener al menos un ítem')
    }

    const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    if (data.type === 'financiado_tercero' && !data.financingProvider?.trim()) {
      throw new BadRequestException('Se requiere el nombre de la financiera')
    }
    const discount = data.discount || 0
    const downPayment = data.downPayment || 0
    const principal = subtotal - discount
    const toFinance = Math.max(0, principal - downPayment)

    const MONTHLY_RATES: Record<string, number> = { pesos: 5, usd: 3 }
    const isCuotasSimples = data.type === 'cuotas' && data.creditType !== 'saldo_compuesto'
    const isFinanced = isCuotasSimples && !!data.financingCurrency
    // Respeta la tasa cargada; si no viene, cae a la tabla por moneda (solo financiado)
    const monthlyRate = isFinanced
      ? (data.interestRate ?? MONTHLY_RATES[data.financingCurrency!] ?? 5)
      : (data.interestRate || 0)
    const n = (isCuotasSimples && data.installmentCount) ? data.installmentCount : 1

    let cuotaAmount = 0
    let total: number
    if (isFinanced && n > 1) {
      cuotaAmount = calcCuotasFijas(toFinance, monthlyRate, n).cuota
      total = downPayment + cuotaAmount * n
    } else if (data.type === 'cuenta_corriente' || (data.type === 'cuotas' && data.creditType === 'saldo_compuesto')) {
      total = principal
    } else {
      total = principal * (1 + monthlyRate / 100)
    }

    const subtotalFormal = data.items
      .filter(it => it.ingresoTipo === 'blanco')
      .reduce((sum, it) => sum + it.quantity * it.unitPrice, 0)
    const subtotalInformal = data.items
      .filter(it => it.ingresoTipo === 'negro')
      .reduce((sum, it) => sum + it.quantity * it.unitPrice, 0)
    const ratio = subtotal > 0 ? principal / subtotal : 1
    const totalRatio = principal > 0 ? total / principal : 1
    const amountFormal = +(subtotalFormal * ratio * totalRatio).toFixed(2)
    const amountInformal = +(subtotalInformal * ratio * totalRatio).toFixed(2)

    return db.transaction(async (tx) => {
      // saleNumber usa el ID del registro — garantía de unicidad sin race condition
      const [sale] = await tx.insert(sales).values({
        saleNumber: 'PENDING',
        clientId: data.clientId,
        userId: data.userId!,
        type: data.type,
        invoiceType: (data.invoiceType ?? 'X') as 'A' | 'B' | 'X' | 'mixto',
        financingCurrency: data.financingCurrency ?? null,
        financingProvider: data.type === 'financiado_tercero' ? data.financingProvider!.trim() : null,
        paymentMethod: data.paymentMethod,
        subtotal: subtotal.toString(),
        discount: discount.toString(),
        downPayment: downPayment.toString(),
        downPaymentMethod: data.downPaymentMethod ?? null,
        interestRate: monthlyRate.toString(),
        total: total.toFixed(2),
        amountFormal: amountFormal.toString(),
        amountInformal: amountInformal.toString(),
        firstInstallmentDate: data.firstInstallmentDate ? new Date(data.firstInstallmentDate) : null,
        notes: data.notes,
      }).returning()

      const num = sale.id.toString().padStart(5, '0')
      const saleNumber = `${new Date().getFullYear()}-${num}`
      await tx.update(sales).set({ saleNumber }).where(eq(sales.id, sale.id))

      await tx.insert(saleItems).values(
        data.items.map(item => ({
          saleId: sale.id,
          productId: item.productId,
          vehicleId: item.vehicleId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          subtotal: (item.quantity * item.unitPrice).toFixed(2),
          ingresoTipo: item.ingresoTipo ?? null,
        })),
      )

      for (const item of data.items) {
        if (item.productId) {
          const [updated] = await tx.update(products)
            .set({ stock: sql`${products.stock} - ${item.quantity}`, updatedAt: new Date() })
            .where(and(eq(products.id, item.productId), gte(products.stock, item.quantity)))
            .returning({ id: products.id, stock: products.stock })
          if (!updated) {
            const [p] = await tx.select({ id: products.id, stock: products.stock }).from(products).where(eq(products.id, item.productId))
            if (!p) throw new BadRequestException(`Producto ${item.productId} no encontrado`)
            throw new BadRequestException(`Stock insuficiente para producto ${item.productId}: disponible ${p.stock}, solicitado ${item.quantity}`)
          }
        }
        if (item.vehicleId) {
          const [updatedV] = await tx.update(vehicles)
            .set({ status: 'vendido', updatedAt: new Date() })
            .where(and(eq(vehicles.id, item.vehicleId), inArray(vehicles.status, ['disponible', 'reservado'])))
            .returning({ id: vehicles.id })
          if (!updatedV) throw new BadRequestException(`Vehículo ${item.vehicleId} no disponible para venta (ya vendido)`)
        }
      }

      // Financiado y cuenta corriente viven en el módulo créditos
      if (data.type === 'cuenta_corriente' || data.type === 'cuotas') {
        if (!data.clientId) throw new BadRequestException('Se requiere cliente para venta financiada / cuenta corriente')

        const creditType = isCuotasSimples ? 'cuotas_simples' : 'saldo_compuesto'
        // cuenta corriente: vence en N días; financiado: arranca en la fecha de primer vencimiento elegida
        const firstDueDate = data.type === 'cuenta_corriente'
          ? new Date(Date.now() + (data.daysToExpire ?? 30) * 24 * 60 * 60 * 1000)
          : data.firstInstallmentDate ? new Date(data.firstInstallmentDate) : null
        const rate = data.type === 'cuenta_corriente' ? 0 : monthlyRate

        const [credit] = await tx.insert(credits).values({
          clientId: data.clientId,
          userId: data.userId!,
          saleId: sale.id,
          creditType,
          currency: data.financingCurrency === 'usd' ? 'usd' : 'pesos',
          originalAmount: toFinance.toFixed(2),
          interestRate: rate.toString(),
          startDate: new Date(),
          firstDueDate,
          installmentsCount: creditType === 'cuotas_simples' ? n : null,
        }).returning()

        // Cuotas planificadas con interés simple. amount = cuota con interés; principalAmount = solo capital (pago anticipado 20+ días)
        if (creditType === 'cuotas_simples') {
          if (!firstDueDate) throw new BadRequestException('Se requiere fecha de primer vencimiento para financiación en cuotas')
          if (n < 2) throw new BadRequestException('La financiación en cuotas requiere al menos 2 cuotas')
          const { cuota: cuotaConInteres, cuotaBase } = calcCuotasFijas(toFinance, rate, n)
          const rows = Array.from({ length: n }, (_, i) => {
            const due = new Date(firstDueDate)
            due.setMonth(due.getMonth() + i)
            return { creditId: credit.id, number: i + 1, dueDate: due, amount: cuotaConInteres.toFixed(2), principalAmount: cuotaBase.toFixed(2), surcharge: '0' }
          })
          await tx.insert(creditInstallments).values(rows)
        }
      }

      return sale.id
    }).then(saleId => this.findOne(saleId))
  }

  async cancelSale(id: number) {
    return db.transaction(async (tx) => {
      const [sale] = await tx.select().from(sales).where(eq(sales.id, id))
      if (!sale) throw new NotFoundException(`Venta ${id} no encontrada`)
      if (sale.status === 'cancelado') throw new BadRequestException('La venta ya está cancelada')

      const items = await tx.select().from(saleItems).where(eq(saleItems.saleId, id))

      for (const item of items) {
        if (item.productId) {
          await tx.update(products)
            .set({ stock: sql`${products.stock} + ${item.quantity}`, updatedAt: new Date() })
            .where(eq(products.id, item.productId))
        }
        if (item.vehicleId) {
          await tx.update(vehicles)
            .set({ status: 'disponible', updatedAt: new Date() })
            .where(and(eq(vehicles.id, item.vehicleId), eq(vehicles.status, 'vendido')))
        }
      }
      const [updated] = await tx.update(sales).set({ status: 'cancelado' }).where(eq(sales.id, id)).returning()
      return updated
    })
  }

  async remove(id: number) {
    return db.transaction(async (tx) => {
      const [sale] = await tx.select().from(sales).where(eq(sales.id, id))
      if (!sale) throw new NotFoundException(`Venta ${id} no encontrada`)

      // Restaurar stock/vehículos solo si no estaba cancelada (cancel ya lo hizo)
      if (sale.status !== 'cancelado') {
        const items = await tx.select().from(saleItems).where(eq(saleItems.saleId, id))
        for (const item of items) {
          if (item.productId) {
            await tx.update(products)
              .set({ stock: sql`${products.stock} + ${item.quantity}`, updatedAt: new Date() })
              .where(eq(products.id, item.productId))
          }
          if (item.vehicleId) {
            await tx.update(vehicles)
              .set({ status: 'disponible', updatedAt: new Date() })
              .where(and(eq(vehicles.id, item.vehicleId), eq(vehicles.status, 'vendido')))
          }
        }
      }

      await tx.update(stockMovements).set({ saleId: null }).where(eq(stockMovements.saleId, id))
      await tx.update(credits).set({ saleId: null }).where(eq(credits.saleId, id))
      await tx.delete(installments).where(eq(installments.saleId, id))
      await tx.delete(saleItems).where(eq(saleItems.saleId, id))
      const [deleted] = await tx.delete(sales).where(eq(sales.id, id)).returning()
      return deleted
    })
  }

  // Cobranza opera sobre las cuotas del módulo créditos (creditInstallments). Delega el cobro
  // a CreditsService para reusar recargo por atraso + regla de pago anticipado 20 días.
  async payInstallment(installmentId: number, userId: number) {
    return this.creditsService.payInstallment(installmentId, new Date().toISOString(), userId)
  }

  async updateTransport(id: number, data: {
    transportPropio?: boolean
    transportistaNombre?: string
    transportistaCuit?: string
    transportistaDomicilio?: string
    conductorNombre?: string
    conductorDni?: string
    conductorRegNum?: string
    dominioVehiculo?: string
    dominioAcoplado?: string
  }) {
    const [updated] = await db.update(sales).set({
      transportPropio: data.transportPropio ?? false,
      transportistaNombre: data.transportistaNombre || null,
      transportistaCuit: data.transportistaCuit || null,
      transportistaDomicilio: data.transportistaDomicilio || null,
      conductorNombre: data.conductorNombre || null,
      conductorDni: data.conductorDni || null,
      conductorRegNum: data.conductorRegNum || null,
      dominioVehiculo: data.dominioVehiculo || null,
      dominioAcoplado: data.dominioAcoplado || null,
    }).where(eq(sales.id, id)).returning()
    if (!updated) throw new NotFoundException('Venta no encontrada')
    return updated
  }

  async getPendingInstallments(params: { page?: number; limit?: number; clientId?: number; overdue?: boolean; search?: string } = {}) {
    const page = params.page ?? 1
    const limit = Math.min(200, params.limit ?? 50)
    const offset = (page - 1) * limit

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const baseConditions = [isNull(creditInstallments.paidAt)]
    if (params.clientId) baseConditions.push(eq(credits.clientId, params.clientId))
    if (params.search) baseConditions.push(ilike(clients.name, `%${params.search}%`))
    const baseWhere = baseConditions.length === 1 ? baseConditions[0] : and(...baseConditions)

    const overdueWhere = and(baseWhere, sql`${creditInstallments.dueDate} < ${today}`)
    const upcomingWhere = and(baseWhere, sql`${creditInstallments.dueDate} >= ${today}`)
    const filterWhere = params.overdue ? overdueWhere : baseWhere

    const [items, countResult, overdueStats, upcomingStats] = await Promise.all([
      db.select({
        id: creditInstallments.id,
        saleId: credits.saleId,
        creditId: creditInstallments.creditId,
        number: creditInstallments.number,
        amount: creditInstallments.amount,
        dueDate: creditInstallments.dueDate,
        status: sql<string>`'pendiente'`,
        paidAt: creditInstallments.paidAt,
        clientId: credits.clientId,
        clientName: clients.name,
      })
      .from(creditInstallments)
      .leftJoin(credits, eq(creditInstallments.creditId, credits.id))
      .leftJoin(clients, eq(credits.clientId, clients.id))
      .where(filterWhere)
      .orderBy(creditInstallments.dueDate)
      .limit(limit)
      .offset(offset),
      db.select({ count: sql<number>`count(*)::int` })
      .from(creditInstallments).leftJoin(credits, eq(creditInstallments.creditId, credits.id)).leftJoin(clients, eq(credits.clientId, clients.id)).where(filterWhere),
      db.select({ count: sql<number>`count(*)::int`, total: sql<number>`COALESCE(SUM(${creditInstallments.amount}), 0)::numeric` })
      .from(creditInstallments).leftJoin(credits, eq(creditInstallments.creditId, credits.id)).leftJoin(clients, eq(credits.clientId, clients.id)).where(overdueWhere),
      db.select({ count: sql<number>`count(*)::int`, total: sql<number>`COALESCE(SUM(${creditInstallments.amount}), 0)::numeric` })
      .from(creditInstallments).leftJoin(credits, eq(creditInstallments.creditId, credits.id)).leftJoin(clients, eq(credits.clientId, clients.id)).where(upcomingWhere),
    ])

    const total = countResult[0]?.count ?? 0
    return {
      items,
      total, page, limit, pages: Math.ceil(total / limit),
      overdueCount: overdueStats[0]?.count ?? 0,
      overdueTotal: overdueStats[0]?.total ?? 0,
      upcomingCount: upcomingStats[0]?.count ?? 0,
      upcomingTotal: upcomingStats[0]?.total ?? 0,
    }
  }
}
