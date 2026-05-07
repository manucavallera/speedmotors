import { useState } from 'react'
import { Modal } from '../ui/Modal'

interface QuoteDetailModalProps {
  detail: any
  onClose: () => void
  onUpdateStatus: (id: number, status: string) => void
}

export function QuoteDetailModal({ detail, onClose, onUpdateStatus }: QuoteDetailModalProps) {
  const [currentStatus, setCurrentStatus] = useState(detail.status)

  function handleStatus(s: string) {
    setCurrentStatus(s)
    onUpdateStatus(detail.id, s)
  }

  return (
    <Modal title={`Presupuesto #${detail.id}`} onClose={onClose} width={500}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['borrador', 'enviado', 'aceptado', 'rechazado', 'vencido'].map(s => (
            <button key={s} onClick={() => handleStatus(s)}
              style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 600, border: 'none', borderRadius: '8px', cursor: 'pointer', background: currentStatus === s ? '#0f172a' : '#f1f5f9', color: currentStatus === s ? 'white' : '#374151' }}>
              {s}
            </button>
          ))}
        </div>
        {detail.items?.map((it: any) => (
          <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13.5px' }}>
            <span>{it.description} × {it.quantity}</span>
            <span style={{ fontWeight: 600 }}>${Number(it.subtotal).toLocaleString('es-AR')}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '16px' }}>
          <span>Total</span><span>${Number(detail.total).toLocaleString('es-AR')}</span>
        </div>
      </div>
    </Modal>
  )
}
