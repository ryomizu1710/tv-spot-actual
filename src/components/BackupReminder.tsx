import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { shouldRemindBackup, downloadBackup, snoozeBackupReminder } from '../lib/auto-backup'
import { useSpotStore } from '../stores/spot-store'

export function BackupReminder() {
  const [show, setShow] = useState(false)
  const spots = useSpotStore((s) => s.spots)

  useEffect(() => {
    // データがある場合のみリマインド
    if (spots.length > 0 && shouldRemindBackup()) {
      setShow(true)
    }
  }, [spots.length])

  if (!show) return null

  const handleBackup = () => {
    downloadBackup()
    setShow(false)
  }

  const handleDismiss = () => {
    snoozeBackupReminder()
    setShow(false)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 rounded-2xl bg-white p-4 shadow-lg ring-1 ring-black/[0.08]">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#007AFF]/10">
          <Download size={18} className="text-[#007AFF]" />
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-[#1d1d1f]">
            バックアップのお知らせ
          </p>
          <p className="mt-0.5 text-[12px] text-[#86868b]">
            前回のバックアップから1週間以上経過しています。データを保護するためバックアップをおすすめします。
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleBackup}
              className="rounded-full bg-[#007AFF] px-4 py-1.5 text-[12px] font-medium text-white hover:bg-[#007AFF]/80"
            >
              今すぐバックアップ
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-full px-3 py-1.5 text-[12px] font-medium text-[#86868b] hover:bg-[#f5f5f7]"
            >
              後で
            </button>
          </div>
        </div>
        <button onClick={handleDismiss} className="shrink-0 text-[#d2d2d7] hover:text-[#86868b]">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
