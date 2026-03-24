import { NavLink } from 'react-router'
import { LayoutDashboard, Upload, Megaphone, List, Settings } from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { to: '/import', label: 'データ取込', icon: Upload },
  { to: '/campaigns', label: 'キャンペーン', icon: Megaphone },
  { to: '/spots', label: 'スポット一覧', icon: List },
  { to: '/settings', label: '設定', icon: Settings },
]

export function Sidebar() {
  return (
    <aside className="flex w-[220px] flex-col border-r border-gray-200/80 bg-white/80 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-2.5 px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-b from-[#007AFF] to-[#0055D4] text-[11px] font-bold text-white shadow-sm">TV</div>
        <span className="text-[13px] font-semibold text-[#1d1d1f] tracking-tight">スポット実績管理</span>
      </div>
      <nav className="mt-1 flex-1 space-y-0.5 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-[#007AFF]/10 text-[#007AFF]'
                  : 'text-[#86868b] hover:bg-gray-100/80 hover:text-[#1d1d1f]'
              }`
            }
          >
            <item.icon size={17} strokeWidth={1.8} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-gray-200/60 px-5 py-4 text-[11px] text-[#86868b]">
        Prime Video Campaign
      </div>
    </aside>
  )
}
