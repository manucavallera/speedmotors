import { Injectable, NotFoundException, Logger } from '@nestjs/common'
import { db } from '../db'
import { products, categories } from '../db/schema'
import { eq, ilike, and, lte, gt, asc, desc, sql, inArray } from 'drizzle-orm'

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name)
  async findAll(filters?: { search?: string; categoryId?: number; supplierId?: number; ingresoTipo?: string; priceSort?: string; page?: number; limit?: number }) {
    const page = Math.max(1, filters?.page ?? 1)
    const limit = Math.min(200, Math.max(1, filters?.limit ?? 50))
    const offset = (page - 1) * limit

    const conditions = []
    if (filters?.search) conditions.push(ilike(products.name, `%${filters.search}%`))
    if (filters?.categoryId) conditions.push(eq(products.categoryId, filters.categoryId))
    if (filters?.supplierId) conditions.push(eq(products.supplierId, filters.supplierId))
    if (filters?.ingresoTipo) conditions.push(eq(products.ingresoTipo, filters.ingresoTipo as 'blanco' | 'negro'))
    conditions.push(eq(products.active, true))
    const where = and(...conditions)

    const baseQuery = db.select().from(products).where(where)
    const orderedQuery = filters?.priceSort === 'asc'
      ? baseQuery.orderBy(asc(products.sellPrice))
      : filters?.priceSort === 'desc'
        ? baseQuery.orderBy(desc(products.sellPrice))
        : baseQuery

    const [items, countResult] = await Promise.all([
      orderedQuery.limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(products).where(where),
    ])
    const total = countResult[0]?.count ?? 0
    return { items, total, page, limit, pages: Math.ceil(total / limit) }
  }

  async findOne(id: number) {
    const [product] = await db.select().from(products).where(eq(products.id, id))
    if (!product) throw new NotFoundException(`Producto ${id} no encontrado`)
    return product
  }

  async create(data: typeof products.$inferInsert) {
    const [product] = await db.insert(products).values(data).returning()
    return product
  }

  async update(id: number, data: Partial<typeof products.$inferInsert>) {
    const [product] = await db
      .update(products)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning()
    if (!product) throw new NotFoundException(`Producto ${id} no encontrado`)
    return product
  }

  async remove(id: number) {
    const [product] = await db
      .update(products)
      .set({ active: false })
      .where(eq(products.id, id))
      .returning()
    if (!product) throw new NotFoundException(`Producto ${id} no encontrado`)
    return product
  }

  async findLowStock() {
    return db
      .select()
      .from(products)
      .where(and(
        eq(products.active, true),
        gt(products.stock, 0),
        lte(products.stock, products.minStock),
      ))
  }

  async importProducts(rows: { code: string; name: string; brand?: string; costPrice: number; sellPrice?: number; category?: string }[]) {
    const CHUNK = 100
    let created = 0, updated = 0, errors = 0

    const allCodes = rows.map(r => r.code)
    const existingRows = await db.select({ code: products.code }).from(products)
      .where(inArray(products.code, allCodes))
    const existingCodes = new Set(existingRows.map(r => r.code))

    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK)
      const values = chunk.map(row => ({
        code: row.code,
        name: row.name,
        brand: row.brand ?? null,
        costPrice: (row.costPrice).toFixed(2),
        sellPrice: (row.sellPrice ?? row.costPrice * 1.3).toFixed(2),
      }))
      try {
        await db.transaction(async (tx) => {
          await tx.insert(products)
            .values(values)
            .onConflictDoUpdate({
              target: products.code,
              set: {
                name: sql`excluded.name`,
                brand: sql`COALESCE(excluded.brand, ${products.brand})`,
                costPrice: sql`excluded.cost_price`,
                sellPrice: sql`excluded.sell_price`,
                updatedAt: new Date(),
              },
            })
        })
        for (const row of chunk) {
          if (existingCodes.has(row.code)) updated++
          else created++
        }
      } catch (err) {
        errors += chunk.length
        this.logger.error(`importProducts: error en chunk ${i}-${i + CHUNK}: ${(err as Error).message}`)
      }
    }
    return { created, updated, errors, total: rows.length }
  }

  async updateStock(id: number, quantity: number) {
    const [product] = await db
      .update(products)
      .set({ stock: quantity, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning()
    if (!product) throw new NotFoundException(`Producto ${id} no encontrado`)
    return product
  }
}
