import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common'
import { db } from '../db'
import { sales, saleItems, installments, products, vehicles, clients } from '../db/schema'
import { eq, desc, sql, asc, and, or, gte, lte, ilike, inArray } from 'drizzle-orm'
import { CreateSaleDto } from './create-sale.dto'

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name)

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
    const cuotas = await db.select().from(installments).where(eq(installments.saleId, id)).orderBy(asc(installments.dueDate))

    return { ...sale, items, installments: cuotas }
  }

  async create(data: CreateSaleDto) {
    if (!data.items || data.items.length === 0) {
      throw new BadRequestException('La venta debe tener al menos un ítem')
    }

    const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    const discount = data.discount || 0
    const principal = subtotal - discount

    const MONTHLY_RATES: Record<string, number> = { pesos: 5, usd: 3 }
    const isFinanced = data.type === 'cuotas' && !!data.financingCurrency
    const monthlyRate = isFinanced ? (MONTHLY_RATES[data.financingCurrency!] ?? 5) : (data.interestRate || 0)
    const n = (data.type === 'cuotas' && data.installmentCount) ? data.installmentCount : 1

    let cuotaAmount = 0
    let total: number
    if (isFinanced && n > 1) {
      const r = monthlyRate / 100
      cuotaAmount = principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1)
      total = cuotaAmount * n
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
        paymentMethod: data.paymentMethod,
        subtotal: subtotal.toString(),
        discount: discount.toString(),
        interestRate: monthlyRate.toString(),
        total: total.toFixed(2),
        amountFormal: amountFormal.toString(),
        amountInformal: amountInformal.toString(),
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

      if (data.type === 'cuotas' && n > 1) {
        const amount = isFinanced ? cuotaAmount : total / n
        const cuotas = Array.from({ length: n }, (_, i) => {
          const dueDate = new Date()
          dueDate.setMonth(dueDate.getMonth() + i + 1)
          return { saleId: sale.id, number: i + 1, amount: amount.toFixed(2), dueDate }
        })
        await tx.insert(installments).values(cuotas)
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

  async payInstallment(installmentId: number) {
    const [existing] = await db.select().from(installments).where(eq(installments.id, installmentId))
    if (!existing) throw new NotFoundException(`Cuota ${installmentId} no encontrada`)
    if (existing.status === 'pagado') throw new BadRequestException('La cuota ya fue pagada')

    const [updated] = await db
      .update(installments)
      .set({ status: 'pagado', paidAt: new Date() })
      .where(and(eq(installments.id, installmentId), eq(installments.status, 'pendiente')))
      .returning()
    if (!updated) throw new BadRequestException('La cuota ya fue pagada')
    return updated
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

  async getPendingInstallments(limit = 500) {
    return db.select({
      id: installments.id,
      saleId: installments.saleId,
      number: installments.number,
      amount: installments.amount,
      dueDate: installments.dueDate,
      status: installments.status,
      paidAt: installments.paidAt,
      clientId: sales.clientId,
      clientName: clients.name,
    })
    .from(installments)
    .leftJoin(sales, eq(installments.saleId, sales.id))
    .leftJoin(clients, eq(sales.clientId, clients.id))
    .where(eq(installments.status, 'pendiente'))
    .limit(limit)
  }
}
