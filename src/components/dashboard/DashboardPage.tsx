import { Download } from 'lucide-react'
import { useUiStore } from '../../stores/ui-store'
import { useStationActuals } from '../../hooks/use-station-actuals'
import { exportStationActualsToExcel, exportDailyPrpToExcel } from '../../lib/exporters/dashboard-exporter'
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

  if (!campaignId) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-gray-400">
        <p className="text-lg">キャンペーンを選択してください</p>
        <p className="mt-1 text-sm">ヘッダーのドロップダウンからキャンペーンを選択するか、新規作成してください</p>
      </div>
    )
  }

  if (!actualsData || (actualsData.stationActuals.length === 0 && actualsData.dailyPrpProgress.length === 0)) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-gray-400">
        <p className="text-lg">データがありません</p>
        <p className="mt-1 text-sm">データ取込ページからSharestファイルとSPOTプランをインポートしてください</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* サマリー: 全体の場合はエリア別テーブル、個別エリアの場合はカード */}
      {isAllRegion ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">エリア別サマリー</h3>
          <RegionSummaryTable
            regionSubtotals={actualsData.regionSubtotals}
          />
        </div>
      ) : (
        <PrpSummaryCards data={actualsData} />
      )}

      {/* 局別アクチュアル */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">
            局別アクチュアル（PRP・TG別）
          </h3>
          <button
            onClick={() => exportStationActualsToExcel(actualsData.stationActuals, actualsData.regionSubtotals)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
          >
            <Download size={13} /> Excel出力
          </button>
        </div>
        <StationActualTable
          stationActuals={actualsData.stationActuals}
          regionSubtotals={actualsData.regionSubtotals}
        />
      </div>

      {/* 日別PRP推移 */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">
            日別PRP推移（%）
          </h3>
          <button
            onClick={() => exportDailyPrpToExcel(
              actualsData.regionDailyPrpProgress,
              actualsData.stationDailyPrpProgress,
              actualsData.regionStationDailyPrpProgress,
              isAllRegion,
            )}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
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
        <div className="mt-4 border-t border-gray-200 pt-4">
          <DailyPrpTable
            regionDailyProgress={actualsData.regionDailyPrpProgress}
            stationDailyProgress={actualsData.stationDailyPrpProgress}
            regionStationDailyProgress={actualsData.regionStationDailyPrpProgress}
            isAllRegion={isAllRegion}
          />
        </div>
      </div>
    </div>
  )
}
