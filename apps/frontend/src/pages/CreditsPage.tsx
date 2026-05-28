import { useState } from 'react'
import { useCredits } from '../hooks/useCredits'
import { useAuth } from '../hooks/useAuth'
import { InfoBanner } from '../components/ui/InfoBanner'
import { btnPrimary } from '../components/ui/FormField'
import { CreditsTable } from '../components/credits/CreditsTable'
import { CreditFormModal } from '../components/credits/CreditFormModal'
import { CreditDetailModal } from '../components/credits/CreditDetailModal'
import { CreditPaymentModal } from '../components/credits/CreditPaymentModal'

export function CreditsPage() {
  const { isAdmin } = useAuth()
  const c = useCredits()
  const [paymentModal, setPaymentModal] = useState(false)

  const filtered = c.statusFilter === 'todos' ? c.credits : c.credits.filter(cr => cr.status === c.statusFilter)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Créditos</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '2px' }}>{c.credits.length} registros · cuenta corriente con interés mensual</p>
        </div>
        <button onClick={() => c.setModal(true)} style={btnPrimary}>+ Nuevo crédito</button>
      </div>

      <InfoBanner title="Créditos cuenta corriente">
        Deudores que <strong>pagan lo que pueden cada mes</strong> sobre un saldo abierto. Cada 30 días se aplica automáticamente la tasa de interés sobre el saldo. Podés registrar entregas parciales en cualquier momento. Para deudores del sistema viejo, cargá solo el saldo actual y la fecha desde la que querés que empiecen a correr los próximos intereses.
      </InfoBanner>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {(['todos', 'activo', 'pagado', 'cancelado'] as const).map(s => (
          <button key={s} onClick={() => c.setStatusFilter(s)}
            style={{ padding: '6px 16px', fontSize: '13px', fontWeight: 600, borderRadius: '20px', cursor: 'pointer', border: c.statusFilter === s ? '1.5px solid #2563eb' : '1.5px solid #e2e8f0', background: c.statusFilter === s ? '#eff6ff' : '#fff', color: c.statusFilter === s ? '#2563eb' : '#64748b' }}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <CreditsTable credits={filtered} isLoading={c.isLoading} onView={c.setDetailId} />

      {c.modal && (
        <CreditFormModal
          mode="create"
          clients={c.clients}
          onClose={() => c.setModal(false)}
          onSubmit={data => c.create.mutate(data)}
          isPending={c.create.isPending}
        />
      )}

      {c.editing && (
        <CreditFormModal
          mode="edit"
          credit={c.editing}
          clients={c.clients}
          onClose={() => c.setEditing(null)}
          onSubmit={data => c.update.mutate({ id: c.editing!.id, data })}
          isPending={c.update.isPending}
        />
      )}

      {c.detail && c.detailId && !c.editing && (
        <CreditDetailModal
          detail={c.detail}
          onClose={() => c.setDetailId(null)}
          onAddPayment={() => setPaymentModal(true)}
          onEdit={() => c.setEditing(c.detail!)}
          onDelete={() => { if (confirm('¿Eliminar este crédito y todos sus pagos/intereses? No se puede deshacer.')) c.remove.mutate(c.detail!.id) }}
          onRemovePayment={id => c.removePayment.mutate(id)}
          onPayInstallment={(installmentId, paymentDate) => c.payInstallment.mutate({ installmentId, paymentDate })}
          onUnpayInstallment={(installmentId) => c.unpayInstallment.mutate(installmentId)}
          isAdmin={isAdmin}
        />
      )}

      {paymentModal && c.detail && (
        <CreditPaymentModal
          maxAmount={c.detail.balance}
          currency={c.detail.currency}
          onClose={() => setPaymentModal(false)}
          onSubmit={data => { c.addPayment.mutate({ creditId: c.detail!.id, data }); setPaymentModal(false) }}
          isPending={c.addPayment.isPending}
        />
      )}
    </div>
  )
}
