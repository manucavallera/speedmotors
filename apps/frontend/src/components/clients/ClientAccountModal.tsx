// @file: ClientAccountModal.tsx | Cuenta corriente del cliente. Self-contained: maneja su propio query y payInstallment mutation.
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '../ui/Modal'
import { btnPrimary, btnSecondary } from '../ui/FormField'
import { api } from '../../lib/api'
import { generateAccountStatement } from '../../lib/pdf'
import { OverdueInstallments } from './OverdueInstallments'
import { SalesHistoryList } from './SalesHistoryList'

const paymentTypeLabel: Record<string, { label: string; color: string; sign: string }> = {
  pago_cuenta: { label: 'Pago a cuenta', color: '#16a34a', sign: '-' },
  nota_credito: { label: 'Nota de crédito', color: '#2563eb', sign: '-' },
  nota_debito:  { label: 'Nota de débito',  color: '#dc2626', sign: '+' },
}

function fmt(n: number) { return '$' + n.toLocaleString('es-AR') }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) }
// Vencimientos se guardan a las 00:00 UTC: formatear en UTC para no restar un día en hora AR
function fmtDue(d: string) { return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) }

interface ClientAccountModalProps {
  client: any
  onClose: () => void
}

export function ClientAccountModal({ client, onClose }: ClientAccountModalProps) {
  const qc = useQueryClient()
  const [payingInstallment, setPayingInstallment] = useState<any>(null)

  const { data: account, isLoading } = useQuery({
    queryKey: ['client-account', client.id],
    queryFn: () => api.get(`/clients/${client.id}/account`).then(r => r.data),
  })

  const inv = () => qc.invalidateQueries({ queryKey: ['client-account', client.id] })

  const payInstallment = useMutation({
    mutationFn: (id: number) => api.post(`/sales/installments/${id}/pay`),
    onSuccess: () => { inv(); setPayingInstallment(null) },
  })

  const removePayment = useMutation({
    mutationFn: (paymentId: number) => api.delete(`/clients/${client.id}/payments/${paymentId}`),
    onSuccess: inv,
  })

  return (
    <>
      <Modal title={`Cuenta corriente — ${client.name}`} onClose={onClose} width={620}>
        {isLoading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>Cargando...</div>
        ) : account && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Los pagos se registran en la sección <strong style={{ color: '#374151' }}>Créditos</strong>, en cada deuda por separado.</span>
              <button onClick={() => generateAccountStatement(client, account)}
                style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, background: '#f8fafc', color: '#374151', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', flexShrink: 0 }}>
                Estado de cuenta PDF
              </button>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
              {[
                { label: 'Total comprado', value: fmt(account.totalPurchased), color: '#0f172a', bg: '#f8fafc' },
                { label: 'Deuda pendiente', value: fmt(account.totalPending), color: account.totalPending > 0 ? '#d97706' : '#16a34a', bg: account.totalPending > 0 ? '#fffbeb' : '#f0fdf4' },
                { label: 'Deuda vencida', value: fmt(account.totalOverdue), color: account.totalOverdue > 0 ? '#dc2626' : '#16a34a', bg: account.totalOverdue > 0 ? '#fef2f2' : '#f0fdf4' },
                { label: 'Saldo real', value: fmt(account.balance ?? account.totalPending), color: (account.balance ?? account.totalPending) > 0 ? '#dc2626' : '#16a34a', bg: (account.balance ?? account.totalPending) > 0 ? '#fef2f2' : '#f0fdf4' },
              ].map(k => (
                <div key={k.label} style={{ background: k.bg, borderRadius: '10px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '5px' }}>{k.label}</div>
                  <div style={{ fontSize: '17px', fontWeight: 700, color: k.color }}>{k.value}</div>
                </div>
              ))}
            </div>

            <OverdueInstallments items={account.pendingInstallments} onPay={setPayingInstallment} />

            {/* Cuenta corriente / saldo variable (deuda sin cuotas) */}
            {account.accountCredits?.length > 0 && (
              <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px 16px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>
                  Cuenta corriente / saldo ({account.accountCredits.length})
                </div>
                {account.accountCredits.map((c: any) => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', paddingBottom: '6px', marginBottom: '6px', borderBottom: '1px solid #e2e8f0' }}>
                    <span style={{ color: c.overdue ? '#dc2626' : '#374151' }}>
                      {Number(c.interestRate) > 0 ? 'Saldo variable' : 'Cuenta corriente'}
                      {c.saleId ? ` · Venta #${c.saleId}` : ''}
                      {c.dueDate ? ` · ${c.overdue ? 'Venció' : 'Vence'} ${fmtDue(c.dueDate)}` : ''}
                    </span>
                    <span style={{ fontWeight: 700, color: c.overdue ? '#dc2626' : '#0f172a' }}>{fmt(Number(c.balance))}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Movimientos de cuenta */}
            {account.payments?.length > 0 && (
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>
                  Movimientos de cuenta ({account.payments.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                  {account.payments.map((p: any) => {
                    const pt = paymentTypeLabel[p.type] ?? paymentTypeLabel.pago_cuenta
                    return (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', background: '#f8fafc', borderRadius: '8px', fontSize: '13px' }}>
                        <span style={{ background: `${pt.color}15`, color: pt.color, fontSize: '10.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', flexShrink: 0 }}>{pt.label}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{fmtDate(p.date)}</div>
                        </div>
                        <div style={{ fontWeight: 700, color: pt.color, flexShrink: 0 }}>{pt.sign}${Number(p.amount).toLocaleString('es-AR')}</div>
                        <button onClick={() => { if (confirm('¿Eliminar este movimiento?')) removePayment.mutate(p.id) }}
                          style={{ padding: '2px 7px', fontSize: '12px', fontWeight: 700, background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '5px', cursor: 'pointer', flexShrink: 0 }}>
                          ×
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>Historial de ventas ({account.sales.length})</div>
              <SalesHistoryList sales={account.sales} client={client} />
            </div>
          </div>
        )}
      </Modal>

      {payingInstallment && (
        <Modal title="Registrar cobro de cuota" onClose={() => setPayingInstallment(null)} width={400}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Cuota {payingInstallment.number} — Venta #{payingInstallment.saleId}</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>${Number(payingInstallment.amount).toLocaleString('es-AR')}</div>
              <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>Vence {fmtDue(payingInstallment.dueDate)}</div>
            </div>
            <p style={{ fontSize: '13px', color: '#374151' }}>Al confirmar, la cuota quedará marcada como pagada y se registrará un ingreso en caja.</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setPayingInstallment(null)} style={btnSecondary}>Cancelar</button>
              <button onClick={() => payInstallment.mutate(payingInstallment.id)} style={btnPrimary} disabled={payInstallment.isPending}>
                {payInstallment.isPending ? 'Registrando...' : 'Confirmar cobro'}
              </button>
            </div>
          </div>
        </Modal>
      )}

    </>
  )
}
