import { btnPrimary, btnSecondary } from '../ui/FormField'

interface Props {
  previewReady: boolean
  previewBlockReason: string | null
  errors: string[]
  isRefreshing: boolean
  isPreviewing: boolean
  isClosing: boolean
  onManage: () => void
  onRefresh: () => void
  onPreview: () => void
  onClose: () => void
}

export function ValuationActionBar({
  previewReady,
  previewBlockReason,
  errors,
  isRefreshing,
  isPreviewing,
  isClosing,
  onManage,
  onRefresh,
  onPreview,
  onClose,
}: Props) {
  const previewDisabled = previewBlockReason !== null || errors.length > 0 || isPreviewing
  const previewDisabledReason = errors[0] ?? previewBlockReason ?? undefined

  return (
    <section style={{ position: 'sticky', top: 0, zIndex: 10, background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 16px', marginBottom: '12px', boxShadow: '0 4px 14px rgba(15, 23, 42, 0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" onClick={onManage} style={btnSecondary}>Gestionar motos</button>
          <button type="button" onClick={onRefresh} disabled={isRefreshing} style={{ ...btnSecondary, opacity: isRefreshing ? 0.55 : 1 }}>
            {isRefreshing ? 'Actualizando…' : 'Actualizar stock'}
          </button>
          <button type="button" onClick={onPreview} disabled={previewDisabled} title={previewDisabledReason} style={{ ...btnSecondary, opacity: previewDisabled ? 0.55 : 1 }}>
            {isPreviewing ? 'Calculando…' : 'Previsualizar cierre'}
          </button>
          {previewReady && (
            <button type="button" onClick={onClose} disabled={isClosing} style={{ ...btnPrimary, opacity: isClosing ? 0.6 : 1 }}>
              {isClosing ? 'Guardando…' : 'Confirmar cierre'}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
