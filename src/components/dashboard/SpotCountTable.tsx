import type { SpotSummary } from '../../lib/calculators/spot-counter'
import { CREATIVE_LENGTH_LABELS } from '../../constants'
import { formatNumber } from '../../lib/formatters/number'

interface Props {
  summary: SpotSummary
}

export function SpotCountTable({ summary }: Props) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200">
          <th className="py-2 text-left font-medium text-gray-500">CM尺</th>
          <th className="py-2 text-right font-medium text-gray-500">本数</th>
          <th className="py-2 text-right font-medium text-gray-500">秒数</th>
        </tr>
      </thead>
      <tbody>
        {summary.byLength.map((b) => (
          <tr key={b.length} className="border-b border-gray-100">
            <td className="py-2 text-gray-700">{CREATIVE_LENGTH_LABELS[b.length]}</td>
            <td className="py-2 text-right text-gray-700">{formatNumber(b.count)}本</td>
            <td className="py-2 text-right text-gray-700">{formatNumber(b.seconds)}秒</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="border-t-2 border-gray-300 font-semibold">
          <td className="py-2 text-gray-900">合計</td>
          <td className="py-2 text-right text-gray-900">{formatNumber(summary.totalCount)}本</td>
          <td className="py-2 text-right text-gray-900">{formatNumber(summary.totalSeconds)}秒</td>
        </tr>
      </tfoot>
    </table>
  )
}
