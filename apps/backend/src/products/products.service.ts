import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common'
import Anthropic from '@anthropic-ai/sdk'
import { db } from '../db'
import { products, categories, stockMovements } from '../db/schema'
import { eq, ilike, and, or, lte, gt, asc, desc, sql, inArray } from 'drizzle-orm'

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name)
  async findAll(filters?: { search?: string; categoryId?: number; supplierId?: number; ingresoTipo?: string; brand?: string; priceSort?: string; costSort?: string; page?: number; limit?: number }) {
    const page = Math.max(1, filters?.page ?? 1)
    const limit = Math.min(5000, Math.max(1, filters?.limit ?? 50))
    const offset = (page - 1) * limit

    const conditions = []
    if (filters?.search) conditions.push(or(ilike(products.name, `%${filters.search}%`), ilike(products.code, `%${filters.search}%`)))
    if (filters?.categoryId) conditions.push(eq(products.categoryId, filters.categoryId))
    if (filters?.supplierId) conditions.push(eq(products.supplierId, filters.supplierId))
    if (filters?.ingresoTipo) conditions.push(eq(products.ingresoTipo, filters.ingresoTipo as 'blanco' | 'negro'))
    if (filters?.brand) conditions.push(ilike(products.brand, `%${filters.brand}%`))
    conditions.push(eq(products.active, true))
    const where = and(...conditions)

    const baseQuery = db.select().from(products).where(where)
    const orderedQuery = filters?.priceSort === 'asc' ? baseQuery.orderBy(asc(products.sellPrice))
      : filters?.priceSort === 'desc' ? baseQuery.orderBy(desc(products.sellPrice))
      : filters?.costSort === 'asc' ? baseQuery.orderBy(asc(products.costPrice))
      : filters?.costSort === 'desc' ? baseQuery.orderBy(desc(products.costPrice))
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
                active: true,
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

  async parseRemito(file: Express.Multer.File): Promise<{ remitoNumber: string | null; items: { name: string; code: string | null; quantity: number; unitPrice: number | null }[] }> {
    if (!process.env.ANTHROPIC_API_KEY) throw new BadRequestException('ANTHROPIC_API_KEY no configurada')

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const base64 = file.buffer.toString('base64')
    const isPdf = file.mimetype === 'application/pdf'

    const content: Anthropic.ContentBlockParam[] = [
      isPdf
        ? ({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } } as unknown as Anthropic.ContentBlockParam)
        : ({ type: 'image', source: { type: 'base64', media_type: file.mimetype as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif', data: base64 } } as Anthropic.ImageBlockParam),
      { type: 'text', text: `Extraé los ítems de este remito de proveedor de productos/repuestos. Devolvé SOLO un JSON con esta estructura exacta, sin texto adicional:\n{"remitoNumber":"número de remito o null","items":[{"name":"descripción del producto","code":"código o null","quantity":1,"unitPrice":null}]}\nEl quantity debe ser numérico. El unitPrice puede ser null si no aparece.` },
    ]

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content }],
    })

    const raw = (response.content[0] as Anthropic.TextBlock).text
    const text = raw.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim()
    try {
      return JSON.parse(text)
    } catch {
      throw new BadRequestException('No se pudo interpretar la respuesta del análisis')
    }
  }

  async receiveRemito(
    items: { name: string; code: string | null; quantity: number; unitPrice: number | null }[],
    userId: number,
    remitoNumber: string | null,
  ) {
    const results = []
    const reason = `Remito${remitoNumber ? ` #${remitoNumber}` : ''}`

    for (const item of items) {
      // Find existing product by code (including inactive — remito reactivates them)
      let product = item.code
        ? (await db.select().from(products).where(eq(products.code, item.code)))[0]
        : null

      // Reactivate if soft-deleted
      if (product && !product.active) {
        const reactivated = await db.update(products).set({ active: true, updatedAt: new Date() }).where(eq(products.id, product.id)).returning()
        product = reactivated[0]
      }

      // Create if not found
      if (!product) {
        const code = item.code || `REM-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
        const cost = item.unitPrice ?? 0
        const created = await db.insert(products).values({
          code,
          name: item.name,
          costPrice: cost.toFixed(2),
          sellPrice: (cost * 1.3).toFixed(2),
          stock: 0,
          active: true,
        }).returning()
        product = created[0]
      }

      // Create stock movement (entrada)
      const previousStock = product.stock
      const newStock = previousStock + item.quantity
      await db.update(products).set({ stock: newStock, updatedAt: new Date() }).where(eq(products.id, product.id))
      const [movement] = await db.insert(stockMovements).values({
        productId: product.id,
        userId,
        type: 'entrada',
        quantity: item.quantity,
        previousStock,
        newStock,
        reason,
      }).returning()

      results.push({ product, movement, created: !item.code || previousStock === product.stock })
    }

    return results
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
