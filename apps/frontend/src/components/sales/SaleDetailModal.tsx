import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { btnPrimary, btnSecondary, inputStyle, FormField } from '../ui/FormField'
import { generateReceipt, generateInvoice, generateRemito } from '../../lib/pdf'

const invoiceColors: Record<string, { bg: string; color: string }> = {
  A: { bg: '#eff6ff', color: '#2563eb' },
  B: { bg: '#f5f3ff', color: '#7c3aed' },
  X: { bg: '#f8fafc', color: '#94a3b8' },
}

interface SaleDetailModalProps {
  detail: any
  clients: any[]
  onClose: () => void
  onCancel: (id: number) => void
  cancelPending: boolean
  onDelete: (id: number) => void
  deletePending: boolean
  onUpdateTransport: (id: number, data: any) => void
  transportPending?: boolean
}

function toTransportForm(s: any) {
  return {
    transportPropio: s.transportPropio ?? false,
    transportistaNombre: s.transportistaNombre || '',
    transportistaCuit: s.transportistaCuit || '',
    transportistaDomicilio: s.transportistaDomicilio || '',
    conductorNombre: s.conductorNombre || '',
    conductorDni: s.conductorDni || '',
    conductorRegNum: s.conductorRegNum || '',
    dominioVehiculo: s.dominioVehiculo || '',
    dominioAcoplado: s.dominioAcoplado || '',
  }
}

