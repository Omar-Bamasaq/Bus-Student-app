import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Bus, ArrowRight, Users, Clock } from 'lucide-react'
import { api } from '../../lib/api'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import StatusBadge from '../../components/ui/StatusBadge'
import { SkeletonCard } from '../../components/ui/Skeleton'
import ResponsiveKpiGrid from '../../components/ui/ResponsiveKpiGrid'
import EmptyState from '../../components/ui/EmptyState'

export default function DepartedTrips() {
  const [departed, setDeparted] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await api.return.departed()
      setDeparted(Array.isArray(data) ? data : [])
    } catch (err) { console.error(err)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div>
        <PageHeader title="الرحلات المنطلقة" subtitle="الباصات التي غادرت" />
        <ResponsiveKpiGrid>{[1,2,3].map(i => <SkeletonCard key={i} />)}</ResponsiveKpiGrid>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="الرحلات المنطلقة" subtitle="الباصات التي غادرت في رحلة الرجوع" />

      {departed.length === 0 ? (
        <Section>
          <EmptyState icon={Bus} title="لا توجد رحلات منطلقة" description="جميع الباصات في انتظار الرجوع أو لم تبدأ عملية الرجوع بعد" />
        </Section>
      ) : (
        <div className="space-y-1.5">
          {departed.map((bus, idx) => (
            <motion.div key={bus.id || idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
              className="card p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-success-light)] flex items-center justify-center">
                    <Bus size={16} className="text-green-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm">{bus.bus?.busNumber || bus.busNumber || 'باص'}</span>
                      <StatusBadge status="active" label="منطلق" />
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[var(--color-text-muted)]">
                      {bus.driver?.name && <span>{bus.driver.name}</span>}
                      <span><Users size={10} className="inline" /> {bus.loads?.length || 0}</span>
                      {bus.departedAt && <span><Clock size={10} className="inline" /> {new Date(bus.departedAt).toLocaleTimeString('ar-SA')}</span>}
                    </div>
                  </div>
                </div>
                <ArrowRight size={14} className="text-green-500" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
