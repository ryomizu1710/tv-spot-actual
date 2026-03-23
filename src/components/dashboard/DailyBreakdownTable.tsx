import type { DailyActual } from '../../types'
import { REGION_LABELS } from '../../constants'
import { formatGrp, formatPercent } from '../../lib/formatters/number'

interface Props {
  dailyActuals: DailyActual[]
}

export function DailyBreakdownTable({ dailyActuals }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-3 py-2 text-left font-medium text-gray-500">日付</th>
            <th className="px-3 py-2 text-left font-medium text-gray-500">地域</th>
            <th className="px-3 py-2 text-right font-medium text-gray-500">世帯GRP</th>
            <th className="px-3 py-2 text-right font-medium text-gray-500">個人GRP</th>
            <th className="px-3 py-2 text-right font-medium text-gray-500">ﾌﾟﾗｲﾑ世帯</th>
            <th className="px-3 py-2 text-right font-medium text-gray-500">ﾌﾟﾗｲﾑ割合</th>
            <th className="px-3 py-2 text-right font-medium text-gray-500">本数</th>
            <th className="px-3 py-2 text-right font-medium text-gray-500">秒数</th>
          </tr>
        </thead>
        <tbody>
          {dailyActuals.map((d, i) => {
            const primeShare = d.householdGrp > 0
              ? Math.round((d.primeHouseholdGrp / d.householdGrp) * 1000) / 10
              : 0
            return (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-700">{d.date}</td>
                <td className="px-3 py-2 text-gray-700">{REGION_LABELS[d.region]}</td>
                <td className="px-3 py-2 text-right text-gray-700">{formatGrp(d.householdGrp)}</td>
                <td className="px-3 py-2 text-right text-gray-700">{formatGrp(d.individualGrp)}</td>
                <td className="px-3 py-2 text-right text-gray-700">{formatGrp(d.primeHouseholdGrp)}</td>
                <td className="px-3 py-2 text-right text-gray-700">{formatPercent(primeShare)}</td>
                <td className="px-3 py-2 text-right text-gray-700">{d.spotCount}</td>
                <td className="px-3 py-2 text-right text-gray-700">{d.totalSeconds}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
