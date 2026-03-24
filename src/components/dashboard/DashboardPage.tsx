import { Download } from 'lucide-react'
import { useUiStore } from '../../stores/ui-store'
import { useSpotStore } from '../../stores/spot-store'
import { useStationActuals } from '../../hooks/use-station-actuals'
import { exportStationActualsToExcel, exportDailyPrpToExcel, exportKaianToExcel } from '../../lib/exporters/dashboard-exporter'
import { PrpSummaryCards } from './PrpSummaryCards'
import { RegionSummaryTable } from './RegionSummaryTable'
import { StationActualTable } from './StationActualTable'
import { DailyPrpTrendChart } from './DailyPrpTrendChart'
import { DailyPrpTable } from './DailyPrpTable'

export function DashboardPage() {
  const campaignId = useUiStore((s) => s.selectedCampaignId)
  const selectedRegion = useUiStore((s) => s.selectedRegion)
  const actualsData = useStationActuals()
  const isAllRegion = selectedRegion === 'all'
  const campaignDataMap = useSpotStore((s) => s.campaignDataMap)
  const spots = useSpotStore((s) => s.spots)
  const campaignData = campaignId ? campaignDataMap[campaignId] : null
  const iclimaxSpots = campaignData?.iclimaxSpots ?? []
  const sharestSpots = campaignId ? spots.filter((s) => s.campaignId === campaignId) : []

  if (!campaignId) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <p className="text-[21px] font-semibold text-[#1d1d1f]">キャンペーンを選択</p>
        <p className="mt-2 text-[15px] text-[#86868b]">ヘッダーのドロップダウンからキャンペーンを選択するか、新規作成してください</p>
      </div>
    )
  }

  if (!actualsData || (actualsData.stationActuals.length === 0 && actualsData.dailyPrpProgress.length === 0)) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <p className="text-[21px] font-semibold text-[#1d1d1f]">データがありません</p>
        <p className="mt-2 text-[15px] text-[#86868b]">データ取込ページからSharestファイルとSPOTプランをインポートしてください</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      {/* サマリー */}
      {isAllRegion ? (
        <section>
          <h3 className="mb-3 text-[13px] font-semibold text-[#86868b] uppercase tracking-wider">エリア別サマリー</h3>
          <RegionSummaryTable regionSubtotals={actualsData.regionSubtotals} />
        </section>
      ) : (
        <PrpSummaryCards data={actualsData} />
      )}

      {/* 局別アクチュアル */}
      <section className="rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-black/[0.04] backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-[#1d1d1f]">
            局別アクチュアル（PRP・TG別）
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (iclimaxSpots.length === 0) {
                  alert('iClimaxのスポット行データがありません。\n「データ取込」からiClimaxファイルを再度読み込んでください。')
                  return
                }
                if (sharestSpots.length === 0) {
                  alert('Sharestデータがありません。\n「データ取込」からSharestファイルを読み込んでください。')
                  return
                }
                exportKaianToExcel(iclimaxSpots, sharestSpots)
              }}
              className="flex items-center gap-1.5 rounded-full bg-[#AF52DE]/10 px-3.5 py-1.5 text-[12px] font-medium text-[#AF52DE] transition-all hover:bg-[#AF52DE]/20"
            >
              <Download size={13} /> 改案枠出力
            </button>
            <button
              onClick={() => exportStationActualsToExcel(actualsData.stationActuals, actualsData.regionSubtotals)}
              className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3.5 py-1.5 text-[12px] font-medium text-[#1d1d1f] transition-all hover:bg-gray-200/80"
            >
              <Download size={13} /> Excel出力
            </button>
          </div>
        </div>
        <StationActualTable
          stationActuals={actualsData.stationActuals}
          regionSubtotals={actualsData.regionSubtotals}
        />
      </section>

      {/* 日別PRP推移 */}
      <section className="rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-black/[0.04] backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-[#1d1d1f]">
            日別PRP推移（%）
          </h3>
          <button
            onClick={() => exportDailyPrpToExcel(
              actualsData.regionDailyPrpProgress,
              actualsData.stationDailyPrpProgress,
              actualsData.regionStationDailyPrpProgress,
              isAllRegion,
            )}
            className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3.5 py-1.5 text-[12px] font-medium text-[#1d1d1f] transition-all hover:bg-gray-200/80"
          >
            <Download size={13} /> Excel出力
          </button>
        </div>
        <DailyPrpTrendChart
          dailyProgress={actualsData.dailyPrpProgress}
          regionDailyProgress={actualsData.regionDailyPrpProgress}
          totalTargetPrp={actualsData.totalTargetPrp}
          isAllRegion={isAllRegion}
        />
        <div className="mt-5 border-t border-gray-100 pt-5">
          <DailyPrpTable
            regionDailyProgress={actualsData.regionDailyPrpProgress}
            stationDailyProgress={actualsData.stationDailyPrpProgress}
            regionStationDailyProgress={actualsData.regionStationDailyPrpProgress}
            isAllRegion={isAllRegion}
          />
        </div>
      </section>
    </div>
  )
}
