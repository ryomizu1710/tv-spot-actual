import * as XLSX from 'xlsx'
import type { StationTarget, Region } from '../../types'

/**
 * SPOTプラン Excel パーサー
 *
 * H列 (Col7, 0-indexed) から局別の発注PRP目標値を読み取る
 * L列 (Col11, 0-indexed) から局別の発注TRP目標値を読み取る
 * エリア列とH列/L列を参照して、関東・関西・名古屋の局別目標を抽出
 */
export interface SpotPlanSheet {
  name: string
}

/** エリア別発注TRP（SPOTプランL列の特定行から取得） */
export interface RegionTargetTrp {
  region: Region
  targetTrp: number
}

export interface SpotPlanParseResult {
  targets: StationTarget[]
  /** エリア別発注TRP (M列 Row17=関東, Row23=関西, Row29=名古屋) */
  regionTargetTrps: RegionTargetTrp[]
  errors: string[]
}

/** ファイルからシート名一覧を取得 */
export function getSpotPlanSheets(file: File): Promise<SpotPlanSheet[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array', codepage: 932, bookSheets: true })
        resolve(wb.SheetNames.map((name) => ({ name })))
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}

/** 局コードの正規化マップ */
const STATION_CODE_MAP: Record<string, string> = {
  NTV: 'NTV', '日本テレビ': 'NTV', '日テレ': 'NTV',
  TBS: 'TBS', '東京放送': 'TBS', 'TBSテレビ': 'TBS',
  CX: 'CX', CXT: 'CX', 'フジテレビ': 'CX', 'フジ': 'CX',
  EX: 'EX', 'テレビ朝日': 'EX', 'テレ朝': 'EX',
  TX: 'TX', 'テレビ東京': 'TX', 'テレ東': 'TX',
  YTV: 'YTV', '読売テレビ': 'YTV', '読売': 'YTV',
  MBS: 'MBS', '毎日放送': 'MBS', 'MBSテレビ': 'MBS',
  KTV: 'KTV', '関西テレビ': 'KTV', '関テレ': 'KTV',
  ABC: 'ABC', '朝日放送テレビ': 'ABC', 'ABCテレビ': 'ABC', '朝日放送': 'ABC',
  TVO: 'TVO', 'テレビ大阪': 'TVO', 'テレ大': 'TVO',
  CTV: 'CTV', '中京テレビ': 'CTV', '中京': 'CTV',
  CBC: 'CBC', 'CBCテレビ': 'CBC',
  THK: 'THK', '東海テレビ': 'THK', '東海': 'THK',
  NBN: 'NBN', '名古屋テレビ': 'NBN', 'メ~テレ': 'NBN', 'メーテレ': 'NBN',
  TVA: 'TVA', 'テレビ愛知': 'TVA', 'テレ愛': 'TVA',
}

/** エリア文字列からRegionを判定 */
function parseRegion(areaStr: string): Region | null {
  if (!areaStr) return null
  if (areaStr.includes('関東') || areaStr === '東京') return 'kanto'
  if (areaStr.includes('関西') || areaStr.includes('大阪') || areaStr.includes('近畿')) return 'kansai'
  if (areaStr.includes('名古屋') || areaStr.includes('中京') || areaStr.includes('中部')) return 'nagoya'
  return null
}

/** 局名/略称からコードを正規化 */
function resolveCode(name: string): string | null {
  const trimmed = name.trim()
  return STATION_CODE_MAP[trimmed] ?? null
}

