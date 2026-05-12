import { jsPDF } from '../node_modules/jspdf/dist/jspdf.node.js'
import { writeFileSync } from 'fs'

const doc = new jsPDF({ unit: 'mm', format: 'a4' })
const W = 210
const H = 297
const m = 18
let y = 0

const navy  = [15, 23, 42]
const blue  = [29, 78, 216]
const blue2 = [59, 130, 246]
const gray  = [100, 116, 139]
const lgray = [241, 245, 249]
const white = [255, 255, 255]
const green = [22, 163, 74]
const lgreen = [240, 253, 244]

function header() {
  // Franja azul top
  doc.setFillColor(...blue)
  doc.rect(0, 0, W, 42, 'F')

  // Acento lateral
  doc.setFillColor(...blue2)
  doc.rect(0, 0, 5, 42, 'F')

  doc.setTextColor(...white)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(24)
  doc.text('SpeedMotors', m + 2, 18)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Sistema de gestión integral para concesionaria', m + 2, 26)

  doc.setFontSize(8.5)
  doc.setTextColor(186, 230, 253)
  doc.text('Crespo, Entre Ríos', m + 2, 33)

  // Bloque PRESUPUESTO derecha
  doc.setFillColor(...white)
  doc.roundedRect(W - m - 44, 8, 44, 26, 3, 3, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...blue)
  doc.text('PRESUPUESTO', W - m - 22, 17, { align: 'center' })
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...gray)
  doc.text('Mayo 2026', W - m - 22, 23, { align: 'center' })
  doc.text('Válido 30 días', W - m - 22, 29, { align: 'center' })

  y = 52
}

function sectionTitle(title) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(...blue)
  doc.text(title.toUpperCase(), m, y)
  // línea decorativa
  doc.setDrawColor(...blue)
  doc.setLineWidth(0.5)
  doc.line(m, y + 2, W - m, y + 2)
  y += 8
}

// ══════════════════════════════════════════════════
// PÁGINA 1
// ══════════════════════════════════════════════════
header()

// ── MÓDULOS ──
sectionTitle('Módulos incluidos')

const modulos = [
  ['Motos y Lanchas',    'Stock de vehículos, estados, QR, importación por remito con IA'],
  ['Productos',          'Catálogo con stock automático, filtros, exportación PDF/CSV/Excel'],
  ['Ventas',             'Registro completo, cuotas, formas de pago, comprobante PDF'],
  ['Clientes',           'Cuenta corriente, historial de pagos y saldo en tiempo real'],
  ['Presupuestos',       'Cotizaciones con vencimiento, conversión a venta con un clic'],
  ['Reservas',           'Solicitudes formales con documento PDF para firma'],
  ['Proveedores',        'Registro y órdenes de compra con recepción automática de stock'],
  ['Gastos',             'Control de egresos por categoría con totales y filtros'],
  ['Caja',               'Apertura y cierre diario con diferencias declaradas vs. esperadas'],
  ['Transferencias',     'Seguimiento de trámites de dominio por etapas'],
  ['Cuotas',             'Panel de cobranza con vencidas y próximas a vencer'],
  ['Alertas',            'Recordatorios, vencimientos automáticos y avisos de stock'],
  ['Reportes',           'Dashboard gerencial con KPIs y comparación de períodos'],
  ['Usuarios',           'Roles administrador / vendedor con permisos diferenciados'],
  ['Escaneo con IA',     'Lectura automática de DNI, títulos vehiculares y comprobantes'],
  ['Importación Excel',  'Carga masiva de productos desde planilla de cálculo'],
]

const rowH = 10.2
const nameW = 50

modulos.forEach(([nombre, desc], i) => {
  doc.setFillColor(...(i % 2 === 0 ? lgray : white))
  doc.rect(m, y - 3.5, W - m * 2, rowH, 'F')

  // dot accent
  doc.setFillColor(...blue2)
  doc.circle(m + 2, y + 1.5, 1, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(...navy)
  doc.text(nombre, m + 6, y + 2)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...gray)
  doc.text(desc, m + nameW, y + 2)

  y += rowH
})

