import { Injectable, NotFoundException } from '@nestjs/common'
import { db } from '../db'
import { suppliers, products } from '../db/schema'
import { eq, desc, ilike } from 'drizzle-orm'

@Injectable()
export class SuppliersService {
  async findAll(search?: string) {
    const query = db.select().from(suppliers).orderBy(desc(suppliers.createdAt))
    if (search) {
      return db.select().from(suppliers)
        .where(ilike(suppliers.name, `%${search}%`))
        .orderBy(desc(suppliers.createdAt))
    }
    return query
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
