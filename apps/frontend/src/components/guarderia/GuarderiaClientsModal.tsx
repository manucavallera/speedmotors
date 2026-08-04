import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '../ui/Modal'
import { inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'
import { toast } from '../../lib/toast'
import { api, apiError } from '../../lib/api'
import { ClientFormModal } from '../clients/ClientFormModal'
import { type Client, type PaginatedResponse } from '../../types/api.types'
import { type ClientForm } from '../../types/clients.types'

interface Props {
  onClose: () => void
}

// Cartera de clientes de la Guardería (type guarderia), aparte de los de SpeedMotors.
export function GuarderiaClientsModal({ onClose }: Props) {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Client | null>(null)

  const { data, isLoading } = useQuery<PaginatedResponse<Client>>({
    queryKey: ['clients', 'guarderia', search],
    queryFn: () => api.get('/clients', { params: { type: 'guarderia', search: search || undefined, limit: 200 } }).then(r => r.data),
    placeholderData: prev => prev,
  })
  const clients = data?.items ?? []

  const invalidate = () => qc.invalidateQueries({ queryKey: ['clients'] })
  const create = useMutation({
    mutationFn: (d: ClientForm) => api.post('/clients', { ...d, type: 'guarderia' }),
    onSuccess: () => { invalidate(); setForm(null); toast.success('Cliente creado') },
    onError: (err: any) => toast.error(apiError(err)),
  })
  const update = useMutation({
    mutationFn: ({ id, d }: { id: number; d: ClientForm }) => api.put(`/clients/${id}`, d),
    onSuccess: () => { invalidate(); setForm(null); toast.success('Cliente actualizado') },
    onError: (err: any) => toast.error(apiError(err)),
  })

  return (
    <Modal title="Clientes de la guardería" onClose={onClose} width={560}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
        <input style={{ ...inputStyle, flex: 1 }} placeholder="Buscar por nombre o teléfono..." value={search} onChange={e => setSearch(e.target.value)} />
        <button style={btnPrimary} onClick={() => { setEditing(null); setForm('create') }}>+ Nuevo</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '420px', overflowY: 'auto' }}>
        {isLoading && <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Cargando...</div>}
        {!isLoading && clients.length === 0 && (
          <div style={{ padding: '28px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', border: '1.5px dashed #e2e8f0', borderRadius: '10px' }}>
            {search ? 'Sin resultados.' : 'Todavía no hay clientes de guardería. Creá el primero con "+ Nuevo".'}
          </div>
        )}
        {clients.map(c => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 12px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#0f172a' }}>{c.name}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>{c.phone || 'sin teléfono'}</div>
            </div>
            <button style={{ ...btnSecondary, padding: '6px 12px' }} onClick={() => { setEditing(c); setForm('edit') }}>Editar</button>
          </div>
        ))}
      </div>

      {form && (
        <ClientFormModal
          mode={form}
          editing={editing}
          onClose={() => setForm(null)}
          onSubmit={(d) => form === 'edit' && editing ? update.mutate({ id: editing.id, d }) : create.mutate(d)}
          isPending={create.isPending || update.isPending}
        />
      )}
    </Modal>
  )
}
