import { NavLink, Outlet } from 'react-router-dom'
import { ArrowLeftRight, History } from 'lucide-react'

const tabs = [
  { to: 'transfers', label: 'التحويلات', icon: ArrowLeftRight },
  { to: 'audit', label: 'سجل الحركات', icon: History },
]

export default function AdminControl() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `inline-flex items-center gap-2 px-3 py-2 rounded-2xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-border-light)] hover:text-[var(--color-text)]'
                }`
              }
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </NavLink>
          )
        })}
      </div>
      <Outlet />
    </div>
  )
}
