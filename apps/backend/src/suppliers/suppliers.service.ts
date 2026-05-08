import { Injectable, NotFoundException } from '@nestjs/common'
import { db } from '../db'
import { suppliers, products } from '../db/schema'
import { eq, desc, ilike, sql } from 'drizzle-orm'

@Injectable()
export class SuppliersService {
  async findAll(params: { search?: string; page?: number; limit?: number } = {}) {
    const page = Math.max(1, params.page ?? 1)
    const limit = Math.min(100, params.limit ?? 50)
    const offset = (page - 1) * limit
    const where = params.search ? ilike(suppliers.name, `%${params.search}%`) : undefined
    const [items, countResult] = await Promise.all([
      where
        ? db.select().from(suppliers).where(where).orderBy(desc(suppliers.createdAt)).limit(limit).offset(offset)
        : db.select().from(suppliers).orderBy(desc(suppliers.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(suppliers).then(r => r[0].count),
    ])
    return { items, total: countResult, page, pages: Math.ceil(countResult / limit) }
  }

  async findOne(id: number) {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id))
    if (!supplier) throw new NotFoundException(`Proveedor ${id} no encontrado`)
    return supplier
  }

  async create(data: any) {
    const [supplier] = await db.insert(suppliers).values({
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      notes: data.notes || null,
    }).returning()
    return supplier
  }

  async update(id: number, data: any) {
    const [supplier] = await db.update(suppliers)
      .set({
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        notes: data.notes || null,
      })
      .where(eq(suppliers.id, id))
      .returning()
    if (!supplier) throw new NotFoundException(`Proveedor ${id} no encontrado`)
    return supplier
  }

  async remove(id: number) {
    await db.update(products).set({ supplierId: null }).where(eq(products.supplierId, id))
    const [supplier] = await db.delete(suppliers).where(eq(suppliers.id, id)).returning()
    if (!supplier) throw new NotFoundException(`Proveedor ${id} no encontrado`)
    return supplier
  }
}
