import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { sql } from 'drizzle-orm'
import * as schema from '../schema'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const db = drizzle(pool, { schema })

const NOW = new Date()
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86400000)
const daysFrom = (n: number) => new Date(NOW.getTime() + n * 86400000)

async function getAdminId(): Promise<number> {
  const [user] = await db.select().from(schema.users).limit(1)
  if (!user) throw new Error('No hay usuario admin. Corré el seed base primero.')
  return user.id
}

async function seedSuppliers(userId: number) {
  console.log('📦 Creando proveedores...')
  const rows = await db.insert(schema.suppliers).values([
    { name: 'Honda Argentina SA', email: 'pedidos@honda.com.ar', phone: '011-4567-8900' },
    { name: 'Yamaha Motor Argentina', email: 'ventas@yamaha.com.ar', phone: '011-4321-1234' },
    { name: 'Importadora Nautica del Litoral', email: 'info@nautica-litoral.com.ar', phone: '0343-420-0000' },
    { name: 'Distribuidora Bajaj Cuyo', email: 'bajaj-cuyo@distribuidora.com.ar', phone: '0261-450-3300' },
  ]).onConflictDoNothing().returning()
  console.log(`  ✅ ${rows.length} proveedores`)
  return rows
}

async function seedClients() {
  console.log('👥 Creando clientes...')
  const rows = await db.insert(schema.clients).values([
    { name: 'Juan Pablo Gómez', phone: '3436-410001', email: 'jpgomez@gmail.com', dni: '28456789', condicionIva: 'consumidor_final', address: 'Belgrano 325, Crespo' },
    { name: 'María Belén Ríos', phone: '3436-412200', email: 'mbrios@hotmail.com', dni: '31123456', condicionIva: 'consumidor_final', address: 'San Martín 112, Crespo' },
    { name: 'Cooperativa Agrícola Crespo SA', phone: '3436-420000', email: 'admin@coopagricola.com.ar', cuit: '30-70123456-4', condicionIva: 'responsable_inscripto', address: 'Ruta 12 km 5, Crespo' },
    { name: 'Carlos Alejandro Müller', phone: '3436-415555', email: 'camuller@yahoo.com.ar', dni: '25789012', condicionIva: 'consumidor_final', address: 'Urquiza 780, Diamante' },
    { name: 'Luciana Fernanda Torres', phone: '3435-300100', email: 'lftorres@gmail.com', dni: '35001122', condicionIva: 'monotributo', cuit: '27-35001122-7', address: 'Moreno 45, Paraná' },
    { name: 'Roberto Ezequiel Schvarzer', phone: '3436-411800', email: 'rschvarzer@outlook.com', dni: '22678901', condicionIva: 'consumidor_final', address: 'Córdoba 890, Crespo' },
    { name: 'Transportes Del Litoral SRL', phone: '0343-431-2200', email: 'contabilidad@transportesdellitoral.com', cuit: '30-68456789-1', condicionIva: 'responsable_inscripto', address: 'Parque Industrial Paraná, Lote 12' },
    { name: 'Martín Sebastián Kraft', phone: '3436-416700', email: 'mkraft@gmail.com', dni: '29345678', condicionIva: 'monotributo', cuit: '20-29345678-6', address: 'Rivadavia 234, Crespo' },
    { name: 'Florencia Andrea Bianchi', phone: '3435-280500', email: 'fabianchi@gmail.com', dni: '37890123', condicionIva: 'consumidor_final', address: 'Perón 567, Paraná' },
    { name: 'Diego Hernán Ortiz', phone: '3436-413300', email: 'dortiz@hotmail.com', dni: '26112233', condicionIva: 'consumidor_final', address: 'Italia 155, Crespo' },
    { name: 'Agropecuaria Ruta 12 SA', phone: '3435-510000', email: 'gerencia@agroruta12.com.ar', cuit: '30-71234567-8', condicionIva: 'responsable_inscripto', address: 'Ruta 12 km 22, Hernandarias' },
    { name: 'Valentina Soledad Méndez', phone: '3436-417900', email: 'vsmendez@gmail.com', dni: '40234567', condicionIva: 'consumidor_final', address: 'Mitre 78, Crespo' },
  ]).onConflictDoNothing().returning()
  console.log(`  ✅ ${rows.length} clientes`)
  return rows
}

