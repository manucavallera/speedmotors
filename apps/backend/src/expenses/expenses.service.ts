import { Injectable, NotFoundException } from '@nestjs/common'
import { db } from '../db'
import { expenses } from '../db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import { CreateExpenseDto, UpdateExpenseDto } from './expense.dto'

@Injectable()
export class ExpensesService {
  async findAll(params: { page?: number; limit?: number } = {}) {
    const page = params.page ?? 1
    const limit = Math.min(200, params.limit ?? 100)
    const offset = (page - 1) * limit

    const [items, countResult] = await Promise.all([
      db.select().from(expenses).orderBy(desc(expenses.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(expenses),
    ])
    const total = countResult[0]?.count ?? 0
    return { items, total, page, limit, pages: Math.ceil(total / limit) }
  }

  async create(data: CreateExpenseDto & { userId: number }) {
    const [expense] = await db.insert(expenses).values({
      category: data.category as typeof expenses.$inferInsert['category'],
      description: data.description,
      amount: data.amount.toString(),
      date: data.date ? new Date(data.date) : new Date(),
      notes: data.notes ?? null,
      userId: data.userId,
    }).returning()
    return expense
  }

  async update(id: number, data: UpdateExpenseDto) {
    const [expense] = await db.update(expenses).set({
      category: data.category as typeof expenses.$inferInsert['category'],
      description: data.description,
      amount: data.amount.toString(),
      date: data.date ? new Date(data.date) : undefined,
      notes: data.notes ?? null,
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
