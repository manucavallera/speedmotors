import { createHash } from 'node:crypto'

export type EligibleStatus = 'disponible' | 'reservado'
export type SaleMode = 'unchanged' | 'manual' | 'margin'

export interface EligibleVehicle {
  id: number
  brand: string
  model: string
  version: string | null
  status: EligibleStatus
  internalCode: string | null
  chassisNumber: string | null
  engineNumber: string | null
  costPrice: string
  sellPrice: string
  updatedAt: Date
}

export interface GroupPriceEdit {
  groupKey: string
  costPrice: number
  saleMode: SaleMode
  manualSellPrice?: number
  marginPercent?: number
}

export interface ValuationRequest {
  period: string
  stockFingerprint: string
  generalMarginPercent?: number
  groups: GroupPriceEdit[]
}

export interface EligibleVehicleGroup {
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
  vehicles: EligibleVehicle[]
}

export interface ValuationVehicleUnit {
  id: number
  internalCode: string | null
  brand: string
  model: string
  version: string | null
  status: EligibleStatus
  chassisNumber: string | null
  engineNumber: string | null
}

export interface ProjectedGroup {
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
  groups: ProjectedGroup[]
  totals: {
    availableUnits: number
    reservedUnits: number
    totalUnits: number
    totalCost: number
    totalSell: number
    potentialMargin: number
    unpricedSaleUnits: number
  }
}

export class StockValuationValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StockValuationValidationError'
  }
}

export const normalizeGroupPart = (value: string | null): string =>
  (value ?? '').trim().toLocaleLowerCase('es-AR')

const createGroupKey = (brand: string, model: string, version: string | null): string =>
  [brand, model, version].map(normalizeGroupPart).join('\u001f')

const sharedPrice = (rows: EligibleVehicle[], field: 'costPrice' | 'sellPrice'): number | null => {
  const prices = new Set(rows.map((row) => Number(row[field])))
  return prices.size === 1 ? [...prices][0] : null
}

export function groupEligibleVehicles(rows: EligibleVehicle[]): EligibleVehicleGroup[] {
  const grouped = new Map<string, EligibleVehicle[]>()

  for (const row of rows) {
    const key = createGroupKey(row.brand, row.model, row.version)
    grouped.set(key, [...(grouped.get(key) ?? []), row])
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right, 'es-AR'))
    .map(([groupKey, vehicles]) => {
      const first = vehicles[0]
      const availableUnits = vehicles.filter((row) => row.status === 'disponible').length
      const reservedUnits = vehicles.filter((row) => row.status === 'reservado').length

      return {
        groupKey,
        brand: first.brand.trim(),
        model: first.model.trim(),
        version: first.version?.trim() || null,
        vehicleIds: vehicles.map((row) => row.id).sort((a, b) => a - b),
        availableUnits,
        reservedUnits,
        totalUnits: vehicles.length,
        currentCostPrice: sharedPrice(vehicles, 'costPrice'),
        currentSellPrice: sharedPrice(vehicles, 'sellPrice'),
        vehicles,
      }
    })
}

export function stockFingerprint(rows: EligibleVehicle[]): string {
  const payload = [...rows]
    .sort((left, right) => left.id - right.id)
    .map((row) => `${row.id}:${row.status}:${row.updatedAt.toISOString()}`)
    .join('|')

  return createHash('sha256').update(payload).digest('hex')
}

const toCents = (value: number): number =>
  Math.round((value + Number.EPSILON * Math.abs(value)) * 100)
const fromCents = (value: number): number => value / 100

const assertMargin = (value: number | undefined): number => {
  if (value === undefined || !Number.isFinite(value) || value < 0 || value > 1000)
    throw new StockValuationValidationError('Ingresá un margen entre 0 y 1000')
  return value
}

export function projectedSell(input: {
  mode: SaleMode
  manual?: number
  groupMargin?: number
  generalMargin?: number
  cost: number
  current: number
}): number {
  if (input.mode === 'unchanged') return fromCents(toCents(input.current))

  if (input.mode === 'manual') {
    if (input.manual === undefined || !Number.isFinite(input.manual) || input.manual < 0)
      throw new StockValuationValidationError('Ingresá un precio de venta manual válido')
    return fromCents(toCents(input.manual))
  }

  const margin = assertMargin(input.groupMargin ?? input.generalMargin)
  const cost = fromCents(toCents(input.cost))
  return fromCents(toCents(cost * (1 + margin / 100)))
}

