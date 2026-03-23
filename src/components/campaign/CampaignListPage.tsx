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
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">キャンペーン管理</h1>
        <button
          onClick={() => { setEditingCampaign(null); setShowForm(true) }}
          className="flex items-center gap-2 rounded-lg bg-prime px-4 py-2 text-sm font-medium text-white hover:bg-prime-dark"
        >
          <Plus size={16} />
          新規作成
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <Megaphone className="mx-auto mb-3 text-gray-400" size={48} />
          <p className="text-gray-500">キャンペーンがまだありません</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-sm text-prime hover:underline"
          >
            最初のキャンペーンを作成
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedCampaign(c.id)}
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{c.name}</h3>
                  <p className="text-xs text-gray-500">{c.client} / {c.product}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  c.status === 'active' ? 'bg-green-100 text-green-700' :
                  c.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {c.status === 'active' ? '実施中' : c.status === 'completed' ? '完了' : '計画中'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-2">
                {c.startDate} ~ {c.endDate}
              </p>
              <div className="flex flex-wrap gap-1 mb-3">
                {c.regions.map((r) => (
                  <span key={r} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                    {REGION_LABELS[r]}
                  </span>
                ))}
              </div>
              <div className="flex gap-2 border-t border-gray-100 pt-3">
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingCampaign(c); setShowForm(true) }}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-prime"
                >
                  <Edit2 size={12} /> 編集
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(c.id) }}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500"
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

function Megaphone({ className, size }: { className?: string; size?: number }) {
  return <div className={className} style={{ fontSize: size }}>📢</div>
}
