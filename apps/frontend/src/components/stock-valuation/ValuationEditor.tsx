import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { inputStyle } from '../ui/FormField'
import { MoneyInput } from '../ui/MoneyInput'
import { projectDraftSellPrice } from '../../lib/stockValuation'
import type { DraftGroup } from '../../types/stock-valuation.types'

interface Props {
  groups: DraftGroup[]
  generalMargin: string
  onGeneralMarginChange: (value: string) => void
  onGroupsChange: (groups: DraftGroup[]) => void
}

const money = (value: number | null) => value === null
  ? 'Varios'
  : value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 })

export function ValuationEditor({ groups, generalMargin, onGeneralMarginChange, onGroupsChange }: Props) {
  const [search, setSearch] = useState('')
  const normalizedSearch = search.trim().toLocaleLowerCase('es-AR')
  const visibleGroups = useMemo(() => groups.filter((group) =>
    !normalizedSearch || `${group.brand} ${group.model} ${group.version ?? ''}`.toLocaleLowerCase('es-AR').includes(normalizedSearch),
  ), [groups, normalizedSearch])

  const update = (groupKey: string, changes: Partial<DraftGroup>) => {
    onGroupsChange(groups.map((group) => group.groupKey === groupKey ? { ...group, ...changes } : group))
  }

  return (
    <section style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '18px', overflow: 'hidden' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'end' }}>
        <div style={{ flex: '1 1 300px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>Buscar grupo</label>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '11px', top: '11px', color: '#94a3b8' }} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Marca, modelo o versión" style={{ ...inputStyle, paddingLeft: '34px' }} />
          </div>
        </div>
        <div style={{ width: '210px', maxWidth: '100%' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>Margen general (%)</label>
          <input type="number" min="0" max="1000" step="0.01" value={generalMargin} onChange={(event) => onGeneralMarginChange(event.target.value)} placeholder="Opcional" style={inputStyle} />
        </div>
        <div style={{ fontSize: '12px', color: '#64748b', paddingBottom: '10px' }}>{visibleGroups.length} de {groups.length} grupos</div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: '1240px', borderCollapse: 'collapse', fontSize: '12.5px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left' }}>
              {['Moto', 'Unidades', 'Costo actual', 'Costo nuevo *', 'Venta actual', 'Modo de venta', 'Margen / Venta', 'Venta proyectada'].map((title) => (
                <th key={title} style={{ padding: '10px 12px', fontWeight: 700, borderBottom: '1px solid #e2e8f0' }}>{title}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleGroups.map((group) => {
              const projected = projectDraftSellPrice(group, generalMargin)
              const invalidCost = !Number.isFinite(Number(group.costPrice)) || Number(group.costPrice) <= 0
              const invalidManual = group.saleMode === 'manual' && (group.manualSellPrice.trim() === '' || Number(group.manualSellPrice) < 0)
              const effectiveMargin = group.marginPercent.trim() || generalMargin.trim()
              const invalidMargin = group.saleMode === 'margin' && (effectiveMargin === '' || Number(effectiveMargin) < 0 || Number(effectiveMargin) > 1000)
              return (
                <tr key={group.groupKey} style={{ borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{group.brand} {group.model}</div>
                    <div style={{ color: '#64748b', marginTop: '2px' }}>{group.version || 'Sin versión'}</div>
                  </td>
                  <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                    <span style={{ color: '#166534', background: '#dcfce7', borderRadius: '999px', padding: '3px 7px', marginRight: '5px' }}>D {group.availableUnits}</span>
                    <span style={{ color: '#92400e', background: '#fef3c7', borderRadius: '999px', padding: '3px 7px' }}>R {group.reservedUnits}</span>
                  </td>
                  <td style={{ padding: '12px', color: group.currentCostPrice === null ? '#b45309' : '#334155', fontWeight: group.currentCostPrice === null ? 700 : 400 }}>{money(group.currentCostPrice)}</td>
                  <td style={{ padding: '8px 12px', width: '155px' }}>
                    <MoneyInput compact value={group.costPrice} onChange={(value) => update(group.groupKey, { costPrice: value })} placeholder="Costo" />
                    {invalidCost && <div style={{ color: '#dc2626', fontSize: '11px', marginTop: '4px' }}>Mayor que cero</div>}
                  </td>
                  <td style={{ padding: '12px', color: group.currentSellPrice === null ? '#b45309' : '#334155' }}>{money(group.currentSellPrice)}</td>
                  <td style={{ padding: '8px 12px', width: '145px' }}>
                    <select value={group.saleMode} onChange={(event) => update(group.groupKey, { saleMode: event.target.value as DraftGroup['saleMode'] })} style={{ ...inputStyle, padding: '6px 8px', fontSize: '12.5px' }}>
                      <option value="unchanged">Sin cambio</option>
                      <option value="manual">Manual</option>
                      <option value="margin">Margen</option>
                    </select>
                  </td>
                  <td style={{ padding: '8px 12px', width: '155px' }}>
                    {group.saleMode === 'manual' && <MoneyInput compact value={group.manualSellPrice} onChange={(value) => update(group.groupKey, { manualSellPrice: value })} placeholder="Venta" />}
                    {group.saleMode === 'margin' && <input type="number" min="0" max="1000" step="0.01" value={group.marginPercent} onChange={(event) => update(group.groupKey, { marginPercent: event.target.value })} placeholder={generalMargin ? `General ${generalMargin}%` : 'Margen %'} style={{ ...inputStyle, padding: '6px 8px', fontSize: '12.5px' }} />}
                    {group.saleMode === 'unchanged' && <span style={{ color: '#94a3b8' }}>Conservar</span>}
                    {(invalidManual || invalidMargin) && <div style={{ color: '#dc2626', fontSize: '11px', marginTop: '4px' }}>{invalidManual ? 'Venta inválida' : 'Margen 0–1000'}</div>}
                  </td>
                  <td style={{ padding: '12px', fontWeight: 700, color: projected === null ? '#b45309' : '#1d4ed8' }}>{money(projected)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {visibleGroups.length === 0 && <div style={{ padding: '28px', textAlign: 'center', color: '#94a3b8' }}>No hay grupos que coincidan con la búsqueda.</div>}
    </section>
  )
}
