import { useSpotStore } from '../stores/spot-store'
import { useCampaignStore } from '../stores/campaign-store'

/** データ取込完了後に自動バックアップJSONをダウンロードする */
export function downloadAutoBackup() {
  const { spots, importBatches, campaignDataMap } = useSpotStore.getState()
  const { campaigns } = useCampaignStore.getState()

  const data = {
    version: 3,
    exportedAt: new Date().toISOString(),
    autoBackup: true,
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
}
