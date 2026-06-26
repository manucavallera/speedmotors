import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, apiError } from '../../lib/api'
import { toast } from '../../lib/toast'
import { Modal } from '../ui/Modal'
import { FormField, inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'
import { SearchableSelect } from '../ui/SearchableSelect'
import { type MapSpot, type CreateUnitForm } from '../../types/guarderia.types'

interface GClient { id: number; name: string; phone: string | null }
interface Props {
  spots: MapSpot[]
  presetSpotId: number | null
  onClose: () => void
  onSubmit: (data: CreateUnitForm) => void
  submitting: boolean
}

export function GuardarModal({ spots, presetSpotId, onClose, onSubmit, submitting }: Props) {
  const qc = useQueryClient()
  const [clientId, setClientId] = useState('')
  const [spotId, setSpotId] = useState(presetSpotId ? String(presetSpotId) : '')
  const [description, setDescription] = useState('')
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

  // Lugares libres (más el preseleccionado por si viene de un lugar libre)
  const freeSpots = spots.filter(s => !s.occupied)
  const spotOptions = freeSpots.map(s => ({ value: String(s.spotId), label: s.code }))

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
      description: description.trim(),
      rate: rate ? Number(rate) : 0,
      entryDate,
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
            <FormField label="Lugar">
              <SearchableSelect value={spotId} onChange={setSpotId} options={spotOptions} placeholder="Lugar..." emptyLabel="— Sin asignar —" />
            </FormField>
          </div>
          <div style={{ flex: 1 }}>
            <FormField label="Tarifa">
              <input style={inputStyle} type="number" placeholder="0" value={rate} onChange={e => setRate(e.target.value)} />
            </FormField>
          </div>
        </div>

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