async function seedVehicles() {
  console.log('🏍️  Creando vehículos...')
  const rows = await db.insert(schema.vehicles).values([
    // Motos disponibles
    { type: 'moto', brand: 'Honda', model: 'Wave 110', year: 2025, color: 'Rojo', chassisNumber: 'CH-WAVE-001', engineNumber: 'ENG-WAVE-001', ingresoTipo: 'blanco', costPrice: '1100000', sellPrice: '1450000', status: 'disponible' },
    { type: 'moto', brand: 'Honda', model: 'CG Titan 150', year: 2025, color: 'Negro', chassisNumber: 'CH-TITAN-001', engineNumber: 'ENG-TITAN-001', ingresoTipo: 'blanco', costPrice: '1350000', sellPrice: '1780000', status: 'disponible' },
    { type: 'moto', brand: 'Bajaj', model: 'Rouser NS200', year: 2024, color: 'Azul', chassisNumber: 'CH-NS200-001', engineNumber: 'ENG-NS200-001', ingresoTipo: 'blanco', costPrice: '2200000', sellPrice: '2850000', status: 'disponible' },
    { type: 'moto', brand: 'Yamaha', model: 'YBR 125', year: 2025, color: 'Blanco', chassisNumber: 'CH-YBR125-001', engineNumber: 'ENG-YBR125-001', ingresoTipo: 'blanco', costPrice: '1250000', sellPrice: '1650000', status: 'disponible' },
    { type: 'moto', brand: 'Zanella', model: 'ZB 110', year: 2024, color: 'Gris', chassisNumber: 'CH-ZB110-001', engineNumber: 'ENG-ZB110-001', ingresoTipo: 'negro', costPrice: '750000', sellPrice: '980000', status: 'disponible' },
    { type: 'moto', brand: 'Motomel', model: 'Skua 150', year: 2025, color: 'Verde', chassisNumber: 'CH-SKUA-001', engineNumber: 'ENG-SKUA-001', ingresoTipo: 'negro', costPrice: '980000', sellPrice: '1280000', status: 'disponible' },
    { type: 'moto', brand: 'Corven', model: 'Triax 250', year: 2024, color: 'Naranja', chassisNumber: 'CH-TRIAX-001', engineNumber: 'ENG-TRIAX-001', ingresoTipo: 'blanco', costPrice: '2100000', sellPrice: '2750000', status: 'disponible' },
    { type: 'moto', brand: 'Honda', model: 'XR250 Tornado', year: 2025, color: 'Rojo', chassisNumber: 'CH-XR250-001', engineNumber: 'ENG-XR250-001', ingresoTipo: 'blanco', costPrice: '3800000', sellPrice: '4900000', status: 'disponible' },
    // Motos reservadas
    { type: 'moto', brand: 'Honda', model: 'CG Titan 150', year: 2025, color: 'Rojo', chassisNumber: 'CH-TITAN-002', engineNumber: 'ENG-TITAN-002', ingresoTipo: 'blanco', costPrice: '1350000', sellPrice: '1780000', status: 'reservado' },
    { type: 'moto', brand: 'Yamaha', model: 'YBR 125', year: 2024, color: 'Negro', chassisNumber: 'CH-YBR125-002', engineNumber: 'ENG-YBR125-002', ingresoTipo: 'negro', costPrice: '1100000', sellPrice: '1450000', status: 'reservado' },
    // Lanchas disponibles
    { type: 'lancha', brand: 'Quicksilver', model: '160', year: 2024, color: 'Blanco/Azul', chassisNumber: 'CH-QS160-001', engineNumber: 'ENG-QS160-001', ingresoTipo: 'blanco', costPrice: '9500000', sellPrice: '12500000', status: 'disponible' },
    { type: 'lancha', brand: 'Bayliner', model: '175', year: 2023, color: 'Blanco', chassisNumber: 'CH-BAY175-001', engineNumber: 'ENG-BAY175-001', ingresoTipo: 'blanco', costPrice: '11000000', sellPrice: '14800000', status: 'disponible' },
    { type: 'lancha', brand: 'Albatros', model: 'Magna', year: 2025, color: 'Azul/Blanco', chassisNumber: 'CH-MAGNA-001', engineNumber: 'ENG-MAGNA-001', ingresoTipo: 'blanco', costPrice: '8200000', sellPrice: '10800000', status: 'reservado' },
    // Vehículos vendidos (para historial)
    { type: 'moto', brand: 'Honda', model: 'Wave 110', year: 2024, color: 'Azul', chassisNumber: 'CH-WAVE-002', engineNumber: 'ENG-WAVE-002', ingresoTipo: 'blanco', costPrice: '1000000', sellPrice: '1320000', status: 'vendido' },
    { type: 'lancha', brand: 'Maverick', model: 'Master', year: 2022, color: 'Rojo/Blanco', chassisNumber: 'CH-MASTER-001', engineNumber: 'ENG-MASTER-001', ingresoTipo: 'negro', costPrice: '6800000', sellPrice: '8900000', status: 'vendido' },
  ]).onConflictDoNothing().returning()
  console.log(`  ✅ ${rows.length} vehículos`)
  return rows
}

