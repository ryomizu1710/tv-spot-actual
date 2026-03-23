import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { Campaign } from '../types'

interface CampaignStore {
  campaigns: Campaign[]
  addCampaign: (campaign: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>) => string
  /** バックアップリストア用: ID含む完全なキャンペーンをそのまま追加 */
  restoreCampaign: (campaign: Campaign) => void
  updateCampaign: (id: string, updates: Partial<Campaign>) => void
  deleteCampaign: (id: string) => void
  getCampaign: (id: string) => Campaign | undefined
}

export const useCampaignStore = create<CampaignStore>()(
  persist(
    (set, get) => ({
      campaigns: [],
      addCampaign: (data) => {
        const id = uuidv4()
        const now = new Date().toISOString()
        const campaign: Campaign = { ...data, id, createdAt: now, updatedAt: now }
        set((state) => ({ campaigns: [...state.campaigns, campaign] }))
        return id
      },
      restoreCampaign: (campaign) => {
        set((state) => {
          // 同じIDが既にあればスキップ
          if (state.campaigns.some((c) => c.id === campaign.id)) return state
          return { campaigns: [...state.campaigns, campaign] }
        })
      },
      updateCampaign: (id, updates) => {
        set((state) => ({
          campaigns: state.campaigns.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c,
          ),
        }))
      },
      deleteCampaign: (id) => {
        set((state) => ({
          campaigns: state.campaigns.filter((c) => c.id !== id),
        }))
      },
      getCampaign: (id) => get().campaigns.find((c) => c.id === id),
    }),
    { name: 'tv-spot-campaigns' },
  ),
)
