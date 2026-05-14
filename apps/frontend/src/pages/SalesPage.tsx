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
  const { clients, products, vehicles, filtered, isLoading, modal, setModal, detail, setDetail, search, setSearch, dateFrom, setDateFrom, dateTo, setDateTo, invoiceFilter, setInvoiceFilter, create, cancel, updateTransport, createClient, total, page, pages, setPage } = useSales()

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
        Historial completo de todo lo que vendiste. Podés registrar ventas al <strong>contado</strong> (un solo pago) o en <strong>cuotas</strong> — en ese caso el sistema arma el plan de pagos automáticamente con la tasa que vos definís. El stock de productos y el estado de los vehículos se actualiza solo al confirmar la venta.
        <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '8px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <span><strong>Factura A</strong> — para clientes Responsables Inscriptos (CUIT)</span>
          <span><strong>Factura B</strong> — para consumidores finales</span>
          <span><strong>Sin factura</strong> — operación informal (en negro)</span>
          <span><strong>Mixto</strong> — parte con factura, parte sin factura</span>
        </div>
        <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '6px' }}>
          Desde el detalle de cada venta podés generar el <strong>Remito</strong> y el <strong>Comprobante PDF</strong> para entregar al cliente. Si vendiste en cuotas, las cuotas aparecen en la sección <strong>Cobranza</strong>.
        </div>
      </InfoBanner>

      <div className="filter-bar" style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div className="filter-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>BUSCAR</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cliente o comprobante..." style={{ ...inputStyle, minWidth: '180px', flex: 1 }} />
        </div>
        <div className="filter-sep" style={{ width: '1px', background: '#e2e8f0', alignSelf: 'stretch' }} />
        <div className="filter-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>PERÍODO</span>
          <div className="filter-dates" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: '130px' }} />
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>→</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: '130px' }} />
          </div>
        </div>
        <div className="filter-sep" style={{ width: '1px', background: '#e2e8f0', alignSelf: 'stretch' }} />
        <div className="filter-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>COMPROBANTE</span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {([['', 'Todas'], ['A', '🧾 A'], ['B', '🧾 B'], ['X', '🤝 Negro'], ['mixto', '🔀 Mixto']] as [string, string][]).map(([val, label]) => (
              <button key={val} onClick={() => setInvoiceFilter(val)}
                style={{ padding: '6px 10px', borderRadius: '9px', fontSize: '12px', fontWeight: 500, border: invoiceFilter === val ? '1.5px solid #1d4ed8' : '1.5px solid #e2e8f0', cursor: 'pointer', background: invoiceFilter === val ? '#eff6ff' : '#fff', color: invoiceFilter === val ? '#1d4ed8' : '#374151', minHeight: '36px' }}>
                {label}
              </button>
            ))}
          </div>
        </div>
        {(search || dateFrom || dateTo || invoiceFilter) && (
          <div className="filter-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); setInvoiceFilter('') }} style={{ ...btnSecondary, fontSize: '12px', padding: '6px 12px', minHeight: '36px' }}>Limpiar</button>
          </div>
        )}
      </div>

      <div style={{ background: 'white', borderRadius: '14px', overflowX: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
        <SalesTable filtered={filtered} clients={clients} isLoading={isLoading} onView={setDetail} />
      </div>
      <Pagination page={page} pages={pages} total={total} onPage={setPage} />

      {modal && <SaleFormModal clients={clients} products={products} vehicles={vehicles} onSubmit={data => create.mutate(data)} onClose={() => setModal(false)} isPending={create.isPending} onCreateClient={data => createClient.mutateAsync(data)} />}
      {detail && <SaleDetailModal detail={detail} clients={clients} onClose={() => setDetail(null)} onCancel={id => cancel.mutate(id)} cancelPending={cancel.isPending} onUpdateTransport={(id, data) => updateTransport.mutate({ id, data })} transportPending={updateTransport.isPending} />}
    </div>
  )
}
