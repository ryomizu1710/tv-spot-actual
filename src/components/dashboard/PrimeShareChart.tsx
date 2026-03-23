import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { RegionComparison } from '../../hooks/use-region-comparison'

interface Props {
  data: RegionComparison[]
}

export function PrimeShareChart({ data }: Props) {
  if (data.length === 0) return <p className="text-sm text-gray-400">データがありません</p>

  const chartData = data.map((d) => ({
    label: d.label,
    primeGrp: Math.round(d.householdGrp * d.primeShare / 100 * 10) / 10,
    nonPrimeGrp: Math.round(d.householdGrp * (100 - d.primeShare) / 100 * 10) / 10,
    primeShare: d.primeShare,
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{ fontSize: 12 }}
          formatter={(value: unknown, name: unknown) => {
            const v = Number(value)
            return String(name ?? '') === 'プライム帯割合' ? `${v}%` : v.toFixed(1)
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="primeGrp" name="プライム帯GRP" stackId="a" fill="#00A8E1" radius={[0, 0, 0, 0]} />
        <Bar dataKey="nonPrimeGrp" name="ノンプライムGRP" stackId="a" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
