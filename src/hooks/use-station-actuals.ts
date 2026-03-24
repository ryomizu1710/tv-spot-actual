import { useMemo } from 'react'
import { useSpotStore } from '../stores/spot-store'
import { useUiStore } from '../stores/ui-store'
import { REGIONS, REGION_LABELS, isPrimeTime, getStationSortOrder } from '../constants'
import type { Region, SpotRecord, StationTarget } from '../types'

/** 局別アクチュアル 1行 */
export interface StationActual {
  region: Region
  regionLabel: string
  stationCode: string
  /** 発注PRP (SPOTプラン H列) */
  targetPrp: number
  /** 実績PRP (= ALL) — 本案のみ */
  actualPrp: number
  /** サービス枠PRP */
  servicePrp: number
  /** PRP アクチュアル % — (本案+サービス)/発注 */
  prpAchievement: number
  /** 発注TRP (局別: Sharest S列合計) */
  targetTrp: number
  /** 実績TG (男女35-99才) — 本案のみ */
  actualTg: number
  /** サービス枠TG */
  serviceTg: number
  /** TG アクチュアル % — (本案+サービス)/発注 */
  tgAchievement: number
  /** プライム帯PRP (19-24時) */
  primePrp: number
  /** プライム帯TG (19-24時) */
  primeTg: number
  /** プライムタイムシェア % (primePrp / actualPrp) */
  primeShare: number
  /** 出稿本数 */
  spotCount: number
  /** プライム帯本数 */
  primeSpotCount: number
}

/** エリア小計 */
export interface RegionSubtotal {
  region: Region
  regionLabel: string
  targetPrp: number
  actualPrp: number
  servicePrp: number
  prpAchievement: number
  /** 発注TRP (小計: SPOTプラン L列合計) */
  targetTrp: number
  actualTg: number
  serviceTg: number
  tgAchievement: number
  primePrp: number
  primeTg: number
  primeShare: number
  spotCount: number
  primeSpotCount: number
}

/** 日別PRP推移データ */
export interface DailyPrpProgress {
  date: string
  dateLabel: string
  /** その日のPRP */
  dailyPrp: number
  /** 累積PRP */
  cumulativePrp: number
  /** その日のTG */
  dailyTg: number
  /** 累積TG */
  cumulativeTg: number
  /** 累積PRP達成率 % */
  cumulativePrpRate: number
  /** 累積TG/PRP比率 */
  cumulativeTgPrpRatio: number
}

/** エリア別日別PRP推移 */
export interface RegionDailyPrpProgress {
  date: string
  dateLabel: string
  kantoRate: number
  kansaiRate: number
  nagoyaRate: number
  /** 日別PRP実数 */
  kantoPrp: number
  kansaiPrp: number
  nagoyaPrp: number
  /** 累積PRP実数 */
  kantoCumPrp: number
  kansaiCumPrp: number
  nagoyaCumPrp: number
  /** エリア別累積達成率 % */
  kantoCumRate: number
  kansaiCumRate: number
  nagoyaCumRate: number
  /** 全体累積達成率 % */
  cumulativeRate: number
}

/** 局別日別PRP推移（個別エリアタブ用） */
export interface StationDailyPrpProgress {
  stationCode: string
  targetPrp: number
  dailyData: { date: string; dateLabel: string; dailyPrp: number; dailyRate: number; cumulativePrp: number; cumulativeRate: number }[]
}

export interface StationActualsData {
  /** 局別アクチュアル */
  stationActuals: StationActual[]
  /** エリア別小計 */
  regionSubtotals: RegionSubtotal[]
  /** 全体合計 */
  grandTotal: RegionSubtotal | null
  /** 日別PRP推移 */
  dailyPrpProgress: DailyPrpProgress[]
  /** エリア別日別PRP推移（全体タブ用） */
  regionDailyPrpProgress: RegionDailyPrpProgress[]
  /** 局別日別PRP推移（個別エリアタブ用・モーダル用） */
  stationDailyPrpProgress: StationDailyPrpProgress[]
  /** エリア別局別日別PRP推移（全体タブモーダル用） */
  regionStationDailyPrpProgress: Record<Region, StationDailyPrpProgress[]>
  /** 合計発注PRP */
  totalTargetPrp: number
  /** 合計実績PRP */
  totalActualPrp: number
  /** 合計実績TG */
  totalActualTg: number
  /** 合計本数 */
  totalSpotCount: number
  /** 合計プライムPRP */
  totalPrimePrp: number
  /** 全体プライムシェア % */
  totalPrimeShare: number
}

