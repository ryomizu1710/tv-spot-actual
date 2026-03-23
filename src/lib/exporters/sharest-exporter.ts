import * as XLSX from 'xlsx'

/** TG表記の選択肢 */
export const SHAREST_TG_OPTIONS = [
  '個人全体',
  '男女 4～12才',
  '男女 13～19才',
  '男女 20才以上',
  '男 20～34才',
  '男 35～49才',
  '男 50才以上',
  '女 20才以上',
  '女 20～34才',
  '女 35～49才',
  '女 50才以上',
  '主婦',
  '女 50～59才',
  '主婦 <0～3才の子供あり>',
  '女 18～34才',
  '女 25～39才',
  '男 20～49才',
  '主婦-59才',
  '女18-44才学働',
  '女15-39才',
  '主婦子供-12才',
  '男35-99才',
  '男女35-99才',
  '男女20-34才',
  '男女20-49才',
  '男女35-49才',
  '男女50-99才',
  '女20-49才',
  'TEEN+M1',
  '男女15-24才',
]

/** エリア定義 */
type RegionKey = 'kanto' | 'kansai' | 'nagoya'

const REGION_FILTER: Record<RegionKey, (val: string) => boolean> = {
  kanto: (v) => v.includes('関東'),
  kansai: (v) => v.includes('関西') || v.includes('近畿'),
  nagoya: (v) => v.includes('名古屋') || v.includes('中京') || v.includes('中部'),
}

const REGION_SHEET_NAMES: Record<RegionKey, string> = {
  kanto: '001関東',
  kansai: '002関西',
  nagoya: '003名古屋',
}

const REGION_FILE_LABELS: Record<RegionKey, string> = {
  kanto: '関東',
  kansai: '関西',
  nagoya: '名古屋',
}

/** Sharestヘッダー行 */
const SHAREST_HEADERS = [
  '',                    // A: 連番
  'ブランド\n固定',       // B
  '視聴率\n固定',         // C
  'JOB No.\n提供No',     // D
  '区\n分',              // E
  '放送局',              // F
  '放送日',              // G
  '曜\n日',              // H
  '開始\n時間',           // I
  '終了\n時間',           // J
  '番組タイトル/提供名',   // K
  'ジャンル名',           // L
  '秒数',               // M
  'タイム\nランク',       // N
  'ブランド\nコード',     // O
  'ブランド名',           // P
  '世帯',               // Q
  'ＡＬＬ',             // R
  '',                   // S: TG（動的）
]

/** Excel日付セルの値をYYYY/MM/DD文字列に変換 */
function formatDateValue(cell: XLSX.CellObject | undefined): string {
  if (!cell) return ''
  if (typeof cell.v === 'number') {
    const d = XLSX.SSF.parse_date_code(cell.v)
    if (d) {
      return `${d.y}/${String(d.m).padStart(2, '0')}/${String(d.d).padStart(2, '0')}`
    }
  }
  return String(cell.v)
}

export interface SharestExportResult {
  region: RegionKey
  fileName: string
  blob: Blob
  rowCount: number
}

/**
 * iClimaxファイルからSharest用Excelを生成（エリア別）
 */
export async function generateSharestFiles(
  iclimaxFile: File,
  selectedTg: string,
  regions: RegionKey[] = ['kanto', 'kansai', 'nagoya'],
): Promise<SharestExportResult[]> {
  const buffer = await iclimaxFile.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  if (!ws) throw new Error('シートが見つかりません')

  const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1')

  // エリアごとに行データを振り分け
  const regionRows: Record<RegionKey, Array<{
    seqNo: number
    jobNo: string
    station: string
    date: string
    dayOfWeek: string
    startTime: string
    endTime: string
  }>> = {
    kanto: [],
    kansai: [],
    nagoya: [],
  }

  for (let r = 1; r <= range.e.r; r++) {
    const cCell = ws[XLSX.utils.encode_cell({ r, c: 2 })] // C列: 地区
    if (!cCell) continue
    const regionStr = String(cCell.v)

    // A列: 連番
    const aCell = ws[XLSX.utils.encode_cell({ r, c: 0 })]
    const seqNo = aCell ? Number(aCell.v) : 0

    // B列: JOB No.
    const bCell = ws[XLSX.utils.encode_cell({ r, c: 1 })]
    const jobNo = bCell ? String(bCell.v) : ''

    // D列: 放送局
    const dCell = ws[XLSX.utils.encode_cell({ r, c: 3 })]
    const station = dCell ? String(dCell.v) : ''

    // E列: 放送日
    const eCell = ws[XLSX.utils.encode_cell({ r, c: 4 })]
    const date = formatDateValue(eCell)

    // F列: 曜日
    const fCell = ws[XLSX.utils.encode_cell({ r, c: 5 })]
    const dayOfWeek = fCell ? String(fCell.v) : ''

    // G列: 開始時間
    const gCell = ws[XLSX.utils.encode_cell({ r, c: 6 })]
    const startTime = gCell ? String(gCell.v) : ''

    // H列: 終了時間
    const hCell = ws[XLSX.utils.encode_cell({ r, c: 7 })]
    const endTime = hCell ? String(hCell.v) : ''

    const rowData = { seqNo, jobNo, station, date, dayOfWeek, startTime, endTime }

    for (const key of regions) {
      if (REGION_FILTER[key](regionStr)) {
        regionRows[key].push(rowData)
        break
      }
    }
  }

  // エリアごとにExcelファイルを生成
  const results: SharestExportResult[] = []

  for (const region of regions) {
    const rows = regionRows[region]
    if (rows.length === 0) continue

    const newWb = XLSX.utils.book_new()
    const sheetData: (string | number | null)[][] = []

    // ヘッダー行
    const headers = [...SHAREST_HEADERS]
    headers[18] = selectedTg  // S列にTGを設定
    sheetData.push(headers)

    // データ行
    for (const row of rows) {
      sheetData.push([
        row.seqNo,      // A: 連番
        null,            // B: ブランド固定
        null,            // C: 視聴率固定
        row.jobNo,       // D: JOB No.
        null,            // E: 区分
        row.station,     // F: 放送局
        row.date,        // G: 放送日
        row.dayOfWeek,   // H: 曜日
        row.startTime,   // I: 開始時間
        row.endTime,     // J: 終了時間
        null,            // K: 番組タイトル
        null,            // L: ジャンル名
        null,            // M: 秒数
        null,            // N: タイムランク
        null,            // O: ブランドコード
        null,            // P: ブランド名
        null,            // Q: 世帯（空）
        null,            // R: ALL（空）
        null,            // S: TG（空）
      ])
    }

    const newWs = XLSX.utils.aoa_to_sheet(sheetData)
    XLSX.utils.book_append_sheet(newWb, newWs, REGION_SHEET_NAMES[region])

    const xlsxBuf = XLSX.write(newWb, { type: 'array', bookType: 'xlsx' })
    const blob = new Blob([xlsxBuf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

    results.push({
      region,
      fileName: `【sharest】${REGION_FILE_LABELS[region]}.xlsx`,
      blob,
      rowCount: rows.length,
    })
  }

  return results
}
