import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common'
import { db } from '../db'
import { rentalSlots, rentalSlotItems, turneraConfig, storageUnits, storageServices, storageSpots, storageCategories, clients, cashSessions, cashMovements } from '../db/schema'
import { eq, and, gte, asc, sql, inArray, isNull } from 'drizzle-orm'
import { CreateSlotDto, TurneraConfigDto, PublicReserveDto, SlotItemDto } from './turnera.dto'

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
    // Guarda solo los dígitos del WhatsApp (o null si viene vacío)
    const wa = dto.whatsapp != null ? dto.whatsapp.replace(/\D/g, '') || null : undefined
    const [cfg] = await db.update(turneraConfig)
      .set({ intervalMin: dto.intervalMin, dayStart: dto.dayStart, dayEnd: dto.dayEnd, ...(wa !== undefined ? { whatsapp: wa } : {}), updatedAt: new Date() })
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
      .from(storageUnits).where(and(eq(storageUnits.id, dto.unitId), eq(storageUnits.status, 'en_guarderia')))
    if (!unit) throw new NotFoundException(`Lancha ${dto.unitId} no encontrada`)

    // El precio del turno es la suma de los servicios pedidos
    const items = dto.items ?? []
    await this.assertSlotServices(items)
    const total = items.reduce((s, it) => s + Number(it.amount), 0)

    return db.transaction(async (tx) => {
      // Serializa altas y reprogramaciones: dos pedidos simultáneos no pueden ocupar la misma rampa.
      await tx.select({ id: turneraConfig.id }).from(turneraConfig)
        .where(eq(turneraConfig.id, 1)).for('update')
      const sameDay = await tx.select().from(rentalSlots)
        .where(and(eq(rentalSlots.date, dto.date), eq(rentalSlots.status, 'reservado')))
      const overlap = sameDay.some(s => dto.startTime < s.endTime && dto.endTime > s.startTime)
      if (overlap) throw new ConflictException('Ya hay otra salida al agua en ese horario')

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

  // Correr un turno a otra fecha/hora. Solo turnos reservados; re-chequea encimado excluyendo el propio.
  async rescheduleSlot(id: number, date: string, startTime: string, endTime: string) {
    if (endTime <= startTime) throw new BadRequestException('La hora de fin debe ser posterior al inicio')

    return db.transaction(async (tx) => {
      await tx.select({ id: turneraConfig.id }).from(turneraConfig)
        .where(eq(turneraConfig.id, 1)).for('update')
      const [current] = await tx.select().from(rentalSlots).where(eq(rentalSlots.id, id))
      if (!current) throw new NotFoundException(`Turno ${id} no encontrado`)
      if (current.status !== 'reservado') throw new BadRequestException('Solo se pueden correr turnos reservados')

      const sameDay = await tx.select().from(rentalSlots)
        .where(and(eq(rentalSlots.date, date), eq(rentalSlots.status, 'reservado')))
      const overlap = sameDay.some(s => s.id !== id && startTime < s.endTime && endTime > s.startTime)
      if (overlap) throw new ConflictException('Ya hay otra salida al agua en ese horario')

      const [slot] = await tx.update(rentalSlots).set({ date, startTime, endTime }).where(eq(rentalSlots.id, id)).returning()
      return slot
    })
  }

  // Editar los servicios de un turno reservado: reemplaza la lista completa y recalcula el precio
  async updateSlotItems(id: number, items: SlotItemDto[]) {
    const [current] = await db.select().from(rentalSlots).where(eq(rentalSlots.id, id))
    if (!current) throw new NotFoundException(`Turno ${id} no encontrado`)
    if (current.status !== 'reservado') throw new BadRequestException('Solo se pueden editar turnos reservados')
    if (current.paidAt) throw new BadRequestException('El turno ya fue cobrado')

    await this.assertSlotServices(items)
    const total = items.reduce((s, it) => s + Number(it.amount), 0)
    return db.transaction(async (tx) => {
      await tx.delete(rentalSlotItems).where(eq(rentalSlotItems.slotId, id))
      if (items.length) {
        await tx.insert(rentalSlotItems).values(items.map((it) => ({
          slotId: id, serviceId: it.serviceId ?? null, concept: it.concept, amount: it.amount.toString(),
        })))
      }
      const [slot] = await tx.update(rentalSlots).set({ price: total.toString() }).where(eq(rentalSlots.id, id)).returning()
      return slot
    })
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
        .where(and(eq(rentalSlots.id, id), isNull(rentalSlots.paidAt))).returning()

      if (!slot) {
        const [current] = await tx.select().from(rentalSlots).where(eq(rentalSlots.id, id))
        return current ?? row
      }

      const [session] = await tx.select().from(cashSessions).where(and(eq(cashSessions.status, 'abierta'), eq(cashSessions.area, 'marina'))).limit(1)
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

  // ---------- Página pública del cliente (sin login, entra por link de WhatsApp) ----------

  // El teléfono se guarda con formato libre; comparamos solo los dígitos
  private normalizePhone(p: string) { return (p || '').replace(/\D/g, '') }

  private async assertSlotServices(items: SlotItemDto[]) {
    const ids = [...new Set(items.flatMap((item) => item.serviceId == null ? [] : [item.serviceId]))]
    if (!ids.length) return
    const valid = await db.select({ id: storageServices.id }).from(storageServices)
      .where(and(
        inArray(storageServices.id, ids),
        eq(storageServices.active, true),
        eq(storageServices.forSlot, true),
      ))
    if (valid.length !== ids.length) {
      throw new BadRequestException('Uno o más servicios no están habilitados para turnos')
    }
  }

  // Suma minutos a una hora 'HH:MM' y la devuelve formateada
  private addMinutes(hhmm: string, min: number) {
    const [h, m] = hhmm.split(':').map(Number)
    const total = h * 60 + m + min
    const nh = Math.floor(total / 60) % 24
    const nm = total % 60
    return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`
  }

  // Busca al cliente por teléfono entre los del pool de guardería. Devuelve solo SUS datos.
  private async findClientByPhone(phone: string) {
    const digits = this.normalizePhone(phone)
    if (digits.length < 6) throw new BadRequestException('Teléfono inválido')
    // Solo clientes que tienen lancha en guardería
    const rows = await db.selectDistinct({ id: clients.id, name: clients.name, phone: clients.phone })
      .from(clients).innerJoin(storageUnits, and(
        eq(storageUnits.clientId, clients.id),
        eq(storageUnits.status, 'en_guarderia'),
      ))
    const match = rows.find((c) => this.normalizePhone(c.phone ?? '') === digits)
    if (!match) throw new NotFoundException('No encontramos ese teléfono. Avisale a la marina para que lo cargue.')
    return match
  }

  // Ficha pública: las lanchas del cliente y sus próximos turnos. Sin plata.
  async publicIdentify(phone: string) {
    const client = await this.findClientByPhone(phone)
    const units = await db.select({ id: storageUnits.id, description: storageUnits.description, spotCode: storageSpots.code, launchRate: storageCategories.launchRate })
      .from(storageUnits)
      .leftJoin(storageSpots, eq(storageSpots.id, storageUnits.spotId))
      .leftJoin(storageCategories, eq(storageCategories.id, storageUnits.categoryId))
      .where(and(eq(storageUnits.clientId, client.id), eq(storageUnits.status, 'en_guarderia')))

    const today = new Date().toISOString().slice(0, 10)
    const mySlots = await db.select({
      id: rentalSlots.id, unitId: rentalSlots.unitId, boatName: storageUnits.description,
      date: rentalSlots.date, startTime: rentalSlots.startTime, endTime: rentalSlots.endTime, status: rentalSlots.status,
    }).from(rentalSlots).leftJoin(storageUnits, eq(storageUnits.id, rentalSlots.unitId))
      .where(and(eq(rentalSlots.clientId, client.id), gte(rentalSlots.date, today)))
      .orderBy(asc(rentalSlots.date), asc(rentalSlots.startTime))

    const items = await this.slotItems(mySlots.map((s) => s.id))
    return {
      client: { id: client.id, name: client.name },
      units,
      slots: mySlots.map((s) => ({ ...s, items: items.filter((it) => it.slotId === s.id) })),
    }
  }

  // Catálogo de servicios que el cliente puede pedir con el turno (batería, nafta, parrilla...)
  async publicServices() {
    return db.select({ id: storageServices.id, name: storageServices.name, price: storageServices.price })
      .from(storageServices)
      .where(and(eq(storageServices.active, true), eq(storageServices.forSlot, true)))
      .orderBy(asc(storageServices.name))
  }

  // Grilla del día para el cliente: SOLO qué franjas están ocupadas (anónimo, sin nombres)
  async publicSlots(date: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new BadRequestException('Fecha inválida (YYYY-MM-DD)')
    const rows = await db.select({ startTime: rentalSlots.startTime, endTime: rentalSlots.endTime })
      .from(rentalSlots)
      .where(and(eq(rentalSlots.date, date), eq(rentalSlots.status, 'reservado')))
      .orderBy(asc(rentalSlots.startTime))
    return { date, taken: rows }
  }

  // Reserva desde la página pública: verifica que la lancha sea del teléfono, precios del server
  async publicReserve(dto: PublicReserveDto) {
    const client = await this.findClientByPhone(dto.phone)

    // La lancha tiene que ser de ESE cliente (no confiamos en el unitId a secas)
    const [unit] = await db.select({ id: storageUnits.id, launchRate: storageCategories.launchRate })
      .from(storageUnits)
      .leftJoin(storageCategories, eq(storageCategories.id, storageUnits.categoryId))
      .where(and(
        eq(storageUnits.id, dto.unitId),
        eq(storageUnits.clientId, client.id),
        eq(storageUnits.status, 'en_guarderia'),
      ))
    if (!unit) throw new ForbiddenException('Esa lancha no está a tu nombre')

    const cfg = await this.getConfig()
    if (dto.startTime < cfg.dayStart || dto.startTime >= cfg.dayEnd) throw new BadRequestException('Ese horario está fuera del día')
    const endTime = this.addMinutes(dto.startTime, cfg.intervalMin)

    // Los precios salen del catálogo del server, no del cliente
    const ids = [...new Set(dto.serviceIds ?? [])]
    // forSlot: un servicio mensual (ej. seguro) no se puede colar por turno aunque manden el id
    const svcs = ids.length ? await db.select().from(storageServices)
      .where(and(inArray(storageServices.id, ids), eq(storageServices.active, true), eq(storageServices.forSlot, true))) : []
    if (svcs.length !== ids.length) throw new BadRequestException('Uno o más servicios no están disponibles para turnos')
    // El turno arranca con la tarifa de salida al agua de la categoría de la lancha
    const launch = Number(unit.launchRate ?? 0)
    const total = launch + svcs.reduce((s, v) => s + Number(v.price), 0)

    return db.transaction(async (tx) => {
      await tx.select({ id: turneraConfig.id }).from(turneraConfig)
        .where(eq(turneraConfig.id, 1)).for('update')
      const sameDay = await tx.select().from(rentalSlots)
        .where(and(eq(rentalSlots.date, dto.date), eq(rentalSlots.status, 'reservado')))
      const overlap = sameDay.some((s) => dto.startTime < s.endTime && endTime > s.startTime)
      if (overlap) throw new ConflictException('Ese turno ya está ocupado, elegí otro')

      const [slot] = await tx.insert(rentalSlots).values({
        unitId: dto.unitId, clientId: client.id, userId: null,
        date: dto.date, startTime: dto.startTime, endTime,
        price: total.toString(),
        notes: 'Reservado por el cliente',
      }).returning()

      const rows = [
        ...(launch > 0 ? [{ slotId: slot.id, serviceId: null, concept: 'Salida al agua', amount: launch.toString() }] : []),
        ...svcs.map((v) => ({ slotId: slot.id, serviceId: v.id, concept: v.name, amount: v.price })),
      ]
      if (rows.length) await tx.insert(rentalSlotItems).values(rows)
      return { id: slot.id, date: slot.date, startTime: slot.startTime, endTime: slot.endTime, total }
    })
  }
}
