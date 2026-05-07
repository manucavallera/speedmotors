import { Injectable, NotFoundException } from '@nestjs/common'
import { db } from '../db'
import { reservations } from '../db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import { CreateReservationDto } from './create-reservation.dto'

@Injectable()
export class ReservationsService {
  async findAll(params: { page?: number; limit?: number } = {}) {
    const page = params.page ?? 1
    const limit = params.limit ?? 100
    const offset = (page - 1) * limit

    const [items, countResult] = await Promise.all([
      db.select().from(reservations).orderBy(desc(reservations.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(reservations),
    ])
    const total = countResult[0]?.count ?? 0
    return { items, total, page, limit, pages: Math.ceil(total / limit) }
  }

  async findOne(id: number) {
    const [r] = await db.select().from(reservations).where(eq(reservations.id, id))
    if (!r) throw new NotFoundException(`Reserva ${id} no encontrada`)
    return r
  }

  async create(data: CreateReservationDto, userId: number) {
    const [countResult] = await db.select({ count: sql<string>`COUNT(*)` }).from(reservations)
    const num = (Number(countResult.count) + 1).toString().padStart(5, '0')
    const reservationNumber = `RES-${new Date().getFullYear()}-${num}`

    const [r] = await db.insert(reservations).values({
      reservationNumber,
      date: data.date ? new Date(data.date) : new Date(),
      clientId: data.clientId ?? null,
      clientName: data.clientName,
      clientDni: data.clientDni ?? null,
      clientAddress: data.clientAddress ?? null,
      clientPhone: data.clientPhone ?? null,
      spouseName: data.spouseName ?? null,
      spouseDni: data.spouseDni ?? null,
      vehicleType: data.vehicleType,
      brand: data.brand,
      model: data.model ?? null,
      year: data.year ?? null,
      color: data.color ?? null,
      motorNumber: data.motorNumber ?? null,
      chassisNumber: data.chassisNumber ?? null,
      price: data.price?.toString() ?? null,
      depositAmount: data.depositAmount?.toString() ?? null,
      notes: data.notes ?? null,
      userId,
    }).returning()
    return r
  }

  async update(id: number, data: CreateReservationDto) {
    const [existing] = await db.select().from(reservations).where(eq(reservations.id, id))
    if (!existing) throw new NotFoundException(`Reserva ${id} no encontrada`)

    const [r] = await db.update(reservations).set({
      date: data.date ? new Date(data.date) : existing.date,
      clientId: data.clientId ?? null,
      clientName: data.clientName,
      clientDni: data.clientDni ?? null,
      clientAddress: data.clientAddress ?? null,
      clientPhone: data.clientPhone ?? null,
      spouseName: data.spouseName ?? null,
      spouseDni: data.spouseDni ?? null,
      vehicleType: data.vehicleType,
      brand: data.brand,
      model: data.model ?? null,
      year: data.year ?? null,
      color: data.color ?? null,
      motorNumber: data.motorNumber ?? null,
      chassisNumber: data.chassisNumber ?? null,
      price: data.price?.toString() ?? null,
      depositAmount: data.depositAmount?.toString() ?? null,
      notes: data.notes ?? null,
    }).where(eq(reservations.id, id)).returning()
    return r
  }

  async updateStatus(id: number, status: 'vigente' | 'concretada' | 'cancelada') {
    const [r] = await db.update(reservations).set({ status }).where(eq(reservations.id, id)).returning()
    if (!r) throw new NotFoundException(`Reserva ${id} no encontrada`)
    return r
  }

  async remove(id: number) {
    const [r] = await db.delete(reservations).where(eq(reservations.id, id)).returning()
    if (!r) throw new NotFoundException(`Reserva ${id} no encontrada`)
    return r
  }
}
