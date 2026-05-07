import { Injectable, NotFoundException } from '@nestjs/common'
import { db } from '../db'
import { expenses } from '../db/schema'
import { eq, desc, gte, sql } from 'drizzle-orm'

@Injectable()
export class ExpensesService {
  async findAll(params: { page?: number; limit?: number } = {}) {
    const page = params.page ?? 1
    const limit = params.limit ?? 100
    const offset = (page - 1) * limit

    const [items, countResult] = await Promise.all([
      db.select().from(expenses).orderBy(desc(expenses.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(expenses),
    ])
    const total = countResult[0]?.count ?? 0
    return { items, total, page, limit, pages: Math.ceil(total / limit) }
  }

  async create(data: any) {
    const [expense] = await db.insert(expenses).values({
      ...data,
      date: data.date ? new Date(data.date) : new Date(),
    }).returning()
    return expense
  }

  async update(id: number, data: any) {
    const [expense] = await db.update(expenses).set({
      ...data,
      date: data.date ? new Date(data.date) : undefined,
    }).where(eq(expenses.id, id)).returning()
    if (!expense) throw new NotFoundException(`Gasto ${id} no encontrado`)
    return expense
  }

  async remove(id: number) {
    const [expense] = await db.delete(expenses).where(eq(expenses.id, id)).returning()
    if (!expense) throw new NotFoundException(`Gasto ${id} no encontrado`)
    return expense
  }

  async getSummaryByCategory() {
    return db.select({
      category: expenses.category,
      total: sql<string>`sum(${expenses.amount})`,
      count: sql<string>`count(*)`,
    }).from(expenses).groupBy(expenses.category)
  }
}
