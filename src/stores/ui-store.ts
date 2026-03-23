import { create } from 'zustand'
import type { Region } from '../types'

interface UiStore {
  selectedCampaignId: string | null
  selectedRegion: Region | 'all'
  sidebarOpen: boolean
  setSelectedCampaign: (id: string | null) => void
  setSelectedRegion: (region: Region | 'all') => void
  toggleSidebar: () => void
}

export const useUiStore = create<UiStore>()((set) => ({
  selectedCampaignId: null,
  selectedRegion: 'all',
  sidebarOpen: true,
  setSelectedCampaign: (id) => set({ selectedCampaignId: id }),
  setSelectedRegion: (region) => set({ selectedRegion: region }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}))
