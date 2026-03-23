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

  // カラム定義（エリア列を削除、局がA列）
  const columns = [
    { header: '局', key: 'station', width: 12 },
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

    // 局別データ
    for (const sa of regionStations) {
      const row = ws.addRow([
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
      if (sa.prpAchievement > 0) applyAchievementStyle(row.getCell(4), sa.prpAchievement)
      if (sa.tgAchievement > 0) applyAchievementStyle(row.getCell(7), sa.tgAchievement)
      if (sa.primeShare > 0) applyAchievementStyle(row.getCell(9), sa.primeShare, 60)
    }

    // エリア小計（A列に「関東 小計」）
    if (subtotal) {
      const row = ws.addRow([
        `${REGION_LABELS[region]} 小計`,
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
      if (subtotal.prpAchievement > 0) applyAchievementStyle(row.getCell(4), subtotal.prpAchievement)
      if (subtotal.tgAchievement > 0) applyAchievementStyle(row.getCell(7), subtotal.tgAchievement)
      if (subtotal.primeShare > 0) applyAchievementStyle(row.getCell(9), subtotal.primeShare, 60)
    }
  }

  // 数値フォーマット
  ws.getColumn(2).numFmt = '0.0'
  ws.getColumn(3).numFmt = '0.0'
  ws.getColumn(4).numFmt = '0.0%'
  ws.getColumn(5).numFmt = '0.0'
  ws.getColumn(6).numFmt = '0.0'
  ws.getColumn(7).numFmt = '0.0%'
  ws.getColumn(8).numFmt = '0.0'
  ws.getColumn(9).numFmt = '0.0%'

  const buf = await wb.xlsx.writeBuffer()
  downloadExcel(buf, '局別アクチュアル.xlsx')
}

/** シート2: 日別PRP推移 Excel出力（横軸=日付、縦軸=エリア・局、累積%なし） */
export async function exportDailyPrpToExcel(
  regionDailyProgress: RegionDailyPrpProgress[],
  stationDailyProgress: StationDailyPrpProgress[],
  regionStationDailyProgress: Record<Region, StationDailyPrpProgress[]>,
  isAllRegion: boolean,
) {
  const wb = new ExcelJS.Workbook()

  if (isAllRegion) {
    // エリア別サマリーシート
    addHorizontalDailySheet(wb, '日別PRP推移', regionDailyProgress)

    // エリア別の局別シート
    const regionKeys: Region[] = ['kanto', 'kansai', 'nagoya']
    for (const region of regionKeys) {
      const stations = regionStationDailyProgress[region]
      if (!stations || stations.length === 0) continue
      addStationHorizontalSheet(wb, `${REGION_LABELS[region]}局別`, stations)
    }
  } else {
    addStationHorizontalSheet(wb, '日別PRP推移', stationDailyProgress)
  }

  const buf = await wb.xlsx.writeBuffer()
  downloadExcel(buf, '日別PRP推移.xlsx')
}

/** エリア別日別シート（横軸=日付、縦軸=関東/関西/名古屋） */
function addHorizontalDailySheet(wb: ExcelJS.Workbook, sheetName: string, data: RegionDailyPrpProgress[]) {
  const ws = wb.addWorksheet(sheetName)
  if (data.length === 0) return

  // 1行目: ヘッダー（A1=空、B1以降=日付）
  const headerValues: string[] = ['']
  for (const d of data) headerValues.push(d.dateLabel)
  const headerRow = ws.addRow(headerValues)
  headerRow.height = 24
  headerRow.eachCell((cell, colNumber) => {
    if (colNumber >= 2) {
      cell.fill = HEADER_FILL
      cell.font = HEADER_FONT
    }
    cell.alignment = CENTER
    cell.border = THIN_BORDER
  })

  // A列幅
  ws.getColumn(1).width = 10
  for (let i = 2; i <= data.length + 1; i++) ws.getColumn(i).width = 11

  // 各エリア行
  const regionRows: { label: string; key: 'kantoRate' | 'kansaiRate' | 'nagoyaRate' }[] = [
    { label: '関東', key: 'kantoRate' },
    { label: '関西', key: 'kansaiRate' },
    { label: '名古屋', key: 'nagoyaRate' },
  ]

  for (const r of regionRows) {
    const rowValues: (string | number | null)[] = [r.label]
    for (const d of data) {
      const val = d[r.key]
      rowValues.push(val > 0 ? val / 100 : null)
    }
    const row = ws.addRow(rowValues)
    row.eachCell((cell, colNumber) => {
      cell.font = colNumber === 1 ? SUBTOTAL_FONT : DATA_FONT
      cell.alignment = CENTER
      cell.border = THIN_BORDER
    })
  }

  // 数値フォーマット
  for (let i = 2; i <= data.length + 1; i++) ws.getColumn(i).numFmt = '0.0%'
}

/** 局別日別シート（横軸=日付、縦軸=局） */
function addStationHorizontalSheet(wb: ExcelJS.Workbook, sheetName: string, stations: StationDailyPrpProgress[]) {
  const ws = wb.addWorksheet(sheetName)
  if (stations.length === 0) return

  // 全日付を収集・ソート
  const allDatesSet = new Set<string>()
  for (const st of stations) {
    for (const d of st.dailyData) allDatesSet.add(d.dateLabel)
  }
  const allDates = Array.from(allDatesSet).sort()

  // 1行目: ヘッダー（A1=空、B1以降=日付）
  const headerValues: string[] = ['']
  for (const date of allDates) headerValues.push(date)
  const headerRow = ws.addRow(headerValues)
  headerRow.height = 24
  headerRow.eachCell((cell, colNumber) => {
    if (colNumber >= 2) {
      cell.fill = HEADER_FILL
      cell.font = HEADER_FONT
    }
    cell.alignment = CENTER
    cell.border = THIN_BORDER
  })

  ws.getColumn(1).width = 10
  for (let i = 2; i <= allDates.length + 1; i++) ws.getColumn(i).width = 11

  // 局ごとに1行
  for (const st of stations) {
    const dateMap = new Map<string, number>()
    for (const d of st.dailyData) dateMap.set(d.dateLabel, d.dailyRate)

    const rowValues: (string | number | null)[] = [st.stationCode]
    for (const date of allDates) {
      const val = dateMap.get(date)
      rowValues.push(val && val > 0 ? val / 100 : null)
    }
    const row = ws.addRow(rowValues)
    row.eachCell((cell, colNumber) => {
      cell.font = colNumber === 1 ? SUBTOTAL_FONT : DATA_FONT
      cell.alignment = CENTER
      cell.border = THIN_BORDER
    })
  }

  // 数値フォーマット
  for (let i = 2; i <= allDates.length + 1; i++) ws.getColumn(i).numFmt = '0.0%'
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
