import { toast } from '../lib/toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, apiError } from '../lib/api'

export interface AppUser {
  id: number
  name: string
  email: string
  role: 'admin' | 'vendedor'
  createdAt: string
}

export function useUsers() {
  const qc = useQueryClient()
  const inv = () => qc.invalidateQueries({ queryKey: ['users'] })

  const list = useQuery<AppUser[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data),
  })

  const create = useMutation({
    mutationFn: (data: { name: string; email: string; password: string; role: 'admin' | 'vendedor' }) =>
      api.post('/users', data).then(r => r.data),
    onSuccess: inv,
    onError: (err: any) => toast.error(apiError(err)),
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; email?: string; role?: 'admin' | 'vendedor' } }) =>
      api.put(`/users/${id}`, data).then(r => r.data),
    onSuccess: inv,
    onError: (err: any) => toast.error(apiError(err)),
  })

  const changePassword = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      api.patch(`/users/${id}/password`, { password }).then(r => r.data),
    onError: (err: any) => toast.error(apiError(err)),
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/users/${id}`).then(r => r.data),
    onSuccess: inv,
    onError: (err: any) => toast.error(apiError(err)),
  })

  return { list, create, update, changePassword, remove }
}
