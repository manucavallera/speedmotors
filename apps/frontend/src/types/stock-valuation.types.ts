export type SaleMode = 'unchanged' | 'manual' | 'margin'

export interface ValuationGroup {
  groupKey: string
  brand: string
  model: string
  version: string | null
  vehicleIds: number[]
  availableUnits: number
  reservedUnits: number
  totalUnits: number
  currentCostPrice: number | null
  currentSellPrice: number | null
}

export interface DraftGroup extends ValuationGroup {
  costPrice: string
  saleMode: SaleMode
  manualSellPrice: string
  marginPercent: string
}

export interface CurrentValuationResponse {
  period: string
  stockFingerprint: string
  groups: ValuationGroup[]
  existingValuation: StockValuationHeader | null
}

export interface ValuationSummary {
  availableUnits: number
  reservedUnits: number
  totalUnits: number
  totalCost: number
  totalSell: number
  potentialMargin: number
  unpricedSaleUnits: number
}

export interface ProjectedValuationGroup extends ValuationGroup {
  costPrice: number
  sellPrice: number | null
  saleMode: SaleMode
  totalCost: number
  totalSell: number
  potentialMargin: number
  unpricedSaleUnits: number
}

export interface ValuationProjection {
  period: string
  stockFingerprint: string
  groups: ProjectedValuationGroup[]
  totals: ValuationSummary
}

export interface StockValuationHeader {
  id: number
  period: string
  closedAt: string
  availableUnits: number
  reservedUnits: number
  totalUnits: number
  totalCost: string
  totalSell: string
  potentialMargin: string
  unpricedSaleUnits: number
  createdAt: string
  updatedAt: string
}

export interface StockValuationLine {
  id: number
  valuationId: number
  brand: string
  model: string
  version: string | null
  availableUnits: number
  reservedUnits: number
  totalUnits: number
  costPrice: string
  sellPrice: string | null
  totalCost: string
  totalSell: string
  potentialMargin: string
}

export interface StockValuationDetail extends StockValuationHeader {
  lines: StockValuationLine[]
}

export interface GroupPriceEditPayload {
  groupKey: string
  costPrice: number
  saleMode: SaleMode
  manualSellPrice?: number
  marginPercent?: number
}

export interface ValuationRequestPayload {
  period: string
  stockFingerprint: string
  generalMarginPercent?: number
  groups: GroupPriceEditPayload[]
  replaceExisting?: boolean
}
