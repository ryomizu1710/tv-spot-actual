export function formatGrp(value: number): string {
  return value.toFixed(1)
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export function formatNumber(value: number): string {
  return value.toLocaleString('ja-JP')
}

export function formatAchievementRate(actual: number, target: number): number {
  if (target <= 0) return 0
  return Math.round((actual / target) * 1000) / 10
}