// ══════════════════════════════════════════════════
// PÁGINA 2
// ══════════════════════════════════════════════════
doc.addPage()
header()

// ── PRECIO ──
doc.setFillColor(...navy)
doc.roundedRect(m, y, W - m * 2, 20, 4, 4, 'F')

doc.setTextColor(...white)
doc.setFont('helvetica', 'bold')
doc.setFontSize(11)
doc.text('PRECIO TOTAL', m + 8, y + 8)
doc.setFontSize(9)
doc.setFont('helvetica', 'normal')
doc.setTextColor(186, 230, 253)
doc.text('Sistema completo · todos los módulos', m + 8, y + 14)

doc.setFont('helvetica', 'bold')
doc.setFontSize(22)
doc.setTextColor(...white)
doc.text('U$D 1.500', W - m - 6, y + 13, { align: 'right' })

y += 28

// ── CUOTAS ──
sectionTitle('Opciones de pago')

const cuotas = [
  ['Contado',  'U$D 1.500  —  pago único'],
  ['2 cuotas', 'U$D 800 al inicio  +  U$D 700 a la entrega'],
  ['3 cuotas', 'U$D 500  ×  3 meses'],
  ['4 cuotas', 'U$D 400  ×  4 meses'],
  ['5 cuotas', 'U$D 320  ×  5 meses'],
]

cuotas.forEach(([op, det], i) => {
  doc.setFillColor(...(i % 2 === 0 ? lgray : white))
  doc.rect(m, y - 3.5, W - m * 2, 10, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...navy)
  doc.text(op, m + 4, y + 2)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...gray)
  doc.text(det, m + 34, y + 2)

  y += 10
})

doc.setFont('helvetica', 'italic')
doc.setFontSize(8)
doc.setTextColor(...gray)
y += 3
doc.text('Pagos en efectivo, transferencia bancaria o USDT. Valores en dólares billete.', m, y)

y += 14

// ── INCLUYE ──
sectionTitle('¿Qué incluye?')

const incluye = [
  'Sistema funcionando en producción, accesible desde PC, tablet y celular',
  '3 meses de soporte técnico y corrección de errores sin costo adicional',
  'Actualizaciones y mejoras sobre los módulos incluidos',
  'Nuevas funcionalidades que surjan durante el período de soporte',
]

doc.setFillColor(...lgreen)
doc.roundedRect(m, y - 4, W - m * 2, incluye.length * 10 + 10, 4, 4, 'F')
doc.setDrawColor(...green)
doc.setLineWidth(0.4)
doc.roundedRect(m, y - 4, W - m * 2, incluye.length * 10 + 10, 4, 4, 'S')

// barra verde izquierda
doc.setFillColor(...green)
doc.roundedRect(m, y - 4, 4, incluye.length * 10 + 10, 4, 4, 'F')

incluye.forEach(item => {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...green)
  doc.text('✓', m + 8, y + 2)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...navy)
  doc.text(item, m + 15, y + 2)
  y += 10
})

y += 12

// ── FOOTER ──
doc.setFillColor(...lgray)
doc.rect(0, H - 16, W, 16, 'F')
doc.setDrawColor(...blue2)
doc.setLineWidth(0.5)
doc.line(0, H - 16, W, H - 16)

doc.setFont('helvetica', 'normal')
doc.setFontSize(8)
doc.setTextColor(...gray)
doc.text('Este presupuesto es válido por 30 días desde su emisión.', W / 2, H - 9, { align: 'center' })
doc.text('SpeedMotors · Crespo, Entre Ríos · Mayo 2026', W / 2, H - 4, { align: 'center' })

// ── GUARDAR ──
const output = doc.output('arraybuffer')
writeFileSync('/mnt/c/Users/coco/Desktop/presupuesto-speedmotors.pdf', Buffer.from(output))
console.log('✓ Listo: presupuesto-speedmotors.pdf en el escritorio')
