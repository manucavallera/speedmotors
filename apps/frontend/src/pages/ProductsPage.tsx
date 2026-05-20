// @file: ProductsPage.tsx | Cáscara orquestadora de productos. Lógica en useProducts, UI en ProductsTable/ProductFormModal.
import { useState } from 'react'
import { inputStyle, btnPrimary, btnSecondary } from '../components/ui/FormField'
import { InfoBanner } from '../components/ui/InfoBanner'
import { QRModal } from '../components/ui/QRModal'
import { ImportExcelModal } from '../components/ImportExcelModal'
import { ProductsTable } from '../components/products/ProductsTable'
import { ProductFormModal } from '../components/products/ProductFormModal'
import { ProductRemitoModal } from '../components/products/ProductRemitoModal'
import { useProducts } from '../hooks/useProducts'
import { generatePriceList } from '../lib/pdf'
import { exportProductsCsv, exportProductsPdf } from '../lib/export'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'

export function ProductsPage() {
  const { isAdmin } = useAuth()
  const {
    products, isLoading, sorted, cheapest, priciest,
    total, page, pages, setPage,
    search, setSearch, priceSort, setPriceSort, ingresoFilter, setIngresoFilter,
    supplierFilter, setSupplierFilter, brandFilter, setBrandFilter, suppliers,
    modal, setModal, editing, openCreate, openEdit,
    qrProduct, setQrProduct,
    importModal, setImportModal,
    create, update, remove, refreshProducts,
  } = useProducts()
  const [remitoModal, setRemitoModal] = useState(false)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Productos</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '2px' }}>{total} productos{ingresoFilter ? ` · filtro: ${ingresoFilter}` : ''}{pages > 1 ? ` · pág. ${page}/${pages}` : ''}</p>
        </div>
        <div className="page-header-actions">
          <button onClick={() => exportProductsCsv(products)} style={{ ...btnSecondary, fontSize: '13px' }}>CSV</button>
          <button onClick={() => exportProductsPdf(products)} style={{ ...btnSecondary, fontSize: '13px' }}>PDF stock</button>
          <button onClick={() => generatePriceList(products, [])} style={{ ...btnSecondary, fontSize: '13px' }}>Lista precios</button>
          <button onClick={() => setImportModal(true)} style={{ ...btnSecondary, fontSize: '13px', color: '#16a34a' }}>Importar Excel</button>
          <button onClick={() => setRemitoModal(true)} style={{ ...btnSecondary, fontSize: '13px', color: '#0369a1' }}>Recibir remito</button>
          <button onClick={openCreate} style={btnPrimary}>+ Nuevo producto</button>
        </div>
      </div>

      <InfoBanner title="Catálogo de productos">
        Lista de todo lo que vendés con código, marca, precios y stock. <strong>El stock se actualiza solo</strong> al registrar ventas (baja) o recibir órdenes de compra (sube). Podés exportar el catálogo a PDF para mandárselo a clientes, o importar productos desde Excel para cargas masivas.
        <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '8px' }}>
          Si necesitás corregir el stock manualmente — por rotura, robo, devolución o ajuste de inventario — usá la sección <strong>Movimientos de stock</strong> en el menú lateral. Cada corrección queda registrada con fecha y motivo.
        </div>
      </InfoBanner>

      <div className="filter-bar" style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-start' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '180px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Buscar</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nombre..." style={{ ...inputStyle }} />
        </div>

        <div className="filter-sep" style={{ width: '1px', background: '#e2e8f0', alignSelf: 'stretch' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Precio</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {([['', 'Sin orden'], ['asc', '↑ Menor'], ['desc', '↓ Mayor']] as [string, string][]).map(([val, lbl]) => (
              <button key={val} onClick={() => setPriceSort(val as 'asc' | 'desc' | '')}
                style={{ padding: '7px 14px', borderRadius: '9px', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer', background: priceSort === val ? '#1d4ed8' : '#f1f5f9', color: priceSort === val ? 'white' : '#374151' }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-sep" style={{ width: '1px', background: '#e2e8f0', alignSelf: 'stretch' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ingreso</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {([['', 'Todos'], ['blanco', '🧾 Blanco'], ['negro', '🤝 Negro']] as [string, string][]).map(([val, lbl]) => (
              <button key={val} onClick={() => setIngresoFilter(val as 'blanco' | 'negro' | '')}
                style={{ padding: '7px 14px', borderRadius: '9px', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer', background: ingresoFilter === val ? '#1d4ed8' : '#f1f5f9', color: ingresoFilter === val ? 'white' : '#374151' }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {suppliers.length > 0 && (
          <>
            <div className="filter-sep" style={{ width: '1px', background: '#e2e8f0', alignSelf: 'stretch' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Proveedor</span>
              <select value={supplierFilter} onChange={e => setSupplierFilter(e.target.value ? Number(e.target.value) : '')}
                style={{ ...inputStyle, minWidth: '160px' }}>
                <option value="">Todos</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </>
        )}

        <div className="filter-sep" style={{ width: '1px', background: '#e2e8f0', alignSelf: 'stretch' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '140px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Marca</span>
          <input value={brandFilter} onChange={e => setBrandFilter(e.target.value)} placeholder="Ej: NGK, Castrol..." style={{ ...inputStyle }} />
        </div>
      </div>

      {cheapest && priciest && cheapest.id !== priciest.id && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
          <div style={{ flex: 1, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px 14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#16a34a', marginBottom: '2px' }}>MÁS BARATO</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cheapest.name}</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#16a34a' }}>${Number(cheapest.sellPrice).toLocaleString('es-AR')}</div>
          </div>
          <div style={{ flex: 1, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#dc2626', marginBottom: '2px' }}>MÁS CARO</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{priciest.name}</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#dc2626' }}>${Number(priciest.sellPrice).toLocaleString('es-AR')}</div>
          </div>
        </div>
      )}

      <ProductsTable sorted={sorted} isLoading={isLoading} onEdit={openEdit} onDelete={isAdmin ? (id: number) => { if (window.confirm('¿Eliminar este producto?')) remove.mutate(id) } : undefined} onQR={setQrProduct} />

      {pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: page <= 1 ? '#f8fafc' : 'white', color: page <= 1 ? '#94a3b8' : '#1d4ed8', fontWeight: 600, cursor: page <= 1 ? 'not-allowed' : 'pointer', fontSize: '14px' }}
          >← Ant</button>
          <span style={{ fontSize: '13px', color: '#64748b', minWidth: '80px', textAlign: 'center' }}>Pág. {page} de {pages}</span>
          <button
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={page >= pages}
            style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: page >= pages ? '#f8fafc' : 'white', color: page >= pages ? '#94a3b8' : '#1d4ed8', fontWeight: 600, cursor: page >= pages ? 'not-allowed' : 'pointer', fontSize: '14px' }}
          >Sig →</button>
        </div>
      )}

      {qrProduct && (
        <QRModal
          title={qrProduct.name}
          value={`PROD:${qrProduct.id}:${qrProduct.code}`}
          subtitle={`Código: ${qrProduct.code} | $${Number(qrProduct.sellPrice).toLocaleString('es-AR')}`}
          onClose={() => setQrProduct(null)}
        />
      )}

      {modal && (
        <ProductFormModal
          mode={modal}
          editing={editing}
          onClose={() => setModal(null)}
          onSubmit={data => modal === 'edit' ? update.mutate({ id: editing!.id, data }) : create.mutate(data)}
          isPending={create.isPending || update.isPending}
        />
      )}

      {importModal && (
        <ImportExcelModal
          onClose={() => { setImportModal(false); refreshProducts() }}
          onImport={rows => api.post('/products/import', { products: rows }).then(r => r.data)}
        />
      )}

      {remitoModal && (
        <ProductRemitoModal onClose={() => setRemitoModal(false)} />
      )}
    </div>
  )
}
