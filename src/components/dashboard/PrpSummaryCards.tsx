import type { StationActualsData } from '../../hooks/use-station-actuals'

interface Props {
  data: StationActualsData
}

export function PrpSummaryCards({ data }: Props) {
  const cards = [
    {
      label: '実績PRP',
      value: data.totalActualPrp.toFixed(1),
      sub: data.totalTargetPrp > 0 ? `目標: ${data.totalTargetPrp.toFixed(1)}` : null,
      rate: data.totalTargetPrp > 0
        ? Math.round(data.totalActualPrp / data.totalTargetPrp * 1000) / 10
        : null,
      isHighlight: false,
    },
    {
      label: '実績TG',
      value: data.totalActualTg.toFixed(1),
      sub: data.totalActualPrp > 0
        ? `TG/PRP比: ${(data.totalActualTg / data.totalActualPrp * 100).toFixed(1)}%`
        : null,
      rate: null,
      isHighlight: false,
    },
    {
      label: 'Prime Time Share',
      value: data.totalPrimeShare > 0 ? `${data.totalPrimeShare.toFixed(1)}%` : '—',
      sub: data.totalPrimePrp > 0
        ? `Prime PRP: ${data.totalPrimePrp.toFixed(1)}`
        : null,
      rate: null,
      isHighlight: false,
      isPrime: true,
    },
    {
      label: '出稿本数',
      value: `${data.totalSpotCount.toLocaleString()}本`,
      sub: `${data.regionSubtotals.length}エリア`,
      rate: null,
      isHighlight: false,
    },
    {
      label: '累積達成率',
      value: data.totalTargetPrp > 0
        ? `${(data.totalActualPrp / data.totalTargetPrp * 100).toFixed(1)}%`
        : '—',
      sub: data.totalTargetPrp > 0
        ? `残: ${(data.totalTargetPrp - data.totalActualPrp).toFixed(1)} PRP`
        : null,
      rate: null,
      isHighlight: true,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-lg border p-4 shadow-sm ${
            card.isHighlight
              ? 'border-prime/30 bg-gradient-to-br from-prime/5 to-prime/10'
              : 'border-gray-200 bg-white'
          }`}
        >
          <p className="text-xs font-medium text-gray-500">
            {card.label}
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{card.value}</p>
          {card.sub && (
            <p className="mt-0.5 text-xs text-gray-400">{card.sub}</p>
          )}
          {card.rate !== null && (
            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
              card.rate >= 100 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              達成率 {card.rate}%
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
