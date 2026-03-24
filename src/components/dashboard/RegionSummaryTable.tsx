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
  kanto: 'from-[#0a84ff] to-[#0064d2]',
  kansai: 'from-[#ff9f0a] to-[#e08600]',
  nagoya: 'from-[#bf5af2] to-[#9340c0]',
}

function RateValue({ rate, threshold }: { rate: number; threshold: number }) {
  if (rate === 0) return <span className="text-[28px] font-bold text-[#48484a]">—</span>
  const isGood = rate >= threshold
  return (
    <span className={`text-[28px] font-bold tracking-tight ${isGood ? 'text-[#30d158]' : 'text-[#ff453a]'}`}>
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
          className="rounded-2xl bg-[#1c1c1e]/80 p-5 shadow-sm ring-1 ring-white/[0.06] backdrop-blur-xl"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-b ${REGION_GRADIENT[rs.region]} text-[10px] font-bold text-white`}>
                {REGION_LABELS[rs.region].charAt(0)}
              </span>
              <span className="text-[15px] font-semibold text-[#f5f5f7]">
                {REGION_LABELS[rs.region]}
              </span>
            </div>
            <span className="text-[12px] text-[#636366]">{rs.spotCount.toLocaleString()}本</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#98989d]">PRP %</span>
              <RateValue rate={rs.prpAchievement} threshold={100} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#98989d]">TRP %</span>
              <RateValue rate={rs.tgAchievement} threshold={100} />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#98989d]">Prime Time Share</span>
                <RateValue rate={rs.primeShare} threshold={60} />
              </div>
              <div className="mt-0.5 text-right">
                <span className="text-[11px] text-[#636366]">P4P：{P4P_VALUES[rs.region]}%</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