export function projectValuation(rows: EligibleVehicle[], request: ValuationRequest): ValuationProjection {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(request.period))
    throw new StockValuationValidationError('El período debe usar el formato YYYY-MM')
  if (request.generalMarginPercent !== undefined) assertMargin(request.generalMarginPercent)

  const groups = groupEligibleVehicles(rows)
  const edits = new Map<string, GroupPriceEdit>()
  for (const edit of request.groups) {
    if (edits.has(edit.groupKey)) throw new StockValuationValidationError('Debe existir exactamente una edición por grupo')
    edits.set(edit.groupKey, edit)
  }
  if (edits.size !== groups.length || groups.some((group) => !edits.has(group.groupKey)))
    throw new StockValuationValidationError('Debés completar todos los grupos conocidos')

  const knownKeys = new Set(groups.map((group) => group.groupKey))
  if (request.groups.some((edit) => !knownKeys.has(edit.groupKey)))
    throw new StockValuationValidationError('La solicitud contiene un grupo desconocido')

  let totalCostCents = 0
  let totalSellCents = 0
  let unpricedSaleUnits = 0

  const projectedGroups = groups.map((group): ProjectedGroup => {
    const edit = edits.get(group.groupKey)!
    if (!Number.isFinite(edit.costPrice) || edit.costPrice <= 0)
      throw new StockValuationValidationError(`Ingresá un costo mayor que cero para ${group.brand} ${group.model}`)

    const costPrice = fromCents(toCents(edit.costPrice))
    const costCents = toCents(costPrice)
    let groupSellCents = 0
    let groupUnpricedUnits = 0
    let sellPrice: number | null

    if (edit.saleMode === 'unchanged') {
      const currentSellCents = group.vehicles.map((row) => toCents(Number(row.sellPrice)))
      groupSellCents = currentSellCents.reduce((sum, value) => sum + value, 0)
      groupUnpricedUnits = currentSellCents.filter((value) => value <= 0).length
      sellPrice = new Set(currentSellCents).size === 1 ? fromCents(currentSellCents[0]) : null
    } else {
      const unitSellPrice = projectedSell({
        mode: edit.saleMode,
        manual: edit.manualSellPrice,
        groupMargin: edit.marginPercent,
        generalMargin: request.generalMarginPercent,
        cost: costPrice,
        current: group.currentSellPrice ?? 0,
      })
      const unitSellCents = toCents(unitSellPrice)
      groupSellCents = unitSellCents * group.totalUnits
      groupUnpricedUnits = unitSellCents <= 0 ? group.totalUnits : 0
      sellPrice = unitSellPrice
    }

    const groupCostCents = costCents * group.totalUnits
    totalCostCents += groupCostCents
    totalSellCents += groupSellCents
    unpricedSaleUnits += groupUnpricedUnits

    return {
      groupKey: group.groupKey,
      brand: group.brand,
      model: group.model,
      version: group.version,
      vehicleIds: group.vehicleIds,
      availableUnits: group.availableUnits,
      reservedUnits: group.reservedUnits,
      totalUnits: group.totalUnits,
      currentCostPrice: group.currentCostPrice,
      currentSellPrice: group.currentSellPrice,
      costPrice,
      sellPrice,
      saleMode: edit.saleMode,
      totalCost: fromCents(groupCostCents),
      totalSell: fromCents(groupSellCents),
      potentialMargin: fromCents(groupSellCents - groupCostCents),
      unpricedSaleUnits: groupUnpricedUnits,
    }
  })

  const availableUnits = projectedGroups.reduce((sum, group) => sum + group.availableUnits, 0)
  const reservedUnits = projectedGroups.reduce((sum, group) => sum + group.reservedUnits, 0)

  return {
    period: request.period,
    stockFingerprint: request.stockFingerprint,
    groups: projectedGroups,
    totals: {
      availableUnits,
      reservedUnits,
      totalUnits: availableUnits + reservedUnits,
      totalCost: fromCents(totalCostCents),
      totalSell: fromCents(totalSellCents),
      potentialMargin: fromCents(totalSellCents - totalCostCents),
      unpricedSaleUnits,
    },
  }
}