async function seedProducts(suppliers: typeof schema.suppliers.$inferSelect[]) {
  console.log('🔧 Creando productos accesorios...')
  const honda = suppliers.find(s => s.name.includes('Honda'))
  const yamaha = suppliers.find(s => s.name.includes('Yamaha'))
  const nautical = suppliers.find(s => s.name.includes('Nautica'))
  const bajaj = suppliers.find(s => s.name.includes('Bajaj'))

  // Crear categoría accesorios si no existe
  const [cat] = await db.insert(schema.categories).values({
    name: 'Accesorios',
    slug: 'accesorios',
  }).onConflictDoNothing().returning()

  const catId = cat?.id ?? (await db.select().from(schema.categories).where(sql`slug = 'accesorios'`).limit(1))[0]?.id
  if (!catId) throw new Error('No se pudo obtener/crear categoría accesorios')

  const rows = await db.insert(schema.products).values([
    { code: 'CASC-001', name: 'Casco Integral Shoei NXR2', categoryId: catId, brand: 'Shoei', supplierId: honda?.id, costPrice: '85000', sellPrice: '120000', stock: 5, minStock: 3 },
    { code: 'CASC-002', name: 'Casco Semiabierto LS2 Surfer', categoryId: catId, brand: 'LS2', supplierId: honda?.id, costPrice: '32000', sellPrice: '48000', stock: 8, minStock: 4 },
    { code: 'CASC-003', name: 'Casco Cross Fly Racing Kinetic', categoryId: catId, brand: 'Fly Racing', supplierId: bajaj?.id, costPrice: '55000', sellPrice: '78000', stock: 2, minStock: 3 },
    { code: 'ACE-001', name: 'Aceite 4T Honda 10W-40 1L', categoryId: catId, brand: 'Honda', supplierId: honda?.id, costPrice: '4200', sellPrice: '6500', stock: 24, minStock: 10 },
    { code: 'ACE-002', name: 'Aceite 4T Yamalube 20W-50 1L', categoryId: catId, brand: 'Yamaha', supplierId: yamaha?.id, costPrice: '3800', sellPrice: '5800', stock: 18, minStock: 10 },
    { code: 'BAT-001', name: 'Batería Yuasa YTX7A-BS 12V', categoryId: catId, brand: 'Yuasa', supplierId: honda?.id, costPrice: '18000', sellPrice: '26000', stock: 4, minStock: 3 },
    { code: 'BAT-002', name: 'Batería Moura 12V 9Ah', categoryId: catId, brand: 'Moura', supplierId: bajaj?.id, costPrice: '14000', sellPrice: '20000', stock: 1, minStock: 3 },
    { code: 'NEU-001', name: 'Cubierta Pirelli MT60 RS 130/80-17', categoryId: catId, brand: 'Pirelli', supplierId: honda?.id, costPrice: '28000', sellPrice: '40000', stock: 6, minStock: 4 },
    { code: 'NEU-002', name: 'Cubierta Dunlop TT100 100/90-18', categoryId: catId, brand: 'Dunlop', supplierId: yamaha?.id, costPrice: '22000', sellPrice: '32000', stock: 3, minStock: 4 },
    { code: 'KIT-001', name: 'Kit Arrastre Moto Honda', categoryId: catId, brand: 'Honda', supplierId: honda?.id, costPrice: '12000', sellPrice: '18000', stock: 7, minStock: 2 },
    { code: 'FAR-001', name: 'Faro LED Universal H4 35W', categoryId: catId, brand: 'Genérico', supplierId: bajaj?.id, costPrice: '8500', sellPrice: '13000', stock: 0, minStock: 2 },
    { code: 'FAR-002', name: 'Balizas LED Nauticas Par', categoryId: catId, brand: 'Perko', supplierId: nautical?.id, costPrice: '15000', sellPrice: '22000', stock: 3, minStock: 2 },
    { code: 'CHALECO-001', name: 'Chaleco Salvavidas Homologado', categoryId: catId, brand: 'Plastimo', supplierId: nautical?.id, costPrice: '9800', sellPrice: '14500', stock: 5, minStock: 3 },
    { code: 'MANT-001', name: 'Filtro Aceite Honda GY6', categoryId: catId, brand: 'Honda', supplierId: honda?.id, costPrice: '1800', sellPrice: '2800', stock: 12, minStock: 5 },
    { code: 'MANT-002', name: 'Bujía NGK CR7HSA', categoryId: catId, brand: 'NGK', supplierId: bajaj?.id, costPrice: '1200', sellPrice: '1900', stock: 1, minStock: 5 },
  ]).onConflictDoNothing().returning()
  console.log(`  ✅ ${rows.length} productos`)
  return rows
}

