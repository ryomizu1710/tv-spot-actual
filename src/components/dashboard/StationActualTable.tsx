import type { StationActual, RegionSubtotal } from '../../hooks/use-station-actuals'
import type { WptStationData, WptRegionData } from '../../lib/parsers/iclimax-parser'
import { useSpotStore } from '../../stores/spot-store'
import { useUiStore } from '../../stores/ui-store'
import { REGION_LABELS } from '../../constants'
import type { Region } from '../../types'

interface Props {
  stationActuals: StationActual[]
  regionSubtotals: RegionSubtotal[]
}

function AchievementBadge({ rate }: { rate: number }) {
  if (rate === 0) return <span className="text-[#d2d2d7]">—</span>
  const color = rate >= 100
    ? 'bg-[#34C759]/10 text-[#34C759]'
    : 'bg-[#FF3B30]/10 text-[#FF3B30]'
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${color}`}>
      {rate.toFixed(1)}%
    </span>
  )
}

function PrimeShareBadge({ rate }: { rate: number }) {
  if (rate === 0) return <span className="text-[#d2d2d7]">—</span>
  const color = rate >= 60
    ? 'bg-[#34C759]/10 text-[#34C759]'
    : 'bg-[#FF3B30]/10 text-[#FF3B30]'
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${color}`}>
      {rate.toFixed(1)}%
    </span>
  )
}

/** カテゴリーヘッダーのスタイル定義 (Dark) */
const CATEGORY_STYLES = {
  prp: {
    headerBg: 'bg-[#0a84ff]/10',
    headerText: 'text-[#0a84ff]',
    headerBorder: 'border-[#0a84ff]/20',
    cellBorder: 'border-l-2 border-[#0a84ff]/15',
    colBg: '',
  },
  trp: {
    headerBg: 'bg-[#64d2ff]/10',
    headerText: 'text-[#64d2ff]',
    headerBorder: 'border-[#64d2ff]/20',
    cellBorder: 'border-l-2 border-[#64d2ff]/15',
    colBg: '',
  },
  prime: {
    headerBg: 'bg-[#ff9f0a]/10',
    headerText: 'text-[#ff9f0a]',
    headerBorder: 'border-[#ff9f0a]/20',
    cellBorder: 'border-l-2 border-[#ff9f0a]/15',
    colBg: '',
  },
  spots: {
    headerBg: 'bg-white/[0.04]',
    headerText: 'text-[#98989d]',
    headerBorder: 'border-white/[0.08]',
    cellBorder: 'border-l-2 border-white/[0.06]',
    colBg: '',
  },
  wpt: {
    headerBg: 'bg-[#bf5af2]/10',
    headerText: 'text-[#bf5af2]',
    headerBorder: 'border-[#bf5af2]/20',
    cellBorder: 'border-l-2 border-[#bf5af2]/15',
    colBg: '',
  },
}

