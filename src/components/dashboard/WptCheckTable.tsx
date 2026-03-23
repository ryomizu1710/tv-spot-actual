import { useSpotStore } from '../../stores/spot-store'
import { useUiStore } from '../../stores/ui-store'
import { REGION_LABELS, getStationSortOrder } from '../../constants'
import type { Region } from '../../types'
import type { WptStationData, WptRegionData } from '../../lib/parsers/iclimax-parser'

export function WptCheckTable() {
  const campaignId = useUiStore((s) => s.selectedCampaignId)
  const getCampaignData = useSpotStore((s) => s.getCampaignData)
  const campaignData = campaignId ? getCampaignData(campaignId) : null
  const wptStationData = campaignData?.wptStationData ?? []
  const wptRegionData = campaignData?.wptRegionData ?? []
  const selectedRegion = useUiStore((s) => s.selectedRegion)

  if (wptStationData.length === 0) return null

  const isAllRegion = selectedRegion === 'all'
  const regions: Region[] = isAllRegion ? ['kanto', 'kansai', 'nagoya'] : [selectedRegion as Region]

  // フィルタ & ソート
  const filteredStations = wptStationData
    .filter((s) => regions.includes(s.region))
    .sort((a, b) => {
      const regionOrder: Record<Region, number> = { kanto: 0, kansai: 1, nagoya: 2 }
      const ro = regionOrder[a.region] - regionOrder[b.region]
      if (ro !== 0) return ro
      return getStationSortOrder(a.stationCode) - getStationSortOrder(b.stationCode)
    })

  const filteredRegions = wptRegionData.filter((r) => regions.includes(r.region))

  // 全体合計
  const grandTotal = {
    totalSpots: filteredRegions.reduce((s, r) => s + r.totalSpots, 0),
    wptSpots: filteredRegions.reduce((s, r) => s + r.wptSpots, 0),
    tptSpots: filteredRegions.reduce((s, r) => s + r.tptSpots, 0),
    wptFrames: filteredRegions.reduce((s, r) => s + r.wptFrames, 0),
    tptFrames: filteredRegions.reduce((s, r) => s + r.tptFrames, 0),
  }
  const grandWptTptRate = grandTotal.totalSpots > 0
    ? Math.round((grandTotal.wptSpots + grandTotal.tptSpots) / grandTotal.totalSpots * 1000) / 10
    : 0

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-bold text-gray-800">WPTチェック</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {isAllRegion && <th className="px-2 py-1.5 text-left font-semibold text-gray-600">エリア</th>}
              <th className="px-2 py-1.5 text-left font-semibold text-gray-600">局</th>
              <th className="px-2 py-1.5 text-right font-semibold text-gray-600">全本数</th>
              <th className="px-2 py-1.5 text-right font-semibold text-gray-600">WPT枠数</th>
              <th className="px-2 py-1.5 text-right font-semibold text-gray-600">WPT本数</th>
              <th className="px-2 py-1.5 text-right font-semibold text-gray-600">TPT枠数</th>
              <th className="px-2 py-1.5 text-right font-semibold text-gray-600">TPT本数</th>
              <th className="px-2 py-1.5 text-right font-semibold text-gray-600">WPT+TPT割合</th>
            </tr>
          </thead>
          <tbody>
            {regions.map((region) => {
              const regionStations = filteredStations.filter((s) => s.region === region)
              const regionSub = filteredRegions.find((r) => r.region === region)

              return (
                <RegionBlock
                  key={region}
                  region={region}
                  stations={regionStations}
                  subtotal={regionSub}
                  showRegion={isAllRegion}
                />
              )
            })}
            {/* 全体合計 */}
            <tr className="border-t-2 border-gray-400 bg-gray-100 font-bold">
              {isAllRegion && <td className="px-2 py-1.5" />}
              <td className="px-2 py-1.5 text-left">合計</td>
              <td className="px-2 py-1.5 text-right">{grandTotal.totalSpots}</td>
              <td className="px-2 py-1.5 text-right">{grandTotal.wptFrames}</td>
              <td className="px-2 py-1.5 text-right">{grandTotal.wptSpots}</td>
              <td className="px-2 py-1.5 text-right">{grandTotal.tptFrames}</td>
              <td className="px-2 py-1.5 text-right">{grandTotal.tptSpots}</td>
              <td className="px-2 py-1.5 text-right">{fmtRate(grandWptTptRate)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RegionBlock({ region, stations, subtotal, showRegion }: {
  region: Region
  stations: WptStationData[]
  subtotal: WptRegionData | undefined
  showRegion: boolean
}) {
  return (
    <>
      {stations.map((st, i) => (
        <tr key={`${st.region}-${st.stationCode}`} className="border-b border-gray-100 hover:bg-gray-50">
          {showRegion && (
            i === 0
              ? <td className="px-2 py-1.5 font-medium text-gray-700" rowSpan={stations.length + 1}>{REGION_LABELS[region]}</td>
              : null
          )}
          <td className="px-2 py-1.5 text-left">{st.stationCode}</td>
          <td className="px-2 py-1.5 text-right">{st.totalSpots}</td>
          <td className="px-2 py-1.5 text-right">{st.wptFrames}</td>
          <td className="px-2 py-1.5 text-right">{st.wptSpots}</td>
          <td className="px-2 py-1.5 text-right">{st.tptFrames}</td>
          <td className="px-2 py-1.5 text-right">{st.tptSpots}</td>
          <td className="px-2 py-1.5 text-right">{fmtRate(st.wptTptRate)}</td>
        </tr>
      ))}
      {/* エリア小計 */}
      {subtotal && (
        <tr className="border-b border-gray-300 bg-gray-50 font-semibold">
          <td className="px-2 py-1.5 text-left">{REGION_LABELS[region]}小計</td>
          <td className="px-2 py-1.5 text-right">{subtotal.totalSpots}</td>
          <td className="px-2 py-1.5 text-right">{subtotal.wptFrames}</td>
          <td className="px-2 py-1.5 text-right">{subtotal.wptSpots}</td>
          <td className="px-2 py-1.5 text-right">{subtotal.tptFrames}</td>
          <td className="px-2 py-1.5 text-right">{subtotal.tptSpots}</td>
          <td className="px-2 py-1.5 text-right">{fmtRate(subtotal.wptTptRate)}</td>
        </tr>
      )}
    </>
  )
}

function fmtRate(rate: number): string {
  return rate > 0 ? `${rate.toFixed(1)}%` : '—'
}
