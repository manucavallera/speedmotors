import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { db } from '../db'
import { storageSpots, storageUnits, storageCharges, storageChargeItems, storageServices, clients, cashSessions, cashMovements } from '../db/schema'
import { eq, and, desc, asc, sql, isNull, inArray } from 'drizzle-orm'
import { CreateSpotsDto, CreateUnitDto, ChargeDto, ServiceDto } from './guarderia.dto'

@Injectable()
export class GuarderiaService {
  // Vista por lugares: cada lugar con su ocupante actual y deuda
  async mapa() {
    const debt = sql<number>`coalesce((select sum(amount) from storage_charges sc where sc.storage_unit_id = ${storageUnits.id} and sc.paid_at is null), 0)::float`
    const rows = await db
      .select({
        spotId: storageSpots.id,
        code: storageSpots.code,
        label: storageSpots.label,
        active: storageSpots.active,
        unitId: storageUnits.id,
        description: storageUnits.description,
        rate: storageUnits.rate,
        entryDate: storageUnits.entryDate,
        clientId: clients.id,
        clientName: clients.name,
        debt,
      })
      .from(storageSpots)
      .leftJoin(storageUnits, and(eq(storageUnits.spotId, storageSpots.id), eq(storageUnits.status, 'en_guarderia')))
      .leftJoin(clients, eq(clients.id, storageUnits.clientId))
      .orderBy(asc(storageSpots.code))

    return rows.map((r) => ({
      spotId: r.spotId,
      code: r.code,
      label: r.label,
      active: r.active,
      occupied: r.unitId != null,
      debt: r.debt ?? 0,
      unit: r.unitId == null ? null : {
        id: r.unitId,
        description: r.description,
        rate: Number(r.rate),
        entryDate: r.entryDate,
        clientId: r.clientId,
        clientName: r.clientName,
      },
    }))
  }

  // --- Lugares ---
  listSpots() {
    return db.select().from(storageSpots).orderBy(asc(storageSpots.code))
  }

  async createSpots(dto: CreateSpotsDto) {
    const codes = dto.codes.map((c) => c.trim().toUpperCase()).filter(Boolean)
    if (!codes.length) return []
    return db.insert(storageSpots).values(codes.map((code) => ({ code }))).onConflictDoNothing().returning()
  }

  // --- Unidades guardadas ---
  async listUnits(status?: string) {
    const where = status ? eq(storageUnits.status, status as any) : undefined
    return db
      .select({
        id: storageUnits.id,
        description: storageUnits.description,
        rate: storageUnits.rate,
        entryDate: storageUnits.entryDate,
        exitDate: storageUnits.exitDate,
        status: storageUnits.status,
        clientId: clients.id,
        clientName: clients.name,
        spotId: storageSpots.id,
        spotCode: storageSpots.code,
      })
      .from(storageUnits)
      .leftJoin(clients, eq(clients.id, storageUnits.clientId))
      .leftJoin(storageSpots, eq(storageSpots.id, storageUnits.spotId))
      .where(where)
      .orderBy(desc(storageUnits.createdAt))
  }

  async getUnit(id: number) {
    const [unit] = await db
      .select({
        id: storageUnits.id,
        description: storageUnits.description,
        rate: storageUnits.rate,
        entryDate: storageUnits.entryDate,
        exitDate: storageUnits.exitDate,
        status: storageUnits.status,
        notes: storageUnits.notes,
        clientId: clients.id,
        clientName: clients.name,
        spotId: storageSpots.id,
        spotCode: storageSpots.code,
      })
      .from(storageUnits)
      .leftJoin(clients, eq(clients.id, storageUnits.clientId))
      .leftJoin(storageSpots, eq(storageSpots.id, storageUnits.spotId))
      .where(eq(storageUnits.id, id))
    if (!unit) throw new NotFoundException(`Unidad ${id} no encontrada`)

    const charges = await db.select().from(storageCharges)
      .where(eq(storageCharges.storageUnitId, id))
      .orderBy(desc(storageCharges.chargeDate))
    // Detalle (cuna + servicios) de cada cobro
    const ids = charges.map((c) => c.id)
    const items = ids.length
      ? await db.select().from(storageChargeItems).where(inArray(storageChargeItems.chargeId, ids))
      : []
    const charged = charges.map((c) => ({ ...c, items: items.filter((it) => it.chargeId === c.id) }))
    const debt = charges.filter((c) => !c.paidAt).reduce((s, c) => s + Number(c.amount), 0)
    return { ...unit, charges: charged, debt }
  }

  async createUnit(dto: CreateUnitDto) {
    return db.transaction(async (tx) => {
      // El lugar no puede estar ya ocupado por otra unidad activa
      if (dto.spotId) {
        const [busy] = await tx.select({ id: storageUnits.id }).from(storageUnits)
          .where(and(eq(storageUnits.spotId, dto.spotId), eq(storageUnits.status, 'en_guarderia')))
        if (busy) throw new ConflictException('Ese lugar ya está ocupado')
      }
      const [u] = await tx.insert(storageUnits).values({
        clientId: dto.clientId,
        spotId: dto.spotId ?? null,
        description: dto.description,
        rate: (dto.rate ?? 0).toString(),
        entryDate: dto.entryDate ? new Date(dto.entryDate) : new Date(),
        notes: dto.notes ?? null,
      }).returning()
      return u
    })
  }

