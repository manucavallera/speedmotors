import { Modal } from '../ui/Modal'
import type { Transfer } from '../../hooks/useTransfers'

const statusStyles: Record<string, { bg: string; color: string; label: string }> = {
  pendiente:   { bg: '#fef3c7', color: '#d97706', label: 'Pendiente' },
  en_tramite:  { bg: '#dbeafe', color: '#2563eb', label: 'En trámite' },
  completada:  { bg: '#dcfce7', color: '#16a34a', label: 'Completada' },
  cancelada:   { bg: '#fee2e2', color: '#dc2626', label: 'Cancelada' },
}

function fmt(n?: string | null) { return n ? '$' + Number(n).toLocaleString('es-AR') : '—' }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }) }

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: 500 }}>{value || '—'}</span>
    </div>
  )
}

interface Props { transfer: Transfer; onClose: () => void; onEdit: () => void }

export function TransferDetailModal({ transfer: t, onClose, onEdit }: Props) {
  const st = statusStyles[t.status] ?? statusStyles.pendiente

  return (
    <Modal title={`Transferencia ${t.transferNumber ?? '#' + t.id}`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ background: st.bg, color: st.color, fontWeight: 700, fontSize: '12px', padding: '4px 12px', borderRadius: '20px' }}>{st.label}</span>
          <span style={{ fontSize: '13px', color: '#64748b' }}>{fmtDate(t.date)}</span>
        </div>

        <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div style={{ fontWeight: 700, fontSize: '12px', color: '#64748b', gridColumn: '1/-1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vehículo</div>
          <Row label="Marca / Modelo" value={t.vehicleLabel} />
          <Row label="Chasis" value={t.chassisNumber} />
          <Row label="Motor" value={t.engineNumber} />
        </div>

        <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div style={{ fontWeight: 700, fontSize: '12px', color: '#64748b', gridColumn: '1/-1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Comprador</div>
          <Row label="Nombre" value={t.clientNameResolved ?? t.clientName} />
          <Row label="DNI" value={t.clientDni} />
        </div>

        <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div style={{ fontWeight: 700, fontSize: '12px', color: '#64748b', gridColumn: '1/-1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Datos registrales</div>
          <Row label="Escribano / Gestor" value={t.notaryName} />
          <Row label="Registro notarial" value={t.notaryRegistry} />
          <Row label="N° informe RNP" value={t.rnpNumber} />
          <Row label="N° trámite DNRPA" value={t.dnrpaNumber} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          {[
            { label: 'Honorarios', value: fmt(t.transferFee) },
            { label: 'Sellos', value: fmt(t.taxAmount) },
            { label: 'Total costos', value: fmt(t.totalCost) },
          ].map(k => (
            <div key={k.label} style={{ background: '#f0f9ff', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>{k.label}</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#0284c7' }}>{k.value}</div>
            </div>
          ))}
        </div>

        {t.notes && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px', fontSize: '13.5px', color: '#78350f' }}>
            {t.notes}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', fontSize: '13.5px', fontWeight: 600, background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: '9px', cursor: 'pointer' }}>Cerrar</button>
          <button onClick={onEdit} style={{ padding: '9px 18px', fontSize: '13.5px', fontWeight: 600, background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: 'white', border: 'none', borderRadius: '9px', cursor: 'pointer' }}>Editar</button>
        </div>
      </div>
    </Modal>
  )
}
