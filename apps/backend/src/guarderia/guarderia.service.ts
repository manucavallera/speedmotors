import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common'
import { db } from '../db'
import { storageSpots, storageUnits, storageCharges, storageChargeItems, storageServices, storageCategories, storageUnitServices, rentalSlots, clients, cashSessions, cashMovements } from '../db/schema'
import { eq, and, desc, asc, sql, isNull, inArray } from 'drizzle-orm'
import { CreateSpotsDto, CreateUnitDto, ChargeDto, ServiceDto, CategoryDto } from './guarderia.dto'

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
        hp: storageUnits.hp,
        entryDate: storageUnits.entryDate,
        categoryName: storageCategories.name,
        clientId: clients.id,
        clientName: clients.name,
        clientPhone: clients.phone,
        debt,
      })
      .from(storageSpots)
      .leftJoin(storageUnits, and(eq(storageUnits.spotId, storageSpots.id), eq(storageUnits.status, 'en_guarderia')))
      .leftJoin(clients, eq(clients.id, storageUnits.clientId))
      .leftJoin(storageCategories, eq(storageCategories.id, storageUnits.categoryId))
      .orderBy(this.spotOrder)

    return rows.map((r) => ({
      spotId: r.spotId,
      code: r.code,
      // Línea del galpón (A/B/C/D): es la letra del código de cuna
      line: r.code.charAt(0),
      label: r.label,
      active: r.active,
      occupied: r.unitId != null,
      debt: r.debt ?? 0,
      unit: r.unitId == null ? null : {
        id: r.unitId,
        description: r.description,
        rate: Number(r.rate),
        hp: r.hp,
        categoryName: r.categoryName,
        entryDate: r.entryDate,
        clientId: r.clientId,
        clientName: r.clientName,
        clientPhone: r.clientPhone,
      },
    }))
  }

  // Orden natural de cunas: primero la línea (A..D), después el número (A2 antes que A10)
  private readonly spotOrder = sql`substring(${storageSpots.code} from '^[A-Z]+'), (substring(${storageSpots.code} from '[0-9]+$'))::int`

  // Métricas para los cards de la página
  async stats() {
    const month = new Date().toISOString().slice(0, 7)
    const [r] = await db
      .select({
        ingresosMes: sql<number>`coalesce(sum(${storageCharges.amount}) filter (where ${storageCharges.paidAt} is not null and to_char(${storageCharges.paidAt}, 'YYYY-MM') = ${month}), 0)::float`,
      })
      .from(storageCharges)
    return { ingresosMes: r?.ingresosMes ?? 0 }
  }

  // --- Lugares ---
  listSpots() {
    return db.select().from(storageSpots).orderBy(this.spotOrder)
  }

  async createSpots(dto: CreateSpotsDto) {
    const codes = dto.codes.map((c) => c.trim().toUpperCase()).filter(Boolean)
    if (!codes.length) return []
    return db.insert(storageSpots).values(codes.map((code) => ({ code }))).onConflictDoNothing().returning()
  }

  // --- Unidades guardadas ---
  async listUnits(status?: string) {
    const where = status ? eq(storageUnits.status, status as any) : undefined
    const debt = sql<number>`coalesce((select sum(amount) from storage_charges sc where sc.storage_unit_id = ${storageUnits.id} and sc.paid_at is null), 0)::float`
    return db
      .select({
        id: storageUnits.id,
        description: storageUnits.description,
        rate: storageUnits.rate,
        hp: storageUnits.hp,
        lengthM: storageUnits.lengthM,
        categoryId: storageCategories.id,
        categoryName: storageCategories.name,
        entryDate: storageUnits.entryDate,
        exitDate: storageUnits.exitDate,
        status: storageUnits.status,
        clientId: clients.id,
        clientName: clients.name,
        spotId: storageSpots.id,
        spotCode: storageSpots.code,
        debt,
      })
      .from(storageUnits)
      .leftJoin(clients, eq(clients.id, storageUnits.clientId))
      .leftJoin(storageSpots, eq(storageSpots.id, storageUnits.spotId))
      .leftJoin(storageCategories, eq(storageCategories.id, storageUnits.categoryId))
      .where(where)
      .orderBy(desc(storageUnits.createdAt))
  }

  async getUnit(id: number) {
    const [unit] = await db
      .select({
        id: storageUnits.id,
        description: storageUnits.description,
        rate: storageUnits.rate,
        hp: storageUnits.hp,
        lengthM: storageUnits.lengthM,
        categoryId: storageCategories.id,
        categoryName: storageCategories.name,
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
      .leftJoin(storageCategories, eq(storageCategories.id, storageUnits.categoryId))
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

    // Servicios fijos contratados (seguros): entran en el cobro de todos los meses
    const fixedServices = await db
      .select({ id: storageServices.id, name: storageServices.name, price: storageServices.price })
      .from(storageUnitServices)
      .innerJoin(storageServices, eq(storageServices.id, storageUnitServices.serviceId))
      .where(eq(storageUnitServices.unitId, id))

    return { ...unit, charges: charged, debt, fixedServices }
  }

  async createUnit(dto: CreateUnitDto) {
    return db.transaction(async (tx) => {
      // El lugar no puede estar ya ocupado por otra unidad activa
      if (dto.spotId) {
        const [busy] = await tx.select({ id: storageUnits.id }).from(storageUnits)
          .where(and(eq(storageUnits.spotId, dto.spotId), eq(storageUnits.status, 'en_guarderia')))
        if (busy) throw new ConflictException('Ese lugar ya está ocupado')
      }
      // Sin tarifa explícita, se hereda la mensual de la categoría
      let rate = dto.rate
      if (rate == null && dto.categoryId) {
        const [cat] = await tx.select({ monthlyRate: storageCategories.monthlyRate })
          .from(storageCategories).where(eq(storageCategories.id, dto.categoryId))
        if (!cat) throw new NotFoundException(`Categoría ${dto.categoryId} no encontrada`)
        rate = Number(cat.monthlyRate)
      }
      const [u] = await tx.insert(storageUnits).values({
        clientId: dto.clientId,
        spotId: dto.spotId ?? null,
        categoryId: dto.categoryId ?? null,
        description: dto.description,
        hp: dto.hp ?? null,
        lengthM: dto.lengthM != null ? dto.lengthM.toString() : null,
        rate: (rate ?? 0).toString(),
        entryDate: dto.entryDate ? new Date(dto.entryDate) : new Date(),
        notes: dto.notes ?? null,
      }).returning()
      return u
    })
  }

  // Mover una lancha a otra cuna. spotId null = queda suelta sobre trailer.
  async moveUnit(id: number, spotId: number | null) {
    return db.transaction(async (tx) => {
      const [unit] = await tx.select().from(storageUnits).where(eq(storageUnits.id, id))
      if (!unit) throw new NotFoundException(`Unidad ${id} no encontrada`)
      if (unit.status !== 'en_guarderia') throw new ConflictException('La unidad no está en guardería')

      if (spotId != null) {
        const [spot] = await tx.select().from(storageSpots).where(eq(storageSpots.id, spotId))
        if (!spot) throw new NotFoundException(`Cuna ${spotId} no encontrada`)
        if (!spot.active) throw new ConflictException(`La cuna ${spot.code} no está operativa`)
        const [busy] = await tx.select({ id: storageUnits.id }).from(storageUnits)
          .where(and(eq(storageUnits.spotId, spotId), eq(storageUnits.status, 'en_guarderia')))
        if (busy && busy.id !== id) throw new ConflictException(`La cuna ${spot.code} ya está ocupada`)
      }

      const [u] = await tx.update(storageUnits).set({ spotId })
        .where(eq(storageUnits.id, id)).returning()
      return u
    })
  }

  // Ficha del cliente de guardería: sus lanchas, su deuda, sus cobros y sus salidas al agua
  async clientFile(clientId: number) {
    const [client] = await db
      .select({ id: clients.id, name: clients.name, phone: clients.phone, email: clients.email })
      .from(clients).where(eq(clients.id, clientId))
    if (!client) throw new NotFoundException(`Cliente ${clientId} no encontrado`)

    const units = await db
      .select({
        id: storageUnits.id,
        description: storageUnits.description,
        hp: storageUnits.hp,
        lengthM: storageUnits.lengthM,
        rate: storageUnits.rate,
        status: storageUnits.status,
        entryDate: storageUnits.entryDate,
        spotCode: storageSpots.code,
        categoryName: storageCategories.name,
      })
      .from(storageUnits)
      .leftJoin(storageSpots, eq(storageSpots.id, storageUnits.spotId))
      .leftJoin(storageCategories, eq(storageCategories.id, storageUnits.categoryId))
      .where(eq(storageUnits.clientId, clientId))
      .orderBy(desc(storageUnits.createdAt))

    const unitIds = units.map((u) => u.id)

    const charges = unitIds.length
      ? await db
          .select({
            id: storageCharges.id,
            storageUnitId: storageCharges.storageUnitId,
            amount: storageCharges.amount,
            periodLabel: storageCharges.periodLabel,
            chargeDate: storageCharges.chargeDate,
            paidAt: storageCharges.paidAt,
          })
          .from(storageCharges)
          .where(inArray(storageCharges.storageUnitId, unitIds))
          .orderBy(desc(storageCharges.chargeDate))
      : []

    const items = charges.length
      ? await db.select().from(storageChargeItems).where(inArray(storageChargeItems.chargeId, charges.map((c) => c.id)))
      : []

    const salidas = await db
      .select({
        id: rentalSlots.id,
        date: rentalSlots.date,
        startTime: rentalSlots.startTime,
        endTime: rentalSlots.endTime,
        price: rentalSlots.price,
        status: rentalSlots.status,
        paidAt: rentalSlots.paidAt,
        boatName: storageUnits.description,
      })
      .from(rentalSlots)
      .leftJoin(storageUnits, eq(storageUnits.id, rentalSlots.unitId))
      .where(eq(rentalSlots.clientId, clientId))
      .orderBy(desc(rentalSlots.date))
      .limit(20)

    const debt = charges.filter((c) => !c.paidAt).reduce((s, c) => s + Number(c.amount), 0)

    return {
      client,
      debt,
      units,
      charges: charges.map((c) => ({ ...c, items: items.filter((it) => it.chargeId === c.id) })),
      salidas,
    }
  }

  // --- Servicios fijos de una lancha (se cobran todos los meses con la cuna) ---
  async setUnitServices(unitId: number, serviceIds: number[]) {
    return db.transaction(async (tx) => {
      const [unit] = await tx.select({ id: storageUnits.id }).from(storageUnits).where(eq(storageUnits.id, unitId))
      if (!unit) throw new NotFoundException(`Unidad ${unitId} no encontrada`)

      await tx.delete(storageUnitServices).where(eq(storageUnitServices.unitId, unitId))
      if (serviceIds.length) {
        await tx.insert(storageUnitServices)
          .values(serviceIds.map((serviceId) => ({ unitId, serviceId })))
          .onConflictDoNothing()
      }
      return { unitId, serviceIds }
    })
  }

  // El período es obligatorio y va como YYYY-MM (ej. 2026-07)
  private assertPeriod(periodLabel: string) {
    if (!periodLabel || !/^\d{4}-\d{2}$/.test(periodLabel)) {
      throw new BadRequestException('Período inválido: usá el formato YYYY-MM (ej. 2026-07)')
    }
  }

  // Previsualización del cobro masivo: qué se va a generar y cuánto suma
  async previewMonth(periodLabel: string) {
    this.assertPeriod(periodLabel)
    const rows = await this.monthChargeRows(periodLabel)
    const total = rows.reduce((s, r) => s + r.items.reduce((a, it) => a + it.amount, 0), 0)
    return {
      periodLabel,
      units: rows.length,
      total,
      alreadyCharged: await this.chargedCount(periodLabel),
      detail: rows.map((r) => ({
        unitId: r.unitId,
        description: r.description,
        clientName: r.clientName,
        spotCode: r.spotCode,
        items: r.items,
        total: r.items.reduce((a, it) => a + it.amount, 0),
      })),
    }
  }

  // Genera de una sola vez el cobro del mes de todas las lanchas en guardería.
  // Queda como deuda (no entra a caja): el dueño va saldando a medida que le pagan.
  async generateMonth(periodLabel: string, userId: number) {
    this.assertPeriod(periodLabel)
    const rows = await this.monthChargeRows(periodLabel)
    if (!rows.length) return { periodLabel, created: 0, total: 0 }

    return db.transaction(async (tx) => {
      let created = 0
      let total = 0
      for (const r of rows) {
        const amount = r.items.reduce((a, it) => a + it.amount, 0)
        // El índice único (unit, period) evita duplicar el mes si tocan el botón dos veces
        const [charge] = await tx.insert(storageCharges).values({
          storageUnitId: r.unitId,
          userId,
          amount: amount.toString(),
          periodLabel,
        }).onConflictDoNothing().returning()
        if (!charge) continue

        await tx.insert(storageChargeItems).values(r.items.map((it) => ({
          chargeId: charge.id,
          concept: it.concept,
          amount: it.amount.toString(),
          serviceId: it.serviceId,
        })))
        created++
        total += amount
      }
      return { periodLabel, created, total }
    })
  }

  private async chargedCount(periodLabel: string) {
    const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(storageCharges)
      .where(eq(storageCharges.periodLabel, periodLabel))
    return r?.n ?? 0
  }

  // Arma, para cada lancha en guardería, los ítems del mes: la cuna + sus servicios fijos
  private async monthChargeRows(periodLabel: string) {
    const units = await db
      .select({
        unitId: storageUnits.id,
        description: storageUnits.description,
        rate: storageUnits.rate,
        clientName: clients.name,
        spotCode: storageSpots.code,
        charged: sql<number>`(select count(*) from storage_charges sc where sc.storage_unit_id = ${storageUnits.id} and sc.period_label = ${periodLabel})::int`,
      })
      .from(storageUnits)
      .leftJoin(clients, eq(clients.id, storageUnits.clientId))
      .leftJoin(storageSpots, eq(storageSpots.id, storageUnits.spotId))
      .where(eq(storageUnits.status, 'en_guarderia'))

    const pending = units.filter((u) => u.charged === 0)
    if (!pending.length) return []

    const fixed = await db
      .select({
        unitId: storageUnitServices.unitId,
        serviceId: storageServices.id,
        name: storageServices.name,
        price: storageServices.price,
      })
      .from(storageUnitServices)
      .innerJoin(storageServices, eq(storageServices.id, storageUnitServices.serviceId))
      .where(and(
        inArray(storageUnitServices.unitId, pending.map((u) => u.unitId)),
        eq(storageServices.active, true),
      ))

    return pending.map((u) => ({
      ...u,
      items: [
        { concept: `Cuna ${u.spotCode ?? 'sobre trailer'}`, amount: Number(u.rate), serviceId: null as number | null },
        ...fixed.filter((f) => f.unitId === u.unitId).map((f) => ({
          concept: f.name,
          amount: Number(f.price),
          serviceId: f.serviceId as number | null,
        })),
      ],
    }))
  }

  // --- Categorías (escalas de HP/eslora → tarifa mensual) ---
  listCategories(all = false) {
    const q = db.select().from(storageCategories).orderBy(asc(storageCategories.minHp), asc(storageCategories.id))
    return all ? q : q.where(eq(storageCategories.active, true))
  }

  async createCategory(dto: CategoryDto) {
    const [c] = await db.insert(storageCategories).values(this.categoryValues(dto)).returning()
    return c
  }

  async updateCategory(id: number, dto: CategoryDto) {
    return db.transaction(async (tx) => {
      const [c] = await tx.update(storageCategories)
        .set({ ...this.categoryValues(dto), ...(dto.active != null ? { active: dto.active } : {}) })
        .where(eq(storageCategories.id, id)).returning()
      if (!c) throw new NotFoundException(`Categoría ${id} no encontrada`)
      // La tarifa de la categoría manda: al cambiarla, repreciamos todas sus lanchas.
      // Los cobros ya generados del mes no se tocan (la charge ya quedó grabada).
      await tx.update(storageUnits)
        .set({ rate: c.monthlyRate })
        .where(eq(storageUnits.categoryId, id))
      return c
    })
  }

  async removeCategory(id: number) {
    const [c] = await db.update(storageCategories).set({ active: false })
      .where(eq(storageCategories.id, id)).returning()
    if (!c) throw new NotFoundException(`Categoría ${id} no encontrada`)
    return c
  }

  private categoryValues(dto: CategoryDto) {
    return {
      name: dto.name,
      minHp: dto.minHp ?? null,
      maxHp: dto.maxHp ?? null,
      minLength: dto.minLength != null ? dto.minLength.toString() : null,
      maxLength: dto.maxLength != null ? dto.maxLength.toString() : null,
      monthlyRate: (dto.monthlyRate ?? 0).toString(),
    }
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
    const [session] = await tx.select().from(cashSessions).where(and(eq(cashSessions.status, 'abierta'), eq(cashSessions.area, 'marina'))).limit(1)
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
