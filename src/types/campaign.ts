export type Region = 'kanto' | 'kansai' | 'nagoya'

export type CreativeLength = 15 | 30 | 60 | 90 | 120

export type CampaignStatus = 'planning' | 'active' | 'completed'

export interface CampaignTarget {
  region: Region
  householdGrpTarget: number
  individualGrpTarget: number
  primeShareTarget: number
  spotCountTarget: number
}

export interface Campaign {
  id: string
  name: string
  client: string
  product: string
  startDate: string
  endDate: string
  status: CampaignStatus
  regions: Region[]
  targets: CampaignTarget[]
  notes: string
  createdAt: string
  updatedAt: string
}
