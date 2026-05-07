import { Modal } from '../ui/Modal'
import { btnPrimary } from '../ui/FormField'

const statusColors: Record<string, { bg: string; color: string; label: string }> = {
  borrador:  { bg: '#f8fafc', color: '#64748b', label: 'Borrador' },
  enviada:   { bg: '#fffbeb', color: '#d97706', label: 'Enviada' },
  recibida:  { bg: '#f0fdf4', color: '#16a34a', label: 'Recibida' },
  cancelada: { bg: '#fef2f2', color: '#dc2626', label: 'Cancelada' },
}

interface PurchaseOrderDetailModalProps {
  detail: any
  onClose: () => void
  onChangeStatus: (id: number, status: string) => void
  isPending: boolean
}

export function PurchaseOrderDetailModal({ detail, onClose, onChangeStatus, isPending }: PurchaseOrderDetailModalProps) {
  return (
    <Modal title={`Orden #${detail.id}`} onClose={onClose} width={560}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13.5px' }}>
          <div>
            <span style={{ color: '#94a3b8' }}>Estado: </span>
            <span style={{ fontWeight: 600, color: statusColors[detail.status]?.color }}>{statusColors[detail.status]?.label}</span>
          </div>
          <div><span style={{ color: '#94a3b8' }}>Total: </span><strong>${Number(detail.total).toLocaleString('es-AR')}</strong></div>
          {Number(detail.amountFormal) > 0 && <div><span style={{ color: '#94a3b8' }}>En blanco: </span><span style={{ fontWeight: 600, color: '#16a34a' }}>${Number(detail.amountFormal).toLocaleString('es-AR')}</span></div>}
          {Number(detail.amountInformal) > 0 && <div><span style={{ color: '#94a3b8' }}>En negro: </span><span style={{ fontWeight: 600, color: '#dc2626' }}>${Number(detail.amountInformal).toLocaleString('es-AR')}</span></div>}
          {detail.expectedDate && <div><span style={{ color: '#94a3b8' }}>Fecha esperada: </span>{new Date(detail.expectedDate).toLocaleDateString('es-AR')}</div>}
          {detail.receivedAt && <div><span style={{ color: '#94a3b8' }}>Recibida: </span>{new Date(detail.receivedAt).toLocaleDateString('es-AR')}</div>}
        </div>

        {detail.notes && (
          <p style={{ fontSize: '13px', color: '#64748b', background: '#f8fafc', padding: '10px 12px', borderRadius: '8px' }}>{detail.notes}</p>
        )}

        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Ítems ({detail.items?.length || 0})</div>
          {detail.items?.map((it: any) => (
            <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
              <div>
                <div style={{ fontWeight: 500 }}>{it.description}</div>
                <div style={{ color: '#94a3b8', fontSize: '12px' }}>x{it.quantity} · ${Number(it.unitPrice).toLocaleString('es-AR')} c/u</div>
              </div>
              <span style={{ fontWeight: 700 }}>${Number(it.subtotal).toLocaleString('es-AR')}</span>
            </div>
          ))}
        </div>

        {detail.status !== 'recibida' && detail.status !== 'cancelada' && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {detail.status === 'borrador' && (
              <button onClick={() => onChangeStatus(detail.id, 'enviada')} disabled={isPending}
                style={{ padding: '7px 16px', fontSize: '13px', fontWeight: 600, background: '#fffbeb', color: '#d97706', border: '1px solid #fed7aa', borderRadius: '8px', cursor: 'pointer' }}>
                Marcar como enviada
              </button>
            )}
            {(detail.status === 'borrador' || detail.status === 'enviada') && (
              <button disabled={isPending}
                onClick={() => { if (confirm('¿Confirmar recepción? Esto actualizará el stock de los productos.')) onChangeStatus(detail.id, 'recibida') }}
                style={{ ...btnPrimary, fontSize: '13px', padding: '7px 16px' }}>
                Confirmar recepción (+stock)
              </button>
            )}
            <button onClick={() => onChangeStatus(detail.id, 'cancelada')} disabled={isPending}
              style={{ padding: '7px 16px', fontSize: '13px', fontWeight: 600, background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              Cancelar orden
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}
