import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SpotRecord, ImportBatch, StationTarget } from '../types'
import type { RegionTargetTrp } from '../lib/parsers/spot-plan-parser'
import type { IclimaxStationData, IclimaxRegionData, IclimaxDailyPrp, WptStationData, WptRegionData } from '../lib/parsers/iclimax-parser'

interface SpotStore {
  spots: SpotRecord[]
  importBatches: ImportBatch[]
  stationTargets: StationTarget[]
  /** エリア別発注TRP (SPOTプラン L列 Row17/23/29) */
  regionTargetTrps: RegionTargetTrp[]
  /** iClimax 局別データ（発注TRP・Prime PRP） */
  iclimaxStationData: IclimaxStationData[]
  /** iClimax エリア別データ */
  iclimaxRegionData: IclimaxRegionData[]
  /** iClimax 日別PRP */
  iclimaxDailyData: IclimaxDailyPrp[]
  /** WPTチェック 局別データ */
  wptStationData: WptStationData[]
  /** WPTチェック エリア別データ */
  wptRegionData: WptRegionData[]
  addSpots: (spots: SpotRecord[]) => void
  deleteSpotsByBatch: (batchId: string) => void
  deleteSpotsByCampaign: (campaignId: string) => void
  addImportBatch: (batch: ImportBatch) => void
  setStationTargets: (targets: StationTarget[]) => void
  setRegionTargetTrps: (trps: RegionTargetTrp[]) => void
  setIclimaxData: (stationData: IclimaxStationData[], regionData: IclimaxRegionData[], dailyData: IclimaxDailyPrp[], wptStation: WptStationData[], wptRegion: WptRegionData[]) => void
  clearAll: () => void
}

export const useSpotStore = create<SpotStore>()(
  persist(
    (set) => ({
      spots: [],
      importBatches: [],
      stationTargets: [],
      regionTargetTrps: [],
      iclimaxStationData: [],
      iclimaxRegionData: [],
      iclimaxDailyData: [],
      wptStationData: [],
      wptRegionData: [],
      addSpots: (newSpots) => {
        set((state) => ({ spots: [...state.spots, ...newSpots] }))
      },
      deleteSpotsByBatch: (batchId) => {
        set((state) => ({
          spots: state.spots.filter((s) => s.importBatchId !== batchId),
          importBatches: state.importBatches.filter((b) => b.id !== batchId),
        }))
      },
      deleteSpotsByCampaign: (campaignId) => {
        set((state) => ({
          spots: state.spots.filter((s) => s.campaignId !== campaignId),
          importBatches: state.importBatches.filter((b) => b.campaignId !== campaignId),
        }))
      },
      addImportBatch: (batch) => {
        set((state) => ({ importBatches: [...state.importBatches, batch] }))
      },
      setStationTargets: (targets) => {
        set({ stationTargets: targets })
      },
      setRegionTargetTrps: (trps) => {
        set({ regionTargetTrps: trps })
      },
      setIclimaxData: (stationData, regionData, dailyData, wptStation, wptRegion) => {
        set({ iclimaxStationData: stationData, iclimaxRegionData: regionData, iclimaxDailyData: dailyData, wptStationData: wptStation, wptRegionData: wptRegion })
      },
      clearAll: () => {
        set({ spots: [], importBatches: [], stationTargets: [], regionTargetTrps: [], iclimaxStationData: [], iclimaxRegionData: [], iclimaxDailyData: [], wptStationData: [], wptRegionData: [] })
      },
    }),
    { name: 'tv-spot-data' },
  ),
)
