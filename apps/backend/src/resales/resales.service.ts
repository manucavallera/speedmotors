import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '../db';
import { resaleConsignments, resellers, vehicles } from '../db/schema';

@Injectable()
export class ResalesService {
  async list() {
    const rows = await db
      .select({
        reseller: resellers,
        consignment: resaleConsignments,
        vehicle: vehicles,
      })
      .from(resellers)
      .leftJoin(
        resaleConsignments,
        eq(resaleConsignments.resellerId, resellers.id),
      )
      .leftJoin(vehicles, eq(resaleConsignments.vehicleId, vehicles.id))
      .orderBy(desc(resellers.createdAt), desc(resaleConsignments.deliveredAt));
    return resellersFromRows(rows);
  }

  async createReseller(data: { name: string; phone?: string; notes?: string }) {
    const name = data.name.trim();
    if (!name)
      throw new BadRequestException('El nombre del reventa es obligatorio');
    const [row] = await db
      .insert(resellers)
      .values({
        name,
        phone: data.phone?.trim() || null,
        notes: data.notes?.trim() || null,
      })
      .returning();
    return row;
  }

  async updateReseller(
    id: number,
    data: { name?: string; phone?: string; notes?: string },
  ) {
    const values: {
      name?: string;
      phone?: string | null;
      notes?: string | null;
    } = {};
    if (data.name !== undefined) {
      const name = data.name.trim();
      if (!name)
        throw new BadRequestException('El nombre del reventa es obligatorio');
      values.name = name;
    }
    if (data.phone !== undefined) values.phone = data.phone.trim() || null;
    if (data.notes !== undefined) values.notes = data.notes.trim() || null;
    const [row] = await db
      .update(resellers)
      .set(values)
      .where(eq(resellers.id, id))
      .returning();
    if (!row) throw new NotFoundException('Reventa no encontrado');
    return row;
  }

  async deleteReseller(id: number) {
    return db.transaction(async (tx) => {
      const [consignment] = await tx
        .select()
        .from(resaleConsignments)
        .where(eq(resaleConsignments.resellerId, id));
      if (consignment)
        throw new BadRequestException(
          'Primero hay que quitar las motos consignadas',
        );
      await tx.delete(resellers).where(eq(resellers.id, id));
      return { deleted: true };
    });
  }

  async consign(data: {
    resellerId: number;
    vehicleId: number;
    agreedPrice?: number;
    deliveredAt?: string;
  }) {
    return db.transaction(async (tx) => {
      const [vehicle] = await tx
        .select()
        .from(vehicles)
        .where(eq(vehicles.id, data.vehicleId));
      if (!vehicle) throw new NotFoundException('Moto no encontrada');
      if (vehicle.type !== 'moto' || vehicle.status !== 'disponible')
        throw new BadRequestException(
          'Solo se pueden consignar motos disponibles',
        );
      const [reseller] = await tx
        .select()
        .from(resellers)
        .where(eq(resellers.id, data.resellerId));
      if (!reseller) throw new NotFoundException('Reventa no encontrado');
      const [active] = await tx
        .select()
        .from(resaleConsignments)
        .where(
          and(
            eq(resaleConsignments.vehicleId, data.vehicleId),
            isNull(resaleConsignments.soldAt),
          ),
        );
      if (active) throw new BadRequestException('La moto ya está consignada');
      const [consignment] = await tx
        .insert(resaleConsignments)
        .values({
          resellerId: data.resellerId,
          vehicleId: data.vehicleId,
          agreedPrice: data.agreedPrice?.toString(),
          deliveredAt:
            data.deliveredAt || new Date().toISOString().slice(0, 10),
        })
        .returning();
      await tx
        .update(vehicles)
        .set({ status: 'reventa', updatedAt: new Date() })
        .where(eq(vehicles.id, data.vehicleId));
      return consignment;
    });
  }

