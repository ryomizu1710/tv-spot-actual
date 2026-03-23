import type { Region } from '../types'

export const REGION_LABELS: Record<Region, string> = {
  kanto: '関東',
  kansai: '関西',
  nagoya: '名古屋',
}

export const REGIONS: Region[] = ['kanto', 'kansai', 'nagoya']

export const REGION_COLORS: Record<Region, string> = {
  kanto: '#3B82F6',
  kansai: '#F97316',
  nagoya: '#8B5CF6',
}