  async retireUnit(id: number) {
    const [existing] = await db.select().from(storageUnits).where(eq(storageUnits.id, id))
    if (!existing) throw new NotFoundException(`Unidad ${id} no encontrada`)
    const [u] = await db.update(storageUnits)
      .set({ status: 'retirada', exitDate: new Date(), spotId: null })
      .where(eq(storageUnits.id, id)).returning()
    return u
  }

  async charge(unitId: number, dto: ChargeDto, userId: number) {
    const [unit] = await db
      .select({ id: storageUnits.id, description: storageUnits.description, clientName: clients.name })
      .from(storageUnits)
      .leftJoin(clients, eq(clients.id, storageUnits.clientId))
      .where(eq(storageUnits.id, unitId))
    if (!unit) throw new NotFoundException(`Unidad ${unitId} no encontrada`)

    // El total del cobro es la suma de los ítems (cuna mensual + servicios anexos)
    const total = dto.items.reduce((s, it) => s + Number(it.amount), 0)
    return db.transaction(async (tx) => {
      const [c] = await tx.insert(storageCharges).values({
        storageUnitId: unitId,
        userId,
        amount: total.toString(),
        periodLabel: dto.periodLabel ?? null,
        paidAt: dto.paid ? new Date() : null,
        notes: dto.notes ?? null,
      }).returning()
      await tx.insert(storageChargeItems).values(dto.items.map((it) => ({
        chargeId: c.id,
        concept: it.concept,
        amount: it.amount.toString(),
        serviceId: it.serviceId ?? null,
      })))
      // Si se cobró en el momento, la plata entra a la caja abierta
      if (dto.paid) await this.depositToCaja(tx, total, userId, this.cajaReason(unit.clientName, dto.periodLabel))
      return c
    })
  }

  // Saldar una deuda pendiente: la marca pagada y la plata entra a la caja abierta
  async payCharge(chargeId: number, userId: number) {
    const [row] = await db
      .select({ id: storageCharges.id, amount: storageCharges.amount, periodLabel: storageCharges.periodLabel, paidAt: storageCharges.paidAt, clientName: clients.name })
      .from(storageCharges)
      .leftJoin(storageUnits, eq(storageUnits.id, storageCharges.storageUnitId))
      .leftJoin(clients, eq(clients.id, storageUnits.clientId))
      .where(eq(storageCharges.id, chargeId))
    if (!row) throw new NotFoundException(`Cobro ${chargeId} no encontrado`)
    if (row.paidAt) return row

    return db.transaction(async (tx) => {
      const [c] = await tx.update(storageCharges)
        .set({ paidAt: new Date() })
        .where(and(eq(storageCharges.id, chargeId), isNull(storageCharges.paidAt)))
        .returning()
      await this.depositToCaja(tx, Number(row.amount), userId, this.cajaReason(row.clientName, row.periodLabel))
      return c ?? row
    })
  }

  // --- Catálogo de servicios anexos ---
  listServices(all = false) {
    const where = all ? undefined : eq(storageServices.active, true)
    return db.select().from(storageServices).where(where).orderBy(asc(storageServices.name))
  }

  async createService(dto: ServiceDto) {
    const [s] = await db.insert(storageServices).values({
      name: dto.name,
      price: (dto.price ?? 0).toString(),
    }).returning()
    return s
  }

  async updateService(id: number, dto: ServiceDto) {
    const [s] = await db.update(storageServices).set({
      name: dto.name,
      price: (dto.price ?? 0).toString(),
      ...(dto.active != null ? { active: dto.active } : {}),
    }).where(eq(storageServices.id, id)).returning()
    if (!s) throw new NotFoundException(`Servicio ${id} no encontrado`)
    return s
  }

  async removeService(id: number) {
    const [s] = await db.update(storageServices).set({ active: false }).where(eq(storageServices.id, id)).returning()
    if (!s) throw new NotFoundException(`Servicio ${id} no encontrado`)
    return s
  }

  private cajaReason(clientName: string | null, periodLabel?: string | null) {
    return `Guardería — ${clientName ?? 'sin cliente'}${periodLabel ? ` · ${periodLabel}` : ''}`
  }

  // Inserta un depósito en la caja abierta (si hay). Si no hay caja abierta, el cobro igual queda registrado.
  private async depositToCaja(tx: any, amount: number, userId: number, reason: string) {
    const [session] = await tx.select().from(cashSessions).where(eq(cashSessions.status, 'abierta')).limit(1)
    if (!session) return
    await tx.insert(cashMovements).values({
      sessionId: session.id,
      userId,
      type: 'deposito',
      amount: amount.toString(),
      reason,
    })
  }
}
