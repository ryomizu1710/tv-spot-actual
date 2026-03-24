import * as XLSX from 'xlsx'
import type { Region } from '../../types'
import { isPrimeTime } from '../../constants'

/** iClimaxの TRP 参照列オプション（後方互換用） */
export type IclimaxTrpColumn = 'U' | 'V' | 'W' | 'X'

/** 動的に読み取った列ヘッダー情報 */
export interface IclimaxColumnHeader {
  /** 列の文字（U, V, W, ... AD） */
  columnLetter: string
  /** 0-basedの列インデックス */
  columnIndex: number
  /** Excelの1行目に書かれたヘッダー文字列 */
  label: string
}

/** 後方互換用の固定TRP列選択肢 */
export const ICLIMAX_TRP_COLUMNS: { value: IclimaxTrpColumn; label: string }[] = [
  { value: 'U', label: 'U列 — 女 35才以上' },
  { value: 'V', label: 'V列 — 男 35才以上' },
  { value: 'W', label: 'W列 — 女 20～34才' },
  { value: 'X', label: 'X列 — ３５＋' },
]

/** 列インデックス(0-based) → 列文字 (A, B, ..., Z, AA, AB, ...) */
function colIndexToLetter(idx: number): string {
  let s = ''
  let n = idx
  while (n >= 0) {
    s = String.fromCharCode((n % 26) + 65) + s
    n = Math.floor(n / 26) - 1
  }
  return s
}

/** iClimaxファイルのU列〜AD列（index 20〜29）のヘッダーを読み取る
 *  1行目（row 0）を最優先で探し、見つからなければ最初の5行をスキャンする */
export async function readIclimaxColumnHeaders(file: File): Promise<IclimaxColumnHeader[]> {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  if (!ws) return []

  // 最初の5行（row 0〜4）をスキャンしてヘッダー行を探す
  for (let r = 0; r < 5; r++) {
    const headers: IclimaxColumnHeader[] = []
    for (let c = 20; c <= 29; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })]
      if (!cell) continue
      const val = cell.v
      // 数値のみのセルはヘッダーではなくデータ行 → スキップ
      if (typeof val === 'number') continue
      const label = String(val).trim()
      if (!label) continue
      headers.push({
        columnLetter: colIndexToLetter(c),
        columnIndex: c,
        label,
      })
    }
    // 2列以上テキストヘッダーが見つかればヘッダー行と判定
    if (headers.length >= 2) {
      return headers
    }
  }
  return []
}

/** 局別のiClimax集計結果 */
export interface IclimaxStationData {
  region: Region
  stationCode: string
  /** 発注TRP (選択列の合計) */
  targetTrp: number
  /** T列の全時間帯PRP合計 (Prime Time Shareの分母) */
  totalPrp: number
  /** Prime PRP (G列=プライム時間帯のT列合計) */
  primePrp: number
  /** スポット本数 */
  spotCount: number
}

/** エリア別のiClimax集計結果 */
export interface IclimaxRegionData {
  region: Region
  targetTrp: number
  /** T列の全時間帯PRP合計 */
  totalPrp: number
  primePrp: number
}

/** WPTチェック: 局別データ */
export interface WptStationData {
  region: Region
  stationCode: string
  /** 全スポット数 */
  totalSpots: number
  /** WPT本数 (2本同枠・終了時間あり) */
  wptSpots: number
  /** WSB本数 (2本同枠・終了時間なし) */
  wsbSpots: number
  /** TPT本数 (3本以上同枠) */
  tptSpots: number
  /** WPT枠数 */
  wptFrames: number
  /** WSB枠数 */
  wsbFrames: number
  /** TPT枠数 */
  tptFrames: number
  /** WPT+WSB+TPT割合 % */
  wptTptRate: number
}

/** WPTチェック: エリア別データ */
export interface WptRegionData {
  region: Region
  totalSpots: number
  wptSpots: number
  wsbSpots: number
  tptSpots: number
  wptFrames: number
  wsbFrames: number
  tptFrames: number
  wptTptRate: number
}

/** iClimax 日別PRP（局別・エリア別の日別T列PRP） */
export interface IclimaxDailyPrp {
  region: Region
  stationCode: string
  /** YYYY-MM-DD */
  date: string
  /** T列 PRP値 */
  prp: number
}

/** iClimax 個別スポット行（改案枠出力用） */
export interface IclimaxSpotRow {
  region: Region
  stationCode: string
  date: string        // YYYY-MM-DD
  dayOfWeek: string   // 曜日
  startTime: string   // e.g. "21:00"
  endTime: string     // e.g. "21:54" or ""
  seconds: number     // 秒数
  prp: number         // T列 見積ALL
  trp: number         // 選択TRP列
}