export function useStationActuals(): StationActualsData | null {
  const spots = useSpotStore((s) => s.spots)
  const campaignDataMap = useSpotStore((s) => s.campaignDataMap)
  const campaignId = useUiStore((s) => s.selectedCampaignId)
  const selectedRegion = useUiStore((s) => s.selectedRegion)
  const campaignData = campaignId ? (campaignDataMap[campaignId] ?? null) : null
  const stationTargets = campaignData?.stationTargets ?? []
  const regionTargetTrps = campaignData?.regionTargetTrps ?? []
  const iclimaxStationData = campaignData?.iclimaxStationData ?? []
  const iclimaxRegionData = campaignData?.iclimaxRegionData ?? []
  const iclimaxDailyData = campaignData?.iclimaxDailyData ?? []

  return useMemo(() => {
    if (!campaignId) return null

    const campaignSpots = spots.filter((s) => s.campaignId === campaignId)
    if (campaignSpots.length === 0 && stationTargets.length === 0) return null

    // 対象エリアを決定
    const regions: Region[] = selectedRegion === 'all' ? [...REGIONS] : [selectedRegion]

    // 局コード正規化 (CXT→CX等、既存データ対応)
    const normalizeCode = (code: string) => {
      const map: Record<string, string> = { CXT: 'CX' }
      return map[code] ?? code
    }

    // 局別にスポットを集計
    const stationSpotMap = new Map<string, SpotRecord[]>()
    for (const spot of campaignSpots) {
      if (selectedRegion !== 'all' && spot.region !== selectedRegion) continue
      const key = `${spot.region}|${normalizeCode(spot.stationCode)}`
      const list = stationSpotMap.get(key) ?? []
      list.push(spot)
      stationSpotMap.set(key, list)
    }

    // 局別ターゲットをマップ化
    const targetMap = new Map<string, StationTarget>()
    for (const t of stationTargets) {
      if (selectedRegion !== 'all' && t.region !== selectedRegion) continue
      targetMap.set(`${t.region}|${normalizeCode(t.stationCode)}`, t)
    }

    // iClimax局別データをマップ化（発注TRP・Prime PRP）
    const iclimaxMap = new Map<string, { targetTrp: number; totalPrp: number; primePrp: number }>()
    for (const ic of iclimaxStationData) {
      if (selectedRegion !== 'all' && ic.region !== selectedRegion) continue
      iclimaxMap.set(`${ic.region}|${normalizeCode(ic.stationCode)}`, {
        targetTrp: ic.targetTrp,
        totalPrp: ic.totalPrp,
        primePrp: ic.primePrp,
      })
    }

    // 全てのキーをマージ（ターゲットがあっても実績0の場合も表示、逆も）
    const allKeys = new Set<string>([...stationSpotMap.keys(), ...targetMap.keys()])

    const stationActuals: StationActual[] = []

    for (const key of allKeys) {
      const [regionStr, stationCode] = key.split('|')
      const region = regionStr as Region
      if (!regions.includes(region)) continue

      const spotsList = stationSpotMap.get(key) ?? []
      const target = targetMap.get(key)

      // 本案・サービスを分離
      const mainSpots = spotsList.filter((s) => !s.isService)
      const serviceSpots = spotsList.filter((s) => !!s.isService)

      const actualPrp = round2(mainSpots.reduce((sum, s) => sum + getPrp(s), 0))
      const actualTg = round2(mainSpots.reduce((sum, s) => sum + getTg(s), 0))
      const servicePrp = round2(serviceSpots.reduce((sum, s) => sum + getPrp(s), 0))
      const serviceTg = round2(serviceSpots.reduce((sum, s) => sum + getTg(s), 0))
      const targetPrp = target?.targetPrp ?? 0

      // 達成率は本案+サービスの合計で計算
      const totalPrp = round2(actualPrp + servicePrp)
      const totalTg = round2(actualTg + serviceTg)

      // iClimaxデータ参照
      const iclimaxEntry = iclimaxMap.get(key)

      // 発注TRP: iClimaxデータ優先、なければSPOTプラン L列
      const targetTrp = iclimaxEntry?.targetTrp ?? target?.targetTrp ?? 0

      // Prime PRP: iClimaxデータ優先、なければSharest実績から計算
      const primeSpots = spotsList.filter((s) => isPrimeTime(s.broadcastTime))
      const primePrp = iclimaxEntry
        ? round2(iclimaxEntry.primePrp)
        : round2(primeSpots.reduce((sum, s) => sum + getPrp(s), 0))
      const primeTg = round2(primeSpots.reduce((sum, s) => sum + getTg(s), 0))

      stationActuals.push({
        region,
        regionLabel: REGION_LABELS[region],
        stationCode,
        targetPrp,
        actualPrp,
        servicePrp,
        prpAchievement: targetPrp > 0 ? round1(totalPrp / targetPrp * 100) : 0,
        targetTrp,
        actualTg,
        serviceTg,
        tgAchievement: targetTrp > 0 ? round1(totalTg / targetTrp * 100) : 0,
        primePrp,
        primeTg,
        primeShare: (() => {
          // Prime Time Share分母: iClimaxのT列全時間帯合計を優先
          const denom = iclimaxEntry ? iclimaxEntry.totalPrp : totalPrp
          return denom > 0 ? round1(primePrp / denom * 100) : 0
        })(),
        spotCount: spotsList.length,
        primeSpotCount: primeSpots.length,
      })
    }

    // エリア順・系列順ソート (NTV系→TBS系→CX系→EX系→TX系)
    const regionOrder: Record<Region, number> = { kanto: 0, kansai: 1, nagoya: 2 }
    stationActuals.sort((a, b) => {
      const ro = regionOrder[a.region] - regionOrder[b.region]
      if (ro !== 0) return ro
      return getStationSortOrder(a.stationCode) - getStationSortOrder(b.stationCode)
    })

    // エリア別小計
    const regionSubtotals: RegionSubtotal[] = regions.map((region) => {
      const regionStations = stationActuals.filter((s) => s.region === region)
      const targetPrp = round2(regionStations.reduce((s, st) => s + st.targetPrp, 0))
      const actualPrp = round2(regionStations.reduce((s, st) => s + st.actualPrp, 0))
      const servicePrp = round2(regionStations.reduce((s, st) => s + st.servicePrp, 0))
      const actualTg = round2(regionStations.reduce((s, st) => s + st.actualTg, 0))
      const serviceTg = round2(regionStations.reduce((s, st) => s + st.serviceTg, 0))
      const primePrp = round2(regionStations.reduce((s, st) => s + st.primePrp, 0))
      const primeTg = round2(regionStations.reduce((s, st) => s + st.primeTg, 0))
      const totalPrpForRegion = round2(actualPrp + servicePrp)
      const totalTgForRegion = round2(actualTg + serviceTg)

      // エリア小計の発注TRP: SPOTプラン M列 (M17/M23/M29) を優先
      const regionTrpEntry = regionTargetTrps.find((r) => r.region === region)
      const targetTrp = regionTrpEntry?.targetTrp ?? 0

      return {
        region,
        regionLabel: REGION_LABELS[region],
        targetPrp,
        actualPrp,
        servicePrp,
        prpAchievement: targetPrp > 0 ? round1(totalPrpForRegion / targetPrp * 100) : 0,
        targetTrp,
        actualTg,
        serviceTg,
        tgAchievement: targetTrp > 0 ? round1(totalTgForRegion / targetTrp * 100) : 0,
        primePrp,
        primeTg,
        primeShare: (() => {
          // Prime Time Share分母: iClimaxのT列エリア合計を優先
          const iclimaxRegionEntry = iclimaxRegionData.find((r) => r.region === region)
          const denom = iclimaxRegionEntry ? iclimaxRegionEntry.totalPrp : totalPrpForRegion
          return denom > 0 ? round1(primePrp / denom * 100) : 0
        })(),
        spotCount: regionStations.reduce((s, st) => s + st.spotCount, 0),
        primeSpotCount: regionStations.reduce((s, st) => s + st.primeSpotCount, 0),
      }
    })

    // 全体合計
    const totalTargetPrp = round2(regionSubtotals.reduce((s, r) => s + r.targetPrp, 0))
    const totalActualPrp = round2(regionSubtotals.reduce((s, r) => s + r.actualPrp, 0))
    const totalServicePrp = round2(regionSubtotals.reduce((s, r) => s + r.servicePrp, 0))
    const totalActualTg = round2(regionSubtotals.reduce((s, r) => s + r.actualTg, 0))
    const totalServiceTg = round2(regionSubtotals.reduce((s, r) => s + r.serviceTg, 0))
    const totalSpotCount = regionSubtotals.reduce((s, r) => s + r.spotCount, 0)
    const totalPrimePrp = round2(regionSubtotals.reduce((s, r) => s + r.primePrp, 0))
    const totalPrimeTg = round2(regionSubtotals.reduce((s, r) => s + r.primeTg, 0))
    const totalPrimeSpotCount = regionSubtotals.reduce((s, r) => s + r.primeSpotCount, 0)
    const totalTargetTrp = round2(regionSubtotals.reduce((s, r) => s + r.targetTrp, 0))

    const totalCombinedPrp = round2(totalActualPrp + totalServicePrp)
    const totalCombinedTg = round2(totalActualTg + totalServiceTg)

    const grandTotal: RegionSubtotal = {
      region: 'kanto', // placeholder
      regionLabel: '合計',
      targetPrp: totalTargetPrp,
      actualPrp: totalActualPrp,
      servicePrp: totalServicePrp,
      prpAchievement: totalTargetPrp > 0 ? round1(totalCombinedPrp / totalTargetPrp * 100) : 0,
      targetTrp: totalTargetTrp,
      actualTg: totalActualTg,
      serviceTg: totalServiceTg,
      tgAchievement: totalTargetTrp > 0 ? round1(totalCombinedTg / totalTargetTrp * 100) : 0,
      primePrp: totalPrimePrp,
      primeTg: totalPrimeTg,
      primeShare: (() => {
        const iclimaxTotalPrp = iclimaxRegionData.length > 0
          ? round2(iclimaxRegionData.reduce((s, r) => s + r.totalPrp, 0))
          : 0
        const denom = iclimaxTotalPrp > 0 ? iclimaxTotalPrp : totalCombinedPrp
        return denom > 0 ? round1(totalPrimePrp / denom * 100) : 0
      })(),
      spotCount: totalSpotCount,
      primeSpotCount: totalPrimeSpotCount,
    }

    // --- 日別PRP推移 ---
    const filteredSpots = selectedRegion === 'all'
      ? campaignSpots
      : campaignSpots.filter((s) => s.region === selectedRegion)

    // 日別集計 (iClimaxデータ優先)
    const filteredIclimaxDaily = selectedRegion === 'all'
      ? iclimaxDailyData
      : iclimaxDailyData.filter((d) => d.region === selectedRegion)
    const useIclimaxForDaily = filteredIclimaxDaily.length > 0

    const dailyMap = new Map<string, { prp: number; tg: number; count: number }>()
    if (useIclimaxForDaily) {
      // iClimax T列PRPを分子に使用
      for (const d of filteredIclimaxDaily) {
        const existing = dailyMap.get(d.date)
        if (existing) {
          existing.prp += d.prp
          existing.count += 1
        } else {
          dailyMap.set(d.date, { prp: d.prp, tg: 0, count: 1 })
        }
      }
      // TGはSharestから補完
      for (const spot of filteredSpots) {
        const tg = getTg(spot)
        const existing = dailyMap.get(spot.broadcastDate)
        if (existing) {
          existing.tg += tg
        }
      }
    } else {
      // Sharest実績にフォールバック
      for (const spot of filteredSpots) {
        const prp = getPrp(spot)
        const tg = getTg(spot)
        const existing = dailyMap.get(spot.broadcastDate)
        if (existing) {
          existing.prp += prp
          existing.tg += tg
          existing.count += 1
        } else {
          dailyMap.set(spot.broadcastDate, { prp, tg, count: 1 })
        }
      }
    }

    // 対象エリアの合計発注PRP（iClimaxがない場合のフォールバック）
    const totalRegionTarget = selectedRegion === 'all'
      ? stationTargets.reduce((s, t) => s + t.targetPrp, 0)
      : stationTargets.filter((t) => t.region === selectedRegion).reduce((s, t) => s + t.targetPrp, 0)

    // 日付順ソート → 累積計算
    const sortedDays = Array.from(dailyMap.entries()).sort(([a], [b]) => a.localeCompare(b))

    // 累積達成率の分母: iClimaxデータがあればiClimax合計PRP（最終日に100%になるように）
    const totalDailyPrp = sortedDays.reduce((s, [, d]) => s + d.prp, 0)
    const dailyCumDenom = useIclimaxForDaily && totalDailyPrp > 0 ? totalDailyPrp : totalRegionTarget

    let cumulativePrp = 0
    let cumulativeTg = 0

    const dailyPrpProgress: DailyPrpProgress[] = sortedDays.map(([date, data]) => {
      cumulativePrp += data.prp
      cumulativeTg += data.tg
      return {
        date,
        dateLabel: formatDateLabel(date), // MM-DD
        dailyPrp: round2(data.prp),
        cumulativePrp: round2(cumulativePrp),
        dailyTg: round2(data.tg),
        cumulativeTg: round2(cumulativeTg),
        cumulativePrpRate: dailyCumDenom > 0 ? round1(cumulativePrp / dailyCumDenom * 100) : 0,
        cumulativeTgPrpRatio: cumulativePrp > 0 ? round1(cumulativeTg / cumulativePrp * 100) : 0,
      }
    })

    // --- エリア別日別PRP推移（全体タブ用）---
    const regionDailyPrpProgress: RegionDailyPrpProgress[] = (() => {
      if (selectedRegion !== 'all') return []

      // エリア別の日別PRPマップ (iClimaxデータ優先)
      const regionDailyMaps: Record<Region, Map<string, number>> = {
        kanto: new Map(),
        kansai: new Map(),
        nagoya: new Map(),
      }
      if (iclimaxDailyData.length > 0) {
        // iClimaxのT列日別データを使用
        for (const d of iclimaxDailyData) {
          const map = regionDailyMaps[d.region]
          if (map) {
            map.set(d.date, (map.get(d.date) ?? 0) + d.prp)
          }
        }
      } else {
        // Sharest実績にフォールバック
        for (const spot of campaignSpots) {
          const prp = getPrp(spot)
          const map = regionDailyMaps[spot.region]
          if (map) {
            map.set(spot.broadcastDate, (map.get(spot.broadcastDate) ?? 0) + prp)
          }
        }
      }

      // エリア別のiClimax合計PRP（累積達成率の分母用：最終日に100%になるように）
      const regionTotalIclimaxPrp: Record<Region, number> = { kanto: 0, kansai: 0, nagoya: 0 }
      const hasIclimaxDaily = iclimaxDailyData.length > 0
      if (hasIclimaxDaily) {
        for (const m of regionDailyMaps.kanto.values()) regionTotalIclimaxPrp.kanto += m
        for (const m of regionDailyMaps.kansai.values()) regionTotalIclimaxPrp.kansai += m
        for (const m of regionDailyMaps.nagoya.values()) regionTotalIclimaxPrp.nagoya += m
      }

      // エリア別の発注PRP合計（iClimaxがない場合のフォールバック）
      const regionTargetPrpMap: Record<Region, number> = { kanto: 0, kansai: 0, nagoya: 0 }
      for (const t of stationTargets) {
        if (regionTargetPrpMap[t.region] !== undefined) {
          regionTargetPrpMap[t.region] += t.targetPrp
        }
      }

      // 累積達成率の分母: iClimaxデータがあればiClimax合計、なければSPOTプラン発注PRP
      const regionCumDenom: Record<Region, number> = {
        kanto: hasIclimaxDaily && regionTotalIclimaxPrp.kanto > 0 ? regionTotalIclimaxPrp.kanto : regionTargetPrpMap.kanto,
        kansai: hasIclimaxDaily && regionTotalIclimaxPrp.kansai > 0 ? regionTotalIclimaxPrp.kansai : regionTargetPrpMap.kansai,
        nagoya: hasIclimaxDaily && regionTotalIclimaxPrp.nagoya > 0 ? regionTotalIclimaxPrp.nagoya : regionTargetPrpMap.nagoya,
      }
      const totalCumDenom = regionCumDenom.kanto + regionCumDenom.kansai + regionCumDenom.nagoya

      // 全日付を集めてソート
      const allDates = new Set<string>()
      for (const m of Object.values(regionDailyMaps)) {
        for (const d of m.keys()) allDates.add(d)
      }
      const sortedAllDates = Array.from(allDates).sort()

      // 全体累積・エリア別累積
      let cumPrp = 0
      let kantoCum = 0
      let kansaiCum = 0
      let nagoyaCum = 0

      return sortedAllDates.map((date) => {
        const kantoPrp = regionDailyMaps.kanto.get(date) ?? 0
        const kansaiPrp = regionDailyMaps.kansai.get(date) ?? 0
        const nagoyaPrp = regionDailyMaps.nagoya.get(date) ?? 0
        cumPrp += kantoPrp + kansaiPrp + nagoyaPrp
        kantoCum += kantoPrp
        kansaiCum += kansaiPrp
        nagoyaCum += nagoyaPrp

        return {
          date,
          dateLabel: formatDateLabel(date),
          kantoRate: regionCumDenom.kanto > 0 ? round1(kantoPrp / regionCumDenom.kanto * 100) : 0,
          kansaiRate: regionCumDenom.kansai > 0 ? round1(kansaiPrp / regionCumDenom.kansai * 100) : 0,
          nagoyaRate: regionCumDenom.nagoya > 0 ? round1(nagoyaPrp / regionCumDenom.nagoya * 100) : 0,
          kantoPrp: round2(kantoPrp),
          kansaiPrp: round2(kansaiPrp),
          nagoyaPrp: round2(nagoyaPrp),
          kantoCumPrp: round2(kantoCum),
          kansaiCumPrp: round2(kansaiCum),
          nagoyaCumPrp: round2(nagoyaCum),
          kantoCumRate: regionCumDenom.kanto > 0 ? round1(kantoCum / regionCumDenom.kanto * 100) : 0,
          kansaiCumRate: regionCumDenom.kansai > 0 ? round1(kansaiCum / regionCumDenom.kansai * 100) : 0,
          nagoyaCumRate: regionCumDenom.nagoya > 0 ? round1(nagoyaCum / regionCumDenom.nagoya * 100) : 0,
          cumulativeRate: totalCumDenom > 0 ? round1(cumPrp / totalCumDenom * 100) : 0,
        }
      })
    })()

    // --- 局別日別PRP推移を計算するヘルパー ---
    // iClimaxデータがあればiClimax T列PRPを分子に使用、なければSharest実績
    function buildStationDaily(spots: SpotRecord[], regionFilter?: Region): StationDailyPrpProgress[] {
      const region = regionFilter ?? (spots.length > 0 ? spots[0].region : 'kanto')

      // iClimaxの日別データがあれば優先使用
      const iclimaxRegionDaily = iclimaxDailyData.filter((d) => d.region === region)
      const useIclimax = iclimaxRegionDaily.length > 0

      const stationDailyMap = new Map<string, Map<string, number>>()
      if (useIclimax) {
        for (const d of iclimaxRegionDaily) {
          const code = d.stationCode // already normalized in parser
          if (!stationDailyMap.has(code)) stationDailyMap.set(code, new Map())
          const dayMap = stationDailyMap.get(code)!
          dayMap.set(d.date, (dayMap.get(d.date) ?? 0) + d.prp)
        }
      } else {
        for (const spot of spots) {
          const code = normalizeCode(spot.stationCode)
          if (!stationDailyMap.has(code)) stationDailyMap.set(code, new Map())
          const dayMap = stationDailyMap.get(code)!
          dayMap.set(spot.broadcastDate, (dayMap.get(spot.broadcastDate) ?? 0) + getPrp(spot))
        }
      }

      // 全局を通じた全日付を収集（枠が0本の日も表示するため）
      const allDatesSet = new Set<string>()
      for (const dayMap of stationDailyMap.values()) {
        for (const date of dayMap.keys()) {
          allDatesSet.add(date)
        }
      }
      const allDates = Array.from(allDatesSet).sort()

      const stationCodes = Array.from(stationDailyMap.keys()).sort(
        (a, b) => getStationSortOrder(a) - getStationSortOrder(b)
      )
      return stationCodes.map((stationCode) => {
        const target = targetMap.get(`${region}|${stationCode}`)
        const stationTargetPrp = target?.targetPrp ?? 0
        const dayMap = stationDailyMap.get(stationCode)!
        // 全日付を使用し、データがない日は0として扱う
        const sortedDays: [string, number][] = allDates.map((date) => [date, dayMap.get(date) ?? 0])
        // 累積達成率の分母: iClimaxデータの合計PRP（最終日に100%になるように）、なければSPOTプラン発注PRP
        const totalIclimaxPrp = sortedDays.reduce((s, [, prp]) => s + prp, 0)
        const cumDenom = useIclimax && totalIclimaxPrp > 0 ? totalIclimaxPrp : stationTargetPrp
        let cumPrp = 0
        const dailyData = sortedDays.map(([date, prp]) => {
          cumPrp += prp
          return {
            date,
            dateLabel: formatDateLabel(date),
            dailyPrp: round2(prp),
            dailyRate: cumDenom > 0 ? round1(prp / cumDenom * 100) : 0,
            cumulativePrp: round2(cumPrp),
            cumulativeRate: cumDenom > 0 ? round1(cumPrp / cumDenom * 100) : 0,
          }
        })
        return { stationCode, targetPrp: stationTargetPrp, dailyData }
      })
    }

    // 個別エリアタブ用
    const stationDailyPrpProgress: StationDailyPrpProgress[] =
      selectedRegion === 'all' ? [] : buildStationDaily(filteredSpots)

    // 全体タブモーダル用: エリア別の局別日別PRP
    const regionStationDailyPrpProgress: Record<Region, StationDailyPrpProgress[]> = {
      kanto: buildStationDaily(campaignSpots.filter((s) => s.region === 'kanto'), 'kanto'),
      kansai: buildStationDaily(campaignSpots.filter((s) => s.region === 'kansai'), 'kansai'),
      nagoya: buildStationDaily(campaignSpots.filter((s) => s.region === 'nagoya'), 'nagoya'),
    }

    return {
      stationActuals,
      regionSubtotals,
      grandTotal,
      dailyPrpProgress,
      regionDailyPrpProgress,
      stationDailyPrpProgress,
      regionStationDailyPrpProgress,
      totalTargetPrp,
      totalActualPrp,
      totalActualTg,
      totalSpotCount,
      totalPrimePrp,
      totalPrimeShare: (() => {
        const iclimaxTotalPrp = iclimaxRegionData.length > 0
          ? round2(iclimaxRegionData.reduce((s, r) => s + r.totalPrp, 0))
          : 0
        const denom = iclimaxTotalPrp > 0 ? iclimaxTotalPrp : totalActualPrp
        return denom > 0 ? round1(totalPrimePrp / denom * 100) : 0
      })(),
    }
  }, [spots, campaignDataMap, campaignId, selectedRegion])
}

/** prpRating取得（旧データ互換: undefinedの場合individualRatingにフォールバック） */
function getPrp(s: SpotRecord): number {
  const v = s.prpRating
  if (v !== undefined && v !== null && !isNaN(v)) return v
  // 旧CSV形式ではindividualRatingに個人視聴率が入っている
  return s.individualRating ?? 0
}

/** tgRating取得（旧データ互換: undefinedの場合0） */
function getTg(s: SpotRecord): number {
  const v = s.tgRating
  if (v !== undefined && v !== null && !isNaN(v)) return v
  return 0
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

const DAY_OF_WEEK = ['日', '月', '火', '水', '木', '金', '土']

/** "2026-03-24" → "3/24(月)" */
function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr)
  const m = d.getMonth() + 1
  const day = d.getDate()
  const dow = DAY_OF_WEEK[d.getDay()]
  return `${m}/${day}(${dow})`
}