export function StationActualTable({ stationActuals, regionSubtotals }: Props) {
  const campaignId = useUiStore((s) => s.selectedCampaignId)
  const campaignDataMap = useSpotStore((s) => s.campaignDataMap)
  const campaignData = campaignId ? (campaignDataMap[campaignId] ?? null) : null
  const wptStationData = campaignData?.wptStationData ?? []
  const wptRegionData = campaignData?.wptRegionData ?? []
  const hasWpt = wptStationData.length > 0

  // WPTマップ化
  const wptStationMap = new Map<string, WptStationData>()
  for (const w of wptStationData) {
    wptStationMap.set(`${w.region}|${w.stationCode}`, w)
  }
  const wptRegionMap = new Map<Region, WptRegionData>()
  for (const w of wptRegionData) {
    wptRegionMap.set(w.region, w)
  }

  // エリアごとにグルーピング
  const regionGroups = new Map<Region, StationActual[]>()
  for (const sa of stationActuals) {
    const list = regionGroups.get(sa.region) ?? []
    list.push(sa)
    regionGroups.set(sa.region, list)
  }

  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-white/[0.08]">
      <table className="w-full text-xs">
        <thead>
          {/* カテゴリーグループヘッダー */}
          <tr>
            <th colSpan={2} className="rounded-tl-xl bg-[#2c2c2e] px-3 py-2.5">
            </th>
            <th colSpan={4} className={`${CATEGORY_STYLES.prp.headerBg} border-l ${CATEGORY_STYLES.prp.headerBorder} px-2 py-2.5 text-center text-[11px] font-bold tracking-wider ${CATEGORY_STYLES.prp.headerText}`}>
              PRP
            </th>
            <th colSpan={4} className={`${CATEGORY_STYLES.trp.headerBg} border-l ${CATEGORY_STYLES.trp.headerBorder} px-2 py-2.5 text-center text-[11px] font-bold tracking-wider ${CATEGORY_STYLES.trp.headerText}`}>
              TRP
            </th>
            <th colSpan={2} className={`${CATEGORY_STYLES.prime.headerBg} border-l ${CATEGORY_STYLES.prime.headerBorder} px-2 py-2.5 text-center text-[11px] font-bold tracking-wider ${CATEGORY_STYLES.prime.headerText}`}>
              Prime Time
            </th>
            <th className={`${CATEGORY_STYLES.spots.headerBg} border-l ${CATEGORY_STYLES.spots.headerBorder} px-2 py-2.5 text-center text-[11px] font-bold tracking-wider ${CATEGORY_STYLES.spots.headerText}`}>
              出稿
            </th>
            {hasWpt && (
              <th colSpan={4} className={`${CATEGORY_STYLES.wpt.headerBg} border-l ${CATEGORY_STYLES.wpt.headerBorder} rounded-tr-xl px-2 py-2.5 text-center text-[11px] font-bold tracking-wider ${CATEGORY_STYLES.wpt.headerText}`}>
                WPT チェック
              </th>
            )}
          </tr>
          <tr className="border-b border-white/[0.06] bg-[#2c2c2e]/60">
            <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-[#98989d]">エリア</th>
            <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-[#98989d]">局</th>
            <th className={`${CATEGORY_STYLES.prp.cellBorder} px-2 py-2 text-center text-xs font-semibold text-[#98989d]`}>発注</th>
            <th className="px-2 py-2 text-center text-xs font-semibold text-[#98989d]">本案予測</th>
            <th className="px-2 py-2 text-center text-xs font-semibold text-[#98989d]">サービス予測</th>
            <th className="px-2 py-2 text-center text-xs font-semibold text-[#98989d]">達成率</th>
            <th className={`${CATEGORY_STYLES.trp.cellBorder} px-2 py-2 text-center text-xs font-semibold text-[#98989d]`}>発注</th>
            <th className="px-2 py-2 text-center text-xs font-semibold text-[#98989d]">本案予測</th>
            <th className="px-2 py-2 text-center text-xs font-semibold text-[#98989d]">サービス予測</th>
            <th className="px-2 py-2 text-center text-xs font-semibold text-[#98989d]">達成率</th>
            <th className={`${CATEGORY_STYLES.prime.cellBorder} px-2 py-2 text-center text-xs font-semibold text-[#98989d]`}>PRP</th>
            <th className="px-2 py-2 text-center text-xs font-semibold text-[#98989d]">Share</th>
            <th className={`${CATEGORY_STYLES.spots.cellBorder} px-2 py-2 text-center text-xs font-semibold text-[#98989d]`}>本数</th>
            {hasWpt && (
              <>
                <th className={`${CATEGORY_STYLES.wpt.cellBorder} px-2 py-2 text-center text-xs font-semibold text-[#98989d]`}>WPT</th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-[#98989d]">WSB</th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-[#98989d]">TPT</th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-[#98989d]">割合</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {Array.from(regionGroups.entries()).map(([region, stations]) => {
            const subtotal = regionSubtotals.find((r) => r.region === region)
            return (
              <RegionBlock
                key={region}
                region={region}
                stations={stations}
                subtotal={subtotal}
                wptStationMap={wptStationMap}
                wptRegionMap={wptRegionMap}
                hasWpt={hasWpt}
              />
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/** エリアごとのアクセントカラー */
const REGION_ACCENT: Record<Region, { bg: string; border: string; text: string; subtotalBg: string }> = {
  kanto: { bg: '', border: 'border-l-[#0a84ff]', text: 'text-[#0a84ff]', subtotalBg: 'bg-[#0a84ff]/[0.06]' },
  kansai: { bg: '', border: 'border-l-[#ff9f0a]', text: 'text-[#ff9f0a]', subtotalBg: 'bg-[#ff9f0a]/[0.06]' },
  nagoya: { bg: '', border: 'border-l-[#bf5af2]', text: 'text-[#bf5af2]', subtotalBg: 'bg-[#bf5af2]/[0.06]' },
}

function RegionBlock({
  region,
  stations,
  subtotal,
  wptStationMap,
  wptRegionMap,
  hasWpt,
}: {
  region: Region
  stations: StationActual[]
  subtotal: RegionSubtotal | undefined
  wptStationMap: Map<string, WptStationData>
  wptRegionMap: Map<Region, WptRegionData>
  hasWpt: boolean
}) {
  const accent = REGION_ACCENT[region]

  return (
    <>
      {stations.map((sa, i) => {
        const wpt = wptStationMap.get(`${sa.region}|${sa.stationCode}`)
        const isLast = i === stations.length - 1
        return (
          <tr
            key={sa.stationCode}
            className={`border-l-4 ${accent.border} ${i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'} ${isLast ? '' : 'border-b border-white/[0.04]'} transition-colors hover:bg-white/[0.04]`}
          >
            {i === 0 && (
              <td className={`px-3 py-2 text-center font-bold ${accent.text}`} rowSpan={stations.length}>
                <div className="flex items-center justify-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full" style={{
                    backgroundColor: region === 'kanto' ? '#3B82F6' : region === 'kansai' ? '#F97316' : '#8B5CF6'
                  }} />
                  {REGION_LABELS[region]}
                </div>
              </td>
            )}
            <td className="px-3 py-2 text-center font-semibold text-[#f5f5f7]">{sa.stationCode}</td>
            {/* PRP */}
            <td className={`${CATEGORY_STYLES.prp.cellBorder} px-2 py-2 text-center text-[#636366]`}>
              {sa.targetPrp > 0 ? sa.targetPrp.toFixed(1) : <span className="text-[#48484a]">—</span>}
            </td>
            <td className="px-2 py-2 text-center font-bold text-[#f5f5f7]">{sa.actualPrp.toFixed(1)}</td>
            <td className="px-2 py-2 text-center text-teal-600">
              {sa.servicePrp > 0 ? sa.servicePrp.toFixed(1) : <span className="text-[#48484a]">—</span>}
            </td>
            <td className="px-2 py-2 text-center">
              <AchievementBadge rate={sa.prpAchievement} />
            </td>
            {/* TRP */}
            <td className={`${CATEGORY_STYLES.trp.cellBorder} px-2 py-2 text-center text-[#636366]`}>
              {sa.targetTrp > 0 ? sa.targetTrp.toFixed(1) : <span className="text-[#48484a]">—</span>}
            </td>
            <td className="px-2 py-2 text-center font-bold text-[#f5f5f7]">{sa.actualTg.toFixed(1)}</td>
            <td className="px-2 py-2 text-center text-teal-600">
              {sa.serviceTg > 0 ? sa.serviceTg.toFixed(1) : <span className="text-[#48484a]">—</span>}
            </td>
            <td className="px-2 py-2 text-center">
              <AchievementBadge rate={sa.tgAchievement} />
            </td>
            {/* Prime Time */}
            <td className={`${CATEGORY_STYLES.prime.cellBorder} px-2 py-2 text-center font-bold text-[#f5f5f7]`}>{sa.primePrp.toFixed(1)}</td>
            <td className="px-2 py-2 text-center">
              <PrimeShareBadge rate={sa.primeShare} />
            </td>
            {/* 出稿 */}
            <td className={`${CATEGORY_STYLES.spots.cellBorder} px-2 py-2 text-center text-[#98989d]`}>{sa.spotCount}</td>
            {/* WPT */}
            {hasWpt && (
              <>
                <td className={`${CATEGORY_STYLES.wpt.cellBorder} px-2 py-2 text-center text-[#98989d]`}>{wpt ? wpt.wptSpots : <span className="text-[#48484a]">—</span>}</td>
                <td className="px-2 py-2 text-center text-[#98989d]">{wpt ? (wpt.wsbSpots ?? 0) : <span className="text-[#48484a]">—</span>}</td>
                <td className="px-2 py-2 text-center text-[#98989d]">{wpt ? wpt.tptSpots : <span className="text-[#48484a]">—</span>}</td>
                <td className="px-2 py-2 text-center">
                  {wpt && wpt.wptTptRate > 0
                    ? <span className="inline-block rounded-full bg-[#bf5af2]/15 px-2 py-0.5 text-xs font-semibold text-[#bf5af2]">{wpt.wptTptRate.toFixed(1)}%</span>
                    : <span className="text-[#48484a]">—</span>}
                </td>
              </>
            )}
          </tr>
        )
      })}
      {/* エリア小計 */}
      {subtotal && (() => {
        const wptR = wptRegionMap.get(region)
        return (
          <tr className={`border-b-2 border-white/[0.08] ${accent.subtotalBg}`}>
            <td className="px-3 py-2.5 text-center font-bold text-[#d1d1d6]" colSpan={2}>
              <span className={`${accent.text}`}>{REGION_LABELS[region]}</span> 小計
            </td>
            {/* PRP */}
            <td className={`${CATEGORY_STYLES.prp.cellBorder} px-2 py-2.5 text-center font-bold text-[#d1d1d6]`}>{subtotal.targetPrp.toFixed(1)}</td>
            <td className="px-2 py-2.5 text-center font-bold text-[#f5f5f7]">{subtotal.actualPrp.toFixed(1)}</td>
            <td className="px-2 py-2.5 text-center font-bold text-teal-600">
              {subtotal.servicePrp > 0 ? subtotal.servicePrp.toFixed(1) : <span className="text-[#48484a]">—</span>}
            </td>
            <td className="px-2 py-2.5 text-center">
              <AchievementBadge rate={subtotal.prpAchievement} />
            </td>
            {/* TRP */}
            <td className={`${CATEGORY_STYLES.trp.cellBorder} px-2 py-2.5 text-center font-bold text-[#d1d1d6]`}>
              {subtotal.targetTrp > 0 ? subtotal.targetTrp.toFixed(1) : <span className="text-[#48484a]">—</span>}
            </td>
            <td className="px-2 py-2.5 text-center font-bold text-[#f5f5f7]">{subtotal.actualTg.toFixed(1)}</td>
            <td className="px-2 py-2.5 text-center font-bold text-teal-600">
              {subtotal.serviceTg > 0 ? subtotal.serviceTg.toFixed(1) : <span className="text-[#48484a]">—</span>}
            </td>
            <td className="px-2 py-2.5 text-center">
              <AchievementBadge rate={subtotal.tgAchievement} />
            </td>
            {/* Prime Time */}
            <td className={`${CATEGORY_STYLES.prime.cellBorder} px-2 py-2.5 text-center font-bold text-[#f5f5f7]`}>{subtotal.primePrp.toFixed(1)}</td>
            <td className="px-2 py-2.5 text-center">
              <PrimeShareBadge rate={subtotal.primeShare} />
            </td>
            {/* 出稿 */}
            <td className={`${CATEGORY_STYLES.spots.cellBorder} px-2 py-2.5 text-center font-bold text-[#d1d1d6]`}>{subtotal.spotCount}</td>
            {/* WPT */}
            {hasWpt && (
              <>
                <td className={`${CATEGORY_STYLES.wpt.cellBorder} px-2 py-2.5 text-center font-bold text-[#d1d1d6]`}>{wptR ? wptR.wptSpots : <span className="text-[#48484a]">—</span>}</td>
                <td className="px-2 py-2.5 text-center font-bold text-[#d1d1d6]">{wptR ? (wptR.wsbSpots ?? 0) : <span className="text-[#48484a]">—</span>}</td>
                <td className="px-2 py-2.5 text-center font-bold text-[#d1d1d6]">{wptR ? wptR.tptSpots : <span className="text-[#48484a]">—</span>}</td>
                <td className="px-2 py-2.5 text-center">
                  {wptR && wptR.wptTptRate > 0
                    ? <span className="inline-block rounded-full bg-[#bf5af2]/15 px-2 py-0.5 text-xs font-semibold text-[#bf5af2]">{wptR.wptTptRate.toFixed(1)}%</span>
                    : <span className="text-[#48484a]">—</span>}
                </td>
              </>
            )}
          </tr>
        )
      })()}
    </>
  )
}
