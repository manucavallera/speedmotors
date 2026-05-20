import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import Anthropic from '@anthropic-ai/sdk'
import { db } from '../db'
import { vehicles } from '../db/schema'
import { eq, and, or, ilike, sql } from 'drizzle-orm'

@Injectable()
export class VehiclesService {
  async findAll(filters?: { type?: 'moto' | 'lancha'; status?: string; search?: string; page?: number; limit?: number }) {
    const page = filters?.page ?? 1
    const limit = Math.min(200, filters?.limit ?? 100)
    const offset = (page - 1) * limit

    const conditions = []
    if (filters?.type) conditions.push(eq(vehicles.type, filters.type))
    if (filters?.status) conditions.push(eq(vehicles.status, filters.status as any))
    if (filters?.search) conditions.push(or(
      ilike(vehicles.brand, `%${filters.search}%`),
      ilike(vehicles.model, `%${filters.search}%`),
      ilike(vehicles.chassisNumber, `%${filters.search}%`),
      ilike(vehicles.engineNumber, `%${filters.search}%`),
    ))

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [items, countResult] = await Promise.all([
      where
        ? db.select().from(vehicles).where(where).limit(limit).offset(offset)
        : db.select().from(vehicles).limit(limit).offset(offset),
      where
        ? db.select({ count: sql<number>`count(*)::int` }).from(vehicles).where(where)
        : db.select({ count: sql<number>`count(*)::int` }).from(vehicles),
    ])
    const total = countResult[0]?.count ?? 0
    return { items, total, page, limit, pages: Math.ceil(total / limit) }
  }

  async findOne(id: number) {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id))
    if (!vehicle) throw new NotFoundException(`Vehículo ${id} no encontrado`)
    return vehicle
  }

  async findByChassis(chassisNumber: string) {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.chassisNumber, chassisNumber))
    return vehicle
  }

  async create(data: typeof vehicles.$inferInsert) {
    const [vehicle] = await db.insert(vehicles).values(data).returning()
    return vehicle
  }

  async update(id: number, data: Partial<typeof vehicles.$inferInsert>) {
    const [vehicle] = await db
      .update(vehicles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(vehicles.id, id))
      .returning()
    if (!vehicle) throw new NotFoundException(`Vehículo ${id} no encontrado`)
    return vehicle
  }

  async updateStatus(id: number, status: 'disponible' | 'reservado' | 'vendido') {
    return this.update(id, { status })
  }

  async remove(id: number) {
    const [vehicle] = await db.delete(vehicles).where(eq(vehicles.id, id)).returning()
    if (!vehicle) throw new NotFoundException(`Vehículo ${id} no encontrado`)
    return vehicle
  }

  async parseTitulo(file: Express.Multer.File): Promise<{ brand: string; model: string; year: string; chassisNumber: string; engineNumber: string }> {
    if (!process.env.ANTHROPIC_API_KEY) throw new BadRequestException('ANTHROPIC_API_KEY no configurada')
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const base64 = file.buffer.toString('base64')

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: file.mimetype as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif', data: base64 } },
          { type: 'text', text: 'Extraé los datos de este título/cédula de vehículo argentino. Devolvé SOLO un JSON sin texto adicional:\n{"brand":"marca","model":"modelo","year":"año como string o vacío","chassisNumber":"número de chasis o VIN","engineNumber":"número de motor o vacío"}' },
        ],
      }],
    })

    const raw = (response.content[0] as Anthropic.TextBlock).text
    const text = raw.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim()
    try {
      return JSON.parse(text)
    } catch {
      throw new BadRequestException('No se pudo leer el título')
    }
  }

  async bulkCreate(items: (typeof vehicles.$inferInsert)[]) {
    return db.insert(vehicles).values(items).returning()
  }

  async parseRemito(file: Express.Multer.File): Promise<{ remitoNumber: string | null; items: { importCode: string; model: string; engineNumber: string; chassisNumber: string; brand: string }[] }> {
    if (!process.env.ANTHROPIC_API_KEY) throw new BadRequestException('ANTHROPIC_API_KEY no configurada')

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const existingVehicles = await db
      .selectDistinct({ importCode: vehicles.importCode, brand: vehicles.brand })
      .from(vehicles)
      .where(sql`${vehicles.importCode} IS NOT NULL AND ${vehicles.brand} IS NOT NULL AND ${vehicles.brand} != ''`)
    const brandContext = existingVehicles.length > 0
      ? `\nReferencia de marcas ya cargadas en el sistema (código → marca):\n${existingVehicles.map(v => `${v.importCode} → ${v.brand}`).join('\n')}\nUsá estos datos para inferir la marca por prefijo del código.`
      : ''

    const base64 = file.buffer.toString('base64')
    const isPdf = file.mimetype === 'application/pdf'

    const content: Anthropic.ContentBlockParam[] = [
      isPdf
        ? ({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } } as unknown as Anthropic.ContentBlockParam)
        : ({ type: 'image', source: { type: 'base64', media_type: file.mimetype as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif', data: base64 } } as Anthropic.ImageBlockParam),
      { type: 'text', text: `Extraé los datos de este remito de proveedor de motos. Intentá inferir la marca (brand) del código de artículo comparando con la referencia provista.${brandContext}\nDevolvé SOLO un JSON con esta estructura exacta, sin texto adicional:\n{"remitoNumber":"número de remito o null","items":[{"importCode":"código artículo","model":"modelo","engineNumber":"número de motor","chassisNumber":"número de chasis","brand":"marca inferida o cadena vacía"}]}` },
    ]

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content }],
    })

    const raw = (response.content[0] as Anthropic.TextBlock).text
    const text = raw.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim()
    try {
      return JSON.parse(text)
    } catch {
      throw new BadRequestException('No se pudo interpretar la respuesta del análisis')
    }
  }
}