  async updateConsignment(
    id: number,
    data: { resellerId?: number; vehicleId?: number; deliveredAt?: string },
  ) {
    return db.transaction(async (tx) => {
      const [consignment] = await tx
        .select()
        .from(resaleConsignments)
        .where(eq(resaleConsignments.id, id));
      if (!consignment)
        throw new NotFoundException('Consignación no encontrada');
      if (consignment.soldAt)
        throw new BadRequestException(
          'No se puede editar una consignación vendida',
        );

      if (data.resellerId !== undefined) {
        const [reseller] = await tx
          .select()
          .from(resellers)
          .where(eq(resellers.id, data.resellerId));
        if (!reseller) throw new NotFoundException('Reventa no encontrada');
      }

      if (data.vehicleId !== undefined && data.vehicleId !== consignment.vehicleId) {
        const [vehicle] = await tx
          .select()
          .from(vehicles)
          .where(eq(vehicles.id, data.vehicleId));
        if (!vehicle) throw new NotFoundException('Moto no encontrada');
        if (vehicle.type !== 'moto' || vehicle.status !== 'disponible')
          throw new BadRequestException(
            'Solo se pueden consignar motos disponibles',
          );
        const [active] = await tx
          .select()
          .from(resaleConsignments)
          .where(
            and(
              eq(resaleConsignments.vehicleId, data.vehicleId),
              isNull(resaleConsignments.soldAt),
            ),
          );
        if (active && active.id !== id)
          throw new BadRequestException('La moto ya está consignada');
        await tx
          .update(vehicles)
          .set({ status: 'disponible', updatedAt: new Date() })
          .where(eq(vehicles.id, consignment.vehicleId));
        await tx
          .update(vehicles)
          .set({ status: 'reventa', updatedAt: new Date() })
          .where(eq(vehicles.id, data.vehicleId));
      }

      const [updated] = await tx
        .update(resaleConsignments)
        .set({
          ...(data.resellerId !== undefined && { resellerId: data.resellerId }),
          ...(data.vehicleId !== undefined && { vehicleId: data.vehicleId }),
          ...(data.deliveredAt !== undefined && { deliveredAt: data.deliveredAt }),
        })
        .where(eq(resaleConsignments.id, id))
        .returning();
      return updated;
    });
  }

  async registerSale(id: number, data: { soldAt?: string } = {}) {
    return db.transaction(async (tx) => {
      const [consignment] = await tx
        .select()
        .from(resaleConsignments)
        .where(eq(resaleConsignments.id, id));
      if (!consignment)
        throw new NotFoundException('Consignación no encontrada');
      if (consignment.soldAt)
        throw new BadRequestException('La consignación ya fue vendida');
      const [vehicle] = await tx
        .select()
        .from(vehicles)
        .where(eq(vehicles.id, consignment.vehicleId));
      if (!vehicle) throw new NotFoundException('Moto no encontrada');
      const [updated] = await tx
        .update(resaleConsignments)
        .set({
          soldPrice: vehicle.sellPrice,
          soldAt: data.soldAt || new Date().toISOString().slice(0, 10),
        })
        .where(eq(resaleConsignments.id, id))
        .returning();
      await tx
        .update(vehicles)
        .set({ status: 'vendido', updatedAt: new Date() })
        .where(eq(vehicles.id, consignment.vehicleId));
      return updated;
    });
  }

  async removeConsignment(id: number) {
    return db.transaction(async (tx) => {
      const [consignment] = await tx
        .select()
        .from(resaleConsignments)
        .where(eq(resaleConsignments.id, id));
      if (!consignment)
        throw new NotFoundException('Consignación no encontrada');
      if (consignment.soldAt)
        throw new BadRequestException(
          'No se puede eliminar una consignación vendida',
        );
      await tx
        .update(vehicles)
        .set({ status: 'disponible', updatedAt: new Date() })
        .where(eq(vehicles.id, consignment.vehicleId));
      await tx.delete(resaleConsignments).where(eq(resaleConsignments.id, id));
      return { deleted: true };
    });
  }
}

type ResaleRow = {
  reseller: typeof resellers.$inferSelect;
  consignment: typeof resaleConsignments.$inferSelect | null;
  vehicle: typeof vehicles.$inferSelect | null;
};
type ResellerWithConsignments = typeof resellers.$inferSelect & {
  consignments: Array<
    typeof resaleConsignments.$inferSelect & {
      vehicle: typeof vehicles.$inferSelect | null;
    }
  >;
};

function resellersFromRows(rows: ResaleRow[]): ResellerWithConsignments[] {
  const map = new Map<number, ResellerWithConsignments>();
  for (const row of rows) {
    let item = map.get(row.reseller.id);
    if (!item) {
      item = { ...row.reseller, consignments: [] };
      map.set(row.reseller.id, item);
    }
    if (row.consignment)
      item.consignments.push({ ...row.consignment, vehicle: row.vehicle });
  }
  return [...map.values()];
}
