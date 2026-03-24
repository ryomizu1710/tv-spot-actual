import type { RegionSubtotal } from '../../hooks/use-station-actuals'
import { REGION_LABELS, REGION_COLORS } from '../../constants'
import type { Region } from '../../types'

interface Props {
  regionSubtotals: RegionSubtotal[]
}

const REGION_ORDER: Region[] = ['kanto', 'kansai', 'nagoya']

const P4P_VALUES: Record<Region, number> = {
  kanto: 50.7,
  kansai: 57.1,
  nagoya: 47.4,
}

function RateValue({ rate, threshold }: { rate: number; threshold: number }) {
  if (rate === 0) return <span className="text-2xl font-bold text-gray-300">—</span>
  const isGood = rate >= threshold
  return (
    <span className={`text-2xl font-bold ${isGood ? 'text-green-600' : 'text-red-500'}`}>
      {rate.toFixed(1)}%
    </span>
  )
}

export function RegionSummaryTable({ regionSubtotals }: Props) {
  const sorted = REGION_ORDER
    .map((r) => regionSubtotals.find((rs) => rs.region === r))
    .filter((rs): rs is RegionSubtotal => rs !== undefined)

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {sorted.map((rs) => (
        <div
          key={rs.region}
          className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
          style={{ borderTopColor: REGION_COLORS[rs.region], borderTopWidth: 3 }}
        >
          {/* エリア名 */}
          <div className="mb-4 flex items-center justify-between">
            <span className="text-base font-bold text-gray-800">
              {REGION_LABELS[rs.region]}
            </span>
            <span className="text-xs text-gray-400">{rs.spotCount.toLocaleString()}本</span>
          </div>

          {/* 指標一覧 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">PRP %</span>
              <RateValue rate={rs.prpAchievement} threshold={100} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">TRP %</span>
              <RateValue rate={rs.tgAchievement} threshold={100} />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Prime Time Share</span>
                <RateValue rate={rs.primeShare} threshold={60} />
              </div>
              <div className="mt-0.5 text-right">
                <span className="text-xs text-gray-400">P4P：{P4P_VALUES[rs.region]}％</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
