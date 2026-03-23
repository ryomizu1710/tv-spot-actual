import type { DailyActual, CreativeLength } from '../../types'
import { CREATIVE_LENGTHS } from '../../constants'

export interface SpotSummary {
  totalCount: number
  totalSeconds: number
  byLength: { length: CreativeLength; count: number; seconds: number }[]
}

export function summarizeSpots(actuals: DailyActual[]): SpotSummary {
  const counts: Partial<Record<CreativeLength, number>> = {}
  let totalCount = 0
  let totalSeconds = 0

  for (const d of actuals) {
    totalCount += d.spotCount
    totalSeconds += d.totalSeconds
    for (const len of CREATIVE_LENGTHS) {
      counts[len] = (counts[len] ?? 0) + (d.spotCountByLength[len] ?? 0)
    }
  }

  const byLength = CREATIVE_LENGTHS
    .map((len) => ({
      length: len,
      count: counts[len] ?? 0,
      seconds: (counts[len] ?? 0) * len,
    }))
    .filter((b) => b.count > 0)

  return { totalCount, totalSeconds, byLength }
}
