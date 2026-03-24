import { useState } from 'react'
import { Download } from 'lucide-react'
import { useSpotStore } from '../../stores/spot-store'
import { useUiStore } from '../../stores/ui-store'
import { useCampaignStore } from '../../stores/campaign-store'
import { useCampaignMetrics } from '../../hooks/use-campaign-metrics'
import { exportDailyActualsToCSV } from '../../lib/exporters/csv-exporter'
import { REGION_LABELS } from '../../constants'

export function SpotListPage() {
  const spots = useSpotStore((s) => s.spots)
  const campaignId = useUiStore((s) => s.selectedCampaignId)
  const selectedRegion = useUiStore((s) => s.selectedRegion)
  const campaign = useCampaignStore((s) => s.campaigns.find((c) => c.id === campaignId))
  const metrics = useCampaignMetrics()
  const [stationFilter, setStationFilter] = useState('')
  const [page, setPage] = useState(0)
  const pageSize = 50

  if (!campaignId) {
    return (
      <div className="flex h-full items-center justify-center text-[#86868b]">
        キャンペーンを選択してください
      </div>
    )
  }

  const filtered = spots
    .filter((s) => s.campaignId === campaignId)
    .filter((s) => selectedRegion === 'all' || s.region === selectedRegion)
    .filter((s) => !stationFilter || s.stationName.includes(stationFilter) || s.stationCode.includes(stationFilter))
    .sort((a, b) => a.broadcastDate.localeCompare(b.broadcastDate) || a.broadcastTime.localeCompare(b.broadcastTime))

  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize)
  const totalPages = Math.ceil(filtered.length / pageSize)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-[21px] font-semibold tracking-tight text-[#1d1d1f]">スポット一覧</h1>
        <div className="flex items-center gap-3">
          <input
            value={stationFilter}
            onChange={(e) => { setStationFilter(e.target.value); setPage(0) }}
            placeholder="局名で検索..."
            className="rounded-lg border border-black/[0.08] bg-white px-3 py-1.5 text-sm text-[#1d1d1f] focus:border-[#007AFF] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20"
          />
          {metrics && (
            <button
              onClick={() => exportDailyActualsToCSV(metrics.dailyActuals, campaign?.name ?? 'export')}
              className="flex items-center gap-1 rounded-full bg-black/[0.04] px-3.5 py-1.5 text-sm text-[#1d1d1f] transition-all hover:bg-black/[0.08]"
            >
              <Download size={14} /> CSV出力
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white/80 shadow-sm ring-1 ring-black/[0.04] backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-black/[0.06] bg-[#f5f5f7]/60">
                <th className="px-3 py-2 text-left font-medium text-[#86868b]">日付</th>
                <th className="px-3 py-2 text-left font-medium text-[#86868b]">時刻</th>
                <th className="px-3 py-2 text-left font-medium text-[#86868b]">地域</th>
                <th className="px-3 py-2 text-left font-medium text-[#86868b]">局</th>
                <th className="px-3 py-2 text-left font-medium text-[#86868b]">番組</th>
                <th className="px-3 py-2 text-left font-medium text-[#86868b]">素材</th>
                <th className="px-3 py-2 text-right font-medium text-[#86868b]">尺</th>
                <th className="px-3 py-2 text-right font-medium text-[#86868b]">世帯</th>
                <th className="px-3 py-2 text-right font-medium text-[#86868b]">個人</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((s) => (
                <tr key={s.id} className="border-b border-black/[0.04] transition-colors hover:bg-black/[0.02]">
                  <td className="px-3 py-1.5 text-[#1d1d1f]">{s.broadcastDate}</td>
                  <td className="px-3 py-1.5 text-[#1d1d1f]">{s.broadcastTime}</td>
                  <td className="px-3 py-1.5 text-[#1d1d1f]">{REGION_LABELS[s.region]}</td>
                  <td className="px-3 py-1.5 text-[#1d1d1f]">{s.stationName}</td>
                  <td className="px-3 py-1.5 max-w-32 truncate text-[#1d1d1f]">{s.programName}</td>
                  <td className="px-3 py-1.5 max-w-32 truncate text-[#1d1d1f]">{s.creativeName}</td>
                  <td className="px-3 py-1.5 text-right text-[#1d1d1f]">{s.creativeLength}秒</td>
                  <td className="px-3 py-1.5 text-right text-[#1d1d1f]">{s.householdRating.toFixed(1)}</td>
                  <td className="px-3 py-1.5 text-right text-[#1d1d1f]">{s.individualRating.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-black/[0.06] px-4 py-2">
            <span className="text-xs text-[#86868b]">{filtered.length}件中 {page * pageSize + 1}-{Math.min((page + 1) * pageSize, filtered.length)}件</span>
            <div className="flex gap-1">
              <button disabled={page === 0} onClick={() => setPage(page - 1)}
                className="rounded px-2 py-1 text-xs text-[#1d1d1f] hover:bg-black/[0.04] disabled:opacity-30">前へ</button>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}
                className="rounded px-2 py-1 text-xs text-[#1d1d1f] hover:bg-black/[0.04] disabled:opacity-30">次へ</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
