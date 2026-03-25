import type { RegionSubtotal } from '../../hooks/use-station-actuals'
import { REGION_LABELS } from '../../constants'
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

/** エリアごとの色設定 */
const REGION_STYLE: Record<Region, { bar: string; bg: string; text: string }> = {
  kanto:  { bar: 'bg-[#007AFF]', bg: 'bg-[#007AFF]/[0.07]', text: 'text-[#007AFF]' },
  kansai: { bar: 'bg-[#FF9500]', bg: 'bg-[#FF9500]/[0.07]', text: 'text-[#FF9500]' },
  nagoya: { bar: 'bg-[#AF52DE]', bg: 'bg-[#AF52DE]/[0.07]', text: 'text-[#AF52DE]' },
}

function RateValue({ rate, threshold }: { rate: number; threshold: number }) {
  if (rate === 0) return <span className="text-[28px] font-bold text-[#d2d2d7]">—</span>
  const isGood = rate >= threshold
  return (
    <span className={`text-[28px] font-bold tracking-tight ${isGood ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
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
      {sorted.map((rs) => {
        const style = REGION_STYLE[rs.region]
        return (
          <div
            key={rs.region}
            className="overflow-hidden rounded-2xl bg-white/80 shadow-sm ring-1 ring-black/[0.04] backdrop-blur-xl"
          >
            {/* エリアカラーのアクセントバー */}
            <div className={`h-1 ${style.bar}`} />
            <div className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className={`inline-block rounded-md px-2.5 py-1 text-[14px] font-bold ${style.bg} ${style.text}`}>
                  {REGION_LABELS[rs.region]}
                </span>
                <span className="text-[12px] text-[#86868b]">{rs.spotCount.toLocaleString()}本</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-[#86868b]">PRP %</span>
                  <RateValue rate={rs.prpAchievement} threshold={100} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-[#86868b]">TRP %</span>
                  <RateValue rate={rs.tgAchievement} threshold={100} />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#86868b]">Prime Time Share</span>
                    <RateValue rate={rs.primeShare} threshold={60} />
                  </div>
                  <div className="mt-0.5 text-right">
                    <span className="text-[11px] text-[#86868b]">P4P：{P4P_VALUES[rs.region]}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
