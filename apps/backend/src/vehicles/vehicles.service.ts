import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common'
import Anthropic from '@anthropic-ai/sdk'
import { db } from '../db'
import { vehicles } from '../db/schema'
import { eq, and, or, ilike, inArray, sql } from 'drizzle-orm'

export interface ParsedRemitoItem {
  importCode: string
  brand: string
  model: string
  displacement: number | null
  version: string
  color: string
  engineNumber: string
  chassisNumber: string
}

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
      ilike(vehicles.version, `%${filters.search}%`),
      ilike(vehicles.internalCode, `%${filters.search}%`),
      ilike(vehicles.importCode, `%${filters.search}%`),
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

  async findByInternalCode(internalCode: string) {
    const code = internalCode.trim()
    if (!code) throw new BadRequestException('Ingresá un código interno')
    const [vehicle] = await db.select().from(vehicles).where(ilike(vehicles.internalCode, code))
    if (!vehicle) throw new NotFoundException(`No existe una moto con el código interno ${code}`)
    return vehicle
  }

  async create(data: typeof vehicles.$inferInsert) {
    const normalizedCode = data.internalCode?.trim().toUpperCase() || null
    if (normalizedCode) {
      const [duplicate] = await db.select({ id: vehicles.id }).from(vehicles).where(eq(vehicles.internalCode, normalizedCode))
      if (duplicate) throw new ConflictException(`El código interno ${normalizedCode} ya está asignado`)
    }
    const [vehicle] = await db.insert(vehicles).values({ ...data, internalCode: normalizedCode }).returning()
    return vehicle
  }

  async update(id: number, data: Partial<typeof vehicles.$inferInsert>) {
    const normalizedCode = data.internalCode === undefined ? undefined : data.internalCode?.trim().toUpperCase() || null
    if (normalizedCode) {
      const [duplicate] = await db.select({ id: vehicles.id }).from(vehicles).where(and(
        eq(vehicles.internalCode, normalizedCode),
        sql`${vehicles.id} <> ${id}`,
      ))
      if (duplicate) throw new ConflictException(`El código interno ${normalizedCode} ya está asignado`)
    }
    const [vehicle] = await db
      .update(vehicles)
      .set({ ...data, ...(normalizedCode !== undefined ? { internalCode: normalizedCode } : {}), updatedAt: new Date() })
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
    const normalizedItems = items.map(item => ({
      ...item,
      internalCode: item.internalCode?.trim().toUpperCase() || null,
    }))
    const codes = normalizedItems.map(item => item.internalCode).filter((code): code is string => !!code)
    if (new Set(codes).size !== codes.length)
      throw new ConflictException('Hay códigos internos repetidos en el remito')
    if (codes.length > 0) {
      const [duplicate] = await db.select({ internalCode: vehicles.internalCode }).from(vehicles)
        .where(inArray(vehicles.internalCode, codes)).limit(1)
      if (duplicate?.internalCode)
        throw new ConflictException(`El código interno ${duplicate.internalCode} ya está asignado`)
    }
    return db.insert(vehicles).values(normalizedItems).returning()
  }

  async parseRemito(file: Express.Multer.File): Promise<{ remitoNumber: string | null; items: ParsedRemitoItem[] }> {
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
      { type: 'text', text: `Extraé y CLASIFICÁ cada moto de este remito.${brandContext}
El campo Modelo suele combinar datos. Ejemplo: "CVN-HUNTER 150 R2 V01 NE" significa brand="Corven", model="Hunter", displacement=150, version="R2 V01", color="Negro". CVN es el código de Corven y NE es Negro. Separá del mismo modo las demás filas. Si un código de marca o color no es seguro, conservá el código para que el usuario lo corrija; no inventes. "importCode" es el valor de la columna Artículo, no un código interno.
Devolvé SOLO JSON con esta estructura exacta, sin texto adicional:
{"remitoNumber":"número de remito o null","items":[{"importCode":"artículo del proveedor","brand":"marca clasificada","model":"modelo sin marca/cilindrada/versión/color","displacement":150,"version":"versión completa o vacío","color":"color clasificado","engineNumber":"número de motor","chassisNumber":"número de chasis"}]}` },
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
