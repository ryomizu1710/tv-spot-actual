import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { idbStorage } from '../lib/idb-storage'
import type { SpotRecord, ImportBatch, StationTarget } from '../types'
import type { RegionTargetTrp } from '../lib/parsers/spot-plan-parser'
import type { IclimaxStationData, IclimaxRegionData, IclimaxDailyPrp, IclimaxSpotRow, WptStationData, WptRegionData } from '../lib/parsers/iclimax-parser'

/** キャンペーン固有データ */
export interface CampaignSpecificData {
  stationTargets: StationTarget[]
  regionTargetTrps: RegionTargetTrp[]
  iclimaxStationData: IclimaxStationData[]
  iclimaxRegionData: IclimaxRegionData[]
  iclimaxDailyData: IclimaxDailyPrp[]
  iclimaxSpots: IclimaxSpotRow[]
  wptStationData: WptStationData[]
  wptRegionData: WptRegionData[]
}

const emptyCampaignData: CampaignSpecificData = {
  stationTargets: [],
  regionTargetTrps: [],
  iclimaxStationData: [],
  iclimaxRegionData: [],
  iclimaxDailyData: [],
  iclimaxSpots: [],
  wptStationData: [],
  wptRegionData: [],
}

interface SpotStore {
  spots: SpotRecord[]
  importBatches: ImportBatch[]
  /** キャンペーン別データ (campaignId -> data) */
  campaignDataMap: Record<string, CampaignSpecificData>

  // --- 後方互換: 旧グローバルフィールド（マイグレーション用） ---
  stationTargets?: StationTarget[]
  regionTargetTrps?: RegionTargetTrp[]
  iclimaxStationData?: IclimaxStationData[]
  iclimaxRegionData?: IclimaxRegionData[]
  iclimaxDailyData?: IclimaxDailyPrp[]
  wptStationData?: WptStationData[]
  wptRegionData?: WptRegionData[]

  /** キャンペーン別データ取得ヘルパー */
  getCampaignData: (campaignId: string) => CampaignSpecificData

  addSpots: (spots: SpotRecord[]) => void
  deleteSpotsByBatch: (batchId: string) => void
  deleteSpotsByCampaign: (campaignId: string) => void
  deleteSpotsByCampaignAndType: (campaignId: string, isService: boolean) => void
  addImportBatch: (batch: ImportBatch) => void
  setStationTargets: (campaignId: string, targets: StationTarget[]) => void
  setRegionTargetTrps: (campaignId: string, trps: RegionTargetTrp[]) => void
  setIclimaxData: (campaignId: string, stationData: IclimaxStationData[], regionData: IclimaxRegionData[], dailyData: IclimaxDailyPrp[], spotRows: IclimaxSpotRow[], wptStation: WptStationData[], wptRegion: WptRegionData[]) => void
  clearAll: () => void
}

export const useSpotStore = create<SpotStore>()(
  persist(
    (set, get) => ({
      spots: [],
      importBatches: [],
      campaignDataMap: {},

      getCampaignData: (campaignId) => {
        return get().campaignDataMap[campaignId] ?? emptyCampaignData
      },

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
          // campaignDataMap（SPOTプラン・iClimax等）は保持
        }))
      },
      deleteSpotsByCampaignAndType: (campaignId, isService) => {
        set((state) => ({
          spots: state.spots.filter((s) =>
            s.campaignId !== campaignId || (!!s.isService) !== isService
          ),
          importBatches: state.importBatches.filter((b) => {
            if (b.campaignId !== campaignId) return true
            // バッチのファイル名でサービス判定
            const batchIsService = b.fileName.includes('サービス')
            return batchIsService !== isService
          }),
        }))
      },
      addImportBatch: (batch) => {
        set((state) => ({ importBatches: [...state.importBatches, batch] }))
      },
      setStationTargets: (campaignId, targets) => {
        set((state) => ({
          campaignDataMap: {
            ...state.campaignDataMap,
            [campaignId]: {
              ...(state.campaignDataMap[campaignId] ?? emptyCampaignData),
              stationTargets: targets,
            },
          },
        }))
      },
      setRegionTargetTrps: (campaignId, trps) => {
        set((state) => ({
          campaignDataMap: {
            ...state.campaignDataMap,
            [campaignId]: {
              ...(state.campaignDataMap[campaignId] ?? emptyCampaignData),
              regionTargetTrps: trps,
            },
          },
        }))
      },
      setIclimaxData: (campaignId, stationData, regionData, dailyData, spotRows, wptStation, wptRegion) => {
        set((state) => ({
          campaignDataMap: {
            ...state.campaignDataMap,
            [campaignId]: {
              ...(state.campaignDataMap[campaignId] ?? emptyCampaignData),
              iclimaxStationData: stationData,
              iclimaxRegionData: regionData,
              iclimaxDailyData: dailyData,
              iclimaxSpots: spotRows,
              wptStationData: wptStation,
              wptRegionData: wptRegion,
            },
          },
        }))
      },
      clearAll: () => {
        set({ spots: [], importBatches: [], campaignDataMap: {} })
      },
    }),
    { name: 'tv-spot-data', storage: idbStorage },
  ),
)
