import type { CampaignMetrics } from '../../hooks/use-campaign-metrics'
import { formatGrp, formatPercent, formatNumber } from '../../lib/formatters/number'

interface Props {
  metrics: CampaignMetrics
}

export function SummaryCards({ metrics }: Props) {
  const cards = [
    {
      label: '世帯GRP',
      value: formatGrp(metrics.totalHouseholdGrp),
      target: metrics.target ? formatGrp(metrics.target.householdGrpTarget) : null,
      rate: metrics.householdAchievementRate,
    },
    {
      label: '個人GRP',
      value: formatGrp(metrics.totalIndividualGrp),
      target: metrics.target ? formatGrp(metrics.target.individualGrpTarget) : null,
      rate: metrics.individualAchievementRate,
    },
    {
      label: 'プライム帯割合',
      value: formatPercent(metrics.householdPrimeShare),
      target: metrics.target ? formatPercent(metrics.target.primeShareTarget) : null,
      rate: null,
    },
    {
      label: '出稿本数',
      value: `${formatNumber(metrics.spotSummary.totalCount)}本`,
      target: metrics.target ? `${formatNumber(metrics.target.spotCountTarget)}本` : null,
      rate: metrics.target && metrics.target.spotCountTarget > 0
        ? Math.round((metrics.spotSummary.totalCount / metrics.target.spotCountTarget) * 1000) / 10
        : null,
    },
    {
      label: '出稿秒数',
      value: `${formatNumber(metrics.spotSummary.totalSeconds)}秒`,
      target: null,
      rate: null,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">{card.label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{card.value}</p>
          {card.target && (
            <p className="mt-0.5 text-xs text-gray-400">目標: {card.target}</p>
          )}
          {card.rate !== null && (
            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
              card.rate >= 90 ? 'bg-green-100 text-green-700' :
              card.rate >= 70 ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              達成率 {card.rate}%
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
