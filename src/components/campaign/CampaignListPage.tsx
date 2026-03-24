import { useState } from 'react'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { useCampaignStore } from '../../stores/campaign-store'
import { useSpotStore } from '../../stores/spot-store'
import { useUiStore } from '../../stores/ui-store'
import { CampaignForm } from './CampaignForm'
import { REGION_LABELS } from '../../constants'
import type { Campaign } from '../../types'

export function CampaignListPage() {
  const campaigns = useCampaignStore((s) => s.campaigns)
  const deleteCampaign = useCampaignStore((s) => s.deleteCampaign)
  const deleteSpotsByCampaign = useSpotStore((s) => s.deleteSpotsByCampaign)
  const setSelectedCampaign = useUiStore((s) => s.setSelectedCampaign)
  const [showForm, setShowForm] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)

  const handleDelete = (id: string) => {
    if (!confirm('このキャンペーンと関連するスポットデータを全て削除しますか？')) return
    deleteCampaign(id)
    deleteSpotsByCampaign(id)
  }

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[21px] font-semibold tracking-tight text-[#1d1d1f]">キャンペーン管理</h1>
        <button
          onClick={() => { setEditingCampaign(null); setShowForm(true) }}
          className="flex items-center gap-2 rounded-full bg-[#007AFF] px-5 py-2 text-[13px] font-medium text-white transition-all hover:bg-[#007AFF]/80"
        >
          <Plus size={15} />
          新規作成
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-2xl bg-white/80 p-16 text-center shadow-sm ring-1 ring-black/[0.04] backdrop-blur-xl">
          <div className="mx-auto mb-4 text-[48px]">📢</div>
          <p className="text-[15px] text-[#86868b]">キャンペーンがまだありません</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-[13px] font-medium text-[#007AFF] hover:underline"
          >
            最初のキャンペーンを作成
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-black/[0.04] backdrop-blur-xl transition-all duration-200 hover:ring-black/[0.08] cursor-pointer"
              onClick={() => setSelectedCampaign(c.id)}
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="text-[15px] font-semibold text-[#1d1d1f]">{c.name}</h3>
                  <p className="text-[12px] text-[#86868b]">{c.client} / {c.product}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  c.status === 'active' ? 'bg-[#34C759]/10 text-[#34C759]' :
                  c.status === 'completed' ? 'bg-black/[0.04] text-[#86868b]' :
                  'bg-[#FF9500]/10 text-[#FF9500]'
                }`}>
                  {c.status === 'active' ? '実施中' : c.status === 'completed' ? '完了' : '計画中'}
                </span>
              </div>
              <p className="text-[12px] text-[#86868b] mb-2.5">
                {c.startDate} ~ {c.endDate}
              </p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {c.regions.map((r) => (
                  <span key={r} className="rounded-md bg-black/[0.04] px-2 py-0.5 text-[11px] font-medium text-[#6e6e73]">
                    {REGION_LABELS[r]}
                  </span>
                ))}
              </div>
              <div className="flex gap-3 border-t border-black/[0.06] pt-3">
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingCampaign(c); setShowForm(true) }}
                  className="flex items-center gap-1 text-[12px] text-[#86868b] transition-colors hover:text-[#007AFF]"
                >
                  <Edit2 size={12} /> 編集
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(c.id) }}
                  className="flex items-center gap-1 text-[12px] text-[#86868b] transition-colors hover:text-[#FF3B30]"
                >
                  <Trash2 size={12} /> 削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <CampaignForm
          campaign={editingCampaign}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
