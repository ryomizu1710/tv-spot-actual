import type { TimeBand } from '../types'

export const TIME_BANDS: TimeBand[] = [
  { code: 'early_morning', label: '早朝', startHour: 5, endHour: 8, isPrime: false },
  { code: 'morning', label: '朝', startHour: 8, endHour: 12, isPrime: false },
  { code: 'afternoon', label: '午後', startHour: 12, endHour: 18, isPrime: false },
  { code: 'evening', label: '夕方', startHour: 18, endHour: 19, isPrime: false },
  { code: 'prime', label: 'プライム', startHour: 19, endHour: 23, isPrime: true },
  { code: 'late_night', label: '深夜', startHour: 23, endHour: 25, isPrime: false },
]

export const PRIME_START_HOUR = 19
export const PRIME_END_HOUR = 24

export function isPrimeTime(timeStr: string): boolean {
  const hour = parseTimeToHour(timeStr)
  return hour >= PRIME_START_HOUR && hour < PRIME_END_HOUR
}

export function parseTimeToHour(timeStr: string): number {
  const cleaned = timeStr.replace(/[時分]/g, ':').replace(/：/g, ':')
  const parts = cleaned.split(':')
  return parseInt(parts[0], 10)
}

export function getTimeBand(timeStr: string): TimeBand | undefined {
  const hour = parseTimeToHour(timeStr)
  // Handle past-midnight (25時 = 1AM next day)
  const adjustedHour = hour < 5 ? hour + 24 : hour
  return TIME_BANDS.find(
    (b) => adjustedHour >= b.startHour && adjustedHour < b.endHour,
  )
}
