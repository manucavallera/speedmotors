// @file: SalesPage.tsx | Cáscara orquestadora de ventas. Lógica en useSales, UI en SalesTable/SaleFormModal/SaleDetailModal.
import { inputStyle, btnPrimary, btnSecondary } from '../components/ui/FormField'
import { InfoBanner } from '../components/ui/InfoBanner'
import { SalesTable } from '../components/sales/SalesTable'
import { SaleFormModal } from '../components/sales/SaleFormModal'
import { SaleDetailModal } from '../components/sales/SaleDetailModal'
import { useSales } from '../hooks/useSales'
import { Pagination } from '../components/ui/Pagination'

export function SalesPage() {
  const { clients, products, vehicles, filtered, isLoading, modal, setModal, detail, setDetail, search, setSearch, dateFrom, setDateFrom, dateTo, setDateTo, invoiceFilter, setInvoiceFilter, create, cancel, total, page, pages, setPage } = useSales()

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Ventas</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '2px' }}>{total} ventas registradas{pages > 1 ? ` · pág. ${page}/${pages}` : ''}</p>
        </div>
        <button onClick={() => setModal(true)} style={btnPrimary}>+ Nueva venta</button>
      </div>

      <InfoBanner title="Ventas registradas">
        Historial de todo lo que vendiste. Podés vender al <strong>contado</strong> (un solo pago) o en <strong>cuotas</strong> (el sistema arma el plan de pagos automáticamente). El stock baja solo al registrar la venta.
      </InfoBanner>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente o comprobante..." style={{ ...inputStyle, maxWidth: '260px' }} />
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ ...inputStyle, width: '150px' }} />
        <span style={{ color: '#94a3b8', fontSize: '13px' }}>→</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ ...inputStyle, width: '150px' }} />
        <div style={{ display: 'flex', gap: '6px' }}>
          {([['', 'Todas'], ['A', '🧾 Fctura A'], ['B', '🧾 Fctura B'], ['X', '🤝 Negro'], ['mixto', '🔀 Mixto']] as [string, string][]).map(([val, label]) => (
            <button key={val} onClick={() => setInvoiceFilter(val)}
              style={{ padding: '6px 12px', borderRadius: '9px', fontSize: '12px', fontWeight: 500, border: 'none', cursor: 'pointer', background: invoiceFilter === val ? '#1d4ed8' : '#f1f5f9', color: invoiceFilter === val ? 'white' : '#374151' }}>
              {label}
            </button>
          ))}
        </div>
        {(search || dateFrom || dateTo || invoiceFilter) && (
          <button onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); setInvoiceFilter('') }} style={{ ...btnSecondary, fontSize: '12px', padding: '6px 12px' }}>Limpiar</button>
        )}
      </div>

      <div style={{ background: 'white', borderRadius: '14px', overflowX: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
        <SalesTable filtered={filtered} clients={clients} isLoading={isLoading} onView={setDetail} />
      </div>
      <Pagination page={page} pages={pages} total={total} onPage={setPage} />

      {modal && <SaleFormModal clients={clients} products={products} vehicles={vehicles} onSubmit={data => create.mutate(data)} onClose={() => setModal(false)} isPending={create.isPending} />}
      {detail && <SaleDetailModal detail={detail} clients={clients} onClose={() => setDetail(null)} onCancel={id => cancel.mutate(id)} cancelPending={cancel.isPending} />}
    </div>
  )
}
