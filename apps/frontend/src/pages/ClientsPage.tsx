import { useClients } from '../hooks/useClients'
import { InfoBanner } from '../components/ui/InfoBanner'
import { btnPrimary, inputStyle } from '../components/ui/FormField'
import { ClientsTable } from '../components/clients/ClientsTable'
import { ClientFormModal } from '../components/clients/ClientFormModal'
import { ClientAccountModal } from '../components/clients/ClientAccountModal'
import { Pagination } from '../components/ui/Pagination'
import { useAuth } from '../hooks/useAuth'

export function ClientsPage() {
  const { isAdmin } = useAuth()
  const {
    clients, isLoading,
    search, setSearch,
    hasDebt, setHasDebt,
    total, page, pages, setPage,
    modal, setModal, editing, openCreate, openEdit,
    accountClient, setAccountClient,
    create, update, remove,
  } = useClients()

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Clientes</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '2px' }}>{total} clientes{pages > 1 ? ` · pág. ${page}/${pages}` : ''}</p>
        </div>
        <button onClick={openCreate} style={btnPrimary}>+ Nuevo cliente</button>
      </div>

      <InfoBanner title="Clientes del negocio">
        Datos de contacto y fiscales (CUIT, DNI, condición de IVA) de tus clientes. Asociá ventas y presupuestos a un cliente para <strong>llevar su cuenta corriente</strong>, ver qué cuotas debe y generar estados de cuenta en PDF para mandárselos.
      </InfoBanner>

      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '200px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Buscar</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Nombre, teléfono o DNI..." style={{ ...inputStyle }} />
        </div>

        <div style={{ width: '1px', background: '#e2e8f0', alignSelf: 'stretch' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Deuda</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {([false, true] as boolean[]).map(val => (
              <button key={String(val)} onClick={() => setHasDebt(val)}
                style={{ padding: '7px 14px', borderRadius: '9px', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer', background: hasDebt === val ? '#1d4ed8' : '#f1f5f9', color: hasDebt === val ? 'white' : '#374151' }}>
                {val ? 'Con deuda' : 'Todos'}
              </button>
            ))}
          </div>
        </div>

      </div>

      <ClientsTable
        clients={clients}
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={isAdmin ? (id: number) => { if (window.confirm('¿Eliminar este cliente?')) remove.mutate(id) } : undefined}
        onAccount={setAccountClient}
      />
      <Pagination page={page} pages={pages} total={total} onPage={setPage} />

      {accountClient && (
        <ClientAccountModal client={accountClient} onClose={() => setAccountClient(null)} />
      )}

      {modal && (
        <ClientFormModal
          mode={modal}
          editing={editing}
          onClose={() => setModal(null)}
          onSubmit={(data) => modal === 'edit' && editing ? update.mutate({ id: editing.id, data }) : create.mutate(data)}
          isPending={create.isPending || update.isPending}
        />
      )}
    </div>
  )
}
