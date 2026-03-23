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
  if (rate === 0) return <span className="text-gray-300">—</span>
  const color = rate >= 100
    ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 ring-1 ring-green-200'
    : 'bg-gradient-to-r from-red-50 to-red-100 text-red-600 ring-1 ring-red-200'
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${color}`}>
      {rate.toFixed(1)}%
    </span>
  )
}

function PrimeShareBadge({ rate }: { rate: number }) {
  if (rate === 0) return <span className="text-gray-300">—</span>
  const color = rate >= 60
    ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 ring-1 ring-green-200'
    : 'bg-gradient-to-r from-red-50 to-red-100 text-red-600 ring-1 ring-red-200'
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${color}`}>
      {rate.toFixed(1)}%
    </span>
  )
}

/** カテゴリーヘッダーのスタイル定義 */
const CATEGORY_STYLES = {
  prp: {
    headerBg: 'bg-gradient-to-b from-blue-50 to-blue-100/60',
    headerText: 'text-blue-700',
    headerBorder: 'border-blue-200',
    cellBorder: 'border-l-2 border-blue-100',
    colBg: '',
  },
  trp: {
    headerBg: 'bg-gradient-to-b from-teal-50 to-teal-100/60',
    headerText: 'text-teal-700',
    headerBorder: 'border-teal-200',
    cellBorder: 'border-l-2 border-teal-100',
    colBg: '',
  },
  prime: {
    headerBg: 'bg-gradient-to-b from-amber-50 to-amber-100/60',
    headerText: 'text-amber-700',
    headerBorder: 'border-amber-200',
    cellBorder: 'border-l-2 border-amber-100',
    colBg: '',
  },
  spots: {
    headerBg: 'bg-gradient-to-b from-gray-50 to-gray-100/60',
    headerText: 'text-gray-600',
    headerBorder: 'border-gray-200',
    cellBorder: 'border-l-2 border-gray-200',
    colBg: '',
  },
  wpt: {
    headerBg: 'bg-gradient-to-b from-violet-50 to-violet-100/60',
    headerText: 'text-violet-700',
    headerBorder: 'border-violet-200',
    cellBorder: 'border-l-2 border-violet-100',
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
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table className="w-full text-xs">
        <thead>
          {/* カテゴリーグループヘッダー */}
          <tr>
            <th colSpan={2} className="rounded-tl-xl bg-gray-800 px-3 py-2.5 text-left text-[11px] font-bold tracking-wide text-white">
              局別アクチュアル
            </th>
            <th colSpan={3} className={`${CATEGORY_STYLES.prp.headerBg} border-l ${CATEGORY_STYLES.prp.headerBorder} px-2 py-2.5 text-center text-[11px] font-bold tracking-wider ${CATEGORY_STYLES.prp.headerText}`}>
              PRP
            </th>
            <th colSpan={3} className={`${CATEGORY_STYLES.trp.headerBg} border-l ${CATEGORY_STYLES.trp.headerBorder} px-2 py-2.5 text-center text-[11px] font-bold tracking-wider ${CATEGORY_STYLES.trp.headerText}`}>
              TRP
            </th>
            <th colSpan={2} className={`${CATEGORY_STYLES.prime.headerBg} border-l ${CATEGORY_STYLES.prime.headerBorder} px-2 py-2.5 text-center text-[11px] font-bold tracking-wider ${CATEGORY_STYLES.prime.headerText}`}>
              Prime Time
            </th>
            <th className={`${CATEGORY_STYLES.spots.headerBg} border-l ${CATEGORY_STYLES.spots.headerBorder} px-2 py-2.5 text-center text-[11px] font-bold tracking-wider ${CATEGORY_STYLES.spots.headerText}`}>
              出稿
            </th>
            {hasWpt && (
              <th colSpan={3} className={`${CATEGORY_STYLES.wpt.headerBg} border-l ${CATEGORY_STYLES.wpt.headerBorder} rounded-tr-xl px-2 py-2.5 text-center text-[11px] font-bold tracking-wider ${CATEGORY_STYLES.wpt.headerText}`}>
                WPT チェック
              </th>
            )}
          </tr>
          <tr className="border-b border-gray-200 bg-gray-50/80">
            <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">エリア</th>
            <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">局</th>
            <th className={`${CATEGORY_STYLES.prp.cellBorder} px-2 py-2 text-center text-xs font-semibold text-gray-500`}>発注</th>
            <th className="px-2 py-2 text-center text-xs font-semibold text-gray-500">実績</th>
            <th className="px-2 py-2 text-center text-xs font-semibold text-gray-500">達成率</th>
            <th className={`${CATEGORY_STYLES.trp.cellBorder} px-2 py-2 text-center text-xs font-semibold text-gray-500`}>発注</th>
            <th className="px-2 py-2 text-center text-xs font-semibold text-gray-500">実績</th>
            <th className="px-2 py-2 text-center text-xs font-semibold text-gray-500">達成率</th>
            <th className={`${CATEGORY_STYLES.prime.cellBorder} px-2 py-2 text-center text-xs font-semibold text-gray-500`}>PRP</th>
            <th className="px-2 py-2 text-center text-xs font-semibold text-gray-500">Share</th>
            <th className={`${CATEGORY_STYLES.spots.cellBorder} px-2 py-2 text-center text-xs font-semibold text-gray-500`}>本数</th>
            {hasWpt && (
              <>
                <th className={`${CATEGORY_STYLES.wpt.cellBorder} px-2 py-2 text-center text-xs font-semibold text-gray-500`}>WPT</th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-500">TPT</th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-500">割合</th>
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
  kanto: { bg: 'bg-blue-50/30', border: 'border-l-blue-500', text: 'text-blue-700', subtotalBg: 'bg-blue-50/50' },
  kansai: { bg: 'bg-orange-50/30', border: 'border-l-orange-500', text: 'text-orange-700', subtotalBg: 'bg-orange-50/50' },
  nagoya: { bg: 'bg-purple-50/30', border: 'border-l-purple-500', text: 'text-purple-700', subtotalBg: 'bg-purple-50/50' },
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
            className={`border-l-4 ${accent.border} ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} ${isLast ? '' : 'border-b border-gray-100'} transition-colors hover:bg-blue-50/30`}
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
            <td className="px-3 py-2 text-center font-semibold text-gray-800">{sa.stationCode}</td>
            {/* PRP */}
            <td className={`${CATEGORY_STYLES.prp.cellBorder} px-2 py-2 text-center text-gray-500`}>
              {sa.targetPrp > 0 ? sa.targetPrp.toFixed(1) : <span className="text-gray-300">—</span>}
            </td>
            <td className="px-2 py-2 text-center font-bold text-gray-800">{sa.actualPrp.toFixed(1)}</td>
            <td className="px-2 py-2 text-center">
              <AchievementBadge rate={sa.prpAchievement} />
            </td>
            {/* TRP */}
            <td className={`${CATEGORY_STYLES.trp.cellBorder} px-2 py-2 text-center text-gray-500`}>
              {sa.targetTrp > 0 ? sa.targetTrp.toFixed(1) : <span className="text-gray-300">—</span>}
            </td>
            <td className="px-2 py-2 text-center font-bold text-gray-800">{sa.actualTg.toFixed(1)}</td>
            <td className="px-2 py-2 text-center">
              <AchievementBadge rate={sa.tgAchievement} />
            </td>
            {/* Prime Time */}
            <td className={`${CATEGORY_STYLES.prime.cellBorder} px-2 py-2 text-center font-bold text-gray-800`}>{sa.primePrp.toFixed(1)}</td>
            <td className="px-2 py-2 text-center">
              <PrimeShareBadge rate={sa.primeShare} />
            </td>
            {/* 出稿 */}
            <td className={`${CATEGORY_STYLES.spots.cellBorder} px-2 py-2 text-center text-gray-700`}>{sa.spotCount}</td>
            {/* WPT */}
            {hasWpt && (
              <>
                <td className={`${CATEGORY_STYLES.wpt.cellBorder} px-2 py-2 text-center text-gray-700`}>{wpt ? wpt.wptSpots : <span className="text-gray-300">—</span>}</td>
                <td className="px-2 py-2 text-center text-gray-700">{wpt ? wpt.tptSpots : <span className="text-gray-300">—</span>}</td>
                <td className="px-2 py-2 text-center">
                  {wpt && wpt.wptTptRate > 0
                    ? <span className="inline-block rounded-full bg-gradient-to-r from-violet-50 to-violet-100 px-2 py-0.5 text-xs font-bold text-violet-700 ring-1 ring-violet-200">{wpt.wptTptRate.toFixed(1)}%</span>
                    : <span className="text-gray-300">—</span>}
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
          <tr className={`border-b-2 border-gray-200 ${accent.subtotalBg}`}>
            <td className="px-3 py-2.5 text-center font-bold text-gray-700" colSpan={2}>
              <span className={`${accent.text}`}>{REGION_LABELS[region]}</span> 小計
            </td>
            {/* PRP */}
            <td className={`${CATEGORY_STYLES.prp.cellBorder} px-2 py-2.5 text-center font-bold text-gray-700`}>{subtotal.targetPrp.toFixed(1)}</td>
            <td className="px-2 py-2.5 text-center font-bold text-gray-900">{subtotal.actualPrp.toFixed(1)}</td>
            <td className="px-2 py-2.5 text-center">
              <AchievementBadge rate={subtotal.prpAchievement} />
            </td>
            {/* TRP */}
            <td className={`${CATEGORY_STYLES.trp.cellBorder} px-2 py-2.5 text-center font-bold text-gray-700`}>
              {subtotal.targetTrp > 0 ? subtotal.targetTrp.toFixed(1) : <span className="text-gray-300">—</span>}
            </td>
            <td className="px-2 py-2.5 text-center font-bold text-gray-900">{subtotal.actualTg.toFixed(1)}</td>
            <td className="px-2 py-2.5 text-center">
              <AchievementBadge rate={subtotal.tgAchievement} />
            </td>
            {/* Prime Time */}
            <td className={`${CATEGORY_STYLES.prime.cellBorder} px-2 py-2.5 text-center font-bold text-gray-900`}>{subtotal.primePrp.toFixed(1)}</td>
            <td className="px-2 py-2.5 text-center">
              <PrimeShareBadge rate={subtotal.primeShare} />
            </td>
            {/* 出稿 */}
            <td className={`${CATEGORY_STYLES.spots.cellBorder} px-2 py-2.5 text-center font-bold text-gray-700`}>{subtotal.spotCount}</td>
            {/* WPT */}
            {hasWpt && (
              <>
                <td className={`${CATEGORY_STYLES.wpt.cellBorder} px-2 py-2.5 text-center font-bold text-gray-700`}>{wptR ? wptR.wptSpots : <span className="text-gray-300">—</span>}</td>
                <td className="px-2 py-2.5 text-center font-bold text-gray-700">{wptR ? wptR.tptSpots : <span className="text-gray-300">—</span>}</td>
                <td className="px-2 py-2.5 text-center">
                  {wptR && wptR.wptTptRate > 0
                    ? <span className="inline-block rounded-full bg-gradient-to-r from-violet-50 to-violet-100 px-2 py-0.5 text-xs font-bold text-violet-700 ring-1 ring-violet-200">{wptR.wptTptRate.toFixed(1)}%</span>
                    : <span className="text-gray-300">—</span>}
                </td>
              </>
            )}
          </tr>
        )
      })()}
    </>
  )
}
