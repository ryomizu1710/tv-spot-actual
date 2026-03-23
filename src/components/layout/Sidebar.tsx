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
    <aside className="flex w-56 flex-col bg-amazon text-white">
      <div className="flex h-14 items-center gap-2 px-4">
        <div className="h-6 w-6 rounded bg-prime flex items-center justify-center text-xs font-bold">TV</div>
        <span className="text-sm font-semibold">スポット実績管理</span>
      </div>
      <nav className="mt-2 flex-1 space-y-0.5 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-prime/20 text-prime'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4 text-xs text-gray-400">
        Prime Video Campaign
      </div>
    </aside>
  )
}
