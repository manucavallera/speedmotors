import { Modal } from '../ui/Modal'
import { btnPrimary, btnSecondary } from '../ui/FormField'
import { generateReservationPdf, printReservation } from '../../lib/pdf'

const statusStyles: Record<string, { bg: string; color: string; label: string }> = {
  vigente:    { bg: '#fffbeb', color: '#d97706', label: 'Vigente' },
  concretada: { bg: '#f0fdf4', color: '#16a34a', label: 'Concretada' },
  cancelada:  { bg: '#fef2f2', color: '#dc2626', label: 'Cancelada' },
}

interface ReservationDetailModalProps {
  detail: any
  onClose: () => void
  onEdit: () => void
  onChangeStatus: (id: number, status: string) => void
  isPending: boolean
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', gap: '8px', fontSize: '13.5px', paddingBottom: '5px', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ color: '#94a3b8', minWidth: '150px' }}>{label}</span>
      <span style={{ fontWeight: 500, color: '#0f172a' }}>{value}</span>
    </div>
  )
}

function Section({ label }: { label: string }) {
  return (
    <div style={{ fontSize: '11px', fontWeight: 700, color: '#334155', background: '#f1f5f9', padding: '4px 10px', borderRadius: '5px', letterSpacing: '.5px', margin: '4px 0' }}>
      {label}
    </div>
  )
}

export function ReservationDetailModal({ detail, onClose, onEdit, onChangeStatus, isPending }: ReservationDetailModalProps) {
  const st = statusStyles[detail.status] || statusStyles.vigente
  const price = Number(detail.price || 0)
  const deposit = Number(detail.depositAmount || 0)
  const fecha = new Date(detail.date || detail.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <Modal title={`Reserva ${detail.reservationNumber || '#' + detail.id}`} onClose={onClose} width={560}>
      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <span style={{ background: st.bg, color: st.color, fontWeight: 700, fontSize: '12px', padding: '3px 12px', borderRadius: '20px' }}>
          {st.label}
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => printReservation(detail)}
            style={{ ...btnSecondary, fontSize: '13px', padding: '6px 14px' }}>
            Imprimir
          </button>
          <button onClick={() => generateReservationPdf(detail)}
            style={{ ...btnPrimary, fontSize: '13px', padding: '6px 14px' }}>
            Descargar PDF
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', marginBottom: '4px' }}>
          <div><span style={{ color: '#94a3b8' }}>Fecha: </span><strong>{fecha}</strong></div>
          <div><span style={{ color: '#94a3b8' }}>N°: </span><strong>{detail.reservationNumber || '—'}</strong></div>
        </div>

        <Section label="COMPRADOR" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <Row label="Apellido y Nombre" value={detail.clientName} />
          <Row label="DNI / CUIL" value={detail.clientDni} />
          <Row label="Domicilio" value={detail.clientAddress} />
          <Row label="Teléfono" value={detail.clientPhone} />
        </div>

        {(detail.spouseName || detail.spouseDni) && (
          <>
            <Section label="CÓNYUGE" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <Row label="Apellido y Nombre" value={detail.spouseName} />
              <Row label="DNI / CUIL" value={detail.spouseDni} />
            </div>
          </>
        )}

        <Section label="VEHÍCULO" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <Row label="Tipo" value={detail.vehicleType === 'lancha' ? 'Lancha / Embarcación' : 'Motocicleta'} />
          <Row label="Marca" value={detail.brand} />
          <Row label="Modelo" value={detail.model} />
          <Row label="Año" value={detail.year ? String(detail.year) : undefined} />
          <Row label="Color" value={detail.color} />
          <Row label="Nro. de Motor" value={detail.motorNumber} />
          <Row label="Nro. de Chasis" value={detail.chassisNumber} />
        </div>

        {(price > 0 || deposit > 0) && (
          <>
            <Section label="CONDICIONES" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', padding: '12px' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>PRECIO</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>${price.toLocaleString('es-AR')}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>SEÑA</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#16a34a' }}>${deposit.toLocaleString('es-AR')}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>SALDO</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#dc2626' }}>${(price - deposit).toLocaleString('es-AR')}</div>
              </div>
            </div>
          </>
        )}

        {detail.notes && (
          <p style={{ fontSize: '13px', color: '#64748b', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', margin: 0 }}>{detail.notes}</p>
        )}

        {detail.status === 'vigente' && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: '4px' }}>
            <button onClick={onEdit}
              style={{ padding: '7px 16px', fontSize: '13px', fontWeight: 600, background: '#f8fafc', color: '#374151', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}>
              Editar
            </button>
            <button disabled={isPending}
              onClick={() => onChangeStatus(detail.id, 'concretada')}
              style={{ padding: '7px 16px', fontSize: '13px', fontWeight: 600, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '8px', cursor: 'pointer' }}>
              Marcar concretada
            </button>
            <button disabled={isPending}
              onClick={() => { if (confirm('¿Cancelar esta reserva?')) onChangeStatus(detail.id, 'cancelada') }}
              style={{ padding: '7px 16px', fontSize: '13px', fontWeight: 600, background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              Cancelar reserva
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}
