import { inputStyle } from './FormField'

interface Props {
  value: number | string
  onChange: (raw: string) => void
  placeholder?: string
  autoFocus?: boolean
  disabled?: boolean
  /** Va al wrapper, no al input (el input siempre ocupa el 100% del wrapper) */
  style?: React.CSSProperties
  compact?: boolean
}

/** Input de plata: prefijo $ fijo y 0 mostrado en blanco (un "0" pelado no le dice nada al usuario). */
export function MoneyInput({ value, onChange, placeholder = 'Precio', autoFocus, disabled, style, compact }: Props) {
  const shown = Number(value) === 0 ? '' : String(value)
  return (
    <div style={{ position: 'relative', ...style }}>
      <span
        style={{
          position: 'absolute', left: compact ? '8px' : '12px', top: '50%', transform: 'translateY(-50%)',
          fontSize: compact ? '12.5px' : '14px', color: '#94a3b8', pointerEvents: 'none',
        }}
      >$</span>
      <input
        style={{
          ...inputStyle,
          paddingLeft: compact ? '20px' : '26px',
          ...(compact ? { padding: '4px 8px 4px 20px', fontSize: '12.5px' } : {}),
        }}
        type="number"
        min={0}
        inputMode="numeric"
        value={shown}
        onChange={e => onChange(e.target.value)}
        onClick={e => e.stopPropagation()}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={disabled}
      />
    </div>
  )
}
