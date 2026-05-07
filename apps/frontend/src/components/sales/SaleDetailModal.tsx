import { Modal } from '../ui/Modal'
import { btnPrimary, btnSecondary } from '../ui/FormField'
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
}

export function SaleDetailModal({ detail, clients, onClose, onCancel, cancelPending }: SaleDetailModalProps) {
  const clientData = clients.find((c: any) => c.id === detail.clientId)
  const invStyle = invoiceColors[detail.invoiceType || 'X'] || invoiceColors.X

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
          const P = Number(detail.subtotal) - Number(detail.discount)
          const r = Number(detail.interestRate) / 100
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
                <span style={{ color: 'white', fontWeight: 700, fontSize: '12px' }}>
                  CRÉDITO EN {currency.toUpperCase()} · {detail.interestRate}% MENSUAL TEM
                </span>
                <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '11px', padding: '1px 8px', borderRadius: '20px' }}>
                  INTERÉS COMPUESTO
                </span>
              </div>
              <div style={{ background: accentBg, padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: accentColor }}>CUOTA MENSUAL</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>${fmt(cuota)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: accentColor }}>TOTAL A PAGAR</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>${fmt(totalPagar)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: '#dc2626' }}>INTERÉS TOTAL</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#dc2626' }}>+${fmt(totalInteres)}</div>
                </div>
              </div>
              <div style={{ padding: '10px 14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>PLAN DE PAGOS</div>
                {detail.installments.map((inst: any) => (
                  <div key={inst.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                    <span style={{ color: '#64748b' }}>Cuota {inst.number} — {new Date(inst.dueDate).toLocaleDateString('es-AR')}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 600 }}>${Number(inst.amount).toLocaleString('es-AR')}</span>
                      <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: inst.status === 'pagado' ? '#f0fdf4' : '#fffbeb', color: inst.status === 'pagado' ? '#16a34a' : '#d97706' }}>
                        {inst.status}
                      </span>
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
                <span style={{ color: '#64748b' }}>Cuota {inst.number} — {new Date(inst.dueDate).toLocaleDateString('es-AR')}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 600 }}>${Number(inst.amount).toLocaleString('es-AR')}</span>
                  <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: inst.status === 'pagado' ? '#f0fdf4' : '#fffbeb', color: inst.status === 'pagado' ? '#16a34a' : '#d97706' }}>
                    {inst.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {detail.status !== 'cancelado' && (
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
            <button
              onClick={() => { if (confirm('¿Cancelar esta venta? Se restaurará el stock.')) onCancel(detail.id) }}
              style={{ padding: '7px 16px', fontSize: '13px', fontWeight: 600, background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              disabled={cancelPending}>
              {cancelPending ? 'Cancelando...' : 'Cancelar venta'}
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}
