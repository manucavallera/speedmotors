// @file: SalesPage.tsx | Cáscara orquestadora de ventas. Lógica en useSales, UI en SalesTable/SaleFormModal/SaleDetailModal.
import { inputStyle, btnPrimary, btnSecondary } from '../components/ui/FormField'
import { InfoBanner } from '../components/ui/InfoBanner'
import { SalesTable } from '../components/sales/SalesTable'
import { SaleFormModal } from '../components/sales/SaleFormModal'
import { SaleDetailModal } from '../components/sales/SaleDetailModal'
import { useSales } from '../hooks/useSales'
import { Pagination } from '../components/ui/Pagination'
import { exportSalesCsv, exportSalesPdf } from '../lib/export'

export function SalesPage() {
  const { clients, products, vehicles, filtered, isLoading, modal, setModal, detail, setDetail, search, setSearch, dateFrom, setDateFrom, dateTo, setDateTo, invoiceFilter, setInvoiceFilter, create, cancel, updateTransport, total, page, pages, setPage } = useSales()

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Ventas</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '2px' }}>{total} ventas registradas{pages > 1 ? ` · pág. ${page}/${pages}` : ''}</p>
        </div>
        <div className="page-header-actions">
          <button onClick={() => exportSalesCsv(filtered, clients)} style={{ ...btnSecondary, fontSize: '13px' }}>CSV</button>
          <button onClick={() => exportSalesPdf(filtered, clients)} style={{ ...btnSecondary, fontSize: '13px' }}>PDF</button>
          <button onClick={() => setModal(true)} style={btnPrimary}>+ Nueva venta</button>
        </div>
      </div>

      <InfoBanner title="Ventas registradas">
        Historial de todo lo que vendiste. Podés vender al <strong>contado</strong> (un solo pago) o en <strong>cuotas</strong> (el sistema arma el plan de pagos automáticamente). El stock baja solo al registrar la venta.
      </InfoBanner>

      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>BUSCAR</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cliente o comprobante..." style={{ ...inputStyle, width: '220px' }} />
        </div>
        <div style={{ width: '1px', background: '#e2e8f0', alignSelf: 'stretch' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>PERÍODO</span>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ ...inputStyle, width: '150px' }} />
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>→</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ ...inputStyle, width: '150px' }} />
          </div>
        </div>
        <div style={{ width: '1px', background: '#e2e8f0', alignSelf: 'stretch' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>COMPROBANTE</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {([['', 'Todas'], ['A', '🧾 Fctura A'], ['B', '🧾 Fctura B'], ['X', '🤝 Negro'], ['mixto', '🔀 Mixto']] as [string, string][]).map(([val, label]) => (
              <button key={val} onClick={() => setInvoiceFilter(val)}
                style={{ padding: '6px 12px', borderRadius: '9px', fontSize: '12px', fontWeight: 500, border: invoiceFilter === val ? '1.5px solid #1d4ed8' : '1.5px solid #e2e8f0', cursor: 'pointer', background: invoiceFilter === val ? '#eff6ff' : '#fff', color: invoiceFilter === val ? '#1d4ed8' : '#374151' }}>
                {label}
              </button>
            ))}
          </div>
        </div>
        {(search || dateFrom || dateTo || invoiceFilter) && (
          <>
            <div style={{ width: '1px', background: '#e2e8f0', alignSelf: 'stretch' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>&nbsp;</span>
              <button onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); setInvoiceFilter('') }} style={{ ...btnSecondary, fontSize: '12px', padding: '6px 12px' }}>Limpiar</button>
            </div>
          </>
        )}
      </div>

      <div style={{ background: 'white', borderRadius: '14px', overflowX: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
        <SalesTable filtered={filtered} clients={clients} isLoading={isLoading} onView={setDetail} />
      </div>
      <Pagination page={page} pages={pages} total={total} onPage={setPage} />

      {modal && <SaleFormModal clients={clients} products={products} vehicles={vehicles} onSubmit={data => create.mutate(data)} onClose={() => setModal(false)} isPending={create.isPending} />}
      {detail && <SaleDetailModal detail={detail} clients={clients} onClose={() => setDetail(null)} onCancel={id => cancel.mutate(id)} cancelPending={cancel.isPending} onUpdateTransport={(id, data) => updateTransport.mutate({ id, data })} transportPending={updateTransport.isPending} />}
    </div>
  )
}