async function seedSales(userId: number, clients: typeof schema.clients.$inferSelect[], vehicles: typeof schema.vehicles.$inferSelect[]) {
  console.log('💰 Creando ventas...')
  const disponibles = vehicles.filter(v => v.status === 'disponible')
  const vendidos = vehicles.filter(v => v.status === 'vendido')

  const salesData = [
    // Venta 1: contado mix blanco/negro efectivo
    {
      sale: {
        clientId: clients[0].id, userId, type: 'contado' as const, invoiceType: 'X' as const,
        subtotal: '2500000', discount: '0', interestRate: '0', total: '2500000',
        amountFormal: '1500000', amountInformal: '1000000', paymentMethod: 'efectivo' as const, status: 'completado' as const,
        saleNumber: 'V-2026-001', notes: 'Pago mix blanco/negro en efectivo',
      },
      items: [{ vehicleId: disponibles[0]?.id, description: `${disponibles[0]?.brand} ${disponibles[0]?.model} ${disponibles[0]?.year}`, quantity: 1, unitPrice: '2500000', subtotal: '2500000', ingresoTipo: 'mixto' }],
      installments: [],
    },
    // Venta 2: contado mix blanco/negro transferencia
    {
      sale: {
        clientId: clients[1].id, userId, type: 'contado' as const, invoiceType: 'X' as const,
        subtotal: '1780000', discount: '0', interestRate: '0', total: '1780000',
        amountFormal: '1200000', amountInformal: '580000', paymentMethod: 'transferencia' as const, status: 'completado' as const,
        saleNumber: 'V-2026-002', notes: 'Transferencia mix blanco/negro',
      },
      items: [{ vehicleId: disponibles[1]?.id, description: `${disponibles[1]?.brand} ${disponibles[1]?.model} ${disponibles[1]?.year}`, quantity: 1, unitPrice: '1780000', subtotal: '1780000', ingresoTipo: 'mixto' }],
      installments: [],
    },
    // Venta 3: cuotas pesos 12 cuotas 5% TEM
    {
      sale: {
        clientId: clients[2].id, userId, type: 'cuotas' as const, invoiceType: 'A' as const,
        subtotal: '3000000', discount: '0', interestRate: '5', total: '3000000',
        amountFormal: '3000000', amountInformal: '0', paymentMethod: 'transferencia' as const, status: 'completado' as const,
        financingCurrency: 'pesos', saleNumber: 'V-2026-003', notes: '12 cuotas en pesos TEM 5%',
      },
      items: [{ vehicleId: disponibles[2]?.id, description: `${disponibles[2]?.brand} ${disponibles[2]?.model} ${disponibles[2]?.year}`, quantity: 1, unitPrice: '3000000', subtotal: '3000000', ingresoTipo: 'blanco' }],
      installments: Array.from({ length: 12 }, (_, i) => ({
        number: i + 1,
        amount: '267549', // ~3M * factor anualidad francesa 5% TEM 12 cuotas
        dueDate: daysFrom((i + 1) * 30),
        status: 'pendiente' as const,
      })),
    },
    // Venta 4: cuotas pesos 18 cuotas 5% TEM
    {
      sale: {
        clientId: clients[3].id, userId, type: 'cuotas' as const, invoiceType: 'X' as const,
        subtotal: '4500000', discount: '0', interestRate: '5', total: '4500000',
        amountFormal: '2500000', amountInformal: '2000000', paymentMethod: 'efectivo' as const, status: 'completado' as const,
        financingCurrency: 'pesos', saleNumber: 'V-2026-004', notes: '18 cuotas en pesos TEM 5%',
      },
      items: [{ vehicleId: disponibles[3]?.id, description: `${disponibles[3]?.brand} ${disponibles[3]?.model} ${disponibles[3]?.year}`, quantity: 1, unitPrice: '4500000', subtotal: '4500000', ingresoTipo: 'mixto' }],
      installments: Array.from({ length: 18 }, (_, i) => ({
        number: i + 1,
        amount: '356789',
        dueDate: daysFrom((i + 1) * 30),
        status: 'pendiente' as const,
      })),
    },
    // Venta 5: cuotas USD 6 cuotas 3% TEM
    {
      sale: {
        clientId: clients[4].id, userId, type: 'cuotas' as const, invoiceType: 'X' as const,
        subtotal: '8120000', discount: '0', interestRate: '3', total: '8120000',
        amountFormal: '0', amountInformal: '8120000', paymentMethod: 'efectivo' as const, status: 'completado' as const,
        financingCurrency: 'usd', saleNumber: 'V-2026-005', notes: '6 cuotas USD (U$D 8000 equiv)',
      },
      items: [{ vehicleId: disponibles[4]?.id, description: `${disponibles[4]?.brand} ${disponibles[4]?.model} ${disponibles[4]?.year}`, quantity: 1, unitPrice: '8120000', subtotal: '8120000', ingresoTipo: 'negro' }],
      installments: Array.from({ length: 6 }, (_, i) => ({
        number: i + 1,
        amount: '1453000',
        dueDate: daysFrom((i + 1) * 30),
        status: 'pendiente' as const,
      })),
    },
    // Venta 6: cuotas USD 24 cuotas 3% TEM
    {
      sale: {
        clientId: clients[5].id, userId, type: 'cuotas' as const, invoiceType: 'X' as const,
        subtotal: '15225000', discount: '0', interestRate: '3', total: '15225000',
        amountFormal: '5000000', amountInformal: '10225000', paymentMethod: 'efectivo' as const, status: 'completado' as const,
        financingCurrency: 'usd', saleNumber: 'V-2026-006', notes: '24 cuotas USD (U$D 15000 equiv)',
      },
      items: [{ vehicleId: disponibles[5]?.id, description: `${disponibles[5]?.brand} ${disponibles[5]?.model} ${disponibles[5]?.year}`, quantity: 1, unitPrice: '15225000', subtotal: '15225000', ingresoTipo: 'mixto' }],
      installments: Array.from({ length: 24 }, (_, i) => ({
        number: i + 1,
        amount: '890000',
        dueDate: daysFrom((i + 1) * 30),
        status: 'pendiente' as const,
      })),
    },
    // Venta 7: cuotas interés simple (interestRate=0)
    {
      sale: {
        clientId: clients[6].id, userId, type: 'cuotas' as const, invoiceType: 'X' as const,
        subtotal: '2750000', discount: '0', interestRate: '0', total: '2750000',
        amountFormal: '2750000', amountInformal: '0', paymentMethod: 'transferencia' as const, status: 'completado' as const,
        saleNumber: 'V-2026-007', notes: 'Cuotas sin interés',
      },
      items: [{ vehicleId: disponibles[6]?.id, description: `${disponibles[6]?.brand} ${disponibles[6]?.model} ${disponibles[6]?.year}`, quantity: 1, unitPrice: '2750000', subtotal: '2750000', ingresoTipo: 'blanco' }],
      installments: Array.from({ length: 10 }, (_, i) => ({
        number: i + 1,
        amount: '275000',
        dueDate: daysFrom((i + 1) * 30),
        status: 'pendiente' as const,
      })),
    },
    // Venta 8: factura tipo A responsable inscripto
    {
      sale: {
        clientId: clients[10].id, userId, type: 'contado' as const, invoiceType: 'A' as const,
        subtotal: '4900000', discount: '0', interestRate: '0', total: '4900000',
        amountFormal: '4900000', amountInformal: '0', paymentMethod: 'transferencia' as const, status: 'completado' as const,
        saleNumber: 'V-2026-008', notes: 'Factura A responsable inscripto',
      },
      items: [{ vehicleId: disponibles[7]?.id, description: `${disponibles[7]?.brand} ${disponibles[7]?.model} ${disponibles[7]?.year}`, quantity: 1, unitPrice: '4900000', subtotal: '4900000', ingresoTipo: 'blanco' }],
      installments: [],
    },
  ]

  const createdSales: (typeof schema.sales.$inferSelect)[] = []

  for (const data of salesData) {
    const [sale] = await db.insert(schema.sales).values(data.sale).returning()
    createdSales.push(sale)

    if (data.items.length > 0) {
      await db.insert(schema.saleItems).values(data.items.map(item => ({ ...item, saleId: sale.id })))
    }
    if (data.installments.length > 0) {
      await db.insert(schema.installments).values(data.installments.map(inst => ({ ...inst, saleId: sale.id })))
    }
  }

  console.log(`  ✅ ${createdSales.length} ventas`)

  // Poner cuotas vencidas en ventas 3 y 4
  const sale3 = createdSales[2]
  const sale4 = createdSales[3]

  if (sale3) {
    const inst3 = await db.select().from(schema.installments)
      .where(sql`sale_id = ${sale3.id}`)
      .orderBy(schema.installments.number)
      .limit(2)
    for (const inst of inst3) {
      const pastDate = inst.number === 1 ? daysAgo(30) : daysAgo(15)
      await db.update(schema.installments)
        .set({ dueDate: pastDate, status: 'pendiente' })
        .where(sql`id = ${inst.id}`)
    }
    console.log(`  ⚠️  2 cuotas venta V-2026-003 marcadas como vencidas (ids: ${inst3.map(i => i.id).join(', ')})`)
  }

  if (sale4) {
    const inst4 = await db.select().from(schema.installments)
      .where(sql`sale_id = ${sale4.id}`)
      .orderBy(schema.installments.number)
      .limit(2)
    for (const inst of inst4) {
      const pastDate = inst.number === 1 ? daysAgo(45) : daysAgo(20)
      await db.update(schema.installments)
        .set({ dueDate: pastDate, status: 'pendiente' })
        .where(sql`id = ${inst.id}`)
    }
    console.log(`  ⚠️  2 cuotas venta V-2026-004 marcadas como vencidas (ids: ${inst4.map(i => i.id).join(', ')})`)
  }

  return createdSales
}

