import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import * as bcrypt from 'bcryptjs'

@Injectable()
export class UsersService {
  async findAll() {
    const rows = await db.select({
      id: users.id, name: users.name, email: users.email,
      role: users.role, createdAt: users.createdAt,
    }).from(users)
    return rows
  }

  async create(data: { name: string; email: string; password: string; role: 'admin' | 'vendedor' }) {
    const existing = await db.select().from(users).where(eq(users.email, data.email))
    if (existing.length > 0) throw new ConflictException('Email ya registrado')
    const passwordHash = await bcrypt.hash(data.password, 10)
    const [user] = await db.insert(users).values({
      name: data.name, email: data.email, passwordHash, role: data.role,
    }).returning({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt })
    return user
  }

  async update(id: number, data: { name?: string; email?: string; role?: 'admin' | 'vendedor' }) {
    const [user] = await db.update(users).set(data).where(eq(users.id, id))
      .returning({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt })
    if (!user) throw new NotFoundException(`Usuario ${id} no encontrado`)
    return user
  }

  async changePassword(id: number, newPassword: string) {
    const passwordHash = await bcrypt.hash(newPassword, 10)
    const [user] = await db.update(users).set({ passwordHash }).where(eq(users.id, id))
      .returning({ id: users.id })
    if (!user) throw new NotFoundException(`Usuario ${id} no encontrado`)
    return { ok: true }
  }

  async remove(id: number) {
    await db.delete(users).where(eq(users.id, id))
    return { ok: true }
  }
}
