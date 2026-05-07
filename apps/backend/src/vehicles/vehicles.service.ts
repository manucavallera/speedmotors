import { Injectable, NotFoundException } from '@nestjs/common'
import { db } from '../db'
import { vehicles } from '../db/schema'
import { eq, and, ilike, sql } from 'drizzle-orm'

@Injectable()
export class VehiclesService {
  async findAll(filters?: { type?: 'moto' | 'lancha'; status?: string; search?: string; page?: number; limit?: number }) {
    const page = filters?.page ?? 1
    const limit = filters?.limit ?? 100
    const offset = (page - 1) * limit

    const conditions = []
    if (filters?.type) conditions.push(eq(vehicles.type, filters.type))
    if (filters?.status) conditions.push(eq(vehicles.status, filters.status as any))
    if (filters?.search) conditions.push(ilike(vehicles.model, `%${filters.search}%`))

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [items, countResult] = await Promise.all([
      where
        ? db.select().from(vehicles).where(where).limit(limit).offset(offset)
        : db.select().from(vehicles).limit(limit).offset(offset),
      where
        ? db.select({ count: sql<number>`count(*)::int` }).from(vehicles).where(where)
        : db.select({ count: sql<number>`count(*)::int` }).from(vehicles),
    ])
    const total = countResult[0]?.count ?? 0
    return { items, total, page, limit, pages: Math.ceil(total / limit) }
  }

  async findOne(id: number) {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id))
    if (!vehicle) throw new NotFoundException(`Vehículo ${id} no encontrado`)
    return vehicle
  }

  async findByChassis(chassisNumber: string) {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.chassisNumber, chassisNumber))
    return vehicle
  }

  async create(data: typeof vehicles.$inferInsert) {
    const [vehicle] = await db.insert(vehicles).values(data).returning()
    return vehicle
  }

  async update(id: number, data: Partial<typeof vehicles.$inferInsert>) {
    const [vehicle] = await db
      .update(vehicles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(vehicles.id, id))
      .returning()
    if (!vehicle) throw new NotFoundException(`Vehículo ${id} no encontrado`)
    return vehicle
  }

  async updateStatus(id: number, status: 'disponible' | 'reservado' | 'vendido') {
    return this.update(id, { status })
  }

  async remove(id: number) {
    const [vehicle] = await db.delete(vehicles).where(eq(vehicles.id, id)).returning()
    if (!vehicle) throw new NotFoundException(`Vehículo ${id} no encontrado`)
    return vehicle
  }
}
