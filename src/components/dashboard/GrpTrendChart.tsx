import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { DailyActual } from '../../types'

const DAY_OF_WEEK = ['日', '月', '火', '水', '木', '金', '土']
function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}(${DAY_OF_WEEK[d.getDay()]})`
}

interface Props {
  dailyActuals: DailyActual[]
}

export function GrpTrendChart({ dailyActuals }: Props) {
  // Aggregate by date across regions
  const byDate = new Map<string, { date: string; householdGrp: number; individualGrp: number }>()
  for (const d of dailyActuals) {
    const existing = byDate.get(d.date)
    if (existing) {
      existing.householdGrp += d.householdGrp
      existing.individualGrp += d.individualGrp
    } else {
      byDate.set(d.date, { date: d.date, householdGrp: d.householdGrp, individualGrp: d.individualGrp })
    }
  }

  const data = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({
      ...d,
      dateLabel: formatDateLabel(d.date),
      householdGrp: Math.round(d.householdGrp * 10) / 10,
      individualGrp: Math.round(d.individualGrp * 10) / 10,
    }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{ fontSize: 12 }}
          formatter={(value: unknown) => Number(value).toFixed(1)}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="householdGrp"
          stroke="#3B82F6"
          strokeWidth={2}
          name="世帯GRP"
          dot={{ r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="individualGrp"
          stroke="#F97316"
          strokeWidth={2}
          strokeDasharray="5 5"
          name="個人GRP"
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
