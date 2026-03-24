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
    <aside className="flex w-[220px] flex-col border-r border-white/[0.08] bg-[#1c1c1e]/90 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-2.5 px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-b from-[#0a84ff] to-[#0064d2] text-[11px] font-bold text-white shadow-sm">TV</div>
        <span className="text-[13px] font-semibold text-white tracking-tight">スポット実績管理</span>
      </div>
      <nav className="mt-1 flex-1 space-y-0.5 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-[#0a84ff]/20 text-[#0a84ff]'
                  : 'text-[#98989d] hover:bg-white/[0.06] hover:text-white'
              }`
            }
          >
            <item.icon size={17} strokeWidth={1.8} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/[0.06] px-5 py-4 text-[11px] text-[#636366]">
        Prime Video Campaign
      </div>
    </aside>
  )
}
