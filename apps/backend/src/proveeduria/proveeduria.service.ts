import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { db } from '../db'
import { products, stockMovements, proveeduriaSales, proveeduriaSaleItems, cashSessions, cashMovements } from '../db/schema'
import { eq, and, ilike, or, desc } from 'drizzle-orm'
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
    return db.select().from(proveeduriaSales).orderBy(desc(proveeduriaSales.createdAt)).limit(100)
  }

  async checkout(dto: CheckoutDto, userId: number) {
    if (!dto.items?.length) throw new BadRequestException('El carrito está vacío')

    return db.transaction(async (tx) => {
      let total = 0
      const itemRows: { productId: number; name: string; quantity: number; price: string }[] = []

      for (const it of dto.items) {
        const [p] = await tx.select().from(products).where(and(eq(products.id, it.productId), eq(products.area, 'proveeduria')))
        if (!p) throw new NotFoundException(`Producto ${it.productId} no encontrado`)
        if (p.stock < it.quantity) throw new BadRequestException(`Sin stock suficiente de ${p.name} (quedan ${p.stock})`)

        const price = Number(p.sellPrice)
        total += price * it.quantity
        const newStock = p.stock - it.quantity

        await tx.update(products).set({ stock: newStock, updatedAt: new Date() }).where(eq(products.id, p.id))
        await tx.insert(stockMovements).values({
          productId: p.id, userId, type: 'salida', quantity: it.quantity,
          previousStock: p.stock, newStock, reason: 'Proveeduría venta',
        })
        itemRows.push({ productId: p.id, name: p.name, quantity: it.quantity, price: price.toString() })
      }

      const [sale] = await tx.insert(proveeduriaSales).values({ userId, total: total.toString() }).returning()
      await tx.insert(proveeduriaSaleItems).values(itemRows.map(r => ({ ...r, saleId: sale.id })))

      // Plata a la caja abierta (si hay)
      const [session] = await tx.select().from(cashSessions).where(eq(cashSessions.status, 'abierta')).limit(1)
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
