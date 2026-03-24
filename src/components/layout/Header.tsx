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
    <header className="flex h-12 shrink-0 items-center gap-4 border-b border-gray-200/60 bg-white/70 px-6 backdrop-blur-xl">
      {isDashboard && (
        <div className="flex items-center gap-2.5 min-w-0">
          <label className="text-[11px] font-medium text-[#86868b] uppercase tracking-wider">Campaign</label>
          <select
            value={selectedCampaignId ?? ''}
            onChange={(e) => setSelectedCampaign(e.target.value || null)}
            className="rounded-lg border border-gray-200 bg-white/90 px-3 py-1.5 text-[13px] text-[#1d1d1f] shadow-sm transition-all focus:border-[#007AFF] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20"
          >
            <option value="">選択してください</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </header>
  )
}
