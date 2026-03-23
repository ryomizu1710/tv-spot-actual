import { useState } from 'react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { RegionDailyPrpProgress, StationDailyPrpProgress } from '../../hooks/use-station-actuals'
import type { Region } from '../../types'
import { REGION_COLORS, REGION_LABELS } from '../../constants'

/** 局ごとの色 (系列順: NTV系→TBS系→CX系→EX系→TX系) */
const STATION_COLORS: Record<string, string> = {
  NTV: '#3B82F6', TBS: '#EF4444', CX: '#F97316', EX: '#10B981', TX: '#8B5CF6',
  YTV: '#3B82F6', MBS: '#EF4444', KTV: '#F97316', ABC: '#10B981', TVO: '#8B5CF6',
  CTV: '#3B82F6', CBC: '#EF4444', THK: '#F97316', NBN: '#10B981', TVA: '#8B5CF6',
}

/** 棒グラフ上部にラベルを表示するカスタムレンダラー */
function BarLabel({ x, y, width, value, suffix }: { x?: number; y?: number; width?: number; value?: number; suffix?: string; [key: string]: unknown }) {
  if (!value || value === 0) return null
  const label = suffix === '%' ? `${value.toFixed(1)}%` : value.toFixed(1)
  return (
    <text x={(x ?? 0) + (width ?? 0) / 2} y={(y ?? 0) - 4} textAnchor="middle" fontSize={8} fill="#374151">
      {label}
    </text>
  )
}

/** ツールチップフォーマッター（%表示） */
function pctFormatter(value: unknown) {
  const v = Number(value)
  return [`${v.toFixed(1)}%`]
}

interface Props {
  regionDailyProgress: RegionDailyPrpProgress[]
  stationDailyProgress: StationDailyPrpProgress[]
  regionStationDailyProgress: Record<Region, StationDailyPrpProgress[]>
  isAllRegion: boolean
}

export function DailyPrpTable({ regionDailyProgress, stationDailyProgress, regionStationDailyProgress, isAllRegion }: Props) {
  if (isAllRegion) {
    return <RegionDailyCharts data={regionDailyProgress} regionStationData={regionStationDailyProgress} />
  }
  return <StationDailyCharts data={stationDailyProgress} />
}

