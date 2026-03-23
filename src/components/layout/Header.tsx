import { useLocation } from 'react-router'
import { useCampaignStore } from '../../stores/campaign-store'
import { useUiStore } from '../../stores/ui-store'

export function Header() {
  const campaigns = useCampaignStore((s) => s.campaigns)
  const selectedCampaignId = useUiStore((s) => s.selectedCampaignId)
  const setSelectedCampaign = useUiStore((s) => s.setSelectedCampaign)
  const location = useLocation()
  const isDashboard = location.pathname === '/' || location.pathname === '/dashboard'

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-gray-200 bg-white px-6">
      {isDashboard && (
        <>
          <div className="flex items-center gap-2 min-w-0">
            <label className="text-xs text-gray-500 whitespace-nowrap">キャンペーン</label>
            <select
              value={selectedCampaignId ?? ''}
              onChange={(e) => setSelectedCampaign(e.target.value || null)}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-prime focus:outline-none"
            >
              <option value="">選択してください</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

        </>
      )}
    </header>
  )
}
