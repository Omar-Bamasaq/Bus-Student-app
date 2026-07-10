import { DollarSign, Flag, CheckSquare } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import AdminPricing from './Pricing'
import AdminCampaigns from './Campaigns'
import AdminApprovals from './Approvals'

const tabs = [
  { key: 'pricing', label: 'الأسعار', icon: DollarSign },
  { key: 'campaigns', label: 'الحملات', icon: Flag },
  { key: 'approvals', label: 'الموافقات', icon: CheckSquare },
]

export default function SubscriptionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'pricing'

  function handleTabClick(key) {
    setSearchParams({ tab: key })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-2xl text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-border-light)] hover:text-[var(--color-text)]'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>
      {activeTab === 'pricing' && <AdminPricing />}
      {activeTab === 'campaigns' && <AdminCampaigns />}
      {activeTab === 'approvals' && <AdminApprovals />}
    </div>
  )
}
