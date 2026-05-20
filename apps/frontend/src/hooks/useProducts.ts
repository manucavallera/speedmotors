import { toast } from '../lib/toast'
// @file: useProducts.ts | Queries, mutations y estado de filtros para ProductsPage. Filtros y orden server-side con paginación.
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, apiError } from '../lib/api'
import { type Product, type PaginatedResponse } from '../types/api.types'
import { type ProductForm } from '../types/products.types'

export function useProducts() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [priceSort, setPriceSort] = useState<'asc' | 'desc' | ''>('')
  const [ingresoFilter, setIngresoFilter] = useState<'blanco' | 'negro' | ''>('')
  const [supplierFilter, setSupplierFilter] = useState<number | ''>('')
  const [brandFilter, setBrandFilter] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [importModal, setImportModal] = useState(false)
  const [qrProduct, setQrProduct] = useState<Product | null>(null)
  const [editing, setEditing] = useState<Product | null>(null)

  const { data, isLoading } = useQuery<PaginatedResponse<Product>>({
    queryKey: ['products', { search, priceSort, ingresoFilter, supplierFilter, brandFilter, page }],
    queryFn: () => api.get('/products', {
      params: {
        search: search || undefined,
        priceSort: priceSort || undefined,
        ingresoTipo: ingresoFilter || undefined,
        supplierId: supplierFilter || undefined,
        brand: brandFilter || undefined,
        page,
        limit: 50,
      },
    }).then(r => r.data),
    placeholderData: prev => prev,
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const pages = data?.pages ?? 1

  // cheapest/priciest only meaningful when not already sorted
  const cheapest = items.length ? items.reduce((m, p) => Number(p.sellPrice) < Number(m.sellPrice) ? p : m, items[0]) : null
  const priciest = items.length ? items.reduce((m, p) => Number(p.sellPrice) > Number(m.sellPrice) ? p : m, items[0]) : null

  function resetPage() { setPage(1) }

  const create = useMutation({
    mutationFn: (data: ProductForm) => api.post('/products', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); setModal(null) },
    onError: (err: any) => toast.error(apiError(err)),
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductForm }) => api.put(`/products/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); setModal(null) },
    onError: (err: any) => toast.error(apiError(err)),
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
    onError: (err: any) => toast.error(apiError(err)),
  })

  function openCreate() { setEditing(null); setModal('create') }
  function openEdit(p: Product) { setEditing(p); setModal('edit') }
  function refreshProducts() { qc.invalidateQueries({ queryKey: ['products'] }) }

  function handleSetSearch(v: string) { setSearch(v); resetPage() }
  function handleSetPriceSort(v: 'asc' | 'desc' | '') { setPriceSort(v); resetPage() }
  function handleSetIngresoFilter(v: 'blanco' | 'negro' | '') { setIngresoFilter(v); resetPage() }
  function handleSetSupplierFilter(v: number | '') { setSupplierFilter(v); resetPage() }
  function handleSetBrandFilter(v: string) { setBrandFilter(v); resetPage() }

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: () => api.get('/suppliers', { params: { limit: 200 } }).then(r => r.data),
  })
  const suppliers: { id: number; name: string }[] = suppliersData?.items ?? []

  return {
    products: items, isLoading, sorted: items, cheapest, priciest,
    total, page, pages, setPage,
    search, setSearch: handleSetSearch,
    priceSort, setPriceSort: handleSetPriceSort,
    ingresoFilter, setIngresoFilter: handleSetIngresoFilter,
    supplierFilter, setSupplierFilter: handleSetSupplierFilter,
    brandFilter, setBrandFilter: handleSetBrandFilter,
    suppliers,
    modal, setModal, editing, openCreate, openEdit,
    qrProduct, setQrProduct,
    importModal, setImportModal,
    create, update, remove, refreshProducts,
  }
}
