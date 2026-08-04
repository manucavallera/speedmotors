import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Modal } from '../ui/Modal'
import { btnPrimary, btnSecondary, inputStyle } from '../ui/FormField'
import { toast } from '../../lib/toast'

interface GClient { id: number; name: string; phone: string | null }

// Canal de difusión: el sistema junta los teléfonos, el mensaje se manda desde WhatsApp
export function DifusionModal({ onClose }: { onClose: () => void }) {
  const [msg, setMsg] = useState('')

  const { data } = useQuery<{ items: GClient[] }>({
    queryKey: ['clients', 'guarderia', 'difusion'],
    queryFn: () => api.get('/clients', { params: { type: 'guarderia', limit: 500 } }).then(r => r.data),
  })
  const clients = data?.items ?? []
  const conTel = clients.filter(c => c.phone && c.phone.trim())
  const sinTel = clients.length - conTel.length

  function copiar(text: string, label: string) {
    navigator.clipboard.writeText(text)
      .then(() => toast.success(label))
      .catch(() => toast.error('No se pudo copiar'))
  }

  // wa.me necesita el número sin espacios ni guiones
  const waLink = (phone: string) =>
    `https://wa.me/${phone.replace(/\D/g, '')}${msg ? `?text=${encodeURIComponent(msg)}` : ''}`

  return (
    <Modal title="Canal de difusión" onClose={onClose}>
      <div style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '14px', lineHeight: 1.5 }}>
        Copiá los teléfonos y pegalos en una lista de difusión de WhatsApp para mandarle precios o avisos
        a todos los clientes de la guardería de una sola vez.
      </div>

      <textarea
        style={{ ...inputStyle, minHeight: '80px', resize: 'vertical', marginBottom: '10px' }}
        placeholder="Mensaje (opcional). Ej: Tarifas de guardería actualizadas..."
        value={msg}
        onChange={e => setMsg(e.target.value)}
      />

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          style={btnPrimary}
          disabled={!conTel.length}
          onClick={() => copiar(conTel.map(c => c.phone).join(', '), `${conTel.length} teléfonos copiados`)}
        >
          Copiar {conTel.length} teléfonos
        </button>
        {msg.trim() && (
          <button style={btnSecondary} onClick={() => copiar(msg, 'Mensaje copiado')}>
            Copiar mensaje
          </button>
        )}
      </div>

      {sinTel > 0 && (
        <div style={{ fontSize: '12px', color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '9px', padding: '8px 10px', marginBottom: '14px' }}>
          {sinTel} cliente{sinTel > 1 ? 's' : ''} sin teléfono cargado — no van a recibir el mensaje.
        </div>
      )}

      <div style={{ maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {conTel.map(c => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '9px', padding: '8px 11px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{c.name}</div>
              <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>{c.phone}</div>
            </div>
            <a
              href={waLink(c.phone!)}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: '11.5px', fontWeight: 600, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '7px', padding: '5px 9px', textDecoration: 'none' }}
            >
              WhatsApp
            </a>
          </div>
        ))}
      </div>
    </Modal>
  )
}
