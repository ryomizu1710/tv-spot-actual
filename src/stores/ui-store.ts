import { create } from 'zustand'
import type { Region } from '../types'

/**
 * Prime Time Share の算出基準
 * - iclimax:  分母=iClimax T列の全時間帯PRP合計 / 分子=iClimaxのプライム帯PRP（従来）
 * - forecast: 分母=本案予測+サービス予測の合計PRP / 分子=そのうちプライム帯のPRP
 */
export type PrimeShareBasis = 'iclimax' | 'forecast'

interface UiStore {
  selectedCampaignId: string | null
  selectedRegion: Region | 'all'
  sidebarOpen: boolean
  primeShareBasis: PrimeShareBasis
  setSelectedCampaign: (id: string | null) => void
  setSelectedRegion: (region: Region | 'all') => void
  toggleSidebar: () => void
  setPrimeShareBasis: (basis: PrimeShareBasis) => void
}

export const useUiStore = create<UiStore>()((set) => ({
  selectedCampaignId: null,
  selectedRegion: 'all',
  sidebarOpen: true,
  primeShareBasis: 'iclimax',
  setSelectedCampaign: (id) => set({ selectedCampaignId: id }),
  setSelectedRegion: (region) => set({ selectedRegion: region }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setPrimeShareBasis: (basis) => set({ primeShareBasis: basis }),
}))
