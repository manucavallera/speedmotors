import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { useAuth } from './hooks/useAuth'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { Toaster } from './components/ui/Toaster'

const DashboardPage       = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const ProductsPage        = lazy(() => import('./pages/ProductsPage').then(m => ({ default: m.ProductsPage })))
const VehiclesPage        = lazy(() => import('./pages/VehiclesPage').then(m => ({ default: m.VehiclesPage })))
const ClientsPage         = lazy(() => import('./pages/ClientsPage').then(m => ({ default: m.ClientsPage })))
const SalesPage           = lazy(() => import('./pages/SalesPage').then(m => ({ default: m.SalesPage })))
const InstallmentsPage    = lazy(() => import('./pages/InstallmentsPage').then(m => ({ default: m.InstallmentsPage })))
const CreditsPage         = lazy(() => import('./pages/CreditsPage').then(m => ({ default: m.CreditsPage })))
const QuotesPage          = lazy(() => import('./pages/QuotesPage').then(m => ({ default: m.QuotesPage })))
const CashPage            = lazy(() => import('./pages/CashPage').then(m => ({ default: m.CashPage })))
const StockMovementsPage  = lazy(() => import('./pages/StockMovementsPage').then(m => ({ default: m.StockMovementsPage })))
const ExpensesPage        = lazy(() => import('./pages/ExpensesPage').then(m => ({ default: m.ExpensesPage })))
const ReportsPage         = lazy(() => import('./pages/ReportsPage').then(m => ({ default: m.ReportsPage })))
const SettingsPage        = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })))
const SuppliersPage       = lazy(() => import('./pages/SuppliersPage').then(m => ({ default: m.SuppliersPage })))
const PurchaseOrdersPage  = lazy(() => import('./pages/PurchaseOrdersPage').then(m => ({ default: m.PurchaseOrdersPage })))
const ReservationsPage    = lazy(() => import('./pages/ReservationsPage').then(m => ({ default: m.ReservationsPage })))
const AlertsPage          = lazy(() => import('./pages/AlertsPage').then(m => ({ default: m.AlertsPage })))
const TransfersPage       = lazy(() => import('./pages/TransfersPage').then(m => ({ default: m.TransfersPage })))
const UsersPage           = lazy(() => import('./pages/UsersPage').then(m => ({ default: m.UsersPage })))
const GuarderiaPage       = lazy(() => import('./pages/GuarderiaPage').then(m => ({ default: m.GuarderiaPage })))
const ProveeduriaPage     = lazy(() => import('./pages/ProveeduriaPage').then(m => ({ default: m.ProveeduriaPage })))
const TurneraPage         = lazy(() => import('./pages/TurneraPage').then(m => ({ default: m.TurneraPage })))
const TurnosPublicPage    = lazy(() => import('./pages/TurnosPublicPage').then(m => ({ default: m.TurnosPublicPage })))

const queryClient = new QueryClient()

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

const PageFallback = <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Cargando...</div>

export default function App() {
  return (
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          {/* Página pública del cliente: sin login, se entra por link de WhatsApp */}
          <Route path="/turnos" element={<Suspense fallback={PageFallback}><TurnosPublicPage /></Suspense>} />
          <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
            <Route index element={<Suspense fallback={PageFallback}><DashboardPage /></Suspense>} />
            <Route path="products" element={<Suspense fallback={PageFallback}><ProductsPage /></Suspense>} />
            <Route path="vehicles" element={<Suspense fallback={PageFallback}><VehiclesPage /></Suspense>} />
            <Route path="clients" element={<Suspense fallback={PageFallback}><ClientsPage /></Suspense>} />
            <Route path="sales" element={<Suspense fallback={PageFallback}><SalesPage /></Suspense>} />
            <Route path="installments" element={<Suspense fallback={PageFallback}><InstallmentsPage /></Suspense>} />
            <Route path="credits" element={<Suspense fallback={PageFallback}><CreditsPage /></Suspense>} />
            <Route path="quotes" element={<Suspense fallback={PageFallback}><QuotesPage /></Suspense>} />
            <Route path="cash" element={<Suspense fallback={PageFallback}><CashPage /></Suspense>} />
            <Route path="stock-movements" element={<Suspense fallback={PageFallback}><StockMovementsPage /></Suspense>} />
            <Route path="expenses" element={<Suspense fallback={PageFallback}><ExpensesPage /></Suspense>} />
            <Route path="reports" element={<Suspense fallback={PageFallback}><ReportsPage /></Suspense>} />
            <Route path="settings" element={<Suspense fallback={PageFallback}><SettingsPage /></Suspense>} />
            <Route path="suppliers" element={<Suspense fallback={PageFallback}><SuppliersPage /></Suspense>} />
            <Route path="purchase-orders" element={<Suspense fallback={PageFallback}><PurchaseOrdersPage /></Suspense>} />
            <Route path="reservations" element={<Suspense fallback={PageFallback}><ReservationsPage /></Suspense>} />
            <Route path="alerts" element={<Suspense fallback={PageFallback}><AlertsPage /></Suspense>} />
            <Route path="transfers" element={<Suspense fallback={PageFallback}><TransfersPage /></Suspense>} />
            <Route path="guarderia" element={<Suspense fallback={PageFallback}><GuarderiaPage /></Suspense>} />
            <Route path="proveeduria" element={<Suspense fallback={PageFallback}><ProveeduriaPage /></Suspense>} />
            <Route path="turnera" element={<Suspense fallback={PageFallback}><TurneraPage /></Suspense>} />
            <Route path="users" element={<Suspense fallback={PageFallback}><UsersPage /></Suspense>} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
    </ErrorBoundary>
  )
}
