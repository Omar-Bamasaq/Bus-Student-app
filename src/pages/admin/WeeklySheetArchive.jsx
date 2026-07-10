import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronDown, Printer, Archive, FileText } from 'lucide-react'
import { api } from '../../lib/api'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonCard } from '../../components/ui/Skeleton'

function parseLocalDate(value) {
  if (value instanceof Date) {
    const d = new Date(value)
    d.setHours(0, 0, 0, 0)
    return d
  }
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-').map(Number)
      return new Date(year, month - 1, day)
    }
    const d = new Date(value)
    d.setHours(0, 0, 0, 0)
    return d
  }
  const d = new Date(value)
  d.setHours(0, 0, 0, 0)
  return d
}

export default function WeeklySheetArchive() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState({ weekStart: '', busId: '', driverName: '', studentName: '' })
  const [buses, setBuses] = useState([])

  useEffect(() => {
    api.buses.list().then(setBuses).catch(() => {})
  }, [])

  async function handleSearch() {
    setLoading(true)
    try {
      const params = {}
      if (search.weekStart) params.weekStart = search.weekStart
      if (search.busId) params.busId = search.busId
      if (search.driverName) params.driverName = search.driverName
      if (search.studentName) params.studentName = search.studentName
      const data = await api.weeklySheets.archiveSearch(params)
      setResults(data)
    } catch { setResults([]) } finally { setLoading(false) }
  }

  useEffect(() => { handleSearch() }, [])

  return (
    <div>
      <PageHeader title="أرشيف الكشوف الأسبوعية" subtitle="البحث في الكشوف السابقة">
        <a href="/admin/reports/weekly-sheets" className="btn-ghost btn-sm">← الكشوف</a>
      </PageHeader>

      <Section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">الأسبوع</label>
            <input type="date" value={search.weekStart} onChange={e => setSearch({ ...search, weekStart: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">الحافلة</label>
            <select value={search.busId} onChange={e => setSearch({ ...search, busId: e.target.value })} className="select-field">
              <option value="">الكل</option>
              {buses.map(b => <option key={b.id} value={b.id}>باص {b.busNumber}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">اسم السائق</label>
            <input value={search.driverName} onChange={e => setSearch({ ...search, driverName: e.target.value })} placeholder="بحث..." className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">اسم الطالب</label>
            <input value={search.studentName} onChange={e => setSearch({ ...search, studentName: e.target.value })} placeholder="بحث..." className="input-field" />
          </div>
        </div>
        <button onClick={handleSearch} className="btn-primary"><Search size={16} /> بحث</button>
      </Section>

      {loading ? (
        <div className="space-y-2 mt-4">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
      ) : results.length === 0 ? (
        <Section>
          <EmptyState icon={Archive} title="لا توجد نتائج" description="لم يتم العثور على كشوف أسبوعية تطابق معايير البحث" />
        </Section>
      ) : (
        <div className="space-y-2 mt-4">
          {results.map((r, idx) => (
            <details key={r.id} className="card group">
              <summary className="p-4 cursor-pointer select-none list-none flex items-center justify-between" style={{ '&::-webkit-details-marker': { display: 'none' } }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-lighter)] flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-[var(--color-primary-dark)]" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm">باص {r.busNumber}</div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      {r.driverName || 'بدون سائق'} · {parseLocalDate(r.weekStart).toLocaleDateString('ar-SA')} - {parseLocalDate(r.weekEnd).toLocaleDateString('ar-SA')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="badge">{r.versions?.length || 1} إصدار</span>
                  <ChevronDown size={16} className="text-[var(--color-text-muted)] transition-transform group-open:rotate-180" />
                </div>
              </summary>
              <div className="px-4 pb-4 border-t border-[var(--color-border)]">
                <div className="pt-3 space-y-1">
                  {(r.versions || []).map((v, i) => (
                    <div key={i} className="flex items-center justify-between bg-[var(--color-border-light)] rounded-xl px-3 py-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">الإصدار {v.version}</span>
                        <span className="text-xs text-[var(--color-text-muted)]">{v.studentCount} طالب</span>
                        {v.generatedByName && <span className="text-xs text-[var(--color-text-muted)]">بواسطة {v.generatedByName}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {v.isCurrent && <StatusBadge status="success" label="الحالي" />}
                        <a href={`/admin/reports/weekly-sheets/${r.id}/print`} target="_blank" className="btn-ghost btn-sm" title="طباعة"><Printer size={14} /></a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}
