import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { useAuth } from '../../hooks/useAuth'

const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/products': 'Productos',
  '/vehicles': 'Motos y Lanchas',
  '/clients': 'Clientes',
  '/sales': 'Ventas',
  '/installments': 'Cuotas',
  '/quotes': 'Presupuestos',
  '/cash': 'Caja',
  '/stock-movements': 'Movimientos de stock',
  '/expenses': 'Gastos',
  '/reports': 'Reportes',
  '/settings': 'Configuración',
  '/suppliers': 'Proveedores',
  '/purchase-orders': 'Órdenes de compra',
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function todayStr() {
  return new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function AppLayout() {
  const { user } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const title = routeTitles[location.pathname] || ''

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* Header */}
        <header style={{
          height: '52px', background: 'white', borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', flexShrink: 0,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          gap: '12px',
        }}>
          {/* Hamburger (mobile) + breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <button
              onClick={() => setSidebarOpen(true)}
              className="hamburger-btn"
              style={{
                display: 'none', background: 'none', border: 'none', cursor: 'pointer',
                color: '#64748b', padding: '4px', borderRadius: '6px', flexShrink: 0,
              }}
            >
              <Menu size={22} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <span className="hide-mobile" style={{ fontSize: '13px', color: '#94a3b8', whiteSpace: 'nowrap' }}>Speed Motors</span>
              {title && (
                <>
                  <span className="hide-mobile" style={{ color: '#e2e8f0', fontSize: '13px' }}>/</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
                </>
              )}
            </div>
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <span className="hide-mobile" style={{ fontSize: '12.5px', color: '#94a3b8', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
              {todayStr()}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: '11px', fontWeight: 700, flexShrink: 0,
              }}>
                {user.name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()}
              </div>
              <div style={{ lineHeight: 1.2 }} className="hide-mobile">
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>{greeting()}, {user.name.split(' ')[0]}</div>
                <div style={{ fontSize: '10.5px', color: '#94a3b8', textTransform: 'capitalize' }}>{user.role}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ padding: '20px 16px', maxWidth: '1200px' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
