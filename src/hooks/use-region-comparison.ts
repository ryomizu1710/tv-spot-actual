import { useMemo } from 'react'
import { useSpotStore } from '../stores/spot-store'
import { useUiStore } from '../stores/ui-store'
import { calculateDailyActuals } from '../lib/calculators/grp-calculator'
import { calculatePrimeShare } from '../lib/calculators/prime-share'
import { REGIONS, REGION_LABELS } from '../constants'
import type { Region } from '../types'

export interface RegionComparison {
  region: Region
  label: string
  householdGrp: number
  individualGrp: number
  primeShare: number
  spotCount: number
}

export function useRegionComparison(): RegionComparison[] {
  const spots = useSpotStore((s) => s.spots)
  const campaignId = useUiStore((s) => s.selectedCampaignId)

  return useMemo(() => {
    if (!campaignId) return []
    const allDaily = calculateDailyActuals(spots, campaignId)

    return REGIONS.map((region) => {
      const regionDaily = allDaily.filter((d) => d.region === region)
      const primeShare = calculatePrimeShare(regionDaily)
      return {
        region,
        label: REGION_LABELS[region],
        householdGrp: Math.round(regionDaily.reduce((s, d) => s + d.householdGrp, 0) * 10) / 10,
        individualGrp: Math.round(regionDaily.reduce((s, d) => s + d.individualGrp, 0) * 10) / 10,
        primeShare: primeShare.householdPrimeShare,
        spotCount: regionDaily.reduce((s, d) => s + d.spotCount, 0),
      }
    })
  }, [spots, campaignId])
}
