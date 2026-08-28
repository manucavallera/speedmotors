import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { db } from '../db'
import { resaleConsignments, resellers, vehicles } from '../db/schema'

@Injectable()
export class ResalesService {
  async list() {
    const rows = await db.select({ reseller: resellers, consignment: resaleConsignments, vehicle: vehicles })
      .from(resellers)
      .leftJoin(resaleConsignments, eq(resaleConsignments.resellerId, resellers.id))
      .leftJoin(vehicles, eq(resaleConsignments.vehicleId, vehicles.id))
      .orderBy(desc(resellers.createdAt), desc(resaleConsignments.deliveredAt))
    return resellersFromRows(rows)
  }

  async createReseller(data: { name: string; phone?: string; notes?: string }) {
    const name = data.name.trim()
    if (!name) throw new BadRequestException('El nombre del reventa es obligatorio')
    const [row] = await db.insert(resellers).values({ name, phone: data.phone?.trim() || null, notes: data.notes?.trim() || null }).returning()
    return row
  }

  async consign(data: { resellerId: number; vehicleId: number; agreedPrice: number; deliveredAt?: string }) {
    return db.transaction(async tx => {
      const [vehicle] = await tx.select().from(vehicles).where(eq(vehicles.id, data.vehicleId))
      if (!vehicle) throw new NotFoundException('Moto no encontrada')
      if (vehicle.type !== 'moto' || vehicle.status !== 'disponible') throw new BadRequestException('Solo se pueden consignar motos disponibles')
      const [reseller] = await tx.select().from(resellers).where(eq(resellers.id, data.resellerId))
      if (!reseller) throw new NotFoundException('Reventa no encontrado')
      const [active] = await tx.select().from(resaleConsignments).where(and(eq(resaleConsignments.vehicleId, data.vehicleId), isNull(resaleConsignments.soldAt)))
      if (active) throw new BadRequestException('La moto ya está consignada')
      const [consignment] = await tx.insert(resaleConsignments).values({ resellerId: data.resellerId, vehicleId: data.vehicleId, agreedPrice: data.agreedPrice.toString(), deliveredAt: data.deliveredAt || new Date().toISOString().slice(0, 10) }).returning()
      await tx.update(vehicles).set({ status: 'reventa', updatedAt: new Date() }).where(eq(vehicles.id, data.vehicleId))
      return consignment
    })
  }

  async registerSale(id: number, data: { soldPrice: number; soldAt?: string }) {
    return db.transaction(async tx => {
      const [consignment] = await tx.select().from(resaleConsignments).where(eq(resaleConsignments.id, id))
      if (!consignment) throw new NotFoundException('Consignación no encontrada')
      if (consignment.soldAt) throw new BadRequestException('La consignación ya fue vendida')
      const [updated] = await tx.update(resaleConsignments).set({ soldPrice: data.soldPrice.toString(), soldAt: data.soldAt || new Date().toISOString().slice(0, 10) }).where(eq(resaleConsignments.id, id)).returning()
      await tx.update(vehicles).set({ status: 'vendido', updatedAt: new Date() }).where(eq(vehicles.id, consignment.vehicleId))
      return updated
    })
  }
}

type ResaleRow = { reseller: typeof resellers.$inferSelect; consignment: typeof resaleConsignments.$inferSelect | null; vehicle: typeof vehicles.$inferSelect | null }
type ResellerWithConsignments = typeof resellers.$inferSelect & { consignments: Array<typeof resaleConsignments.$inferSelect & { vehicle: typeof vehicles.$inferSelect | null }> }

function resellersFromRows(rows: ResaleRow[]): ResellerWithConsignments[] {
  const map = new Map<number, ResellerWithConsignments>()
  for (const row of rows) {
    let item = map.get(row.reseller.id)
    if (!item) { item = { ...row.reseller, consignments: [] }; map.set(row.reseller.id, item) }
    if (row.consignment) item.consignments.push({ ...row.consignment, vehicle: row.vehicle })
  }
  return [...map.values()]
}
