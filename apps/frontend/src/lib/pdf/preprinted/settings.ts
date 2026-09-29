import type { PrintOffset, PrintedFormKind } from './types'

const STORAGE_KEY = 'speedmotors_preprinted_offsets'
const neutralOffset: PrintOffset = { x: 0, y: 0 }

type OffsetStore = Partial<Record<PrintedFormKind, PrintOffset>>

function isOffset(value: unknown): value is PrintOffset {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return typeof candidate.x === 'number' && Number.isFinite(candidate.x)
    && typeof candidate.y === 'number' && Number.isFinite(candidate.y)
}

function loadStore(): OffsetStore {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return parsed && typeof parsed === 'object' ? parsed as OffsetStore : {}
  } catch {
    return {}
  }
}

export function loadPrintOffset(kind: PrintedFormKind): PrintOffset {
  const offset = loadStore()[kind]
  return isOffset(offset) ? offset : neutralOffset
}

export function savePrintOffset(kind: PrintedFormKind, offset: PrintOffset): void {
  if (!isOffset(offset)) throw new Error('El desplazamiento de impresión es inválido')
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...loadStore(), [kind]: offset }))
}
