import { useState } from 'react'
import { useCredits } from '../hooks/useCredits'
import { useAuth } from '../hooks/useAuth'
import { InfoBanner } from '../components/ui/InfoBanner'
import { btnPrimary } from '../components/ui/FormField'
import { CreditsTable } from '../components/credits/CreditsTable'
import { CreditFormModal } from '../components/credits/CreditFormModal'
import { CreditDetailModal } from '../components/credits/CreditDetailModal'
import { CreditPaymentModal } from '../components/credits/CreditPaymentModal'
import { CreditCapitalModal } from '../components/credits/CreditCapitalModal'
import { Pagination } from '../components/ui/Pagination'
import type { DebtTypeFilter } from '../lib/creditFilters'

export function CreditsPage() {
  const { isAdmin } = useAuth()
  const c = useCredits()
  const [paymentModal, setPaymentModal] = useState(false)
  const [capitalModal, setCapitalModal] = useState(false)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Créditos</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '2px' }}>
            {c.total} crédito{c.total === 1 ? '' : 's'} encontrado{c.total === 1 ? '' : 's'}
          </p>
        </div>
        <button onClick={() => c.setModal(true)} style={btnPrimary}>+ Nuevo crédito</button>
      </div>

      <InfoBanner title="Créditos y financiaciones">
        Acá aparecen todos los clientes que te deben plata: los que compraron en <strong>cuotas fijas</strong> (interés simple, cuotas generadas automáticamente desde la venta), los que quedaron en <strong>cuenta corriente</strong> (sin interés, con fecha de vencimiento), y los que tienen <strong>cuota libre</strong> (pagan lo que pueden, interés compuesto mensual sobre el saldo).
        <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '8px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <span><strong>Cuotas fijas</strong> — cuotas calculadas al momento de la venta. Si paga 20+ días antes del vencimiento de una cuota, se le cobra solo el capital (sin interés).</span>
          <span><strong>Cuota libre</strong> — paga cuando puede. Interés se aplica cada 30 días sobre el saldo. Si paga 20+ días antes del vencimiento mensual, ese mes no corre el interés.</span>
          <span><strong>Cuenta corriente</strong> — sin interés, con fecha de vencimiento. Si no paga, genera alerta automática.</span>
        </div>
        <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '6px' }}>
          Para deudores del sistema viejo: cargá el saldo actual y la fecha desde la que querés que empiecen a correr los próximos intereses.
        </div>
      </InfoBanner>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={c.search}
          onChange={(event) => c.setSearch(event.target.value)}
          placeholder="Buscar cliente..."
          aria-label="Buscar cliente"
          style={{ minWidth: '240px', flex: '1 1 280px', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px' }}
        />
        <select
          value={c.debtTypeFilter}
          onChange={(event) => c.setDebtTypeFilter(event.target.value as DebtTypeFilter)}
          aria-label="Tipo de deuda"
          style={{ minWidth: '190px', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff', fontSize: '14px' }}
        >
          <option value="todos">Todos los tipos</option>
          <option value="fija">Financiación fija</option>
          <option value="libre">Cuota libre</option>
          <option value="cuenta_corriente">Cuenta corriente</option>
        </select>
        {c.isFetching && !c.isLoading && <span style={{ color: '#64748b', fontSize: '13px' }}>Actualizando…</span>}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {(['todos', 'activo', 'pagado', 'cancelado'] as const).map(s => (
          <button key={s} onClick={() => c.setStatusFilter(s)}
            style={{ padding: '6px 16px', fontSize: '13px', fontWeight: 600, borderRadius: '20px', cursor: 'pointer', border: c.statusFilter === s ? '1.5px solid #2563eb' : '1.5px solid #e2e8f0', background: c.statusFilter === s ? '#eff6ff' : '#fff', color: c.statusFilter === s ? '#2563eb' : '#64748b' }}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {c.isError && (
        <div
          role="alert"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '12px', padding: '10px 12px', border: '1px solid #fecaca', borderRadius: '8px', background: '#fef2f2', color: '#991b1b', fontSize: '13px' }}
        >
          <span>No pudimos cargar los créditos. Revisá la conexión e intentá nuevamente.</span>
          <button
            onClick={() => void c.refetch()}
            style={{ padding: '6px 10px', border: '1px solid #fca5a5', borderRadius: '6px', background: '#fff', color: '#991b1b', fontWeight: 600, cursor: 'pointer' }}
          >
            Reintentar
          </button>
        </div>
      )}

      <CreditsTable
        credits={c.credits}
        isLoading={c.isLoading}
        emptyMessage="No hay créditos para estos filtros"
        onView={c.setDetailId}
      />
      <Pagination page={c.page} pages={c.pages} total={c.total} onPage={c.setPage} />

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
          onAddCapital={() => setCapitalModal(true)}
          onEdit={() => c.setEditing(c.detail!)}
          onDelete={() => { if (confirm('¿Eliminar este crédito y todos sus pagos/intereses? No se puede deshacer.')) c.remove.mutate(c.detail!.id) }}
          onRemoveCapital={id => c.removeCapital.mutate(id)}
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
      {capitalModal && c.detail && (
        <CreditCapitalModal
          onClose={() => setCapitalModal(false)}
          onSubmit={data => { c.addCapital.mutate({ creditId: c.detail!.id, data }); setCapitalModal(false) }}
          isPending={c.addCapital.isPending}
        />
      )}
    </div>
  )
}
