import { useState, useEffect } from 'react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { Modal } from '../ui/Modal'
import { FormField, inputStyle, btnPrimary, btnSecondary } from '../ui/FormField'
import { SearchableSelect } from '../ui/SearchableSelect'
import { SaleItemsEditor } from './SaleItemsEditor'
import type { SaleItem } from './SaleItemsEditor'
import { SaleTotalsPanel } from './SaleTotalsPanel'
import { ClientFormModal } from '../clients/ClientFormModal'
import { ProductFormModal } from '../products/ProductFormModal'
import { api } from '../../lib/api'
import { toast } from '../../lib/toast'

interface SaleFormModalProps {
  clients: any[]
  products: any[]
  vehicles: any[]
  onSubmit: (data: any) => void
  onClose: () => void
  isPending: boolean
  onCreateClient?: (data: any) => Promise<any>
  initialData?: { clientId?: number; vehicleId?: number; downPayment?: number }
}

export function SaleFormModal({ clients, products, vehicles, onSubmit, onClose, isPending, onCreateClient, initialData }: SaleFormModalProps) {
  const qc = useQueryClient()
  const [clientId, setClientId] = useState(initialData?.clientId ? String(initialData.clientId) : '')
  const [showNewClient, setShowNewClient] = useState(false)
  const [newProductBarcode, setNewProductBarcode] = useState<string | null>(null)
  const createProduct = useMutation({
    mutationFn: (d: any) => api.post('/products', d),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['products'] })
      addItemFromProduct(res.data)
      setNewProductBarcode(null)
    },
  })
  const [creatingClient, setCreatingClient] = useState(false)
  const [invoiceType, setInvoiceType] = useState<'A' | 'B' | 'X' | 'mixto'>('B')
  const [type, setType] = useState<'contado' | 'cuotas' | 'cuenta_corriente'>('contado')
  const [financingSubtype, setFinancingSubtype] = useState<'cuotas_simples' | 'saldo_compuesto'>('cuotas_simples')
  const [daysToExpire, setDaysToExpire] = useState('30')
  const [paymentMethod, setPaymentMethod] = useState('efectivo')
  const [discount, setDiscount] = useState('0')
  const [discountIsAuto, setDiscountIsAuto] = useState(true)
  const [downPayment, setDownPayment] = useState(initialData?.downPayment ? String(initialData.downPayment) : '0')
  const [downPaymentMethod, setDownPaymentMethod] = useState('efectivo')
  const [customRate, setCustomRate] = useState(false)
  const [interestRate, setInterestRate] = useState('0')
  const [installmentCount, setInstallmentCount] = useState('12')
  const [financingCurrency, setFinancingCurrency] = useState<'pesos' | 'usd'>('pesos')
  const [firstInstallmentDate, setFirstInstallmentDate] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<SaleItem[]>(() => {
    if (initialData?.vehicleId) {
      const v = vehicles.find((x: any) => x.id === initialData.vehicleId)
      if (v) return [{ description: `${v.brand} ${v.model} ${v.year || ''}`.trim(), quantity: 1, unitPrice: Number(v.sellPrice), vehicleId: v.id, ingresoTipo: v.ingresoTipo }]
    }
    return [{ description: '', quantity: 1, unitPrice: 0 }]
  })

  useEffect(() => {
    if (invoiceType === 'mixto') return
    if (!clientId) { setInvoiceType('B'); return }
    const client = clients.find((c: any) => c.id === Number(clientId))
    if (client?.condicionIva === 'responsable_inscripto') setInvoiceType('A')
    else setInvoiceType('B')
  }, [clientId, clients])

  // Auto-descuento 10% cuando es contado
  useEffect(() => {
    if (type === 'contado' && discountIsAuto) {
      setDiscount(Math.round(subtotal * 0.10).toString())
    }
  }, [type, subtotal, discountIsAuto])

  function addItemFromProduct(p: any) {
    setItems(prev => {
      const idx = prev.findIndex(it => it.productId === p.id)
      if (idx >= 0) return prev.map((it, i) => i === idx ? { ...it, quantity: Number(it.quantity) + 1 } : it)
      return [...prev, { description: p.name, quantity: 1, unitPrice: Number(p.sellPrice), productId: p.id, ingresoTipo: p.ingresoTipo || '' }]
    })
  }
  function addItem() { setItems(prev => [...prev, { description: '', quantity: 1, unitPrice: 0 }]) }
  function removeItem(i: number) { setItems(prev => prev.filter((_, idx) => idx !== i)) }
  function updateItem(i: number, key: string, val: any) {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [key]: val } : item))
  }

  const ventaEnBlanco = invoiceType !== 'X' && invoiceType !== 'mixto'
  const conflictos = items.filter(it => it.ingresoTipo === 'negro' && ventaEnBlanco)
  const subtotal = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0)
  const subtotalFormal = items.filter(it => it.ingresoTipo === 'blanco').reduce((s, it) => s + it.quantity * it.unitPrice, 0)
  const subtotalInformal = items.filter(it => it.ingresoTipo === 'negro').reduce((s, it) => s + it.quantity * it.unitPrice, 0)
  const DEFAULT_RATES: Record<'pesos' | 'usd', number> = { pesos: 5, usd: 3 }
  const discountAmt = parseFloat(discount) || 0
  const downPaymentAmt = parseFloat(downPayment) || 0
  const interest = parseFloat(interestRate) || 0
  const principal = subtotal - discountAmt
  const toFinance = Math.max(0, principal - downPaymentAmt)
  const isCuotasSimples = type === 'cuotas' && financingSubtype === 'cuotas_simples'
  const effectiveRate = isCuotasSimples ? (customRate ? interest : DEFAULT_RATES[financingCurrency]) : 0
  const monthlyRate = effectiveRate
  const n = Number(installmentCount)
  const r = monthlyRate / 100
  // Interés simple (igual que módulo créditos): cuota = capital * (1 + tasa*n) / n
  const cuota = isCuotasSimples && n > 1
    ? toFinance * (1 + r * n) / n
    : toFinance / Math.max(n, 1)
  const total = isCuotasSimples
    ? downPaymentAmt + cuota * n
    : (type === 'cuenta_corriente' || (type === 'cuotas' && financingSubtype === 'saldo_compuesto'))
      ? principal
      : principal * (1 + interest / 100)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if ((type === 'cuenta_corriente' || type === 'cuotas') && !clientId) {
      toast.error('Seleccioná un cliente para venta financiada o cuenta corriente')
      return
    }
    if (isCuotasSimples && !firstInstallmentDate) {
      toast.error('Indicá la fecha de primer vencimiento de la cuota')
      return
    }
    onSubmit({
      clientId: clientId ? Number(clientId) : undefined,
      invoiceType, type, paymentMethod,
      discount: discountAmt,
      downPayment: isCuotasSimples ? downPaymentAmt : 0,
      downPaymentMethod: isCuotasSimples && downPaymentAmt > 0 ? downPaymentMethod : undefined,
      interestRate: isCuotasSimples ? monthlyRate : (type === 'cuotas' && financingSubtype === 'saldo_compuesto' ? interest : 0),
      financingCurrency: isCuotasSimples ? financingCurrency : undefined,
      installmentCount: isCuotasSimples ? n : 1,
      firstInstallmentDate: type === 'cuotas' && firstInstallmentDate ? firstInstallmentDate : undefined,
      creditType: type === 'cuotas' ? financingSubtype : undefined,
      daysToExpire: type === 'cuenta_corriente' ? Number(daysToExpire) : undefined,
      notes,
      items: items.map(it => ({ ...it, quantity: Number(it.quantity), unitPrice: Number(it.unitPrice) })),
    })
  }

  async function handleCreateClient(data: any) {
    if (!onCreateClient) return
    setCreatingClient(true)
    try {
      const newClient = await onCreateClient(data)
      setClientId(String(newClient.id))
      setShowNewClient(false)
    } finally {
      setCreatingClient(false)
    }
  }

  const sec = { fontSize: '11px', fontWeight: 700, color: '#475569', background: '#f1f5f9', padding: '5px 10px', borderRadius: '6px', letterSpacing: '.5px' }

  return (
    <>
    <Modal title="Nueva venta" onClose={onClose} width={640}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        <div style={sec}>CLIENTE Y COMPROBANTE</div>
        <div className="form-grid-2">
          <FormField label="Cliente (opcional)">
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <SearchableSelect
                  value={clientId}
                  onChange={setClientId}
                  options={clients.map((c: any) => ({ value: String(c.id), label: c.name }))}
                  placeholder="Buscar cliente..."
                  emptyLabel="Sin cliente"
                />
              </div>
              {onCreateClient && (
                <button type="button" onClick={() => setShowNewClient(true)}
                  style={{ padding: '8px 12px', fontSize: '12px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600 }}>
                  + Nuevo
                </button>
              )}
            </div>
          </FormField>
          <FormField label="Tipo de comprobante">
            <select style={inputStyle} value={invoiceType} onChange={e => setInvoiceType(e.target.value as any)}>
              <option value="B">Factura B — Consumidor final</option>
              <option value="A">Factura A — Resp. Inscripto</option>
              <option value="X">Sin factura (en negro)</option>
              <option value="mixto">Mixto — parte en blanco / negro</option>
            </select>
          </FormField>
        </div>

        <div style={sec}>ARTÍCULOS</div>
        <SaleItemsEditor
          items={items} products={products} vehicles={vehicles}
          isMixto={invoiceType === 'mixto'}
          onAdd={addItem} onRemove={removeItem} onUpdate={updateItem}
          onBarcodeFound={addItemFromProduct}
          onCreateProduct={setNewProductBarcode}
        />

        <div style={sec}>CONDICIONES DE PAGO</div>
        <div className="form-grid-2">
          <FormField label="Tipo de venta">
            <select style={inputStyle} value={type} onChange={e => {
              const newType = e.target.value as typeof type
              setType(newType)
              if (newType === 'contado') setDiscountIsAuto(true)
            }}>
              <option value="contado">Contado</option>
              <option value="cuenta_corriente">Cuenta corriente del cliente</option>
              <option value="cuotas">Financiado</option>
            </select>
          </FormField>
          <FormField label={type === 'cuotas' ? 'Forma de pago' : 'Forma de pago'}>
            <select style={inputStyle} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia bancaria</option>
              <option value="tarjeta">Tarjeta débito/crédito</option>
              <option value="cheque">Cheque</option>
              <option value="usdt">USDT / Cripto</option>
              <option value="mixto">Mixto</option>
            </select>
          </FormField>
        </div>

        {conflictos.length > 0 && (
          <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#854d0e' }}>
            ⚠️ <strong>{conflictos.length} ítem{conflictos.length > 1 ? 's' : ''}</strong> ingresó en negro pero estás emitiendo factura en blanco. Verificá antes de confirmar.
          </div>
        )}

        {type === 'cuenta_corriente' && (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Condiciones de cuenta corriente</div>
            <div className="form-grid-2">
              <FormField label="Descuento ($)">
                <input style={inputStyle} type="number" min="0" value={discount} onChange={e => setDiscount(e.target.value)} />
              </FormField>
              <FormField label="Días para vencer">
                <input style={inputStyle} type="number" min="1" value={daysToExpire} onChange={e => setDaysToExpire(e.target.value)} />
              </FormField>
            </div>
          </div>
        )}

        {type === 'cuotas' && (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Tipo de financiación</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {(['cuotas_simples', 'saldo_compuesto'] as const).map(sub => (
                <label key={sub} style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', padding: '8px 14px', borderRadius: '8px', border: `1.5px solid ${financingSubtype === sub ? '#2563eb' : '#e2e8f0'}`, background: financingSubtype === sub ? '#eff6ff' : '#fff', color: financingSubtype === sub ? '#2563eb' : '#64748b', fontSize: '13px', fontWeight: 600 }}>
                  <input type="radio" name="financingSubtype" value={sub} checked={financingSubtype === sub} onChange={() => setFinancingSubtype(sub)} style={{ display: 'none' }} />
                  {sub === 'cuotas_simples' ? 'Cuotas fijas (interés simple)' : 'Cuota libre (interés compuesto)'}
                </label>
              ))}
            </div>

            {isCuotasSimples ? (
              <>
                <div className="form-grid-2">
                  <FormField label="Descuento ($)">
                    <input style={inputStyle} type="number" min="0" value={discount} onChange={e => setDiscount(e.target.value)} />
                  </FormField>
                  <FormField label="N° cuotas">
                    <input style={inputStyle} type="number" min="2" max="60" value={installmentCount} onChange={e => setInstallmentCount(e.target.value)} />
                  </FormField>
                </div>
                <div className="form-grid-2">
                  <FormField label="Moneda">
                    <select style={inputStyle} value={financingCurrency} onChange={e => { setFinancingCurrency(e.target.value as 'pesos' | 'usd'); setCustomRate(false) }}>
                      <option value="pesos">Pesos AR</option>
                      <option value="usd">Dólares USD</option>
                    </select>
                  </FormField>
                  <FormField label="Tasa mensual (%)">
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input style={{ ...inputStyle, flex: 1 }} type="number" min="0" step="0.1"
                        value={customRate ? interestRate : String(DEFAULT_RATES[financingCurrency])}
                        onChange={e => { setCustomRate(true); setInterestRate(e.target.value) }}
                      />
                      {customRate && (
                        <button type="button" onClick={() => { setCustomRate(false); setInterestRate(String(DEFAULT_RATES[financingCurrency])) }}
                          style={{ padding: '6px 10px', fontSize: '11px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          Reset
                        </button>
                      )}
                    </div>
                  </FormField>
                </div>
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '10px' }}>Seña / Anticipo</div>
                  <div className="form-grid-2">
                    <FormField label="Monto de la seña ($)">
                      <input style={inputStyle} type="number" min="0" value={downPayment} onChange={e => setDownPayment(e.target.value)} placeholder="0" />
                    </FormField>
                    <FormField label="Forma de pago de la seña">
                      <select style={inputStyle} value={downPaymentMethod} onChange={e => setDownPaymentMethod(e.target.value)} disabled={!downPaymentAmt}>
                        <option value="efectivo">Efectivo</option>
                        <option value="transferencia">Transferencia bancaria</option>
                        <option value="tarjeta">Tarjeta débito/crédito</option>
                        <option value="cheque">Cheque</option>
                        <option value="usdt">USDT / Cripto</option>
                      </select>
                    </FormField>
                  </div>
                </div>
                <FormField label="Fecha de primera cuota">
                  <input style={inputStyle} type="date" value={firstInstallmentDate} onChange={e => setFirstInstallmentDate(e.target.value)} />
                </FormField>
              </>
            ) : (
              <>
                <div className="form-grid-2">
                  <FormField label="Descuento ($)">
                    <input style={inputStyle} type="number" min="0" value={discount} onChange={e => setDiscount(e.target.value)} />
                  </FormField>
                  <FormField label="Tasa mensual (%)">
                    <input style={inputStyle} type="number" min="0" step="0.1" value={interestRate} onChange={e => setInterestRate(e.target.value)} placeholder="0" />
                  </FormField>
                </div>
                <FormField label="Fecha de primer vencimiento (arranque de interés)">
                  <input style={inputStyle} type="date" value={firstInstallmentDate} onChange={e => setFirstInstallmentDate(e.target.value)} />
                </FormField>
              </>
            )}
          </div>
        )}

        {type === 'contado' && (
          <div className="form-grid-2">
            <FormField label={`Descuento ($)${discountIsAuto ? ' — 10% auto' : ''}`}>
              <input style={inputStyle} type="number" min="0" value={discount} onChange={e => { setDiscountIsAuto(false); setDiscount(e.target.value) }} />
            </FormField>
            <FormField label="Interés (%)">
              <input style={inputStyle} type="number" min="0" step="0.1" value={interestRate} onChange={e => setInterestRate(e.target.value)} placeholder="0" />
            </FormField>
          </div>
        )}

        <div style={sec}>RESUMEN</div>
        <SaleTotalsPanel
          subtotal={subtotal} discountAmt={discountAmt} downPaymentAmt={isCuotasSimples ? downPaymentAmt : 0}
          interest={interest} total={total}
          invoiceType={invoiceType} type={type === 'cuenta_corriente' ? 'contado' : type} installmentCount={installmentCount}
          subtotalFormal={subtotalFormal} subtotalInformal={subtotalInformal}
          financingCurrency={isCuotasSimples ? financingCurrency : undefined}
          monthlyRate={isCuotasSimples ? effectiveRate : undefined}
        />

        <FormField label="Notas">
          <input style={inputStyle} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opcional..." />
        </FormField>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
          <button type="submit" style={btnPrimary} disabled={isPending}>
            {isPending ? 'Registrando...' : `Registrar venta — $${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
          </button>
        </div>
      </form>
    </Modal>

    {showNewClient && (
      <ClientFormModal
        mode="create"
        editing={null}
        onClose={() => setShowNewClient(false)}
        onSubmit={handleCreateClient}
        isPending={creatingClient}
      />
    )}
    {newProductBarcode !== null && (
      <ProductFormModal
        mode="create"
        editing={null}
        initialValues={{ barcode: newProductBarcode }}
        onClose={() => setNewProductBarcode(null)}
        onSubmit={d => createProduct.mutate(d)}
        isPending={createProduct.isPending}
      />
    )}
    </>
  )
}
