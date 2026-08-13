import type {
  DraftGroup,
  GroupPriceEditPayload,
  ValuationGroup,
} from '../types/stock-valuation.types'

const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON * Math.abs(value)) * 100) / 100
const optionalNumber = (value: string): number | undefined => value.trim() === '' ? undefined : Number(value)
const validMargin = (value: number | undefined): value is number =>
  value !== undefined && Number.isFinite(value) && value >= 0 && value <= 1000

export function createValuationDraft(groups: ValuationGroup[]): DraftGroup[] {
  return groups.map((group) => ({
    ...group,
    costPrice: group.currentCostPrice === null ? '' : String(group.currentCostPrice),
    saleMode: 'unchanged',
    manualSellPrice: '',
    marginPercent: '',
  }))
}

export function projectDraftSellPrice(group: DraftGroup, generalMargin: string): number | null {
  const costPrice = Number(group.costPrice)
  if (!Number.isFinite(costPrice)) return null

  if (group.saleMode === 'unchanged') return group.currentSellPrice
  if (group.saleMode === 'manual') {
    const manual = optionalNumber(group.manualSellPrice)
    return manual === undefined || !Number.isFinite(manual) ? null : roundMoney(manual)
  }

  const margin = optionalNumber(group.marginPercent) ?? optionalNumber(generalMargin)
  if (!validMargin(margin)) return null
  return roundMoney(costPrice * (1 + margin / 100))
}

export function validateDraft(groups: DraftGroup[], generalMargin: string): string[] {
  const errors: string[] = []
  const general = optionalNumber(generalMargin)
  const invalidGeneral = generalMargin.trim() !== '' && !validMargin(general)
  if (invalidGeneral) errors.push('Ingresá un margen general entre 0 y 1000')

  for (const group of groups) {
    const label = `${group.brand} ${group.model} ${group.version || 'Sin versión'}`
    const cost = optionalNumber(group.costPrice)
    if (cost === undefined || !Number.isFinite(cost) || cost <= 0)
      errors.push(`${label}: ingresá un costo mayor que cero`)

    if (group.saleMode === 'manual') {
      const manual = optionalNumber(group.manualSellPrice)
      if (manual === undefined || !Number.isFinite(manual) || manual < 0)
        errors.push(`${label}: ingresá un precio de venta manual válido`)
    }

    if (group.saleMode === 'margin') {
      const specific = optionalNumber(group.marginPercent)
      const margin = specific ?? general
      if (!validMargin(margin)) errors.push(`${label}: ingresá un margen entre 0 y 1000`)
    }
  }
  return errors
}

export function toValuationGroups(groups: DraftGroup[]): GroupPriceEditPayload[] {
  return groups.map((group) => {
    const payload: GroupPriceEditPayload = {
      groupKey: group.groupKey,
      costPrice: Number(group.costPrice),
      saleMode: group.saleMode,
    }
    const manual = optionalNumber(group.manualSellPrice)
    const margin = optionalNumber(group.marginPercent)
    if (manual !== undefined) payload.manualSellPrice = manual
    if (margin !== undefined) payload.marginPercent = margin
    return payload
  })
}
