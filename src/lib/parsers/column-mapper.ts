import type { ColumnMapping } from '../../types'

type FieldName = keyof ColumnMapping

const COLUMN_PATTERNS: Record<FieldName, string[]> = {
  stationName: ['放送局', '局名', 'テレビ局', '局', '放送局名', 'station'],
  broadcastDate: ['放送日', '日付', 'CM放送日', '年月日', 'date'],
  broadcastTime: ['放送時刻', '時刻', 'CM放送時刻', '開始時刻', 'time'],
  programName: ['番組名', '番組', '放送番組名', 'program'],
  creativeName: ['CM素材名', '素材名', 'CM名', '銘柄名', '商品名', 'creative'],
  creativeLength: ['秒数', 'CM秒数', '尺', 'CM尺', 'length', 'duration'],
  householdRating: ['世帯視聴率', '世帯', 'HH視聴率', 'GRP', '世帯%', '世帯GRP'],
  individualRating: ['個人視聴率', '個人全体', 'P+C7', '個人%', '個人GRP', 'ALL', '個人'],
}

export function autoMapColumns(headers: string[]): Partial<ColumnMapping> {
  const mapping: Partial<ColumnMapping> = {}
  const normalizedHeaders = headers.map((h) => h.trim())

  for (const [field, patterns] of Object.entries(COLUMN_PATTERNS) as [FieldName, string[]][]) {
    for (const pattern of patterns) {
      const idx = normalizedHeaders.findIndex(
        (h) => h === pattern || h.includes(pattern),
      )
      if (idx !== -1 && !isAlreadyMapped(mapping, normalizedHeaders[idx])) {
        mapping[field] = normalizedHeaders[idx]
        break
      }
    }
  }

  return mapping
}

function isAlreadyMapped(mapping: Partial<ColumnMapping>, header: string): boolean {
  return Object.values(mapping).includes(header)
}

export function isColumnMappingComplete(mapping: Partial<ColumnMapping>): mapping is ColumnMapping {
  const required: FieldName[] = ['stationName', 'broadcastDate', 'broadcastTime', 'creativeLength', 'householdRating']
  return required.every((field) => mapping[field] !== undefined)
}