async function seedReservations(userId: number, clients: typeof schema.clients.$inferSelect[]) {
  console.log('📋 Creando reservas...')
  const rows = await db.insert(schema.reservations).values([
    // 3 vigentes
    {
      reservationNumber: 'R-2026-001', userId,
      clientId: clients[7].id, clientName: 'Martín Sebastián Kraft',
      clientDni: '29345678', clientAddress: 'Rivadavia 234, Crespo', clientPhone: '3436-416700',
      vehicleType: 'moto', brand: 'Honda', model: 'CG Titan 150', year: 2025, color: 'Negro',
      motorNumber: 'ENG-TITAN-002', chassisNumber: 'CH-TITAN-002',
      price: '1780000', depositAmount: '300000',
      status: 'vigente', createdAt: daysAgo(5),
    },
    {
      reservationNumber: 'R-2026-002', userId,
      clientId: clients[8].id, clientName: 'Florencia Andrea Bianchi',
      clientDni: '37890123', clientAddress: 'Perón 567, Paraná', clientPhone: '3435-280500',
      spouseName: 'Hernán Bianchi', spouseDni: '36001234',
      vehicleType: 'moto', brand: 'Yamaha', model: 'YBR 125', year: 2024, color: 'Negro',
      motorNumber: 'ENG-YBR125-002', chassisNumber: 'CH-YBR125-002',
      price: '1450000', depositAmount: '250000',
      status: 'vigente', createdAt: daysAgo(15),
    },
    {
      // Vigente hace más de 30 días → debe aparecer en alertas
      reservationNumber: 'R-2026-003', userId,
      clientId: clients[9].id, clientName: 'Diego Hernán Ortiz',
      clientDni: '26112233', clientAddress: 'Italia 155, Crespo', clientPhone: '3436-413300',
      vehicleType: 'lancha', brand: 'Albatros', model: 'Magna', year: 2025, color: 'Azul/Blanco',
      motorNumber: 'ENG-MAGNA-001', chassisNumber: 'CH-MAGNA-001',
      price: '10800000', depositAmount: '2000000',
      status: 'vigente', createdAt: daysAgo(35),
    },
    // 2 concretadas
    {
      reservationNumber: 'R-2026-004', userId,
      clientId: clients[0].id, clientName: 'Juan Pablo Gómez',
      clientDni: '28456789', clientAddress: 'Belgrano 325, Crespo', clientPhone: '3436-410001',
      vehicleType: 'moto', brand: 'Honda', model: 'Wave 110', year: 2024, color: 'Azul',
      motorNumber: 'ENG-WAVE-002', chassisNumber: 'CH-WAVE-002',
      price: '1320000', depositAmount: '200000',
      status: 'concretada', createdAt: daysAgo(60),
    },
    {
      reservationNumber: 'R-2026-005', userId,
      clientId: clients[1].id, clientName: 'María Belén Ríos',
      clientDni: '31123456', clientAddress: 'San Martín 112, Crespo', clientPhone: '3436-412200',
      vehicleType: 'lancha', brand: 'Maverick', model: 'Master', year: 2022, color: 'Rojo/Blanco',
      motorNumber: 'ENG-MASTER-001', chassisNumber: 'CH-MASTER-001',
      price: '8900000', depositAmount: '1500000',
      status: 'concretada', createdAt: daysAgo(45),
    },
    // 1 cancelada
    {
      reservationNumber: 'R-2026-006', userId,
      clientId: clients[11].id, clientName: 'Valentina Soledad Méndez',
      clientDni: '40234567', clientAddress: 'Mitre 78, Crespo', clientPhone: '3436-417900',
      vehicleType: 'moto', brand: 'Corven', model: 'Triax 250', year: 2024, color: 'Naranja',
      motorNumber: 'ENG-TRIAX-001', chassisNumber: 'CH-TRIAX-001',
      price: '2750000', depositAmount: '0',
      status: 'cancelada', createdAt: daysAgo(20),
    },
  ]).onConflictDoNothing().returning()
  console.log(`  ✅ ${rows.length} reservas`)
  return rows
}

