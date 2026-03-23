import { v4 as uuidv4 } from 'uuid'
import type { ColumnMapping, ImportError, SpotRecord, Region, CreativeLength } from '../../types'
import { resolveStationCode, CREATIVE_LENGTHS } from '../../constants'

interface ValidationResult {
  valid: SpotRecord[]
  errors: ImportError[]
}

export function validateAndTransform(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
  campaignId: string,
  region: Region,
  batchId: string,
): ValidationResult {
  const valid: SpotRecord[] = []
  const errors: ImportError[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowErrors: ImportError[] = []

    const stationNameRaw = row[mapping.stationName]?.trim() ?? ''
    const stationCode = resolveStationCode(stationNameRaw)
    if (!stationCode && !stationNameRaw) {
      rowErrors.push({ rowIndex: i, columnName: '放送局', value: stationNameRaw, message: '放送局が未入力です' })
    }

    const dateStr = parseDate(row[mapping.broadcastDate]?.trim() ?? '')
    if (!dateStr) {
      rowErrors.push({ rowIndex: i, columnName: '放送日', value: row[mapping.broadcastDate] ?? '', message: '日付の形式が不正です' })
    }

    const timeStr = parseTime(row[mapping.broadcastTime]?.trim() ?? '')
    if (!timeStr) {
      rowErrors.push({ rowIndex: i, columnName: '放送時刻', value: row[mapping.broadcastTime] ?? '', message: '時刻の形式が不正です' })
    }

    const lengthRaw = parseInt(row[mapping.creativeLength]?.trim() ?? '', 10)
    const creativeLength = CREATIVE_LENGTHS.includes(lengthRaw as CreativeLength)
      ? (lengthRaw as CreativeLength)
      : undefined
    if (!creativeLength) {
      rowErrors.push({ rowIndex: i, columnName: '秒数', value: row[mapping.creativeLength] ?? '', message: 'CM秒数が不正です (15/30/60/90/120)' })
    }

    const hhRating = parseFloat(row[mapping.householdRating]?.trim() ?? '')
    if (isNaN(hhRating)) {
      rowErrors.push({ rowIndex: i, columnName: '世帯視聴率', value: row[mapping.householdRating] ?? '', message: '世帯視聴率が数値ではありません' })
    }

    const indRating = mapping.individualRating
      ? parseFloat(row[mapping.individualRating]?.trim() ?? '0') || 0
      : 0

    if (rowErrors.length > 0) {
      errors.push(...rowErrors)
      continue
    }

    valid.push({
      id: uuidv4(),
      campaignId,
      region,
      stationCode: stationCode ?? stationNameRaw,
      stationName: stationNameRaw,
      broadcastDate: dateStr!,
      broadcastTime: timeStr!,
      programName: mapping.programName ? row[mapping.programName]?.trim() ?? '' : '',
      creativeName: mapping.creativeName ? row[mapping.creativeName]?.trim() ?? '' : '',
      creativeLength: creativeLength!,
      householdRating: hhRating,
      individualRating: indRating,
      isTimeCm: false,
      importBatchId: batchId,
      prpRating: indRating,
      tgRating: 0,
    })
  }

  return { valid, errors }
}

function parseDate(raw: string): string | null {
  if (!raw) return null
  // Try YYYY/MM/DD or YYYY-MM-DD
  let match = raw.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/)
  if (match) {
    return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
  }
  // Try MM/DD (infer current year)
  match = raw.match(/^(\d{1,2})[/-](\d{1,2})$/)
  if (match) {
    const year = new Date().getFullYear()
    return `${year}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`
  }
  // Try 令和X年M月D日
  match = raw.match(/令和(\d+)年(\d+)月(\d+)日/)
  if (match) {
    const year = 2018 + parseInt(match[1], 10)
    return `${year}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
  }
  return null
}

function parseTime(raw: string): string | null {
  if (!raw) return null
  // HH:MM or HH：MM
  let match = raw.match(/^(\d{1,2})[:：](\d{2})/)
  if (match) return `${match[1].padStart(2, '0')}:${match[2]}`
  // HHMM
  match = raw.match(/^(\d{2})(\d{2})$/)
  if (match) return `${match[1]}:${match[2]}`
  // H時M分
  match = raw.match(/(\d{1,2})時(\d{2})分/)
  if (match) return `${match[1].padStart(2, '0')}:${match[2]}`
  return null
}
