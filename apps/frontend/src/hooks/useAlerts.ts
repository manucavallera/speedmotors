import { toast } from '../lib/toast'
import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, apiError } from '../lib/api'

export interface AlertsData {
  summary: { critical: number; upcoming: number; total: number }
  installments: {
    overdue: Array<{ id: number; saleId: number; number: number; amount: string; dueDate: string; clientName: string | null; saleNumber: string | null }>
    upcoming: Array<{ id: number; saleId: number; number: number; amount: string; dueDate: string; clientName: string | null; saleNumber: string | null }>
  }
  cuentaCorriente: {
    overdue: Array<{ id: number; clientId: number; amount: string; dueDate: string | null; clientName: string | null; clientPhone: string | null }>
    upcoming: Array<{ id: number; clientId: number; amount: string; dueDate: string | null; clientName: string | null; clientPhone: string | null }>
    current: Array<{ id: number; clientId: number; amount: string; dueDate: string | null; clientName: string | null; clientPhone: string | null }>
  }
  creditInstallments: {
    overdue: Array<{ id: number; creditId: number; number: number; amount: string; dueDate: string; clientName: string | null; clientPhone: string | null }>
    upcoming: Array<{ id: number; creditId: number; number: number; amount: string; dueDate: string; clientName: string | null; clientPhone: string | null }>
  }
  reservations: Array<{ id: number; reservationNumber: string | null; clientName: string; brand: string; model: string | null; depositAmount: string | null; createdAt: string }>
  purchaseOrders: Array<{ id: number; supplierName: string | null; total: string; status: string; createdAt: string }>
  reminders: {
    overdue: Reminder[]
    upcoming: Reminder[]
    pending: Reminder[]
  }
}

export interface Reminder {
  id: number
  type: 'impuesto' | 'factura' | 'vencimiento' | 'otro'
  title: string
  description: string | null
  dueDate: string
  amount: string | null
  status: 'pendiente' | 'pagado' | 'vencido'
  recurrence: 'ninguna' | 'mensual' | 'trimestral' | 'anual'
  createdAt: string
}

export interface CreateReminderData {
  type: 'impuesto' | 'factura' | 'vencimiento' | 'otro'
  title: string
  description?: string
  dueDate: string
  amount?: number
  recurrence?: 'ninguna' | 'mensual' | 'trimestral' | 'anual'
}

export function useAlerts() {
  return useQuery<AlertsData>({
    queryKey: ['alerts'],
    queryFn: () => api.get('/alerts').then(r => r.data),
    refetchInterval: 5 * 60 * 1000,
  })
}

export function useAlertsCount() {
  const { data } = useQuery<AlertsData>({
    queryKey: ['alerts'],
    queryFn: () => api.get('/alerts').then(r => r.data),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 60 * 1000,
  })
  const count = data?.summary.total ?? 0
  // Badge en el título del tab del browser
  React.useEffect(() => {
    const base = 'SpeedMotors'
    document.title = count > 0 ? `(${count}) ${base}` : base
    return () => { document.title = base }
  }, [count])
  return count
}

export function usePayInstallment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.post(`/sales/installments/${id}/pay`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] })
      qc.invalidateQueries({ queryKey: ['installments-pending'] })
    },
    onError: (err: any) => toast.error(apiError(err)),
  })
}

export function useReminders() {
  const qc = useQueryClient()
  const inv = () => { qc.invalidateQueries({ queryKey: ['alerts'] }); qc.invalidateQueries({ queryKey: ['reminders'] }) }

  const list = useQuery<Reminder[]>({
    queryKey: ['reminders'],
    queryFn: () => api.get('/reminders').then(r => r.data),
  })

  const create = useMutation({
    mutationFn: (data: CreateReminderData) => api.post('/reminders', data).then(r => r.data),
    onSuccess: inv,
    onError: (err: any) => toast.error(apiError(err)),
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateReminderData> }) =>
      api.put(`/reminders/${id}`, data).then(r => r.data),
    onSuccess: inv,
    onError: (err: any) => toast.error(apiError(err)),
  })

  const markDone = useMutation({
    mutationFn: (id: number) => api.patch(`/reminders/${id}/done`).then(r => r.data),
    onSuccess: inv,
    onError: (err: any) => toast.error(apiError(err)),
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/reminders/${id}`).then(r => r.data),
    onSuccess: inv,
    onError: (err: any) => toast.error(apiError(err)),
  })

  return { list, create, update, markDone, remove }
}