async function seedPurchaseOrders(userId: number, suppliers: typeof schema.suppliers.$inferSelect[]) {
  console.log('🛒 Creando órdenes de compra...')
  const honda = suppliers.find(s => s.name.includes('Honda'))
  const yamaha = suppliers.find(s => s.name.includes('Yamaha'))
  const bajaj = suppliers.find(s => s.name.includes('Bajaj'))
  const nautica = suppliers.find(s => s.name.includes('Nautica'))

  const orders = [
    {
      order: { supplierId: honda?.id, userId, status: 'borrador' as const, total: '180000', amountFormal: '180000', amountInformal: '0', notes: 'Pedido inicial de accesorios Honda' },
      items: [
        { description: 'Aceite Honda 10W-40 1L x24 unidades', quantity: 24, unitPrice: '4200', subtotal: '100800' },
        { description: 'Filtro Aceite Honda GY6 x20 unidades', quantity: 20, unitPrice: '1800', subtotal: '36000' },
        { description: 'Bujía NGK CR7HSA x20 unidades', quantity: 20, unitPrice: '1200', subtotal: '24000' },
        { description: 'Kit Arrastre Honda x2 unidades', quantity: 2, unitPrice: '12000', subtotal: '24000' },
      ],
    },
    {
      order: { supplierId: honda?.id, userId, status: 'enviada' as const, total: '2750000', amountFormal: '2000000', amountInformal: '750000', expectedDate: daysFrom(15), notes: 'Reposición motos Honda — enviada proveedor' },
      items: [
        { description: 'Honda CG Titan 150 x1', quantity: 1, unitPrice: '1350000', subtotal: '1350000' },
        { description: 'Honda Wave 110 x1', quantity: 1, unitPrice: '1100000', subtotal: '1100000' },
        { description: 'Cascos Integrales Shoei x3', quantity: 3, unitPrice: '100000', subtotal: '300000' },
      ],
    },
    {
      order: { supplierId: yamaha?.id, userId, status: 'enviada' as const, total: '1850000', amountFormal: '1850000', amountInformal: '0', expectedDate: daysFrom(20), notes: 'Pedido Yamaha — enviado, pendiente recepción' },
      items: [
        { description: 'Yamaha YBR 125 x1', quantity: 1, unitPrice: '1250000', subtotal: '1250000' },
        { description: 'Aceite Yamalube 20W-50 x24', quantity: 24, unitPrice: '3800', subtotal: '91200' },
        { description: 'Cubiertas Dunlop TT100 x4', quantity: 4, unitPrice: '22000', subtotal: '88000' },
        { description: 'Cascos LS2 Surfer x6', quantity: 6, unitPrice: '32000', subtotal: '192000' },
      ],
    },
    {
      order: { supplierId: nautica?.id, userId, status: 'recibida' as const, total: '640000', amountFormal: '350000', amountInformal: '290000', receivedAt: daysAgo(10), notes: 'Recibida. Stock actualizado.' },
      items: [
        { description: 'Chalecos Salvavidas Plastimo x8', quantity: 8, unitPrice: '9800', subtotal: '78400' },
        { description: 'Balizas LED Nauticas x10 pares', quantity: 10, unitPrice: '15000', subtotal: '150000' },
        { description: 'Repuestos varios nautica', quantity: 1, unitPrice: '411600', subtotal: '411600' },
      ],
    },
  ]

  const createdOrders = []
  for (const data of orders) {
    const [order] = await db.insert(schema.purchaseOrders).values(data.order).returning()
    await db.insert(schema.purchaseOrderItems).values(data.items.map(item => ({ ...item, orderId: order.id })))
    createdOrders.push(order)
  }
  console.log(`  ✅ ${createdOrders.length} órdenes de compra`)
  return createdOrders
}

