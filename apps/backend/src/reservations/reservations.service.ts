import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common'
import { db } from '../db'
import { reservations, vehicles } from '../db/schema'
import { eq, desc, sql, and, inArray } from 'drizzle-orm'
import { CreateReservationDto } from './create-reservation.dto'

@Injectable()
export class ReservationsService {
  async findAll(params: { page?: number; limit?: number } = {}) {
    const page = params.page ?? 1
    const limit = Math.min(200, params.limit ?? 100)
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
    return db.transaction(async (tx) => {
      if (data.vehicleId) {
        const [locked] = await tx
          .update(vehicles)
          .set({ status: 'reservado', updatedAt: new Date() })
          .where(and(eq(vehicles.id, data.vehicleId), inArray(vehicles.status, ['disponible'])))
          .returning()
        if (!locked) {
          throw new ConflictException('El vehículo no está disponible (ya está reservado o vendido)')
        }
      }

      const [r] = await tx.insert(reservations).values({
        reservationNumber: 'PENDING',
        date: data.date ? new Date(data.date) : new Date(),
        clientId: data.clientId ?? null,
        vehicleId: data.vehicleId ?? null,
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

      const num = r.id.toString().padStart(5, '0')
      const reservationNumber = `RES-${new Date().getFullYear()}-${num}`
      const [updated] = await tx.update(reservations).set({ reservationNumber }).where(eq(reservations.id, r.id)).returning()
      return updated
    })
  }

  async update(id: number, data: CreateReservationDto) {
    const [existing] = await db.select().from(reservations).where(eq(reservations.id, id))
    if (!existing) throw new NotFoundException(`Reserva ${id} no encontrada`)

    if (existing.status !== 'vigente') {
      throw new BadRequestException('Solo se pueden editar reservas vigentes')
    }

    return db.transaction(async (tx) => {
      if (data.vehicleId !== existing.vehicleId) {
        if (existing.vehicleId) {
          await tx.update(vehicles)
            .set({ status: 'disponible', updatedAt: new Date() })
            .where(and(eq(vehicles.id, existing.vehicleId), eq(vehicles.status, 'reservado')))
        }
        if (data.vehicleId) {
          const [locked] = await tx.update(vehicles)
            .set({ status: 'reservado', updatedAt: new Date() })
            .where(and(eq(vehicles.id, data.vehicleId), eq(vehicles.status, 'disponible')))
            .returning()
          if (!locked) throw new ConflictException('El nuevo vehículo no está disponible')
        }
      }

      const [r] = await tx.update(reservations).set({
        date: data.date ? new Date(data.date) : existing.date,
        clientId: data.clientId ?? null,
        vehicleId: data.vehicleId ?? null,
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
    })
  }

  async updateStatus(id: number, status: 'vigente' | 'concretada' | 'cancelada') {
    return db.transaction(async (tx) => {
      const [existing] = await tx.select().from(reservations).where(eq(reservations.id, id))
      if (!existing) throw new NotFoundException(`Reserva ${id} no encontrada`)
      if (existing.status === status) return existing

      if (existing.vehicleId && existing.status === 'vigente') {
        if (status === 'cancelada') {
          await tx.update(vehicles)
            .set({ status: 'disponible', updatedAt: new Date() })
            .where(and(eq(vehicles.id, existing.vehicleId), eq(vehicles.status, 'reservado')))
        }
      }

      const [r] = await tx.update(reservations).set({ status }).where(eq(reservations.id, id)).returning()
      return r
    })
  }

  async remove(id: number) {
    return db.transaction(async (tx) => {
      const [existing] = await tx.select().from(reservations).where(eq(reservations.id, id))
      if (!existing) throw new NotFoundException(`Reserva ${id} no encontrada`)

      if (existing.vehicleId && existing.status === 'vigente') {
        await tx.update(vehicles)
          .set({ status: 'disponible', updatedAt: new Date() })
          .where(and(eq(vehicles.id, existing.vehicleId), eq(vehicles.status, 'reservado')))
      }

      const [r] = await tx.delete(reservations).where(eq(reservations.id, id)).returning()
      return r
    })
  }
}
