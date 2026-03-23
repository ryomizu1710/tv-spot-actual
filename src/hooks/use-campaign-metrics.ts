import { useMemo } from 'react'
import { useSpotStore } from '../stores/spot-store'
import { useCampaignStore } from '../stores/campaign-store'
import { useUiStore } from '../stores/ui-store'
import { calculateDailyActuals, aggregateByRegion } from '../lib/calculators/grp-calculator'
import { calculatePrimeShare } from '../lib/calculators/prime-share'
import { summarizeSpots } from '../lib/calculators/spot-counter'
import { formatAchievementRate } from '../lib/formatters/number'
import type { CampaignTarget, DailyActual } from '../types'

export interface CampaignMetrics {
  dailyActuals: DailyActual[]
  totalHouseholdGrp: number
  totalIndividualGrp: number
  householdPrimeShare: number
  individualPrimeShare: number
  spotSummary: ReturnType<typeof summarizeSpots>
  target: CampaignTarget | undefined
  householdAchievementRate: number
  individualAchievementRate: number
}

export function useCampaignMetrics(): CampaignMetrics | null {
  const spots = useSpotStore((s) => s.spots)
  const campaigns = useCampaignStore((s) => s.campaigns)
  const campaignId = useUiStore((s) => s.selectedCampaignId)
  const region = useUiStore((s) => s.selectedRegion)

  return useMemo(() => {
    if (!campaignId) return null
    const campaign = campaigns.find((c) => c.id === campaignId)
    if (!campaign) return null

    const allDaily = calculateDailyActuals(spots, campaignId)
    const filteredDaily = aggregateByRegion(allDaily, region)

    const totalHouseholdGrp = filteredDaily.reduce((s, d) => s + d.householdGrp, 0)
    const totalIndividualGrp = filteredDaily.reduce((s, d) => s + d.individualGrp, 0)
    const primeShare = calculatePrimeShare(filteredDaily)
    const spotSummary = summarizeSpots(filteredDaily)

    const target = region === 'all'
      ? campaign.targets.reduce<CampaignTarget | undefined>((acc, t) => {
          if (!acc) return { ...t }
          return {
            ...acc,
            householdGrpTarget: acc.householdGrpTarget + t.householdGrpTarget,
            individualGrpTarget: acc.individualGrpTarget + t.individualGrpTarget,
            spotCountTarget: acc.spotCountTarget + t.spotCountTarget,
            primeShareTarget: t.primeShareTarget,
          }
        }, undefined)
      : campaign.targets.find((t) => t.region === region)

    return {
      dailyActuals: filteredDaily,
      totalHouseholdGrp: Math.round(totalHouseholdGrp * 10) / 10,
      totalIndividualGrp: Math.round(totalIndividualGrp * 10) / 10,
      householdPrimeShare: primeShare.householdPrimeShare,
      individualPrimeShare: primeShare.individualPrimeShare,
      spotSummary,
      target,
      householdAchievementRate: target ? formatAchievementRate(totalHouseholdGrp, target.householdGrpTarget) : 0,
      individualAchievementRate: target ? formatAchievementRate(totalIndividualGrp, target.individualGrpTarget) : 0,
    }
  }, [spots, campaigns, campaignId, region])
}
