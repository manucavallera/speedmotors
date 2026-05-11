import { useClients } from '../hooks/useClients'
import { InfoBanner } from '../components/ui/InfoBanner'
import { btnPrimary } from '../components/ui/FormField'
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
    total, page, pages, setPage,
    modal, setModal, editing, openCreate, openEdit,
    accountClient, setAccountClient,
    create, update, remove,
  } = useClients()

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Clientes</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '2px' }}>{total} clientes{pages > 1 ? ` · pág. ${page}/${pages}` : ''}</p>
        </div>
        <button onClick={openCreate} style={btnPrimary}>+ Nuevo cliente</button>
      </div>

      <InfoBanner title="Clientes del negocio">
        Datos de contacto y fiscales (CUIT, DNI, condición de IVA) de tus clientes. Asociá ventas y presupuestos a un cliente para <strong>llevar su cuenta corriente</strong>, ver qué cuotas debe y generar estados de cuenta en PDF para mandárselos.
      </InfoBanner>

      <div style={{ marginBottom: '16px' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre, teléfono o DNI..."
          style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', width: '100%', maxWidth: '360px' }} />
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
