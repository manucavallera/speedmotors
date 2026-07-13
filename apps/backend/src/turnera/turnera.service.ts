import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common'
import { db } from '../db'
import { rentalSlots, rentalSlotItems, turneraConfig, storageUnits, clients, cashSessions, cashMovements } from '../db/schema'
import { eq, and, asc, sql, inArray } from 'drizzle-orm'
import { CreateSlotDto, TurneraConfigDto } from './turnera.dto'

@Injectable()
export class TurneraService {
  // Config de la grilla (fila única). Vive en el server: la usan el panel y la página del cliente.
  async getConfig() {
    const [cfg] = await db.select().from(turneraConfig).where(eq(turneraConfig.id, 1))
    if (cfg) return cfg
    const [created] = await db.insert(turneraConfig).values({ id: 1 }).returning()
    return created
  }

  async setConfig(dto: TurneraConfigDto) {
    if (dto.dayEnd <= dto.dayStart) throw new BadRequestException('El cierre tiene que ser posterior a la apertura')
    const [cfg] = await db.update(turneraConfig)
      .set({ intervalMin: dto.intervalMin, dayStart: dto.dayStart, dayEnd: dto.dayEnd, updatedAt: new Date() })
      .where(eq(turneraConfig.id, 1)).returning()
    if (!cfg) throw new NotFoundException('Config de turnera no encontrada')
    return cfg
  }

  // Salidas al agua de un día: lancha de guardería + cliente + servicios pedidos
  async listSlots(date: string) {
    const slots = await db
      .select({
        id: rentalSlots.id,
        unitId: rentalSlots.unitId,
        boatName: storageUnits.description,
        clientId: rentalSlots.clientId,
        clientName: clients.name,
        date: rentalSlots.date,
        startTime: rentalSlots.startTime,
        endTime: rentalSlots.endTime,
        price: rentalSlots.price,
        status: rentalSlots.status,
        paidAt: rentalSlots.paidAt,
        notes: rentalSlots.notes,
      })
      .from(rentalSlots)
      .leftJoin(storageUnits, eq(storageUnits.id, rentalSlots.unitId))
      .leftJoin(clients, eq(clients.id, rentalSlots.clientId))
      .where(eq(rentalSlots.date, date))
      .orderBy(asc(rentalSlots.startTime))

    const items = await this.slotItems(slots.map((s) => s.id))
    return slots.map((s) => ({ ...s, items: items.filter((it) => it.slotId === s.id) }))
  }

  // Resumen del mes para el calendario: por día, cuántas salidas y cuánto se cobró
  async monthSummary(month: string) {
    // month = 'YYYY-MM' → matchea las fechas de ese mes
    return db
      .select({
        date: rentalSlots.date,
        reserved: sql<number>`count(*) filter (where ${rentalSlots.status} <> 'cancelado')::int`,
        cobrado: sql<number>`coalesce(sum(${rentalSlots.price}) filter (where ${rentalSlots.paidAt} is not null), 0)::float`,
      })
      .from(rentalSlots)
      .where(sql`to_char(${rentalSlots.date}, 'YYYY-MM') = ${month}`)
      .groupBy(rentalSlots.date)
  }

  async createSlot(dto: CreateSlotDto, userId: number) {
    if (dto.endTime <= dto.startTime) throw new BadRequestException('La hora de fin debe ser posterior al inicio')

    // El cliente sale de la lancha de guardería
    const [unit] = await db.select({ id: storageUnits.id, clientId: storageUnits.clientId })
      .from(storageUnits).where(eq(storageUnits.id, dto.unitId))
    if (!unit) throw new NotFoundException(`Lancha ${dto.unitId} no encontrada`)

    // No encimar botaduras: la rampa es compartida, una a la vez en cada franja
    const sameDay = await db.select().from(rentalSlots)
      .where(and(eq(rentalSlots.date, dto.date), eq(rentalSlots.status, 'reservado')))
    const overlap = sameDay.some(s => dto.startTime < s.endTime && dto.endTime > s.startTime)
    if (overlap) throw new ConflictException('Ya hay otra salida al agua en ese horario')

    // El precio del turno es la suma de los servicios pedidos
    const items = dto.items ?? []
    const total = items.reduce((s, it) => s + Number(it.amount), 0)

    return db.transaction(async (tx) => {
      const [slot] = await tx.insert(rentalSlots).values({
        unitId: dto.unitId,
        clientId: unit.clientId,
        userId,
        date: dto.date,
        startTime: dto.startTime,
        endTime: dto.endTime,
        price: total.toString(),
        notes: dto.notes ?? null,
      }).returning()

      if (items.length) {
        await tx.insert(rentalSlotItems).values(items.map((it) => ({
          slotId: slot.id,
          serviceId: it.serviceId ?? null,
          concept: it.concept,
          amount: it.amount.toString(),
        })))
      }
      return slot
    })
  }

  // Servicios pedidos en cada turno de un día, para mostrarlos en la grilla
  async slotItems(slotIds: number[]) {
    if (!slotIds.length) return []
    return db.select().from(rentalSlotItems).where(inArray(rentalSlotItems.slotId, slotIds))
  }

  async setStatus(id: number, status: 'reservado' | 'cancelado' | 'completado') {
    const [slot] = await db.update(rentalSlots).set({ status }).where(eq(rentalSlots.id, id)).returning()
    if (!slot) throw new NotFoundException(`Turno ${id} no encontrado`)
    return slot
  }

  async removeSlot(id: number) {
    const [slot] = await db.delete(rentalSlots).where(eq(rentalSlots.id, id)).returning()
    if (!slot) throw new NotFoundException(`Turno ${id} no encontrado`)
    return slot
  }

  // Cobrar el servicio de la botadura: marca pagado, completa, plata a la caja abierta
  async chargeSlot(id: number, userId: number) {
    const [row] = await db
      .select({ id: rentalSlots.id, price: rentalSlots.price, paidAt: rentalSlots.paidAt, clientName: clients.name, boatName: storageUnits.description })
      .from(rentalSlots)
      .leftJoin(clients, eq(clients.id, rentalSlots.clientId))
      .leftJoin(storageUnits, eq(storageUnits.id, rentalSlots.unitId))
      .where(eq(rentalSlots.id, id))
    if (!row) throw new NotFoundException(`Turno ${id} no encontrado`)
    if (row.paidAt) return row

    return db.transaction(async (tx) => {
      const [slot] = await tx.update(rentalSlots)
        .set({ paidAt: new Date(), status: 'completado' })
        .where(eq(rentalSlots.id, id)).returning()

      const [session] = await tx.select().from(cashSessions).where(eq(cashSessions.status, 'abierta')).limit(1)
      if (session) {
        await tx.insert(cashMovements).values({
          sessionId: session.id, userId, type: 'deposito',
          amount: Number(row.price).toString(),
          reason: `Salida al agua — ${row.clientName ?? 'sin cliente'} · ${row.boatName ?? ''}`,
        })
      }
      return slot
    })
  }
}