export function SaleDetailModal({ detail, clients, onClose, onCancel, cancelPending, onDelete, deletePending, onUpdateTransport, transportPending }: SaleDetailModalProps) {
  const clientData = clients.find((c: any) => c.id === detail.clientId)
  const invStyle = invoiceColors[detail.invoiceType || 'X'] || invoiceColors.X
  const [showTransport, setShowTransport] = useState(false)
  const [tForm, setTForm] = useState(toTransportForm(detail))
  const tf = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setTForm((prev: any) => ({ ...prev, [key]: e.target.value }))

  return (
    <Modal title={`Comprobante ${detail.saleNumber || '#' + detail.id}`} onClose={onClose} width={520}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '12px' }}>
        {detail.invoiceType && detail.invoiceType !== 'X' && (
          <button onClick={() => generateInvoice(detail, clientData)}
            style={{ ...btnSecondary, fontSize: '13px', padding: '7px 16px', color: invStyle.color }}>
            Factura {detail.invoiceType}
          </button>
        )}
        <button onClick={() => generateRemito(detail, clientData)}
          style={{ ...btnSecondary, fontSize: '13px', padding: '7px 16px', color: '#7c3aed' }}>
          Remito
        </button>
        <button onClick={() => generateReceipt(detail, clientData)}
          style={{ ...btnPrimary, fontSize: '13px', padding: '7px 16px' }}>
          Comprobante PDF
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13.5px' }}>
          <div><span style={{ color: '#94a3b8' }}>Fecha: </span>{new Date(detail.createdAt).toLocaleDateString('es-AR')}</div>
          <div><span style={{ color: '#94a3b8' }}>Tipo: </span>{detail.type}</div>
          <div><span style={{ color: '#94a3b8' }}>Pago: </span>{detail.paymentMethod}</div>
          <div><span style={{ color: '#94a3b8' }}>Estado: </span>{detail.status}</div>
          {detail.invoiceType && detail.invoiceType !== 'X' && (
            <div><span style={{ color: '#94a3b8' }}>Comprobante: </span>Factura {detail.invoiceType}</div>
          )}
          {detail.installments?.length > 0 && (() => {
            const paid = detail.installments.filter((i: any) => i.status === 'pagado').length
            const n = detail.installments.length
            const done = paid === n
            return (
              <div>
                <span style={{ color: '#94a3b8' }}>Cuotas: </span>
                <span style={{ fontWeight: 700, color: done ? '#16a34a' : '#d97706' }}>{paid}/{n} pagadas</span>
              </div>
            )
          })()}
        </div>

        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Ítems</div>
          {detail.items?.map((it: any) => (
            <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13.5px' }}>
              <span>{it.description} × {it.quantity}</span>
              <span style={{ fontWeight: 600 }}>${Number(it.subtotal).toLocaleString('es-AR')}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '16px' }}>
          <span>Total</span><span>${Number(detail.total).toLocaleString('es-AR')}</span>
        </div>

        {detail.financingCurrency && detail.installments?.length > 0 && (() => {
          const P = Number(detail.subtotal) - Number(detail.discount) - Number(detail.downPayment || 0)
          const n = detail.installments.length
          const cuota = Number(detail.installments[0]?.amount)
          const totalPagar = cuota * n
          const totalInteres = totalPagar - P
          const currency = detail.financingCurrency === 'usd' ? 'USD' : 'Pesos'
          const accentColor = detail.financingCurrency === 'usd' ? '#0e7490' : '#7c3aed'
          const accentBg = detail.financingCurrency === 'usd' ? '#cffafe' : '#ede9fe'
          const fmt = (v: number) => v.toLocaleString('es-AR', { minimumFractionDigits: 2 })
          return (
            <div style={{ border: `1.5px solid ${accentColor}`, borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ background: accentColor, padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'white', fontWeight: 700, fontSize: '12px' }}>CRÉDITO EN {currency.toUpperCase()} · {detail.interestRate}% MENSUAL</span>
                <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '11px', padding: '1px 8px', borderRadius: '20px' }}>INTERÉS SIMPLE</span>
              </div>
              <div style={{ background: accentBg, padding: '12px 14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', textAlign: 'center' }}>
                <div><div style={{ fontSize: '10px', fontWeight: 600, color: accentColor }}>CUOTA MENSUAL</div><div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>${fmt(cuota)}</div></div>
                <div><div style={{ fontSize: '10px', fontWeight: 600, color: accentColor }}>TOTAL A PAGAR</div><div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>${fmt(totalPagar)}</div></div>
                <div><div style={{ fontSize: '10px', fontWeight: 600, color: '#dc2626' }}>INTERÉS TOTAL</div><div style={{ fontSize: '16px', fontWeight: 800, color: '#dc2626' }}>+${fmt(totalInteres)}</div></div>
              </div>
              <div style={{ padding: '10px 14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>PLAN DE PAGOS</div>
                {detail.installments.map((inst: any) => (
                  <div key={inst.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                    <span style={{ color: '#64748b' }}>Cuota {inst.number} — {new Date(inst.dueDate).toLocaleDateString('es-AR', { timeZone: 'UTC' })}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 600 }}>${Number(inst.amount).toLocaleString('es-AR')}</span>
                      <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: inst.status === 'pagado' ? '#f0fdf4' : '#fffbeb', color: inst.status === 'pagado' ? '#16a34a' : '#d97706' }}>{inst.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}

        {!detail.financingCurrency && detail.installments?.length > 0 && (
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Cuotas</div>
            {detail.installments.map((inst: any) => (
              <div key={inst.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>Cuota {inst.number} — {new Date(inst.dueDate).toLocaleDateString('es-AR', { timeZone: 'UTC' })}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 600 }}>${Number(inst.amount).toLocaleString('es-AR')}</span>
                  <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: inst.status === 'pagado' ? '#f0fdf4' : '#fffbeb', color: inst.status === 'pagado' ? '#16a34a' : '#d97706' }}>{inst.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TRANSPORTE */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
          <button
            type="button"
            onClick={() => setShowTransport(p => !p)}
            style={{ width: '100%', padding: '10px 14px', background: '#f8fafc', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: 600, color: '#334155' }}
          >
            Datos de Transporte (Remito)
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>{showTransport ? '▲ cerrar' : '▼ editar'}</span>
          </button>
          {showTransport && (
            <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <FormField label="Transporte Propio">
                <select style={inputStyle} value={tForm.transportPropio ? 'true' : 'false'}
                  onChange={e => setTForm((p: any) => ({ ...p, transportPropio: e.target.value === 'true' }))}>
                  <option value="false">No (Art. 12 RG 3434)</option>
                  <option value="true">Sí</option>
                </select>
              </FormField>
              {!tForm.transportPropio && (
                <>
                  <div className="form-grid-2">
                    <FormField label="Transportista"><input style={inputStyle} value={tForm.transportistaNombre} onChange={tf('transportistaNombre')} /></FormField>
                    <FormField label="CUIT Transportista"><input style={inputStyle} value={tForm.transportistaCuit} onChange={tf('transportistaCuit')} /></FormField>
                  </div>
                  <FormField label="Domicilio Transportista"><input style={inputStyle} value={tForm.transportistaDomicilio} onChange={tf('transportistaDomicilio')} /></FormField>
                  <div className="form-grid-2">
                    <FormField label="Conductor"><input style={inputStyle} value={tForm.conductorNombre} onChange={tf('conductorNombre')} /></FormField>
                    <FormField label="DNI Conductor"><input style={inputStyle} value={tForm.conductorDni} onChange={tf('conductorDni')} /></FormField>
                  </div>
                  <div className="form-grid-2">
                    <FormField label="Reg. Nº"><input style={inputStyle} value={tForm.conductorRegNum} onChange={tf('conductorRegNum')} /></FormField>
                    <FormField label="Dom. Camión"><input style={inputStyle} value={tForm.dominioVehiculo} onChange={tf('dominioVehiculo')} /></FormField>
                  </div>
                  <FormField label="Dom. Acoplado"><input style={{ ...inputStyle, width: '200px' }} value={tForm.dominioAcoplado} onChange={tf('dominioAcoplado')} /></FormField>
                </>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" style={{ ...btnPrimary, fontSize: '13px', padding: '7px 18px' }}
                  disabled={transportPending}
                  onClick={() => onUpdateTransport(detail.id, tForm)}>
                  {transportPending ? 'Guardando...' : 'Guardar transporte'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {detail.status !== 'cancelado' && (
            <button
              onClick={() => { if (confirm('¿Cancelar esta venta? Se restaurará el stock.')) onCancel(detail.id) }}
              style={{ padding: '7px 16px', fontSize: '13px', fontWeight: 600, background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              disabled={cancelPending}>
              {cancelPending ? 'Cancelando...' : 'Cancelar venta'}
            </button>
          )}
          <button
            onClick={() => { if (confirm('¿Eliminar esta venta permanentemente? Esta acción no se puede deshacer.')) onDelete(detail.id) }}
            style={{ padding: '7px 16px', fontSize: '13px', fontWeight: 600, background: '#fef2f2', color: '#991b1b', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer' }}
            disabled={deletePending}>
            {deletePending ? 'Eliminando...' : 'Eliminar venta'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