/** SPOTプランの指定シートからH列の発注PRP目標を読み取る */
export function parseSpotPlanFile(
  file: File,
  sheetName: string,
): Promise<SpotPlanParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array', codepage: 932 })
        const sheet = wb.Sheets[sheetName]
        if (!sheet) {
          reject(new Error(`シート "${sheetName}" が見つかりません`))
          return
        }

        const rawRows = XLSX.utils.sheet_to_json<string[]>(sheet, {
          header: 1,
          defval: '',
          raw: false,
          blankrows: true,
        })

        const targets: StationTarget[] = []
        const errors: string[] = []

        // ヘッダー行を探す (「エリア」「局名」が含まれる行)
        let headerRowIdx = -1
        let areaColIdx = -1
        let stationColIdx = -1   // 局名
        let codeColIdx = -1      // 略称
        let hColIdx = 7          // H列 (default: 0-indexed = 7)
        const lColIdx = 11       // L列 (default: 0-indexed = 11)

        for (let i = 0; i < Math.min(rawRows.length, 30); i++) {
          const row = rawRows[i]
          if (!row) continue
          for (let j = 0; j < row.length; j++) {
            const val = String(row[j] ?? '').trim()
            if (val === 'エリア') {
              headerRowIdx = i
              areaColIdx = j
            }
            if (val === '局名') stationColIdx = j
            if (val === '略称') codeColIdx = j
          }
          if (headerRowIdx >= 0) break
        }

        if (headerRowIdx < 0) {
          errors.push('ヘッダー行（"エリア"列）が見つかりません')
          resolve({ targets, regionTargetTrps: [], errors })
          return
        }

        // H列の値を確認（ヘッダー行のH列）
        const hColHeader = String(rawRows[headerRowIdx][hColIdx] ?? '').trim()
        errors.push(`H列ヘッダー: "${hColHeader}"`)

        // データ行をパース
        let currentRegion: Region | null = null

        for (let i = headerRowIdx + 1; i < rawRows.length; i++) {
          const row = rawRows[i]
          if (!row || row.length === 0) continue

          // エリア列でリージョン更新
          const areaVal = String(row[areaColIdx] ?? '').trim()
          if (areaVal) {
            const newRegion = parseRegion(areaVal)
            if (newRegion) currentRegion = newRegion
          }

          // 関東・関西・名古屋以外はスキップ
          if (!currentRegion) continue

          // 局名/略称を取得
          const stationName = stationColIdx >= 0 ? String(row[stationColIdx] ?? '').trim() : ''
          const stationShort = codeColIdx >= 0 ? String(row[codeColIdx] ?? '').trim() : ''

          if (!stationName && !stationShort) continue

          // 局コード解決
          const code = resolveCode(stationShort) ?? resolveCode(stationName)
          if (!code) {
            // 小計行や不明局はスキップ
            if (!stationName.includes('小計') && !stationName.includes('合計')) {
              errors.push(`行${i + 1}: 局コード不明 (${stationName}/${stationShort})`)
            }
            continue
          }

          // H列の値を取得
          const hVal = parseFloat(String(row[hColIdx] ?? ''))
          if (isNaN(hVal) || hVal <= 0) continue

          // L列の値を取得（発注TRP）
          const lVal = parseFloat(String(row[lColIdx] ?? ''))

          targets.push({
            region: currentRegion,
            stationName: stationName || stationShort,
            stationCode: code,
            targetPrp: hVal,
            targetTrp: isNaN(lVal) ? 0 : lVal,
          })
        }

        // エリア別発注TRP: M列の特定行 (Excel M17=関東, M23=関西, M29=名古屋)
        const mColIdx = 12 // M列 (0-indexed = 12)
        const regionTrpRows: { row: number; region: Region }[] = [
          { row: 17, region: 'kanto' },
          { row: 23, region: 'kansai' },
          { row: 29, region: 'nagoya' },
        ]
        const regionTargetTrps: RegionTargetTrp[] = regionTrpRows.map(({ row, region }) => {
          const idx = row - 1 // Excel 1-indexed → 0-indexed
          const rowData = rawRows[idx]
          const val = rowData ? parseFloat(String(rowData[mColIdx] ?? '')) : NaN
          return { region, targetTrp: isNaN(val) ? 0 : val }
        })

        resolve({ targets, regionTargetTrps, errors })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}
