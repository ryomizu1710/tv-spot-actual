import type { DailyActual } from '../../types'

export function calculatePrimeShare(actuals: DailyActual[]): {
  householdPrimeShare: number
  individualPrimeShare: number
} {
  let totalHH = 0
  let primeHH = 0
  let totalInd = 0
  let primeInd = 0

  for (const d of actuals) {
    totalHH += d.householdGrp
    primeHH += d.primeHouseholdGrp
    totalInd += d.individualGrp
    primeInd += d.primeIndividualGrp
  }

  return {
    householdPrimeShare: totalHH > 0 ? Math.round((primeHH / totalHH) * 1000) / 10 : 0,
    individualPrimeShare: totalInd > 0 ? Math.round((primeInd / totalInd) * 1000) / 10 : 0,
  }
}
