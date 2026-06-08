import { useSpotStore } from '../stores/spot-store'
import { useCampaignStore } from '../stores/campaign-store'

const BACKUP_REMINDER_KEY = 'tv-spot-last-backup'
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000

/** 前回バックアップから7日以上経っているか判定 */
export function shouldRemindBackup(): boolean {
  const last = localStorage.getItem(BACKUP_REMINDER_KEY)
  if (!last) return true
  return Date.now() - Number(last) > ONE_WEEK_MS
}

/** バックアップ日時を記録（エクスポート実行時に呼ぶ） */
export function markBackupDone() {
  localStorage.setItem(BACKUP_REMINDER_KEY, String(Date.now()))
}

/** リマインダーをスキップ（「後で」押下時） */
export function snoozeBackupReminder() {
  // 1日後に再表示
  localStorage.setItem(BACKUP_REMINDER_KEY, String(Date.now() - ONE_WEEK_MS + 24 * 60 * 60 * 1000))
}

/** バックアップJSONをダウンロードする */
export function downloadBackup() {
  const { spots, importBatches, campaignDataMap } = useSpotStore.getState()
  const { campaigns } = useCampaignStore.getState()

  const data = {
    version: 3,
    exportedAt: new Date().toISOString(),
    campaigns,
    spots,
    importBatches,
    campaignDataMap,
  }

  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const mi = String(now.getMinutes()).padStart(2, '0')
  const dateSuffix = `${yy}${mm}${dd}_${hh}${mi}`

  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tv-spot-backup_${dateSuffix}.json`
  a.click()
  URL.revokeObjectURL(url)

  markBackupDone()
}
