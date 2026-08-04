import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { FormField, btnPrimary, btnSecondary } from '../ui/FormField'
import { SearchableSelect } from '../ui/SearchableSelect'
import { type MapSpot } from '../../types/guarderia.types'

interface Props {
  spots: MapSpot[]
  unitId: number
  unitDescription: string
  fromCode: string
  submitting: boolean
  onClose: () => void
  onSubmit: (spotId: number | null) => void
}

// Mover una lancha a otra cuna: entra una nueva y hay que reubicar (el de A1 pasa a A35)
export function MoveModal({ spots, unitDescription, fromCode, submitting, onClose, onSubmit }: Props) {
  const [spotId, setSpotId] = useState('')

  const freeSpots = spots.filter(s => !s.occupied && s.active)
  const options = freeSpots.map(s => ({ value: String(s.spotId), label: s.code }))

  return (
    <Modal title="Mover de cuna" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 12px' }}>
          <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0f172a' }}>{unitDescription}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>Hoy está en {fromCode}</div>
        </div>

        <FormField label="Nueva cuna">
          <SearchableSelect
            value={spotId}
            onChange={setSpotId}
            options={options}
            placeholder="Buscar cuna libre..."
            emptyLabel="— Suelta sobre trailer —"
          />
        </FormField>

        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
          Solo aparecen las cunas libres de las líneas operativas.
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button style={btnSecondary} onClick={onClose}>Cancelar</button>
          <button style={btnPrimary} disabled={submitting} onClick={() => onSubmit(spotId ? Number(spotId) : null)}>
            Mover
          </button>
        </div>
      </div>
    </Modal>
  )
}
