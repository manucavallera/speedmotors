import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common'
import { db } from '../db'
import { users } from '../db/schema'
import { eq, sql } from 'drizzle-orm'
import * as bcrypt from 'bcryptjs'

const MIN_PASSWORD_LENGTH = 8

@Injectable()
export class UsersService {
  async findAll() {
    return db.select({
      id: users.id, name: users.name, email: users.email,
      role: users.role, createdAt: users.createdAt,
    }).from(users)
  }

  async create(data: { name: string; email: string; password: string; role: 'admin' | 'vendedor' }) {
    if (data.password.length < MIN_PASSWORD_LENGTH) {
      throw new BadRequestException(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`)
    }
    const existing = await db.select().from(users).where(eq(users.email, data.email))
    if (existing.length > 0) throw new ConflictException('Email ya registrado')
    const passwordHash = await bcrypt.hash(data.password, 10)
    const [user] = await db.insert(users).values({
      name: data.name, email: data.email, passwordHash, role: data.role,
    }).returning({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt })
    return user
  }

  async update(id: number, data: { name?: string; email?: string; role?: 'admin' | 'vendedor' }, requesterId: number) {
    if (data.role && data.role !== 'admin') {
      await this.assertNotLastAdmin(id)
    }
    const [user] = await db.update(users).set(data).where(eq(users.id, id))
      .returning({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt })
    if (!user) throw new NotFoundException(`Usuario ${id} no encontrado`)
    return user
  }

  async changePassword(id: number, newPassword: string) {
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      throw new BadRequestException(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`)
    }
    const passwordHash = await bcrypt.hash(newPassword, 10)
    const [user] = await db.update(users).set({ passwordHash }).where(eq(users.id, id))
      .returning({ id: users.id })
    if (!user) throw new NotFoundException(`Usuario ${id} no encontrado`)
    return { ok: true }
  }

  async remove(id: number, requesterId: number) {
    if (id === requesterId) throw new ForbiddenException('No podés eliminar tu propio usuario')
    await this.assertNotLastAdmin(id)
    await db.delete(users).where(eq(users.id, id))
    return { ok: true }
  }

  private async assertNotLastAdmin(id: number) {
    const [target] = await db.select({ role: users.role }).from(users).where(eq(users.id, id))
    if (!target || target.role !== 'admin') return
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(users).where(eq(users.role, 'admin'))
    if (count <= 1) throw new ForbiddenException('No se puede eliminar o degradar el único administrador del sistema')
  }
}
