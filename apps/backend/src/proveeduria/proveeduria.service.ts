import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { db } from '../db'
import { products, stockMovements, proveeduriaSales, proveeduriaSaleItems, cashSessions, cashMovements } from '../db/schema'
import { eq, and, ilike, or, desc, sql } from 'drizzle-orm'
import { ProveeduriaProductDto, CheckoutDto } from './proveeduria.dto'

@Injectable()
export class ProveeduriaService {
  // --- Productos (area = proveeduria) ---
  listProducts(search?: string) {
    const conditions = [eq(products.area, 'proveeduria'), eq(products.active, true)]
    if (search) conditions.push(or(ilike(products.name, `%${search}%`), ilike(products.barcode, `%${search}%`))!)
    return db.select().from(products).where(and(...conditions)).orderBy(products.name)
  }

  async createProduct(dto: ProveeduriaProductDto) {
    const code = dto.code?.trim() || `PROV-${Date.now()}`
    const [p] = await db.insert(products).values({
      area: 'proveeduria',
      code,
      name: dto.name,
      sellPrice: (dto.sellPrice ?? 0).toString(),
      costPrice: (dto.costPrice ?? 0).toString(),
      stock: dto.stock ?? 0,
      minStock: dto.minStock ?? 1,
      barcode: dto.barcode ?? null,
    }).returning()
    return p
  }

  async updateProduct(id: number, dto: ProveeduriaProductDto) {
    const [existing] = await db.select().from(products).where(and(eq(products.id, id), eq(products.area, 'proveeduria')))
    if (!existing) throw new NotFoundException(`Producto ${id} no encontrado`)
    const [p] = await db.update(products).set({
      name: dto.name,
      sellPrice: (dto.sellPrice ?? 0).toString(),
      costPrice: dto.costPrice != null ? dto.costPrice.toString() : existing.costPrice,
      stock: dto.stock ?? existing.stock,
      minStock: dto.minStock ?? existing.minStock,
      barcode: dto.barcode ?? existing.barcode,
      updatedAt: new Date(),
    }).where(eq(products.id, id)).returning()
    return p
  }

  async removeProduct(id: number) {
    const [p] = await db.update(products).set({ active: false }).where(and(eq(products.id, id), eq(products.area, 'proveeduria'))).returning()
    if (!p) throw new NotFoundException(`Producto ${id} no encontrado`)
    return p
  }

  // --- Ventas POS ---
  listSales() {
    return db.select().from(proveeduriaSales).orderBy(desc(proveeduriaSales.createdAt)).limit(30)
  }

  // Métricas para los cards: ventas de hoy, ticket promedio, más vendidos
  async stats() {
    const today = new Date().toISOString().slice(0, 10)
    const [v] = await db
      .select({
        count: sql<number>`count(*)::int`,
        total: sql<number>`coalesce(sum(${proveeduriaSales.total}), 0)::float`,
      })
      .from(proveeduriaSales)
      .where(sql`to_char(${proveeduriaSales.createdAt}, 'YYYY-MM-DD') = ${today}`)
    const top = await db
      .select({
        name: proveeduriaSaleItems.name,
        qty: sql<number>`sum(${proveeduriaSaleItems.quantity})::int`,
      })
      .from(proveeduriaSaleItems)
      .groupBy(proveeduriaSaleItems.name)
      .orderBy(sql`sum(${proveeduriaSaleItems.quantity}) desc`)
      .limit(5)
    const ventasHoy = v?.count ?? 0
    const totalHoy = v?.total ?? 0
    return { ventasHoy, totalHoy, ticketProm: ventasHoy ? totalHoy / ventasHoy : 0, top }
  }

  async checkout(dto: CheckoutDto, userId: number) {
    if (!dto.items?.length) throw new BadRequestException('El carrito está vacío')

    return db.transaction(async (tx) => {
      let total = 0
      const itemRows: { productId: number; name: string; quantity: number; price: string }[] = []

      for (const it of dto.items) {
        const [p] = await tx.select().from(products).where(and(
          eq(products.id, it.productId),
          eq(products.area, 'proveeduria'),
          eq(products.active, true),
        ))
        if (!p) throw new NotFoundException(`Producto ${it.productId} no encontrado`)

        const price = Number(p.sellPrice)
        total += price * it.quantity
        const [updated] = await tx.update(products)
          .set({ stock: sql`${products.stock} - ${it.quantity}`, updatedAt: new Date() })
          .where(and(
            eq(products.id, p.id),
            eq(products.area, 'proveeduria'),
            eq(products.active, true),
            sql`${products.stock} >= ${it.quantity}`,
          ))
          .returning({ newStock: products.stock })
        if (!updated) throw new BadRequestException(`Sin stock suficiente de ${p.name} (quedan ${p.stock})`)
        const newStock = updated.newStock

        await tx.insert(stockMovements).values({
          productId: p.id, userId, type: 'salida', quantity: it.quantity,
          previousStock: newStock + it.quantity, newStock, reason: 'Proveeduría venta',
        })
        itemRows.push({ productId: p.id, name: p.name, quantity: it.quantity, price: price.toString() })
      }

      const [sale] = await tx.insert(proveeduriaSales).values({ userId, total: total.toString() }).returning()
      await tx.insert(proveeduriaSaleItems).values(itemRows.map(r => ({ ...r, saleId: sale.id })))

      // Plata a la caja abierta (si hay)
      const [session] = await tx.select().from(cashSessions).where(and(eq(cashSessions.status, 'abierta'), eq(cashSessions.area, 'marina'))).limit(1)
      if (session) {
        await tx.insert(cashMovements).values({
          sessionId: session.id, userId, type: 'deposito',
          amount: total.toString(), reason: `Proveeduría venta #${sale.id}`,
        })
      }

      return { ...sale, items: itemRows }
    })
  }
}
