import ExcelJS from 'exceljs'
import type { StationActual, RegionSubtotal, StationDailyPrpProgress, RegionDailyPrpProgress } from '../../hooks/use-station-actuals'
import type { Region } from '../../types'
import { REGION_LABELS } from '../../constants'

/** 共通スタイル */
const FONT_NAME = 'Yu Gothic'
const HEADER_FILL: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF374151' } }
const HEADER_FONT: Partial<ExcelJS.Font> = { name: FONT_NAME, size: 9, bold: true, color: { argb: 'FFFFFFFF' } }
const DATA_FONT: Partial<ExcelJS.Font> = { name: FONT_NAME, size: 9 }
const SUBTOTAL_FILL: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1D5DB' } }
const SUBTOTAL_FONT: Partial<ExcelJS.Font> = { name: FONT_NAME, size: 9, bold: true, color: { argb: 'FF1F2937' } }

const GREEN_FILL: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }
const GREEN_FONT: Partial<ExcelJS.Font> = { name: FONT_NAME, size: 9, bold: true, color: { argb: 'FF15803D' } }
const RED_FILL: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }
const RED_FONT: Partial<ExcelJS.Font> = { name: FONT_NAME, size: 9, bold: true, color: { argb: 'FFDC2626' } }

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
  bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
  left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
  right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
}

const CENTER: Partial<ExcelJS.Alignment> = { horizontal: 'center', vertical: 'middle' }

function applyAchievementStyle(cell: ExcelJS.Cell, rate: number, threshold = 100) {
  if (rate === 0) return
  if (rate >= threshold) {
    cell.fill = GREEN_FILL
    cell.font = GREEN_FONT
  } else {
    cell.fill = RED_FILL
    cell.font = RED_FONT
  }
}

/** シート1: 局別アクチュアル Excel出力 */
export async function exportStationActualsToExcel(
  stationActuals: StationActual[],
  regionSubtotals: RegionSubtotal[],
) {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('局別アクチュアル')

  // カラム定義
  const columns = [
    { header: 'エリア', key: 'region', width: 10 },
    { header: '局', key: 'station', width: 8 },
    { header: 'PRP\n発注', key: 'prpTarget', width: 10 },
    { header: 'PRP\n予測', key: 'prpActual', width: 10 },
    { header: 'PRP\n達成率', key: 'prpRate', width: 10 },
    { header: 'TRP\n発注', key: 'trpTarget', width: 10 },
    { header: 'TRP\n予測', key: 'trpActual', width: 10 },
    { header: 'TRP\n達成率', key: 'trpRate', width: 10 },
    { header: 'Prime\nPRP', key: 'primePrp', width: 10 },
    { header: 'Prime\nShare', key: 'primeShare', width: 10 },
    { header: '出稿\n本数', key: 'spotCount', width: 8 },
  ]

  ws.columns = columns

  // ヘッダー行スタイル
  const headerRow = ws.getRow(1)
  headerRow.height = 30
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL
    cell.font = HEADER_FONT
    cell.alignment = { ...CENTER, wrapText: true }
    cell.border = THIN_BORDER
  })

  // エリアごとにデータ追加
  const regions: Region[] = ['kanto', 'kansai', 'nagoya']
  for (const region of regions) {
    const regionStations = stationActuals.filter((s) => s.region === region)
    const subtotal = regionSubtotals.find((s) => s.region === region)
    if (regionStations.length === 0) continue

    // 中央の局にエリア名を表示
    const midIndex = Math.floor(regionStations.length / 2)

    for (let i = 0; i < regionStations.length; i++) {
      const sa = regionStations[i]
      const row = ws.addRow([
        i === midIndex ? REGION_LABELS[region] : '',
        sa.stationCode,
        sa.targetPrp > 0 ? sa.targetPrp : null,
        sa.actualPrp,
        sa.prpAchievement > 0 ? sa.prpAchievement / 100 : null,
        sa.targetTrp > 0 ? sa.targetTrp : null,
        sa.actualTg,
        sa.tgAchievement > 0 ? sa.tgAchievement / 100 : null,
        sa.primePrp,
        sa.primeShare > 0 ? sa.primeShare / 100 : null,
        sa.spotCount,
      ])
      row.eachCell((cell) => {
        cell.font = DATA_FONT
        cell.alignment = CENTER
        cell.border = THIN_BORDER
      })
      // 達成率の色
      if (sa.prpAchievement > 0) applyAchievementStyle(row.getCell(5), sa.prpAchievement)
      if (sa.tgAchievement > 0) applyAchievementStyle(row.getCell(8), sa.tgAchievement)
      if (sa.primeShare > 0) applyAchievementStyle(row.getCell(10), sa.primeShare, 60)
    }

    // エリア小計
    if (subtotal) {
      const row = ws.addRow([
        `${REGION_LABELS[region]} 小計`,
        '',
        subtotal.targetPrp,
        subtotal.actualPrp,
        subtotal.prpAchievement > 0 ? subtotal.prpAchievement / 100 : null,
        subtotal.targetTrp > 0 ? subtotal.targetTrp : null,
        subtotal.actualTg,
        subtotal.tgAchievement > 0 ? subtotal.tgAchievement / 100 : null,
        subtotal.primePrp,
        subtotal.primeShare > 0 ? subtotal.primeShare / 100 : null,
        subtotal.spotCount,
      ])
      row.eachCell((cell) => {
        cell.font = SUBTOTAL_FONT
        cell.alignment = CENTER
        cell.border = THIN_BORDER
        cell.fill = SUBTOTAL_FILL
      })
      if (subtotal.prpAchievement > 0) applyAchievementStyle(row.getCell(5), subtotal.prpAchievement)
      if (subtotal.tgAchievement > 0) applyAchievementStyle(row.getCell(8), subtotal.tgAchievement)
      if (subtotal.primeShare > 0) applyAchievementStyle(row.getCell(10), subtotal.primeShare, 60)
    }
  }

  // 数値フォーマット
  ws.getColumn(3).numFmt = '0.0'
  ws.getColumn(4).numFmt = '0.0'
  ws.getColumn(5).numFmt = '0.0%'
  ws.getColumn(6).numFmt = '0.0'
  ws.getColumn(7).numFmt = '0.0'
  ws.getColumn(8).numFmt = '0.0%'
  ws.getColumn(9).numFmt = '0.0'
  ws.getColumn(10).numFmt = '0.0%'

  // ダウンロード
  const buf = await wb.xlsx.writeBuffer()
  downloadExcel(buf, '局別アクチュアル.xlsx')
}

