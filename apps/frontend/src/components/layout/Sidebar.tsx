import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Package, Bike, Users,
  ShoppingCart, CreditCard, FileText, Wallet,
  ArrowLeftRight, Receipt, BarChart2, Settings, LogOut, X, Truck, ClipboardList, BookMarked, Bell, FileCheck, UserCog, HandCoins, Anchor, Store, CalendarClock, Calculator,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useAlertsCount } from '../../hooks/useAlerts'

const groups = [
  {
    items: [{ to: '/', icon: LayoutDashboard, label: 'Dashboard' }],
  },
  {
    label: 'INVENTARIO',
    items: [
      { to: '/products', icon: Package, label: 'Productos' },
      { to: '/vehicles', icon: Bike, label: 'Motos y Lanchas' },
      { to: '/suppliers', icon: Truck, label: 'Proveedores' },
      { to: '/purchase-orders', icon: ClipboardList, label: 'Órdenes de compra' },
    ],
  },
  {
    label: 'CLIENTES Y VENTAS',
    items: [
      { to: '/clients', icon: Users, label: 'Clientes' },
      { to: '/sales', icon: ShoppingCart, label: 'Ventas' },
      { to: '/installments', icon: CreditCard, label: 'Cuotas' },
      { to: '/credits', icon: HandCoins, label: 'Créditos' },
      { to: '/quotes', icon: FileText, label: 'Presupuestos' },
      { to: '/reservations', icon: BookMarked, label: 'Solicitudes de Reserva' },
      { to: '/transfers', icon: FileCheck, label: 'Transferencias' },
    ],
  },
  {
    label: 'GUARDERÍA',
    items: [
      { to: '/guarderia', icon: Anchor, label: 'Guardería' },
      { to: '/turnera', icon: CalendarClock, label: 'Turnera' },
      { to: '/proveeduria', icon: Store, label: 'Proveeduría' },
    ],
  },
  {
    label: 'FINANZAS',
    items: [
      { to: '/cash', icon: Wallet, label: 'Caja' },
      { to: '/expenses', icon: Receipt, label: 'Gastos' },
      { to: '/reports', icon: BarChart2, label: 'Reportes' },
    ],
  },
  {
    label: 'SISTEMA',
    items: [
      { to: '/alerts', icon: Bell, label: 'Alertas' },
      { to: '/stock-movements', icon: ArrowLeftRight, label: 'Movimientos stock' },
      { to: '/settings', icon: Settings, label: 'Configuración' },
    ],
  },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth()
  const alertsCount = useAlertsCount()
  const visibleGroups = groups.map(group => group.label === 'INVENTARIO' && user.role === 'admin'
    ? { ...group, items: [...group.items, { to: '/stock-valuation', icon: Calculator, label: 'Valuación de stock' }] }
    : group)

  function logout() {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  function initials(name: string) {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  }

  const sidebarContent = (
    <aside style={{
      width: '232px', minWidth: '232px', height: '100%',
      background: '#0f172a', display: 'flex', flexDirection: 'column',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', boxShadow: '0 4px 12px rgba(59,130,246,0.35)',
          }}>🏍️</div>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: '14px', lineHeight: 1.2 }}>Speed Motors</div>
            <div style={{ color: '#475569', fontSize: '11px' }}>Crespo, Entre Ríos</div>
          </div>
        </div>
        {/* Botón cerrar en mobile */}
        <button onClick={onClose} style={{ display: 'none', background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: '4px' }} className="sidebar-close">
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {(user.role === 'admin'
          ? [...visibleGroups, { label: 'ADMIN', items: [{ to: '/users', icon: UserCog, label: 'Usuarios' }] }]
          : visibleGroups.map(g => ({ ...g, items: g.items.filter(i => i.to !== '/reports') }))
        ).map((group, gi) => (
          <div key={gi} style={{ marginBottom: '4px' }}>
            {group.label && (
              <div style={{ padding: '10px 10px 4px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', color: '#334155', textTransform: 'uppercase' }}>
                {group.label}
              </div>
            )}
            {group.items.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={onClose}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: '9px',
                  padding: '8px 10px', borderRadius: '8px', fontSize: '13px',
                  fontWeight: isActive ? 600 : 400, textDecoration: 'none',
                  color: isActive ? 'white' : '#94a3b8',
                  background: isActive ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'transparent',
                  transition: 'all 0.12s',
                  boxShadow: isActive ? '0 2px 8px rgba(37,99,235,0.35)' : 'none',
                  marginBottom: '1px',
                })}
                onMouseEnter={e => { if (!e.currentTarget.getAttribute('aria-current')) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                onMouseLeave={e => { if (!e.currentTarget.getAttribute('aria-current')) e.currentTarget.style.background = 'transparent' }}
              >
                <Icon size={15} strokeWidth={2} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                {to === '/alerts' && alertsCount > 0 && (
                  <span style={{ background: '#ef4444', color: 'white', borderRadius: '20px', fontSize: '10px', fontWeight: 700, padding: '1px 6px', minWidth: '18px', textAlign: 'center' }}>
                    {alertsCount > 99 ? '99+' : alertsCount}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User + logout */}
      <div style={{ padding: '10px 8px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 10px', borderRadius: '9px', background: 'rgba(255,255,255,0.04)', marginBottom: '4px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '11px', fontWeight: 700,
          }}>
            {initials(user.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#e2e8f0', fontSize: '12.5px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
            <div style={{ color: '#475569', fontSize: '10.5px', textTransform: 'capitalize' }}>{user.role}</div>
          </div>
        </div>
        <button
          onClick={logout}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '8px', fontSize: '12.5px', color: '#64748b', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', transition: 'all 0.12s' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'transparent' }}
        >
          <LogOut size={14} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop: sidebar fijo */}
      <div className="sidebar-desktop" style={{ display: 'flex', minHeight: '100vh', boxShadow: '4px 0 24px rgba(0,0,0,0.15)' }}>
        {sidebarContent}
      </div>

      {/* Mobile: overlay drawer */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40, display: 'none' }}
          className="sidebar-overlay"
        />
      )}
      <div
        className="sidebar-mobile"
        style={{
          position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 50,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
          boxShadow: '4px 0 24px rgba(0,0,0,0.3)',
          display: 'none',
        }}
      >
        {sidebarContent}
      </div>
    </>
  )
}
