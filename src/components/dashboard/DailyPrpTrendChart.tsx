import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { DailyPrpProgress, RegionDailyPrpProgress } from '../../hooks/use-station-actuals'
import { REGION_COLORS } from '../../constants'

interface Props {
  dailyProgress: DailyPrpProgress[]
  regionDailyProgress: RegionDailyPrpProgress[]
  totalTargetPrp: number
  isAllRegion: boolean
}

/** 日数に応じたX軸フォントサイズを計算 */
function xAxisFontSize(count: number): number {
  if (count <= 15) return 12
  if (count <= 21) return 10
  if (count <= 31) return 8
  return 7
}

/** 日数に応じたX軸ラベル角度 */
function xAxisAngle(count: number): number {
  if (count <= 15) return 0
  return -45
}

/** 日数に応じたX軸の下マージン */
function xAxisBottomMargin(count: number): number {
  if (count <= 15) return 5
  return 40
}

export function DailyPrpTrendChart({ dailyProgress, regionDailyProgress, totalTargetPrp, isAllRegion }: Props) {
  if (isAllRegion) {
    return <RegionDailyChart data={regionDailyProgress} />
  }
  return <SingleDailyChart dailyProgress={dailyProgress} totalTargetPrp={totalTargetPrp} />
}

function SingleDailyChart({ dailyProgress, totalTargetPrp }: { dailyProgress: DailyPrpProgress[]; totalTargetPrp: number }) {
  if (dailyProgress.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-gray-400">
        データがありません
      </div>
    )
  }

  const data = dailyProgress.map((d) => ({
    ...d,
    dailyPrpRate: totalTargetPrp > 0 ? Math.round(d.dailyPrp / totalTargetPrp * 1000) / 10 : 0,
  }))

  const count = data.length
  const fontSize = xAxisFontSize(count)
  const angle = xAxisAngle(count)
  const bottomMargin = xAxisBottomMargin(count)

  return (
    <ResponsiveContainer width="100%" height={320 + (bottomMargin > 5 ? 30 : 0)}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: bottomMargin }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="dateLabel" tick={{ fontSize }} interval={0} angle={angle} textAnchor={angle < 0 ? 'end' : 'middle'} />
        <YAxis
          tick={{ fontSize: 12 }}
          label={{ value: '日別 %', angle: -90, position: 'insideLeft', fontSize: 12 }}
        />
        <Tooltip
          contentStyle={{ fontSize: 12 }}
          formatter={(value: unknown) => {
            const v = Number(value)
            return [`${v.toFixed(1)}%`]
          }}
          labelFormatter={(label) => `${label}`}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar
          dataKey="dailyPrpRate"
          name="日別PRP %"
          fill="#60A5FA"
          radius={[2, 2, 0, 0]}
          maxBarSize={24}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

function RegionDailyChart({ data }: { data: RegionDailyPrpProgress[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-gray-400">
        データがありません
      </div>
    )
  }

  const count = data.length
  const fontSize = xAxisFontSize(count)
  const angle = xAxisAngle(count)
  const bottomMargin = xAxisBottomMargin(count)

  return (
    <ResponsiveContainer width="100%" height={360 + (bottomMargin > 5 ? 30 : 0)}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: bottomMargin }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="dateLabel" tick={{ fontSize }} interval={0} angle={angle} textAnchor={angle < 0 ? 'end' : 'middle'} />
        <YAxis
          tick={{ fontSize: 12 }}
          label={{ value: '日別 %', angle: -90, position: 'insideLeft', fontSize: 12 }}
        />
        <Tooltip
          contentStyle={{ fontSize: 12 }}
          formatter={(value: unknown, name: unknown) => {
            const v = Number(value)
            const n = String(name ?? '')
            return [`${v.toFixed(1)}%`, n]
          }}
          labelFormatter={(label) => `${label}`}
        />
        <Legend
          content={() => (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: 12, marginTop: 4 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ display: 'inline-block', width: 10, height: 10, backgroundColor: REGION_COLORS.kanto }} />
                関東 %
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ display: 'inline-block', width: 10, height: 10, backgroundColor: REGION_COLORS.kansai }} />
                関西 %
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ display: 'inline-block', width: 10, height: 10, backgroundColor: REGION_COLORS.nagoya }} />
                名古屋 %
              </span>
            </div>
          )}
        />
        <Bar
          dataKey="kantoRate"
          name="関東 %"
          fill={REGION_COLORS.kanto}
          radius={[2, 2, 0, 0]}
          maxBarSize={16}
        />
        <Bar
          dataKey="kansaiRate"
          name="関西 %"
          fill={REGION_COLORS.kansai}
          radius={[2, 2, 0, 0]}
          maxBarSize={16}
        />
        <Bar
          dataKey="nagoyaRate"
          name="名古屋 %"
          fill={REGION_COLORS.nagoya}
          radius={[2, 2, 0, 0]}
          maxBarSize={16}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
