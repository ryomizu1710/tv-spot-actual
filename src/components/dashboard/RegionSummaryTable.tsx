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

const REGION_GRADIENT: Record<Region, string> = {
  kanto: 'from-[#007AFF] to-[#0055D4]',
  kansai: 'from-[#FF9500] to-[#CC7700]',
  nagoya: 'from-[#AF52DE] to-[#8B3FB2]',
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
      {sorted.map((rs) => (
        <div
          key={rs.region}
          className="rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-black/[0.04] backdrop-blur-xl"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-b ${REGION_GRADIENT[rs.region]} text-[10px] font-bold text-white`}>
                {REGION_LABELS[rs.region].charAt(0)}
              </span>
              <span className="text-[15px] font-semibold text-[#1d1d1f]">
                {REGION_LABELS[rs.region]}
              </span>
            </div>
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
      ))}
    </div>
  )
}
