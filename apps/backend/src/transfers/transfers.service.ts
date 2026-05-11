import { Injectable, NotFoundException } from '@nestjs/common'
import { db } from '../db'
import { transfers, vehicles, clients } from '../db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import type { CreateTransferDto } from './create-transfer.dto'

@Injectable()
export class TransfersService {
  async findAll(params: { page?: number; limit?: number } = {}) {
    const page = params.page ?? 1
    const limit = Math.min(200, params.limit ?? 100)
    const offset = (page - 1) * limit

    const [rows, countResult] = await Promise.all([
      db
        .select({
          transfer: transfers,
          vehicleBrand: vehicles.brand,
          vehicleModel: vehicles.model,
          vehicleYear: vehicles.year,
          chassisNumber: vehicles.chassisNumber,
          clientName2: clients.name,
        })
        .from(transfers)
        .leftJoin(vehicles, eq(transfers.vehicleId, vehicles.id))
        .leftJoin(clients, eq(transfers.clientId, clients.id))
        .orderBy(desc(transfers.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(transfers),
    ])

    const items = rows.map(r => ({
      ...r.transfer,
      vehicleLabel: r.vehicleBrand ? `${r.vehicleBrand} ${r.vehicleModel ?? ''} ${r.vehicleYear ?? ''}`.trim() : null,
      chassisNumber: r.chassisNumber,
      clientNameResolved: r.clientName2 ?? r.transfer.clientName,
    }))
    const total = countResult[0]?.count ?? 0
    return { items, total, page, limit, pages: Math.ceil(total / limit) }
  }

  async findOne(id: number) {
    const [row] = await db
      .select({
        transfer: transfers,
        vehicleBrand: vehicles.brand,
        vehicleModel: vehicles.model,
        vehicleYear: vehicles.year,
        chassisNumber: vehicles.chassisNumber,
        engineNumber: vehicles.engineNumber,
        clientName2: clients.name,
        clientDni2: clients.dni,
      })
      .from(transfers)
      .leftJoin(vehicles, eq(transfers.vehicleId, vehicles.id))
      .leftJoin(clients, eq(transfers.clientId, clients.id))
      .where(eq(transfers.id, id))

    if (!row) throw new NotFoundException(`Transferencia ${id} no encontrada`)

    return {
      ...row.transfer,
      vehicleLabel: row.vehicleBrand ? `${row.vehicleBrand} ${row.vehicleModel ?? ''} ${row.vehicleYear ?? ''}`.trim() : null,
      chassisNumber: row.chassisNumber,
      engineNumber: row.engineNumber,
      clientNameResolved: row.clientName2 ?? row.transfer.clientName,
      clientDniResolved: row.clientDni2 ?? row.transfer.clientDni,
    }
  }

  async create(data: CreateTransferDto, userId: number) {
    return db.transaction(async (tx) => {
      const [t] = await tx.insert(transfers).values({
        transferNumber: 'PENDING',
        vehicleId: data.vehicleId ?? null,
        clientId: data.clientId ?? null,
        clientName: data.clientName,
        clientDni: data.clientDni ?? null,
        date: data.date ? new Date(data.date) : new Date(),
        notaryName: data.notaryName ?? null,
        notaryRegistry: data.notaryRegistry ?? null,
        rnpNumber: data.rnpNumber ?? null,
        dnrpaNumber: data.dnrpaNumber ?? null,
        transferFee: data.transferFee?.toFixed(2) ?? '0',
        taxAmount: data.taxAmount?.toFixed(2) ?? '0',
        totalCost: data.totalCost?.toFixed(2) ?? '0',
        status: data.status ?? 'pendiente',
        notes: data.notes ?? null,
        userId,
      }).returning()

      const num = t.id.toString().padStart(5, '0')
      const transferNumber = `TR-${new Date().getFullYear()}-${num}`
      const [updated] = await tx.update(transfers).set({ transferNumber }).where(eq(transfers.id, t.id)).returning()
      return updated
    })
  }

  async update(id: number, data: Partial<CreateTransferDto>) {
    const [t] = await db.update(transfers).set({
      ...(data.vehicleId !== undefined && { vehicleId: data.vehicleId }),
      ...(data.clientId !== undefined && { clientId: data.clientId }),
      ...(data.clientName && { clientName: data.clientName }),
      ...(data.clientDni !== undefined && { clientDni: data.clientDni }),
      ...(data.date && { date: new Date(data.date) }),
      ...(data.notaryName !== undefined && { notaryName: data.notaryName }),
      ...(data.notaryRegistry !== undefined && { notaryRegistry: data.notaryRegistry }),
      ...(data.rnpNumber !== undefined && { rnpNumber: data.rnpNumber }),
      ...(data.dnrpaNumber !== undefined && { dnrpaNumber: data.dnrpaNumber }),
      ...(data.transferFee !== undefined && { transferFee: data.transferFee.toFixed(2) }),
      ...(data.taxAmount !== undefined && { taxAmount: data.taxAmount.toFixed(2) }),
      ...(data.totalCost !== undefined && { totalCost: data.totalCost.toFixed(2) }),
      ...(data.status && { status: data.status }),
      ...(data.notes !== undefined && { notes: data.notes }),
    }).where(eq(transfers.id, id)).returning()

    if (!t) throw new NotFoundException(`Transferencia ${id} no encontrada`)
    return t
  }

  async remove(id: number) {
    await db.delete(transfers).where(eq(transfers.id, id))
    return { ok: true }
  }
}
