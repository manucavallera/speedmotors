import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, apiError } from '../../lib/api'
import { toast } from '../../lib/toast'
import { Modal } from '../ui/Modal'
import { FormField, inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'
import { SearchableSelect } from '../ui/SearchableSelect'
import { type MapSpot, type CreateUnitForm, type StorageCategory, type StorageService } from '../../types/guarderia.types'

interface GClient { id: number; name: string; phone: string | null }
interface Props {
  spots: MapSpot[]
  categories: StorageCategory[]
  services: StorageService[]
  presetSpotId: number | null
  onClose: () => void
  onSubmit: (data: CreateUnitForm) => void
  submitting: boolean
}

export function GuardarModal({ spots, categories, services, presetSpotId, onClose, onSubmit, submitting }: Props) {
  // Servicios fijos: los que se cobran todos los meses con la cuna (seguros)
  const [fixed, setFixed] = useState<number[]>([])
  const qc = useQueryClient()
  const [clientId, setClientId] = useState('')
  const [spotId, setSpotId] = useState(presetSpotId ? String(presetSpotId) : '')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [hp, setHp] = useState('')
  const [lengthM, setLengthM] = useState('')
  const [rate, setRate] = useState('')
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10))
  const [newClient, setNewClient] = useState(false)
  const [ncName, setNcName] = useState('')
  const [ncPhone, setNcPhone] = useState('')
  const [savingClient, setSavingClient] = useState(false)

  // Solo clientes de guardería
  const { data: clientsData } = useQuery<{ items: GClient[] }>({
    queryKey: ['clients', 'guarderia'],
    queryFn: () => api.get('/clients', { params: { type: 'guarderia', limit: 200 } }).then(r => r.data),
  })
  const clients = clientsData?.items ?? []

  // Cunas libres y operativas (las de líneas en obra no se pueden asignar)
  const freeSpots = spots.filter(s => !s.occupied && s.active)
  const spotOptions = freeSpots.map(s => ({ value: String(s.spotId), label: s.code }))

  // La tarifa arranca en la mensual de la categoría; se puede pisar por excepción
  function pickCategory(id: string) {
    setCategoryId(id)
    const cat = categories.find(c => String(c.id) === id)
    if (cat) setRate(String(Number(cat.monthlyRate)))
  }

  async function createClientInline() {
    if (!ncName.trim()) { toast.error('Nombre requerido'); return }
    setSavingClient(true)
    try {
      const res = await api.post('/clients', { name: ncName.trim(), phone: ncPhone.trim() || undefined, type: 'guarderia' })
      await qc.invalidateQueries({ queryKey: ['clients', 'guarderia'] })
      setClientId(String(res.data.id))
      setNewClient(false); setNcName(''); setNcPhone('')
      toast.success('Cliente creado')
    } catch (err) { toast.error(apiError(err)) }
    finally { setSavingClient(false) }
  }

  function submit() {
    if (!clientId) { toast.error('Elegí un cliente'); return }
    if (!description.trim()) { toast.error('Describí la embarcación'); return }
    onSubmit({
      clientId: Number(clientId),
      spotId: spotId ? Number(spotId) : undefined,
      categoryId: categoryId ? Number(categoryId) : undefined,
      description: description.trim(),
      hp: hp ? Number(hp) : undefined,
      lengthM: lengthM ? Number(lengthM) : undefined,
      rate: rate ? Number(rate) : 0,
      entryDate,
      fixedServiceIds: fixed,
    })
  }

  return (
    <Modal title="Guardar embarcación" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <FormField label="Cliente">
          {newClient ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#f8fafc', padding: '10px', borderRadius: '10px' }}>
              <input style={inputStyle} placeholder="Nombre y apellido" value={ncName} onChange={e => setNcName(e.target.value)} />
              <input style={inputStyle} placeholder="Teléfono (opcional)" value={ncPhone} onChange={e => setNcPhone(e.target.value)} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ ...btnPrimary, flex: 1 }} disabled={savingClient} onClick={createClientInline}>Crear cliente</button>
                <button style={btnSecondary} onClick={() => setNewClient(false)}>Cancelar</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <SearchableSelect
                  value={clientId}
                  onChange={setClientId}
                  options={clients.map(c => ({ value: String(c.id), label: c.name }))}
                  placeholder="Buscar cliente..."
                  emptyLabel="— Sin cliente —"
                />
              </div>
              <button style={btnSecondary} onClick={() => setNewClient(true)}>+ Nuevo</button>
            </div>
          )}
        </FormField>

        <FormField label="Embarcación / vehículo">
          <input style={inputStyle} placeholder="Ej: Lancha Quicksilver 540" value={description} onChange={e => setDescription(e.target.value)} />
        </FormField>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <FormField label="HP del motor">
              <input style={inputStyle} type="number" placeholder="Ej: 60" value={hp} onChange={e => setHp(e.target.value)} />
            </FormField>
          </div>
          <div style={{ flex: 1 }}>
            <FormField label="Largo (m)">
              <input style={inputStyle} type="number" step="0.1" placeholder="Ej: 5.4" value={lengthM} onChange={e => setLengthM(e.target.value)} />
            </FormField>
          </div>
        </div>

        <FormField label="Categoría">
          <select style={inputStyle} value={categoryId} onChange={e => pickCategory(e.target.value)}>
            <option value="">— Sin categoría —</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name} · ${Number(c.monthlyRate).toLocaleString('es-AR')}/mes</option>
            ))}
          </select>
        </FormField>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <FormField label="Cuna">
              <SearchableSelect value={spotId} onChange={setSpotId} options={spotOptions} placeholder="Cuna..." emptyLabel="— Suelta sobre trailer —" />
            </FormField>
          </div>
          <div style={{ flex: 1 }}>
            <FormField label="Tarifa mensual">
              <input style={inputStyle} type="number" placeholder="0" value={rate} onChange={e => setRate(e.target.value)} />
            </FormField>
          </div>
        </div>

        <FormField label="Servicios fijos (se cobran todos los meses)">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {services.map(s => {
              const on = fixed.includes(s.id)
              return (
                <button
                  key={s.id}
                  onClick={() => setFixed(p => on ? p.filter(x => x !== s.id) : [...p, s.id])}
                  style={{
                    fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                    background: on ? '#eff6ff' : '#f8fafc',
                    color: on ? '#2563eb' : '#64748b',
                    border: `1.5px solid ${on ? '#bfdbfe' : '#e2e8f0'}`,
                    borderRadius: '20px', padding: '5px 11px',
                  }}
                >
                  {on ? '✓ ' : ''}{s.name}
                </button>
              )
            })}
          </div>
          <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '6px' }}>
            Marcá los seguros que contrató. La batería o el combustible no van acá: esos se piden cuando sale a navegar.
          </div>
        </FormField>

        <FormField label="Fecha de ingreso">
          <input style={inputStyle} type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} />
        </FormField>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
          <button style={btnSecondary} onClick={onClose}>Cancelar</button>
          <button style={btnPrimary} disabled={submitting} onClick={submit}>Guardar</button>
        </div>
      </div>
    </Modal>
  )
}
