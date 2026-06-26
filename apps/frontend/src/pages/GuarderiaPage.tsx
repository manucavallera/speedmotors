import { useState } from 'react'
import { useGuarderia } from '../hooks/useGuarderia'
import { StorageMap } from '../components/guarderia/StorageMap'
import { SpotPanel } from '../components/guarderia/SpotPanel'
import { GuardarModal } from '../components/guarderia/GuardarModal'
import { ChargeModal } from '../components/guarderia/ChargeModal'
import { ServicesModal } from '../components/guarderia/ServicesModal'
import { SetupModal } from '../components/guarderia/SetupModal'
import { btnPrimary, btnSecondary } from '../components/ui/FormField'
import { type UnitDetail } from '../types/guarderia.types'

function Stat({ n, label, color }: { n: number; label: string; color: string }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px' }}>
      <div style={{ fontSize: '24px', fontWeight: 700, color }}>{n}</div>
      <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>{label}</div>
    </div>
  )
}

export function GuarderiaPage() {
  const { spots, mapaQuery, services, createService, updateService, removeService, createSpots, createUnit, retireUnit, charge, payCharge } = useGuarderia()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [guardarSpot, setGuardarSpot] = useState<number | null | 'open'>(null)
  const [chargeUnit, setChargeUnit] = useState<UnitDetail | null>(null)
  const [setup, setSetup] = useState(false)
  const [manageServices, setManageServices] = useState(false)

  const total = spots.length
  const libres = spots.filter(s => !s.occupied).length
  const ocupados = spots.filter(s => s.occupied).length
  const conDeuda = spots.filter(s => s.occupied && s.debt > 0).length
  const selected = spots.find(s => s.spotId === selectedId) ?? null

  function handleRetirar(unitId: number) {
    if (!window.confirm('¿Retirar esta embarcación del lugar? El lugar queda libre.')) return
    retireUnit.mutate(unitId, { onSuccess: () => setSelectedId(null) })
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '180px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Guardería Náutica</h1>
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>Mapa de lugares</div>
        </div>
        <button style={btnSecondary} onClick={() => setManageServices(true)}>Servicios</button>
        <button style={btnSecondary} onClick={() => setSetup(true)}>Configurar lugares</button>
        <button style={btnPrimary} onClick={() => setGuardarSpot('open')}>+ Guardar embarcación</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
        <Stat n={total} label="Lugares" color="#2563eb" />
        <Stat n={libres} label="Libres" color="#16a34a" />
        <Stat n={ocupados} label="Ocupados" color="#0f172a" />
        <Stat n={conDeuda} label="Con deuda" color="#dc2626" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '20px', alignItems: 'start' }} className="guarderia-layout">
        <div>
          {mapaQuery.isLoading
            ? <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Cargando...</div>
            : <StorageMap spots={spots} selectedId={selectedId} onSelect={setSelectedId} />}
        </div>
        <SpotPanel
          spot={selected}
          onGuardar={(spotId) => setGuardarSpot(spotId)}
          onCobrar={(unit) => setChargeUnit(unit)}
          onRetirar={handleRetirar}
          onSaldar={(chargeId) => payCharge.mutate(chargeId)}
        />
      </div>

      {guardarSpot !== null && (
        <GuardarModal
          spots={spots}
          presetSpotId={guardarSpot === 'open' ? null : guardarSpot}
          submitting={createUnit.isPending}
          onClose={() => setGuardarSpot(null)}
          onSubmit={(data) => createUnit.mutate(data, { onSuccess: () => setGuardarSpot(null) })}
        />
      )}

      {chargeUnit && (
        <ChargeModal
          unit={chargeUnit}
          services={services}
          submitting={charge.isPending}
          onClose={() => setChargeUnit(null)}
          onSubmit={(data) => charge.mutate({ unitId: chargeUnit.id, data }, { onSuccess: () => setChargeUnit(null) })}
        />
      )}

      {manageServices && (
        <ServicesModal
          services={services}
          submitting={createService.isPending || updateService.isPending}
          onClose={() => setManageServices(false)}
          onCreate={(data) => createService.mutate(data)}
          onUpdate={(id, data) => updateService.mutate({ id, data })}
          onRemove={(id) => removeService.mutate(id)}
        />
      )}

      {setup && (
        <SetupModal
          submitting={createSpots.isPending}
          onClose={() => setSetup(false)}
          onSubmit={(codes) => createSpots.mutate(codes, { onSuccess: () => setSetup(false) })}
        />
      )}
    </div>
  )
}