/** シート2: 日別PRP推移 Excel出力 */
export async function exportDailyPrpToExcel(
  regionDailyProgress: RegionDailyPrpProgress[],
  stationDailyProgress: StationDailyPrpProgress[],
  regionStationDailyProgress: Record<Region, StationDailyPrpProgress[]>,
  isAllRegion: boolean,
) {
  const wb = new ExcelJS.Workbook()

  if (isAllRegion) {
    // エリア別シート
    const ws = wb.addWorksheet('日別PRP推移')

    const headers = ['日付', '関東 日別%', '関東 累積%', '関西 日別%', '関西 累積%', '名古屋 日別%', '名古屋 累積%', '全体 累積%']
    const headerRow = ws.addRow(headers)
    headerRow.height = 24
    headerRow.eachCell((cell) => {
      cell.fill = HEADER_FILL
      cell.font = HEADER_FONT
      cell.alignment = CENTER
      cell.border = THIN_BORDER
    })

    ws.getColumn(1).width = 14
    for (let i = 2; i <= 8; i++) ws.getColumn(i).width = 13

    for (const d of regionDailyProgress) {
      const row = ws.addRow([
        d.dateLabel,
        d.kantoRate > 0 ? d.kantoRate / 100 : null,
        d.kantoCumRate > 0 ? d.kantoCumRate / 100 : null,
        d.kansaiRate > 0 ? d.kansaiRate / 100 : null,
        d.kansaiCumRate > 0 ? d.kansaiCumRate / 100 : null,
        d.nagoyaRate > 0 ? d.nagoyaRate / 100 : null,
        d.nagoyaCumRate > 0 ? d.nagoyaCumRate / 100 : null,
        d.cumulativeRate > 0 ? d.cumulativeRate / 100 : null,
      ])
      row.eachCell((cell) => {
        cell.font = DATA_FONT
        cell.alignment = CENTER
        cell.border = THIN_BORDER
      })
    }

    for (let i = 2; i <= 8; i++) ws.getColumn(i).numFmt = '0.0%'

    // エリア別の局別シートを追加
    const regionKeys: Region[] = ['kanto', 'kansai', 'nagoya']
    for (const region of regionKeys) {
      const stations = regionStationDailyProgress[region]
      if (!stations || stations.length === 0) continue
      addStationDailySheet(wb, `${REGION_LABELS[region]}局別`, stations)
    }
  } else {
    // 局別シート
    addStationDailySheet(wb, '日別PRP推移', stationDailyProgress)
  }

  const buf = await wb.xlsx.writeBuffer()
  downloadExcel(buf, '日別PRP推移.xlsx')
}

function addStationDailySheet(wb: ExcelJS.Workbook, sheetName: string, stations: StationDailyPrpProgress[]) {
  const ws = wb.addWorksheet(sheetName)

  // 全日付を収集
  const allDates = new Set<string>()
  for (const st of stations) {
    for (const d of st.dailyData) allDates.add(d.dateLabel)
  }
  const sortedDates = Array.from(allDates).sort()

  // ヘッダー: 日付 | 局1 日別% | 局1 累積% | 局2 日別% | ...
  const headers: string[] = ['日付']
  for (const st of stations) {
    headers.push(`${st.stationCode} 日別%`)
    headers.push(`${st.stationCode} 累積%`)
  }

  const headerRow = ws.addRow(headers)
  headerRow.height = 24
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL
    cell.font = HEADER_FONT
    cell.alignment = CENTER
    cell.border = THIN_BORDER
  })

  ws.getColumn(1).width = 14
  for (let i = 2; i <= headers.length; i++) ws.getColumn(i).width = 12

  // 局別日別マップ
  const stationMaps = stations.map((st) => {
    const map = new Map<string, { dailyRate: number; cumulativeRate: number }>()
    for (const d of st.dailyData) {
      map.set(d.dateLabel, { dailyRate: d.dailyRate, cumulativeRate: d.cumulativeRate })
    }
    return map
  })

  for (const date of sortedDates) {
    const rowData: (string | number | null)[] = [date]
    for (const map of stationMaps) {
      const d = map.get(date)
      rowData.push(d ? d.dailyRate / 100 : null)
      rowData.push(d ? d.cumulativeRate / 100 : null)
    }
    const row = ws.addRow(rowData)
    row.eachCell((cell) => {
      cell.font = DATA_FONT
      cell.alignment = CENTER
      cell.border = THIN_BORDER
    })
  }

  for (let i = 2; i <= headers.length; i++) ws.getColumn(i).numFmt = '0.0%'
}

function downloadExcel(buffer: ExcelJS.Buffer, filename: string) {
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