function StationDailyCharts({ data }: { data: StationDailyPrpProgress[] }) {
  if (data.length === 0) return null

  return (
    <div className="space-y-6">
      {data.map((station) => {
        if (station.dailyData.length === 0) return null
        const color = STATION_COLORS[station.stationCode] ?? '#6B7280'
        return (
          <div key={station.stationCode}>
            <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-700">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
              {station.stationCode} 日別PRP推移
            </h4>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={station.dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} label={{ value: '日別%', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} domain={[0, (max: number) => Math.max(max, 110)]} label={{ value: '累積達成率%', angle: 90, position: 'insideRight', fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} formatter={pctFormatter} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left" dataKey="dailyRate" name="日別%" fill={color} radius={[2, 2, 0, 0]} maxBarSize={20} label={(props) => <BarLabel {...(props as Record<string, unknown>)} value={(props as Record<string, unknown>).value as number} suffix="%" />} />
                <Line yAxisId="right" type="monotone" dataKey="cumulativeRate" name="累積達成率" stroke="#9CA3AF" strokeWidth={2} dot={{ r: 2, fill: '#9CA3AF' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )
      })}
    </div>
  )
}

function RegionDailyCharts({ data, regionStationData }: {
  data: RegionDailyPrpProgress[]
  regionStationData: Record<Region, StationDailyPrpProgress[]>
}) {
  const [modalRegion, setModalRegion] = useState<Region | null>(null)

  if (data.length === 0) return null

  const regions = [
    { key: 'kanto' as const, label: '関東', color: REGION_COLORS.kanto, rateKey: 'kantoRate' as const, cumRateKey: 'kantoCumRate' as const },
    { key: 'kansai' as const, label: '関西', color: REGION_COLORS.kansai, rateKey: 'kansaiRate' as const, cumRateKey: 'kansaiCumRate' as const },
    { key: 'nagoya' as const, label: '名古屋', color: REGION_COLORS.nagoya, rateKey: 'nagoyaRate' as const, cumRateKey: 'nagoyaCumRate' as const },
  ]

  return (
    <>
      <div className="space-y-6">
        {regions.map((region) => {
          const chartData = data
            .filter((d) => d[region.rateKey] > 0 || d[region.cumRateKey] > 0)
            .map((d) => ({
              dateLabel: d.dateLabel,
              dailyRate: d[region.rateKey],
              cumulativeRate: d[region.cumRateKey],
            }))

          if (chartData.length === 0) return null

          return (
            <div
              key={region.key}
              className="cursor-pointer rounded-md transition-colors hover:bg-gray-50"
              onDoubleClick={() => setModalRegion(region.key)}
              title="ダブルクリックで局別詳細を表示"
            >
              <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-700">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: region.color }} />
                {region.label} 日別PRP推移
                <span className="ml-auto text-[10px] font-normal text-gray-400">ダブルクリックで局別詳細</span>
              </h4>
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="dateLabel" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis yAxisId="left" tick={{ fontSize: 10 }} label={{ value: '日別%', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} domain={[0, (max: number) => Math.max(max, 110)]} label={{ value: '累積達成率%', angle: 90, position: 'insideRight', fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11 }} formatter={pctFormatter} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="left" dataKey="dailyRate" name="日別%" fill={region.color} radius={[2, 2, 0, 0]} maxBarSize={20} label={(props) => <BarLabel {...(props as Record<string, unknown>)} value={(props as Record<string, unknown>).value as number} suffix="%" />} />
                  <Line yAxisId="right" type="monotone" dataKey="cumulativeRate" name="累積達成率" stroke="#9CA3AF" strokeWidth={2} dot={{ r: 2, fill: '#9CA3AF' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )
        })}
      </div>

      {modalRegion && (
        <StationDailyModal
          region={modalRegion}
          data={regionStationData[modalRegion]}
          onClose={() => setModalRegion(null)}
        />
      )}
    </>
  )
}

function StationDailyModal({ region, data, onClose }: {
  region: Region
  data: StationDailyPrpProgress[]
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative max-h-[90vh] w-[90vw] max-w-4xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-800">
            {REGION_LABELS[region]} 局別日別PRP推移
          </h3>
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            ✕ 閉じる
          </button>
        </div>

        {data.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-gray-400">
            データがありません
          </div>
        ) : (
          <div className="space-y-6">
            {data.map((station) => {
              if (station.dailyData.length === 0) return null
              const color = STATION_COLORS[station.stationCode] ?? '#6B7280'
              return (
                <div key={station.stationCode}>
                  <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-700">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
                    {station.stationCode} 日別PRP%推移
                  </h4>
                  <ResponsiveContainer width="100%" height={180}>
                    <ComposedChart data={station.dailyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="dateLabel" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                      <YAxis yAxisId="left" tick={{ fontSize: 10 }} label={{ value: '日別%', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} domain={[0, (max: number) => Math.max(max, 110)]} label={{ value: '累積達成率%', angle: 90, position: 'insideRight', fontSize: 10 }} />
                      <Tooltip contentStyle={{ fontSize: 11 }} formatter={pctFormatter} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar yAxisId="left" dataKey="dailyRate" name="日別%" fill={color} radius={[2, 2, 0, 0]} maxBarSize={20} label={(props) => <BarLabel {...(props as Record<string, unknown>)} value={(props as Record<string, unknown>).value as number} suffix="%" />} />
                      <Line yAxisId="right" type="monotone" dataKey="cumulativeRate" name="累積達成率" stroke="#9CA3AF" strokeWidth={2} dot={{ r: 2, fill: '#9CA3AF' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