async function seedReminders(userId: number) {
  console.log('🔔 Creando recordatorios...')
  const rows = await db.insert(schema.reminders).values([
    { userId, type: 'impuesto', title: 'Monotributo Categoría D', description: 'Pago mensual monotributo cat. D', dueDate: daysFrom(5), amount: '52000', status: 'pendiente', recurrence: 'mensual' },
    { userId, type: 'impuesto', title: 'IIBB Entre Ríos', description: 'Ingresos Brutos provincia Entre Ríos', dueDate: daysAgo(2), amount: '78000', status: 'vencido', recurrence: 'mensual' },
    { userId, type: 'impuesto', title: 'IVA Mensual', description: 'Declaración jurada IVA', dueDate: daysFrom(20), amount: '180000', status: 'pendiente', recurrence: 'mensual' },
    { userId, type: 'impuesto', title: 'Ganancias Persona Jurídica', description: 'Pago anticipado ganancias', dueDate: daysFrom(60), amount: '850000', status: 'pendiente', recurrence: 'anual' },
    { userId, type: 'impuesto', title: 'Tasa Municipal Crespo', description: 'Tasa habilitación local', dueDate: daysFrom(12), amount: '34000', status: 'pendiente', recurrence: 'trimestral' },
    { userId, type: 'factura', title: 'Factura Honda Argentina #A-0001-00012345', description: 'Factura pendiente de pago proveedor Honda', dueDate: daysAgo(7), amount: '1450000', status: 'vencido', recurrence: 'ninguna' },
    { userId, type: 'factura', title: 'Factura Edenor', description: 'Servicio eléctrico local', dueDate: daysFrom(3), amount: '89000', status: 'pendiente', recurrence: 'mensual' },
    { userId, type: 'vencimiento', title: 'Patente Moto Demo', description: 'Patente moto de demostración', dueDate: daysFrom(45), amount: '24000', status: 'pendiente', recurrence: 'anual' },
    { userId, type: 'vencimiento', title: 'Seguro Local', description: 'Póliza seguro incendio y robo local comercial', dueDate: daysFrom(90), amount: '180000', status: 'pendiente', recurrence: 'anual' },
    { userId, type: 'otro', title: 'Renovar Habilitación Municipal', description: 'Habilitación comercial municipio Crespo', dueDate: NOW, amount: null, status: 'pendiente', recurrence: 'ninguna' },
  ]).onConflictDoNothing().returning()
  console.log(`  ✅ ${rows.length} recordatorios`)
  return rows
}

