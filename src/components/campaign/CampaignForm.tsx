import { useState } from 'react'
import { X } from 'lucide-react'
import { useCampaignStore } from '../../stores/campaign-store'
import { REGIONS, REGION_LABELS } from '../../constants'
import type { Campaign, CampaignTarget, Region, CampaignStatus } from '../../types'
import { toast } from 'sonner'

interface Props {
  campaign: Campaign | null
  onClose: () => void
}

export function CampaignForm({ campaign, onClose }: Props) {
  const addCampaign = useCampaignStore((s) => s.addCampaign)
  const updateCampaign = useCampaignStore((s) => s.updateCampaign)

  const [name, setName] = useState(campaign?.name ?? '')
  const [client, setClient] = useState(campaign?.client ?? 'Amazon Prime Video')
  const [product, setProduct] = useState(campaign?.product ?? '')
  const [startDate, setStartDate] = useState(campaign?.startDate ?? '')
  const [endDate, setEndDate] = useState(campaign?.endDate ?? '')
  const [status, setStatus] = useState<CampaignStatus>(campaign?.status ?? 'planning')
  const [selectedRegions, setSelectedRegions] = useState<Region[]>(
    campaign?.regions ?? [...REGIONS],
  )
  const [targets, setTargets] = useState<Record<Region, Partial<CampaignTarget>>>(
    () => {
      const init: Record<Region, Partial<CampaignTarget>> = {
        kanto: {},
        kansai: {},
        nagoya: {},
      }
      if (campaign) {
        for (const t of campaign.targets) {
          init[t.region] = t
        }
      }
      return init
    },
  )
  const [notes, setNotes] = useState(campaign?.notes ?? '')

  const toggleRegion = (r: Region) => {
    setSelectedRegions((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r],
    )
  }

  const updateTarget = (region: Region, field: keyof CampaignTarget, value: number) => {
    setTargets((prev) => ({
      ...prev,
      [region]: { ...prev[region], [field]: value },
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !startDate || !endDate || selectedRegions.length === 0) {
      toast.error('必須項目を入力してください')
      return
    }

    const campaignTargets: CampaignTarget[] = selectedRegions.map((r) => ({
      region: r,
      householdGrpTarget: targets[r].householdGrpTarget ?? 0,
      individualGrpTarget: targets[r].individualGrpTarget ?? 0,
      primeShareTarget: targets[r].primeShareTarget ?? 60,
      spotCountTarget: targets[r].spotCountTarget ?? 0,
    }))

    if (campaign) {
      updateCampaign(campaign.id, {
        name, client, product, startDate, endDate, status,
        regions: selectedRegions, targets: campaignTargets, notes,
      })
      toast.success('キャンペーンを更新しました')
    } else {
      addCampaign({
        name, client, product, startDate, endDate, status,
        regions: selectedRegions, targets: campaignTargets, notes,
      })
      toast.success('キャンペーンを作成しました')
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {campaign ? 'キャンペーン編集' : '新規キャンペーン'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">キャンペーン名 *</label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-prime focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">ステータス</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as CampaignStatus)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-prime focus:outline-none">
                <option value="planning">計画中</option>
                <option value="active">実施中</option>
                <option value="completed">完了</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">クライアント</label>
              <input value={client} onChange={(e) => setClient(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-prime focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">商品/プロダクト</label>
              <input value={product} onChange={(e) => setProduct(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-prime focus:outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">開始日 *</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-prime focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">終了日 *</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-prime focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-gray-600">対象地域 *</label>
            <div className="flex gap-3">
              {REGIONS.map((r) => (
                <label key={r} className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" checked={selectedRegions.includes(r)}
                    onChange={() => toggleRegion(r)}
                    className="rounded border-gray-300" />
                  {REGION_LABELS[r]}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-gray-600">GRP目標（地域別）</label>
            <div className="space-y-3">
              {selectedRegions.map((r) => (
                <div key={r} className="grid grid-cols-5 gap-2 items-center">
                  <span className="text-sm font-medium text-gray-700">{REGION_LABELS[r]}</span>
                  <div>
                    <label className="text-[10px] text-gray-400">世帯GRP</label>
                    <input type="number" step="0.1"
                      value={targets[r].householdGrpTarget ?? ''}
                      onChange={(e) => updateTarget(r, 'householdGrpTarget', parseFloat(e.target.value) || 0)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400">個人GRP</label>
                    <input type="number" step="0.1"
                      value={targets[r].individualGrpTarget ?? ''}
                      onChange={(e) => updateTarget(r, 'individualGrpTarget', parseFloat(e.target.value) || 0)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400">ﾌﾟﾗｲﾑ帯%</label>
                    <input type="number" step="1"
                      value={targets[r].primeShareTarget ?? ''}
                      onChange={(e) => updateTarget(r, 'primeShareTarget', parseFloat(e.target.value) || 0)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400">出稿本数</label>
                    <input type="number"
                      value={targets[r].spotCountTarget ?? ''}
                      onChange={(e) => updateTarget(r, 'spotCountTarget', parseInt(e.target.value) || 0)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">メモ</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-prime focus:outline-none" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
              キャンセル
            </button>
            <button type="submit"
              className="rounded-lg bg-prime px-6 py-2 text-sm font-medium text-white hover:bg-prime-dark">
              {campaign ? '更新' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