export interface IclimaxParseResult {
  stationData: IclimaxStationData[]
  regionData: IclimaxRegionData[]
  wptStationData: WptStationData[]
  wptRegionData: WptRegionData[]
  /** 日別PRP（局別） */
  dailyPrpData: IclimaxDailyPrp[]
  /** 個別スポット行（改案枠出力用） */
  spotRows: IclimaxSpotRow[]
  totalRows: number
  errorCount: number
  errors: string[]
}

/** 地区文字列 → Region */
function parseRegion(val: string): Region | null {
  const s = val.trim()
  if (s.includes('関東')) return 'kanto'
  if (s.includes('関西') || s.includes('近畿')) return 'kansai'
  if (s.includes('名古屋') || s.includes('中京') || s.includes('中部')) return 'nagoya'
  return null
}

/** 局コード正規化 */
function normalizeStationCode(code: string): string {
  const trimmed = code.trim()
  const map: Record<string, string> = {
    CXT: 'CX',
    // 関西局の表記揺れ
    ABCテレビ: 'ABC', 'ABC TV': 'ABC',
    読売テレビ: 'YTV', 読売TV: 'YTV',
    毎日放送: 'MBS',
    関西テレビ: 'KTV', 関西TV: 'KTV',
    テレビ大阪: 'TVO',
    // 名古屋局の表記揺れ
    中京テレビ: 'CTV', 中京TV: 'CTV',
    CBCテレビ: 'CBC', 'CBC TV': 'CBC',
    東海テレビ: 'THK',
    名古屋テレビ: 'NBN', メーテレ: 'NBN', 'メ〜テレ': 'NBN',
    テレビ愛知: 'TVA',
    // 関東局の表記揺れ
    日本テレビ: 'NTV', 日テレ: 'NTV',
    TBSテレビ: 'TBS', 'TBS TV': 'TBS',
    フジテレビ: 'CX',
    テレビ朝日: 'EX',
    テレビ東京: 'TX',
  }
  return map[trimmed] ?? trimmed
}

/** Excel日付セルを YYYY-MM-DD 文字列に変換 */
function parseDateValue(cell: XLSX.CellObject | undefined): string | null {
  if (!cell) return null
  // Excelのシリアル日付 (数値)
  if (typeof cell.v === 'number') {
    const d = XLSX.SSF.parse_date_code(cell.v)
    if (d) {
      const yyyy = String(d.y).padStart(4, '0')
      const mm = String(d.m).padStart(2, '0')
      const dd = String(d.d).padStart(2, '0')
      return `${yyyy}-${mm}-${dd}`
    }
  }
  // 文字列の場合
  const s = String(cell.v).trim()
  // YYYY/MM/DD or YYYY-MM-DD
  const m = s.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/)
  if (m) {
    return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
  }
  // MM/DD/YYYY
  const m2 = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/)
  if (m2) {
    return `${m2[3]}-${m2[1].padStart(2, '0')}-${m2[2].padStart(2, '0')}`
  }
  return null
}

/** TRP列のインデックス (0-based) */
function trpColumnIndex(col: IclimaxTrpColumn): number {
  const map: Record<IclimaxTrpColumn, number> = { U: 20, V: 21, W: 22, X: 23 }
  return map[col]
}

