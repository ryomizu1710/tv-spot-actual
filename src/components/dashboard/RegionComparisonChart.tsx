import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { RegionComparison } from '../../hooks/use-region-comparison'

interface Props {
  data: RegionComparison[]
}

export function RegionComparisonChart({ data }: Props) {
  if (data.length === 0) return <p className="text-sm text-gray-400">データがありません</p>

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip contentStyle={{ fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="householdGrp" name="世帯GRP" fill="#3B82F6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="individualGrp" name="個人GRP" fill="#F97316" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
