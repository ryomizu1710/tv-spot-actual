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
    <header className="flex h-12 shrink-0 items-center gap-4 border-b border-white/[0.06] bg-[#1c1c1e]/70 px-6 backdrop-blur-xl">
      {isDashboard && (
        <div className="flex items-center gap-2.5 min-w-0">
          <label className="text-[11px] font-medium text-[#636366] uppercase tracking-wider">Campaign</label>
          <select
            value={selectedCampaignId ?? ''}
            onChange={(e) => setSelectedCampaign(e.target.value || null)}
            className="rounded-lg border border-white/[0.1] bg-[#2c2c2e] px-3 py-1.5 text-[13px] text-[#f5f5f7] shadow-sm transition-all focus:border-[#0a84ff] focus:outline-none focus:ring-2 focus:ring-[#0a84ff]/30"
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
