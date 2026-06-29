import { toast } from '../lib/toast'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, apiError } from '../lib/api'
import { type ProvProduct, type ProvProductForm, type CartItem, type ProvStats, type ProvSale } from '../types/proveeduria.types'

export function useProveeduria() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const invalidate = () => qc.invalidateQueries({ queryKey: ['proveeduria'] })

  const productsQuery = useQuery<ProvProduct[]>({
    queryKey: ['proveeduria', 'products', search],
    queryFn: () => api.get('/proveeduria/products', { params: { search: search || undefined } }).then(r => r.data),
    placeholderData: prev => prev,
  })
  const products = productsQuery.data ?? []

  const statsQuery = useQuery<ProvStats>({
    queryKey: ['proveeduria', 'stats'],
    queryFn: () => api.get('/proveeduria/stats').then(r => r.data),
  })
  const stats = statsQuery.data ?? { ventasHoy: 0, totalHoy: 0, ticketProm: 0, top: [] }

  const salesQuery = useQuery<ProvSale[]>({
    queryKey: ['proveeduria', 'sales'],
    queryFn: () => api.get('/proveeduria/sales').then(r => r.data),
  })
  const sales = salesQuery.data ?? []

  const createProduct = useMutation({
    mutationFn: (data: ProvProductForm) => api.post('/proveeduria/products', data),
    onSuccess: () => { invalidate(); toast.success('Producto creado') },
    onError: (err: any) => toast.error(apiError(err)),
  })

  const updateProduct = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProvProductForm }) => api.put(`/proveeduria/products/${id}`, data),
    onSuccess: () => { invalidate(); toast.success('Producto actualizado') },
    onError: (err: any) => toast.error(apiError(err)),
  })

  const removeProduct = useMutation({
    mutationFn: (id: number) => api.delete(`/proveeduria/products/${id}`),
    onSuccess: () => { invalidate(); toast.success('Producto eliminado') },
    onError: (err: any) => toast.error(apiError(err)),
  })

  const checkout = useMutation({
    mutationFn: (items: CartItem[]) => api.post('/proveeduria/sales', { items: items.map(i => ({ productId: i.productId, quantity: i.quantity })) }),
    onSuccess: () => { invalidate(); toast.success('Venta cobrada') },
    onError: (err: any) => toast.error(apiError(err)),
  })

  return { products, productsQuery, stats, sales, search, setSearch, createProduct, updateProduct, removeProduct, checkout }
}
