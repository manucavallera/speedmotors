import { useState } from 'react'
import { useGuarderia } from '../hooks/useGuarderia'
import { StorageMap } from '../components/guarderia/StorageMap'
import { SpotPanel } from '../components/guarderia/SpotPanel'
import { GuardarModal } from '../components/guarderia/GuardarModal'
import { ChargeModal } from '../components/guarderia/ChargeModal'
import { ServicesModal } from '../components/guarderia/ServicesModal'
import { SetupModal } from '../components/guarderia/SetupModal'
import { DeudoresPanel } from '../components/guarderia/DeudoresPanel'
import { HelpModal, HelpButton } from '../components/ui/HelpModal'
import { GUARDERIA_HELP } from '../lib/helpContent'
import { btnPrimary, btnSecondary, inputStyle } from '../components/ui/FormField'
import { type UnitDetail } from '../types/guarderia.types'

function Stat({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px', minWidth: 0 }}>
      <div style={{ fontSize: '22px', fontWeight: 700, color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
      <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>{label}</div>
    </div>
  )
}

export function GuarderiaPage() {
  const { spots, mapaQuery, stats, services, createService, updateService, removeService, createSpots, createUnit, retireUnit, charge, payCharge } = useGuarderia()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [guardarSpot, setGuardarSpot] = useState<number | null | 'open'>(null)
  const [chargeUnit, setChargeUnit] = useState<UnitDetail | null>(null)
  const [setup, setSetup] = useState(false)
  const [manageServices, setManageServices] = useState(false)
  const [search, setSearch] = useState('')
  const [showHelp, setShowHelp] = useState(false)

  const total = spots.length
  const libres = spots.filter(s => !s.occupied).length
  const ocupados = spots.filter(s => s.occupied).length
  const conDeuda = spots.filter(s => s.occupied && s.debt > 0).length
  const deudaTotal = spots.reduce((a, s) => a + (s.debt || 0), 0)
  const ocupPct = total ? Math.round((ocupados / total) * 100) : 0
  const selected = spots.find(s => s.spotId === selectedId) ?? null
  const fmt = (n: number) => '$' + n.toLocaleString('es-AR')

  // Buscar embarcación/cliente y saltar a su lugar en el mapa
  function runSearch(q: string) {
    setSearch(q)
    const term = q.trim().toLowerCase()
    if (!term) return
    const hit = spots.find(s => s.unit && (
      (s.unit.clientName ?? '').toLowerCase().includes(term) ||
      (s.unit.description ?? '').toLowerCase().includes(term) ||
      s.code.toLowerCase().includes(term)
    ))
    if (hit) setSelectedId(hit.spotId)
  }

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
        <HelpButton onClick={() => setShowHelp(true)} />
        <button style={btnSecondary} onClick={() => setManageServices(true)}>Servicios</button>
        <button style={btnSecondary} onClick={() => setSetup(true)}>Configurar lugares</button>
        <button style={btnPrimary} onClick={() => setGuardarSpot('open')}>+ Guardar embarcación</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', marginBottom: '12px' }}>
        <Stat value={total} label="Lugares" color="#2563eb" />
        <Stat value={libres} label="Libres" color="#16a34a" />
        <Stat value={ocupados} label="Ocupados" color="#0f172a" />
        <Stat value={conDeuda} label="Con deuda" color="#dc2626" />
        <Stat value={fmt(deudaTotal)} label="$ en deuda" color={deudaTotal > 0 ? '#dc2626' : '#16a34a'} />
        <Stat value={fmt(stats.ingresosMes)} label="Cobrado en el mes" color="#0f172a" />
      </div>

      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: 600, marginBottom: '7px' }}>
          <span style={{ color: '#64748b' }}>Ocupación</span>
          <span style={{ color: '#0f172a' }}>{ocupados}/{total} · {ocupPct}%</span>
        </div>
        <div style={{ height: '10px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{ width: `${ocupPct}%`, height: '100%', background: 'linear-gradient(90deg,#3b82f6,#1d4ed8)', borderRadius: '6px', transition: 'width .3s' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '20px', alignItems: 'start' }} className="guarderia-layout">
        <div>
          <input
            style={{ ...inputStyle, marginBottom: '14px' }}
            placeholder="Buscar embarcación, cliente o lugar..."
            value={search}
            onChange={e => runSearch(e.target.value)}
          />
          {mapaQuery.isLoading
            ? <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Cargando...</div>
            : <StorageMap spots={spots} selectedId={selectedId} onSelect={setSelectedId} />}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SpotPanel
            spot={selected}
            onGuardar={(spotId) => setGuardarSpot(spotId)}
            onCobrar={(unit) => setChargeUnit(unit)}
            onRetirar={handleRetirar}
            onSaldar={(chargeId) => payCharge.mutate(chargeId)}
          />
          <DeudoresPanel spots={spots} onSelect={setSelectedId} />
        </div>
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

      {showHelp && <HelpModal title="Cómo funciona la Guardería" sections={GUARDERIA_HELP} onClose={() => setShowHelp(false)} />}
    </div>
  )
}
