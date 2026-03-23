import type { CreativeLength, Region } from './campaign'

export interface DailyActual {
  campaignId: string
  region: Region
  date: string
  householdGrp: number
  individualGrp: number
  primeHouseholdGrp: number
  primeIndividualGrp: number
  spotCount: number
  spotCountByLength: Partial<Record<CreativeLength, number>>
  totalSeconds: number
}

export interface CumulativeProgress {
  campaignId: string
  region: Region
  asOfDate: string
  cumulativeHouseholdGrp: number
  cumulativeIndividualGrp: number
  householdAchievementRate: number
  individualAchievementRate: number
  cumulativePrimeShare: number
  cumulativeSpotCount: number
  cumulativeTotalSeconds: number
}
