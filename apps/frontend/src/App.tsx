import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { ProductsPage } from './pages/ProductsPage'
import { VehiclesPage } from './pages/VehiclesPage'
import { ClientsPage } from './pages/ClientsPage'
import { SalesPage } from './pages/SalesPage'
import { InstallmentsPage } from './pages/InstallmentsPage'
import { QuotesPage } from './pages/QuotesPage'
import { CashPage } from './pages/CashPage'
import { StockMovementsPage } from './pages/StockMovementsPage'
import { ExpensesPage } from './pages/ExpensesPage'
import { ReportsPage } from './pages/ReportsPage'
import { SettingsPage } from './pages/SettingsPage'
import { SuppliersPage } from './pages/SuppliersPage'
import { PurchaseOrdersPage } from './pages/PurchaseOrdersPage'
import { ReservationsPage } from './pages/ReservationsPage'
import { AlertsPage } from './pages/AlertsPage'
import { TransfersPage } from './pages/TransfersPage'
import { UsersPage } from './pages/UsersPage'
import { useAuth } from './hooks/useAuth'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { Toaster } from './components/ui/Toaster'

const queryClient = new QueryClient()

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="vehicles" element={<VehiclesPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="sales" element={<SalesPage />} />
            <Route path="installments" element={<InstallmentsPage />} />
            <Route path="quotes" element={<QuotesPage />} />
            <Route path="cash" element={<CashPage />} />
            <Route path="stock-movements" element={<StockMovementsPage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="suppliers" element={<SuppliersPage />} />
            <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
            <Route path="reservations" element={<ReservationsPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="transfers" element={<TransfersPage />} />
            <Route path="users" element={<UsersPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
    </ErrorBoundary>
  )
}
