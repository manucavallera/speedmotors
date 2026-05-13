import { useState, useRef, useEffect } from 'react'
import { inputStyle } from './FormField'

interface Option { value: string; label: string }
interface Group { label: string; options: Option[] }

interface SearchableSelectProps {
  value: string
  onChange: (value: string) => void
  groups?: Group[]
  options?: Option[]
  placeholder?: string
  emptyLabel?: string
}

export function SearchableSelect({ value, onChange, groups, options, placeholder = 'Buscar...', emptyLabel = '— Ninguno —' }: SearchableSelectProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Label del valor seleccionado
  const allOptions: Option[] = groups
    ? groups.flatMap(g => g.options)
    : options ?? []
  const selectedLabel = value ? (allOptions.find(o => o.value === value)?.label ?? '') : ''

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function handleSelect(val: string) {
    onChange(val)
    setQuery('')
    setOpen(false)
  }

  const q = query.toLowerCase()

  function filterOptions(opts: Option[]) {
    return q ? opts.filter(o => o.label.toLowerCase().includes(q)) : opts
  }

  const displayGroups: Group[] = groups
    ? groups.map(g => ({ label: g.label, options: filterOptions(g.options) })).filter(g => g.options.length > 0)
    : [{ label: '', options: filterOptions(allOptions) }]

  const hasResults = displayGroups.some(g => g.options.length > 0)

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          style={{ ...inputStyle, paddingRight: '28px' }}
          value={open ? query : selectedLabel}
          placeholder={open ? placeholder : (selectedLabel || emptyLabel)}
          onFocus={() => { setOpen(true); setQuery('') }}
          onChange={e => { setQuery(e.target.value); if (!open) setOpen(true) }}
          autoComplete="off"
        />
        <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '11px', pointerEvents: 'none' }}>▾</span>
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 1000,
          background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: '240px', overflowY: 'auto',
        }}>
          <div
            onMouseDown={() => handleSelect('')}
            style={{ padding: '8px 12px', fontSize: '13px', color: '#94a3b8', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >{emptyLabel}</div>
          {!hasResults && (
            <div style={{ padding: '12px', fontSize: '13px', color: '#94a3b8', textAlign: 'center' }}>Sin resultados</div>
          )}
          {displayGroups.map((g, gi) => (
            <div key={gi}>
              {g.label && (
                <div style={{ padding: '6px 12px 3px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f8fafc' }}>{g.label}</div>
              )}
              {g.options.map(o => (
                <div
                  key={o.value}
                  onMouseDown={() => handleSelect(o.value)}
                  style={{
                    padding: '8px 12px', fontSize: '13px', cursor: 'pointer',
                    color: o.value === value ? '#1d4ed8' : '#0f172a',
                    fontWeight: o.value === value ? 600 : 400,
                    background: o.value === value ? '#eff6ff' : 'transparent',
                  }}
                  onMouseEnter={e => { if (o.value !== value) e.currentTarget.style.background = '#f8fafc' }}
                  onMouseLeave={e => { if (o.value !== value) e.currentTarget.style.background = 'transparent' }}
                >{o.label}</div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
