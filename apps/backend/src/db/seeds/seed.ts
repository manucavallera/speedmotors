import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as xlsx from 'xlsx'
import * as path from 'path'
import * as bcrypt from 'bcryptjs'
import * as schema from '../schema'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const db = drizzle(pool, { schema })

async function seed() {
  console.log('🌱 Iniciando seed...')

  // Admin user
  const passwordHash = await bcrypt.hash('admin123', 10)
  await db.insert(schema.users).values({
    name: 'Admin',
    email: 'admin@speedmotors.com',
    passwordHash,
    role: 'admin',
  }).onConflictDoNothing()
  console.log('✅ Usuario admin creado')

  // Mercomax como proveedor
  const [mercomax] = await db.insert(schema.suppliers).values({
    name: 'Mercomax S.A.',
    email: 'ventas@mercomax.com',
  }).returning()
  console.log('✅ Proveedor Mercomax creado')

  // Leer el Excel de Mercomax
  const excelPath = path.resolve(__dirname, 'mercomax.xlsx')
  const workbook = xlsx.readFile(excelPath)
  const sheet = workbook.Sheets['Lista de precios general']
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as any[][]

  // Row 0: título, Row 1: headers, Row 2+: datos
  const categoryMap = new Map<string, number>()
  const subcategoryMap = new Map<string, number>()

  let productCount = 0

  for (let i = 2; i < rows.length; i++) {
    const row = rows[i]
    if (!row || !row[0]) continue

    const code = String(row[0]).trim()
    const name = String(row[1] || '').replace(/\xa0/g, ' ').trim()
    const categoryName = String(row[2] || '').trim()
    const subcategoryName = String(row[3] || '').trim()
    const brand = row[4] ? String(row[4]).trim() : null
    const costPrice = parseFloat(row[7]) || 0

    if (!name || !categoryName) continue

    // Crear categoría si no existe
    if (!categoryMap.has(categoryName)) {
      const slug = categoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      const [cat] = await db.insert(schema.categories).values({ name: categoryName, slug })
        .onConflictDoNothing().returning()
      if (cat) categoryMap.set(categoryName, cat.id)
    }

    const categoryId = categoryMap.get(categoryName)

    // Crear subcategoría si no existe
    let subcategoryId: number | undefined
    if (subcategoryName && categoryId) {
      const subKey = `${categoryName}:${subcategoryName}`
      if (!subcategoryMap.has(subKey)) {
        const slug = `${categoryName}-${subcategoryName}`.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        const [sub] = await db.insert(schema.categories).values({
          name: subcategoryName,
          slug,
          parentId: categoryId,
        }).onConflictDoNothing().returning()
        if (sub) subcategoryMap.set(subKey, sub.id)
      }
      subcategoryId = subcategoryMap.get(subKey)
    }

    await db.insert(schema.products).values({
      code,
      name,
      categoryId: subcategoryId || categoryId,
      brand,
      supplierId: mercomax.id,
      costPrice: costPrice.toFixed(2),
      sellPrice: (costPrice * 1.3).toFixed(2), // 30% de ganancia default
      stock: 0,
      minStock: 1,
    }).onConflictDoNothing()

    productCount++
  }

  console.log(`✅ ${productCount} productos importados de Mercomax`)
  console.log('🎉 Seed completado')
  await pool.end()
}

seed().catch(err => {
  console.error('❌ Error en seed:', err)
  process.exit(1)
})
