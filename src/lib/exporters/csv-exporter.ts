import Papa from 'papaparse'
import type { DailyActual } from '../../types'
import { REGION_LABELS } from '../../constants'

export function exportDailyActualsToCSV(actuals: DailyActual[], campaignName: string): void {
  const data = actuals.map((d) => ({
    日付: d.date,
    地域: REGION_LABELS[d.region],
    世帯GRP: d.householdGrp,
    個人GRP: d.individualGrp,
    プライム世帯GRP: d.primeHouseholdGrp,
    プライム個人GRP: d.primeIndividualGrp,
    出稿本数: d.spotCount,
    出稿秒数: d.totalSeconds,
  }))

  const csv = Papa.unparse(data)
  const bom = '\uFEFF'
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${campaignName}_実績データ.csv`
  a.click()
  URL.revokeObjectURL(url)
}
