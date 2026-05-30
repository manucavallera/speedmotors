// Cuotas fijas con interés simple: total = capital × (1 + tasa × n), repartido en n cuotas iguales.
// cuota = capital/n + capital·r (capital + interés mensual fijo). Fuente de verdad única —
// usada por CreditsService.generateInstallments y SalesService.create.
export function calcCuotasFijas(capital: number, ratePct: number, n: number) {
  const r = ratePct / 100
  const total = capital * (1 + r * n)
  const cuota = total / n
  const cuotaBase = capital / n
  return { total, cuota, cuotaBase }
}
