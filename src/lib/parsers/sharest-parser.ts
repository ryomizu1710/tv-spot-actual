import * as XLSX from 'xlsx'
import { v4 as uuidv4 } from 'uuid'
import type { SpotRecord, Region } from '../../types'

/**
 * Sharest Excel形式のパーサー
 *
 * ファイル構造:
 *  Col0: 連番
 *  Col5: 放送局 (NTV, TBS, CX, EX, TX, YTV, MBS, KTV, ABC, TVO, CTV, CBC, THK, NBN, TVA)
 *  Col6: 放送日 (2026/03/20)
 *  Col7: 曜日
 *  Col8: 開始時間
 *  Col9: 終了時間
 *  Col12: 秒数
 *  Col16: 世帯
 *  Col17: ALL (= PRP)
 *  Col18: S列 (= Actual TRP / TG)
 */
export interface SharestParseResult {
  region: Region
  spots: SpotRecord[]
  rowCount: number
  errorCount: number
  errors: string[]
}

/** シート名から地域を判定 */
function detectRegionFromSheet(sheetName: string): Region | null {
  if (sheetName.includes('関東')) return 'kanto'
  if (sheetName.includes('関西')) return 'kansai'
  if (sheetName.includes('名古屋') || sheetName.includes('中京') || sheetName.includes('中部')) return 'nagoya'
  return null
}

/** ファイル名から地域を判定 */
function detectRegionFromFilename(filename: string): Region | null {
  if (filename.includes('関東')) return 'kanto'
  if (filename.includes('関西')) return 'kansai'
  if (filename.includes('名古屋') || filename.includes('中京') || filename.includes('中部')) return 'nagoya'
  return null
}

export function parseSharestFile(
  file: File,
  campaignId: string,
  batchId: string,
): Promise<SharestParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array', codepage: 932 })
        const sheetName = wb.SheetNames[0]
        const sheet = wb.Sheets[sheetName]

        // 地域判定: シート名 → ファイル名
        let region = detectRegionFromSheet(sheetName)
        if (!region) region = detectRegionFromFilename(file.name)
        if (!region) {
          reject(new Error(`地域が判定できません: シート名=${sheetName}, ファイル名=${file.name}`))
          return
        }

        // 行データを取得（ヘッダー含む）
        const rawRows = XLSX.utils.sheet_to_json<string[]>(sheet, {
          header: 1,
          defval: '',
          raw: false,
        })

        const spots: SpotRecord[] = []
        const errors: string[] = []

        // Row 0 はヘッダー、Row 1以降がデータ
        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i]
          if (!row || row.length === 0) continue

          const stationCode = String(row[5] ?? '').trim()
          const dateRaw = String(row[6] ?? '').trim()
          const startTime = String(row[8] ?? '').trim()
          const secondsRaw = row[12]
          const householdRaw = row[16]
          const allRaw = row[17]
          const tgRaw = row[18]

          // 空行スキップ
          if (!stationCode && !dateRaw) continue

          // 放送局チェック
          if (!stationCode) {
            errors.push(`行${i + 1}: 放送局が空です`)
            continue
          }

          // 局コード正規化（CXT→CX等）
          const normalizedStationCode = normalizeStationCode(stationCode)

          // 日付パース
          const broadcastDate = parseSharestDate(dateRaw)
          if (!broadcastDate) {
            errors.push(`行${i + 1}: 日付の形式が不正 (${dateRaw})`)
            continue
          }

          // 時刻パース
          const broadcastTime = parseSharestTime(startTime)
          if (!broadcastTime) {
            errors.push(`行${i + 1}: 時刻の形式が不正 (${startTime})`)
            continue
          }

          const seconds = parseFloat(String(secondsRaw)) || 15
          const householdRating = parseFloat(String(householdRaw)) || 0
          const prpRating = parseFloat(String(allRaw)) || 0
          const tgRating = parseFloat(String(tgRaw)) || 0

          spots.push({
            id: uuidv4(),
            campaignId,
            region,
            stationCode: normalizedStationCode,
            stationName: normalizedStationCode,
            broadcastDate,
            broadcastTime,
            programName: String(row[10] ?? '').trim(),
            creativeName: String(row[15] ?? '').trim(),
            creativeLength: ([15, 30, 60, 90, 120].includes(seconds) ? seconds : 15) as 15 | 30 | 60 | 90 | 120,
            householdRating,
            individualRating: prpRating,
            isTimeCm: false,
            importBatchId: batchId,
            prpRating,
            tgRating,
          })
        }

        resolve({
          region,
          spots,
          rowCount: rawRows.length - 1,
          errorCount: errors.length,
          errors,
        })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}

function parseSharestDate(raw: string): string | null {
  if (!raw) return null
  // YYYY/MM/DD
  const match = raw.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/)
  if (match) {
    return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
  }
  // Excel serial number (e.g., 46113)
  const num = parseFloat(raw)
  if (!isNaN(num) && num > 40000) {
    const date = new Date((num - 25569) * 86400 * 1000)
    const y = date.getUTCFullYear()
    const m = String(date.getUTCMonth() + 1).padStart(2, '0')
    const d = String(date.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  return null
}

/** 局コード正規化 (CXT→CX等の統合) */
function normalizeStationCode(code: string): string {
  const map: Record<string, string> = {
    CXT: 'CX',
  }
  return map[code] ?? code
}

function parseSharestTime(raw: string): string | null {
  if (!raw) return null
  // HH:MM
  let match = raw.match(/^(\d{1,2}):(\d{2})/)
  if (match) return `${match[1].padStart(2, '0')}:${match[2]}`
  // Excel decimal time (e.g., 0.8125 = 19:30)
  const num = parseFloat(raw)
  if (!isNaN(num) && num >= 0 && num < 2) {
    const totalMinutes = Math.round(num * 24 * 60)
    const h = Math.floor(totalMinutes / 60)
    const m = totalMinutes % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }
  return null
}
