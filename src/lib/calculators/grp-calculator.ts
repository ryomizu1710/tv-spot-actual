import type { SpotRecord, DailyActual, Region, CreativeLength } from '../../types'
import { isPrimeTime } from '../../constants'

export function calculateDailyActuals(
  spots: SpotRecord[],
  campaignId: string,
): DailyActual[] {
  const grouped = new Map<string, SpotRecord[]>()

  for (const spot of spots) {
    if (spot.campaignId !== campaignId) continue
    const key = `${spot.region}|${spot.broadcastDate}`
    const list = grouped.get(key) ?? []
    list.push(spot)
    grouped.set(key, list)
  }

  const results: DailyActual[] = []

  for (const [key, daySpots] of grouped) {
    const [region, date] = key.split('|')
    const spotCountByLength: Partial<Record<CreativeLength, number>> = {}
    let householdGrp = 0
    let individualGrp = 0
    let primeHouseholdGrp = 0
    let primeIndividualGrp = 0
    let totalSeconds = 0

    for (const s of daySpots) {
      householdGrp += s.householdRating
      individualGrp += s.individualRating
      totalSeconds += s.creativeLength

      if (isPrimeTime(s.broadcastTime)) {
        primeHouseholdGrp += s.householdRating
        primeIndividualGrp += s.individualRating
      }

      spotCountByLength[s.creativeLength] =
        (spotCountByLength[s.creativeLength] ?? 0) + 1
    }

    results.push({
      campaignId,
      region: region as Region,
      date,
      householdGrp: round2(householdGrp),
      individualGrp: round2(individualGrp),
      primeHouseholdGrp: round2(primeHouseholdGrp),
      primeIndividualGrp: round2(primeIndividualGrp),
      spotCount: daySpots.length,
      spotCountByLength,
      totalSeconds,
    })
  }

  return results.sort((a, b) => a.date.localeCompare(b.date) || a.region.localeCompare(b.region))
}

export function aggregateByRegion(
  dailyActuals: DailyActual[],
  region: Region | 'all',
): DailyActual[] {
  if (region === 'all') return dailyActuals
  return dailyActuals.filter((d) => d.region === region)
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
