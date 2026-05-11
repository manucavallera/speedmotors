import { toast } from '../lib/toast'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { InfoBanner } from '../components/ui/InfoBanner'
import { btnPrimary } from '../components/ui/FormField'
import { ExpensesTable } from '../components/expenses/ExpensesTable'
import { ExpenseFormModal, type ExpenseFormData } from '../components/expenses/ExpenseFormModal'
import { Pagination } from '../components/ui/Pagination'
import { useAuth } from '../hooks/useAuth'

export function ExpensesPage() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [page, setPage] = useState(1)

  const { data: expensesData, isLoading } = useQuery({
    queryKey: ['expenses', page],
    queryFn: () => api.get('/expenses', { params: { page, limit: 50 } }).then(r => r.data),
  })
  const expenses = expensesData?.items ?? []
  const total = expensesData?.total ?? 0
  const pages = expensesData?.pages ?? 1

  const { data: summary = [] } = useQuery({
    queryKey: ['expenses-summary'],
    queryFn: () => api.get('/expenses/summary').then(r => r.data),
  })

  const create = useMutation({
    mutationFn: (d: ExpenseFormData) => api.post('/expenses', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses', 'expenses-summary'] }); setModal(false) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error inesperado'),
  })

  const update = useMutation({
    mutationFn: (d: ExpenseFormData) => api.put(`/expenses/${editing.id}`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses', 'expenses-summary'] }); setEditing(null) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error inesperado'),
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/expenses/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses', 'expenses-summary'] }),
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error inesperado'),
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Gastos</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '2px' }}>{expenses.length} registros</p>
        </div>
        <button onClick={() => setModal(true)} style={btnPrimary}>+ Registrar gasto</button>
      </div>

      <InfoBanner title="Gastos del negocio">
        Plata que <strong>sale del negocio y no vuelve</strong>: alquiler, sueldos, servicios, impuestos, etc. <strong>No incluye compras de mercadería</strong> (eso va en Órdenes de compra, porque la mercadería se vende después). Filtrá por categoría o fecha para analizar dónde se va la plata.
      </InfoBanner>

      <ExpensesTable
        expenses={expenses}
        summary={summary}
        isLoading={isLoading}
        onEdit={setEditing}
        onDelete={isAdmin ? (id) => { if (window.confirm('¿Eliminar este gasto?')) remove.mutate(id)  : undefined}}
      />
      <Pagination page={page} pages={pages} total={total} onPage={setPage} />

      {modal && (
        <ExpenseFormModal
          mode="create"
          onClose={() => setModal(false)}
          onSubmit={(data) => create.mutate(data)}
          isPending={create.isPending}
        />
      )}

      {editing && (
        <ExpenseFormModal
          mode="edit"
          editing={editing}
          onClose={() => setEditing(null)}
          onSubmit={(data) => update.mutate(data)}
          isPending={update.isPending}
        />
      )}
    </div>
  )
}
