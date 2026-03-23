import type { CreativeLength, Region } from './campaign'

export interface SpotRecord {
  id: string
  campaignId: string
  region: Region
  stationCode: string
  stationName: string
  broadcastDate: string
  broadcastTime: string
  programName: string
  creativeName: string
  creativeLength: CreativeLength
  householdRating: number
  individualRating: number
  isTimeCm: boolean
  importBatchId: string
  /** PRP (= ALL視聴率) */
  prpRating: number
  /** TG視聴率 (男女35-99才等) */
  tgRating: number
  /** 発注TRP (Sharest S列) */
  targetTrp?: number
}

/** 局別の発注目標値（SPOTプランから読込） */
export interface StationTarget {
  region: Region
  stationName: string
  stationCode: string
  /** 発注PRP (H列) */
  targetPrp: number
  /** 発注TRP (L列) */
  targetTrp?: number
}

export interface TimeBand {
  code: string
  label: string
  startHour: number
  endHour: number
  isPrime: boolean
}
