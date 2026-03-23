import { useCampaignStore } from '../../stores/campaign-store'
import { useUiStore } from '../../stores/ui-store'
import { REGION_LABELS, REGIONS } from '../../constants'
// Region type used implicitly via REGIONS

export function Header() {
  const campaigns = useCampaignStore((s) => s.campaigns)
  const selectedCampaignId = useUiStore((s) => s.selectedCampaignId)
  const selectedRegion = useUiStore((s) => s.selectedRegion)
  const setSelectedCampaign = useUiStore((s) => s.setSelectedCampaign)
  const setSelectedRegion = useUiStore((s) => s.setSelectedRegion)

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-gray-200 bg-white px-6">
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

      <div className="flex shrink-0 items-center gap-1 rounded-lg bg-gray-100 p-0.5">
        <RegionButton
          active={selectedRegion === 'all'}
          onClick={() => setSelectedRegion('all')}
        >
          全体
        </RegionButton>
        {REGIONS.map((r) => (
          <RegionButton
            key={r}
            active={selectedRegion === r}
            onClick={() => setSelectedRegion(r)}
          >
            {REGION_LABELS[r]}
          </RegionButton>
        ))}
      </div>
    </header>
  )
}

function RegionButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
        active
          ? 'bg-white text-amazon shadow-sm'
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  )
}