async function seedExpenses(userId: number) {
  console.log('💸 Creando gastos...')
  const rows = await db.insert(schema.expenses).values([
    { userId, category: 'alquiler', description: 'Alquiler local comercial Crespo mayo', amount: '450000', date: daysAgo(5) },
    { userId, category: 'sueldos', description: 'Sueldos personal mayo (2 empleados)', amount: '820000', date: daysAgo(5) },
    { userId, category: 'servicios', description: 'Edenor + EDEN mayo', amount: '89000', date: daysAgo(10) },
    { userId, category: 'otros', description: 'Combustible camioneta reparto', amount: '32000', date: daysAgo(12) },
    { userId, category: 'compras', description: 'Materiales limpieza y embalaje', amount: '18500', date: daysAgo(20) },
  ]).returning()
  console.log(`  ✅ ${rows.length} gastos`)
  return rows
}

async function seed() {
  console.log('\n🌱 SpeedMotors — Seed de Testing Exhaustivo\n')

  const userId = await getAdminId()
  console.log(`  Admin userId: ${userId}`)

  const suppliers = await seedSuppliers(userId)
  const clients = await seedClients()
  const vehicles = await seedVehicles()
  await seedProducts(suppliers)
  const sales = await seedSales(userId, clients, vehicles)
  await seedReservations(userId, clients)
  await seedPurchaseOrders(userId, suppliers)
  await seedReminders(userId)
  await seedExpenses(userId)

  console.log('\n🎉 Seed completado!\n')
  console.log('Resumen:')
  console.log(`  ✓ ${suppliers.length} proveedores`)
  console.log(`  ✓ ${clients.length} clientes`)
  console.log(`  ✓ ${vehicles.length} vehículos (10 motos + 5 lanchas)`)
  console.log(`  ✓ 15 productos accesorios`)
  console.log(`  ✓ ${sales.length} ventas (4 financiadas, 2 con cuotas vencidas)`)
  console.log(`  ✓ 6 reservas (3 vigentes, 2 concretadas, 1 cancelada)`)
  console.log(`  ✓ 4 órdenes de compra (1 borrador, 2 enviadas, 1 recibida)`)
  console.log(`  ✓ 10 recordatorios (2 vencidos, varios próximos)`)
  console.log(`  ✓ 5 gastos del último mes`)
  console.log('\nValidaciones esperadas:')
  console.log('  → /alerts: critical >= 3 (IIBB vencido, factura Honda vencida, cuotas vencidas)')
  console.log('  → /sales: ventas V-2026-003/004/005/006 muestran panel amortización')
  console.log('  → /reservations: 3 vigentes visibles')
  console.log('  → /reports: split blanco/negro con porcentajes')

  await pool.end()
}

seed().catch(err => {
  console.error('\n❌ Error en seed:', err)
  process.exit(1)
})