export async function parseIclimaxFile(
  file: File,
  trpColumn: IclimaxTrpColumn,
  /** 動的列インデックスを指定した場合、trpColumnより優先 */
  trpColumnIndexOverride?: number,
): Promise<IclimaxParseResult> {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  if (!ws) throw new Error('シートが見つかりません')

  const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1')
  const errors: string[] = []
  let errorCount = 0

  // 日別PRP収集用
  const dailyPrpList: IclimaxDailyPrp[] = []
  // 個別スポット行（改案枠出力用）
  const spotRows: IclimaxSpotRow[] = []

  // 局別集計マップ: key = "region|stationCode"
  const stationMap = new Map<string, { trpSum: number; totalPrpSum: number; primePrpSum: number; count: number; region: Region; stationCode: string }>()

  // WPTチェック用: 枠マップ key = "region|stationCode|D~I列結合"
  // value: { count, hasEndTime } — H列(index 7)が空欄かどうかを記録
  const frameMap = new Map<string, { count: number; hasEndTime: boolean }>()
  // 局別スポット数 (WPT用)
  const stationSpotCount = new Map<string, { region: Region; stationCode: string; count: number }>()

  const trpColIdx = trpColumnIndexOverride ?? trpColumnIndex(trpColumn)
  const totalRows = range.e.r // exclude header

  for (let r = 1; r <= range.e.r; r++) {
    // C列: 地区
    const cCell = ws[XLSX.utils.encode_cell({ r, c: 2 })]
    if (!cCell) continue
    const region = parseRegion(String(cCell.v))
    if (!region) {
      errors.push(`Row ${r + 1}: 地区「${cCell.v}」を判別できません`)
      errorCount++
      continue
    }

    // D列: 放送局
    const dCell = ws[XLSX.utils.encode_cell({ r, c: 3 })]
    if (!dCell) continue
    const stationCode = normalizeStationCode(String(dCell.v))

    // D〜I列 (index 3〜8) の値を結合して枠キーを生成
    const frameParts: string[] = []
    for (let c = 3; c <= 8; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })]
      frameParts.push(cell ? String(cell.v).trim() : '')
    }
    const frameKey = `${region}|${stationCode}|${frameParts.join('|')}`
    // H列(index 7) = 終了時間: 空欄かどうかを判定
    const hCell = ws[XLSX.utils.encode_cell({ r, c: 7 })]
    const endTimeValue = hCell ? String(hCell.v).trim() : ''
    const existing2 = frameMap.get(frameKey) ?? { count: 0, hasEndTime: endTimeValue !== '' }
    existing2.count += 1
    if (endTimeValue !== '') existing2.hasEndTime = true
    frameMap.set(frameKey, existing2)

    // 局別スポット数
    const stKey = `${region}|${stationCode}`
    const stEntry = stationSpotCount.get(stKey) ?? { region, stationCode, count: 0 }
    stEntry.count += 1
    stationSpotCount.set(stKey, stEntry)

    // E列 (index 4): 放送日
    const eCell = ws[XLSX.utils.encode_cell({ r, c: 4 })]
    const dateStr = parseDateValue(eCell)

    // G列: 開始時間
    const gCell = ws[XLSX.utils.encode_cell({ r, c: 6 })]
    const timeStr = gCell ? String(gCell.v) : ''

    // T列 (index 19): 見積 ALL (PRP)
    const tCell = ws[XLSX.utils.encode_cell({ r, c: 19 })]
    const prpValue = tCell ? Number(tCell.v) : 0

    // 選択TRP列
    const trpCell = ws[XLSX.utils.encode_cell({ r, c: trpColIdx })]
    const trpValue = trpCell ? Number(trpCell.v) : 0

    if (isNaN(prpValue) || isNaN(trpValue)) {
      errorCount++
      continue
    }

    // 個別スポット行を収集（改案枠出力用）
    const fCell = ws[XLSX.utils.encode_cell({ r, c: 5 })]
    const dayOfWeek = fCell ? String(fCell.v).trim() : ''
    const iCell = ws[XLSX.utils.encode_cell({ r, c: 8 })]
    const seconds = iCell ? Number(iCell.v) : 0
    spotRows.push({
      region,
      stationCode,
      date: dateStr ?? '',
      dayOfWeek,
      startTime: timeStr,
      endTime: endTimeValue,
      seconds: isNaN(seconds) ? 0 : seconds,
      prp: prpValue,
      trp: trpValue,
    })

    // 日別PRP収集 (T列)
    if (dateStr) {
      dailyPrpList.push({ region, stationCode, date: dateStr, prp: prpValue })
    }

    const key = `${region}|${stationCode}`
    const existing = stationMap.get(key) ?? { trpSum: 0, totalPrpSum: 0, primePrpSum: 0, count: 0, region, stationCode }

    existing.trpSum += trpValue
    existing.totalPrpSum += prpValue
    existing.count += 1

    // プライムタイム判定 (G列: 19:00〜24:00)
    if (timeStr && isPrimeTime(timeStr)) {
      existing.primePrpSum += prpValue
    }

    stationMap.set(key, existing)
  }

  // 局別データ
  const stationData: IclimaxStationData[] = Array.from(stationMap.values()).map((v) => ({
    region: v.region,
    stationCode: v.stationCode,
    targetTrp: Math.round(v.trpSum * 100) / 100,
    totalPrp: Math.round(v.totalPrpSum * 100) / 100,
    primePrp: Math.round(v.primePrpSum * 100) / 100,
    spotCount: v.count,
  }))

  // エリア別集計
  const regionMap = new Map<Region, { trp: number; totalPrp: number; primePrp: number }>()
  for (const sd of stationData) {
    const existing = regionMap.get(sd.region) ?? { trp: 0, totalPrp: 0, primePrp: 0 }
    existing.trp += sd.targetTrp
    existing.totalPrp += sd.totalPrp
    existing.primePrp += sd.primePrp
    regionMap.set(sd.region, existing)
  }

  const regionData: IclimaxRegionData[] = Array.from(regionMap.entries()).map(([region, v]) => ({
    region,
    targetTrp: Math.round(v.trp * 100) / 100,
    totalPrp: Math.round(v.totalPrp * 100) / 100,
    primePrp: Math.round(v.primePrp * 100) / 100,
  }))

  // --- WPTチェック集計 ---
  // 枠を局別にWPT/WSB/TPT集計
  const wptStationMap = new Map<string, { wptFrames: number; wsbFrames: number; tptFrames: number; wptSpots: number; wsbSpots: number; tptSpots: number }>()
  for (const [frameKey, frameInfo] of frameMap) {
    // frameKey: "region|stationCode|D|E|F|G|H|I"
    const parts = frameKey.split('|')
    const stKey = `${parts[0]}|${parts[1]}`
    const entry = wptStationMap.get(stKey) ?? { wptFrames: 0, wsbFrames: 0, tptFrames: 0, wptSpots: 0, wsbSpots: 0, tptSpots: 0 }
    if (frameInfo.count === 2) {
      if (frameInfo.hasEndTime) {
        // WPT: 2本同枠で終了時間あり
        entry.wptFrames += 1
        entry.wptSpots += 2
      } else {
        // WSB: 2本同枠で終了時間が空欄
        entry.wsbFrames += 1
        entry.wsbSpots += 2
      }
    } else if (frameInfo.count >= 3) {
      entry.tptFrames += 1
      entry.tptSpots += frameInfo.count
    }
    wptStationMap.set(stKey, entry)
  }

  const wptStationData: WptStationData[] = Array.from(stationSpotCount.entries()).map(([stKey, info]) => {
    const wpt = wptStationMap.get(stKey) ?? { wptFrames: 0, wsbFrames: 0, tptFrames: 0, wptSpots: 0, wsbSpots: 0, tptSpots: 0 }
    const total = info.count
    return {
      region: info.region,
      stationCode: info.stationCode,
      totalSpots: total,
      wptSpots: wpt.wptSpots,
      wsbSpots: wpt.wsbSpots,
      tptSpots: wpt.tptSpots,
      wptFrames: wpt.wptFrames,
      wsbFrames: wpt.wsbFrames,
      tptFrames: wpt.tptFrames,
      wptTptRate: total > 0 ? Math.round((wpt.wptSpots + wpt.wsbSpots + wpt.tptSpots) / total * 1000) / 10 : 0,
    }
  })

  // エリア別WPT集計
  const wptRegionMap = new Map<Region, { totalSpots: number; wptSpots: number; wsbSpots: number; tptSpots: number; wptFrames: number; wsbFrames: number; tptFrames: number }>()
  for (const ws2 of wptStationData) {
    const entry = wptRegionMap.get(ws2.region) ?? { totalSpots: 0, wptSpots: 0, wsbSpots: 0, tptSpots: 0, wptFrames: 0, wsbFrames: 0, tptFrames: 0 }
    entry.totalSpots += ws2.totalSpots
    entry.wptSpots += ws2.wptSpots
    entry.wsbSpots += ws2.wsbSpots
    entry.tptSpots += ws2.tptSpots
    entry.wptFrames += ws2.wptFrames
    entry.wsbFrames += ws2.wsbFrames
    entry.tptFrames += ws2.tptFrames
    wptRegionMap.set(ws2.region, entry)
  }

  const wptRegionData: WptRegionData[] = Array.from(wptRegionMap.entries()).map(([region, v]) => ({
    region,
    totalSpots: v.totalSpots,
    wptSpots: v.wptSpots,
    wsbSpots: v.wsbSpots,
    tptSpots: v.tptSpots,
    wptFrames: v.wptFrames,
    wsbFrames: v.wsbFrames,
    tptFrames: v.tptFrames,
    wptTptRate: v.totalSpots > 0 ? Math.round((v.wptSpots + v.wsbSpots + v.tptSpots) / v.totalSpots * 1000) / 10 : 0,
  }))

  return { stationData, regionData, wptStationData, wptRegionData, dailyPrpData: dailyPrpList, spotRows, totalRows, errorCount, errors }
}
