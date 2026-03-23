import { Download, Upload, Trash2, Database } from 'lucide-react'
import { useSpotStore } from '../../stores/spot-store'
import { useCampaignStore } from '../../stores/campaign-store'
import { toast } from 'sonner'

export function SettingsPage() {
  const spots = useSpotStore((s) => s.spots)
  const importBatches = useSpotStore((s) => s.importBatches)
  const campaigns = useCampaignStore((s) => s.campaigns)
  const clearAll = useSpotStore((s) => s.clearAll)

  const handleExportBackup = () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      campaigns,
      spots,
      importBatches,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tv-spot-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('バックアップをエクスポートしました')
  }

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string)
        if (data.campaigns) {
          const addCampaign = useCampaignStore.getState().addCampaign
          for (const c of data.campaigns) {
            addCampaign(c)
          }
        }
        if (data.spots) {
          useSpotStore.getState().addSpots(data.spots)
        }
        if (data.importBatches) {
          for (const b of data.importBatches) {
            useSpotStore.getState().addImportBatch(b)
          }
        }
        toast.success('バックアップをリストアしました')
      } catch {
        toast.error('バックアップファイルの形式が不正です')
      }
    }
    reader.readAsText(file)
  }

  const handleClearAll = () => {
    if (!confirm('全てのスポットデータを削除しますか？この操作は元に戻せません。')) return
    if (!confirm('本当に削除しますか？')) return
    clearAll()
    toast.success('全データを削除しました')
  }

  const storageUsed = (() => {
    let total = 0
    for (const key of ['tv-spot-campaigns', 'tv-spot-data']) {
      const item = localStorage.getItem(key)
      if (item) total += item.length * 2 // UTF-16
    }
    return total
  })()
  const storagePct = Math.round((storageUsed / (5 * 1024 * 1024)) * 100)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-bold text-gray-900">設定</h1>

      {/* Storage usage */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Database size={16} className="text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-700">データ使用量</h2>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>{(storageUsed / 1024).toFixed(1)} KB / 5 MB</span>
            <span>{storagePct}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-200">
            <div
              className={`h-2 rounded-full ${storagePct > 80 ? 'bg-red-500' : storagePct > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(storagePct, 100)}%` }}
            />
          </div>
          <div className="flex gap-4 text-xs text-gray-500">
            <span>キャンペーン: {campaigns.length}件</span>
            <span>スポット: {spots.length}件</span>
            <span>インポート: {importBatches.length}件</span>
          </div>
        </div>
      </div>

      {/* Backup */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">データバックアップ</h2>
        <div className="flex gap-3">
          <button onClick={handleExportBackup}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
            <Download size={14} /> エクスポート
          </button>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
            <Upload size={14} /> リストア
            <input type="file" accept=".json" className="hidden" onChange={handleImportBackup} />
          </label>
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-lg border border-red-200 bg-red-50 p-5">
        <h2 className="mb-3 text-sm font-semibold text-red-700">危険な操作</h2>
        <button onClick={handleClearAll}
          className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600">
          <Trash2 size={14} /> 全スポットデータを削除
        </button>
      </div>
    </div>
  )
}
