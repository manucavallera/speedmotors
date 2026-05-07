import { Injectable, NotFoundException } from '@nestjs/common'
import { db } from '../db'
import { reminders } from '../db/schema'
import { eq } from 'drizzle-orm'

export class CreateReminderDto {
  type: 'impuesto' | 'factura' | 'vencimiento' | 'otro'
  title: string
  description?: string
  dueDate: string
  amount?: number
  recurrence?: 'ninguna' | 'mensual' | 'trimestral' | 'anual'
}

function nextDueDate(from: Date, recurrence: string): Date {
  const next = new Date(from)
  if (recurrence === 'mensual') next.setMonth(next.getMonth() + 1)
  else if (recurrence === 'trimestral') next.setMonth(next.getMonth() + 3)
  else if (recurrence === 'anual') next.setFullYear(next.getFullYear() + 1)
  return next
}

@Injectable()
export class RemindersService {
  async findAll() {
    return db.select().from(reminders).orderBy(reminders.dueDate)
  }

  async create(dto: CreateReminderDto, userId: number) {
    const [created] = await db
      .insert(reminders)
      .values({
        type: dto.type,
        title: dto.title,
        description: dto.description ?? null,
        dueDate: new Date(dto.dueDate),
        amount: dto.amount != null ? dto.amount.toString() : null,
        recurrence: dto.recurrence ?? 'ninguna',
        status: 'pendiente',
        userId,
      })
      .returning()
    return created
  }

  async update(id: number, dto: Partial<CreateReminderDto>) {
    const patch: Record<string, unknown> = {}
    if (dto.type !== undefined) patch.type = dto.type
    if (dto.title !== undefined) patch.title = dto.title
    if (dto.description !== undefined) patch.description = dto.description || null
    if (dto.dueDate !== undefined) patch.dueDate = new Date(dto.dueDate)
    if (dto.amount !== undefined) patch.amount = dto.amount != null ? dto.amount.toString() : null
    if (dto.recurrence !== undefined) patch.recurrence = dto.recurrence
    if (Object.keys(patch).length === 0) throw new NotFoundException('Nothing to update')
    const [updated] = await db.update(reminders).set(patch).where(eq(reminders.id, id)).returning()
    if (!updated) throw new NotFoundException()
    return updated
  }

  async markDone(id: number) {
    return db.transaction(async tx => {
      const [updated] = await tx
        .update(reminders)
        .set({ status: 'pagado' })
        .where(eq(reminders.id, id))
        .returning()

      if (!updated) throw new NotFoundException()

      // Create next occurrence atomically — if this fails the update rolls back
      if (updated.recurrence !== 'ninguna') {
        await tx.insert(reminders).values({
          type: updated.type,
          title: updated.title,
          description: updated.description,
          dueDate: nextDueDate(new Date(updated.dueDate), updated.recurrence),
          amount: updated.amount,
          recurrence: updated.recurrence,
          status: 'pendiente',
          userId: updated.userId,
        })
      }

      return updated
    })
  }

  async remove(id: number) {
    const [deleted] = await db.delete(reminders).where(eq(reminders.id, id)).returning()
    if (!deleted) throw new NotFoundException()
    return deleted
  }
}
