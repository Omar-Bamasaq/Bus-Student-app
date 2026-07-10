import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Users, Bus, User, Flag, FileText, ArrowLeftRight, DollarSign, Clock, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'

const groups = [
  { key: 'students', icon: Users, label: 'الطلاب', color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'buses', icon: Bus, label: 'الحافلات', color: 'text-orange-600', bg: 'bg-orange-50' },
  { key: 'drivers', icon: User, label: 'السائقين', color: 'text-purple-600', bg: 'bg-purple-50' },
  { key: 'campaigns', icon: Flag, label: 'الحملات', color: 'text-green-600', bg: 'bg-green-50' },
  { key: 'sheets', icon: FileText, label: 'الكشوف', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { key: 'transfers', icon: ArrowLeftRight, label: 'التحويلات', color: 'text-red-600', bg: 'bg-red-50' },
  { key: 'pricing', icon: DollarSign, label: 'التسعير', color: 'text-yellow-600', bg: 'bg-yellow-50' },
]

const searchApis = {
  students: (q) => api.students.list({ search: q }).then(r => r.slice(0, 5)),
  buses: (q) => api.buses.list({ search: q }).then(r => r.slice(0, 5)),
  drivers: (q) => api.buses.list({ search: q }).then(r => r.slice(0, 5)),
  campaigns: (q) => api.campaigns.list().then(r => r.filter(c => c.name?.includes(q) || c.description?.includes(q)).slice(0, 5)),
  transfers: (q) => api.transfers.list({ search: q }).then(r => r.slice(0, 5)),
}

export default function SearchModal({ open, onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  function handleChange(val) {
    setQuery(val)
    if (!val.trim()) { setResults({}); return }
    setLoading(true)
    const trimmed = val.trim()
    Promise.all(
      groups.map(async (g) => {
        try {
          const fn = searchApis[g.key]
          if (!fn) return { key: g.key, items: [] }
          const items = await fn(trimmed)
          return { key: g.key, items }
        } catch { return { key: g.key, items: [] } }
      })
    ).then((res) => {
      const map = {}
      res.forEach(r => { if (r.items.length > 0) map[r.key] = r.items })
      setResults(map)
      setLoading(false)
    })
  }

  function handleSelect(group, item) {
    onClose()
    setQuery('')
    setResults({})
    if (group === 'students') navigate(`/admin/buses?studentId=${item.id}`)
    else if (group === 'buses') navigate(`/admin/buses/${item.id}`)
    else if (group === 'drivers') navigate(`/admin/buses?driverId=${item.id}`)
    else if (group === 'campaigns') navigate('/admin/finance/campaigns')
    else if (group === 'transfers') navigate('/admin/control/transfers')
  }

  if (!open) return null

  const totalResults = Object.values(results).reduce((a, b) => a + b.length, 0)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 z-[100] flex items-start justify-center pt-[12vh]"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="البحث العام"
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="بحث في الطلاب، الحافلات، الحملات..."
                className="flex-1 border-0 outline-none text-base bg-transparent placeholder:text-slate-400"
                onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
              />
              {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
              {query && (
                <button onClick={() => { setQuery(''); setResults({}) }} className="p-1 hover:bg-slate-100 rounded-lg">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex px-2 py-0.5 text-xs bg-slate-100 rounded text-slate-400 border border-slate-200">ESC</kbd>
            </div>

            {query && (
              <div className="max-h-[50vh] overflow-y-auto p-2">
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                )}
                {!loading && totalResults === 0 && (
                  <div className="py-8 text-center text-sm text-slate-400">لا توجد نتائج لـ "{query}"</div>
                )}
                {!loading && groups.map(g => {
                  const items = results[g.key]
                  if (!items || items.length === 0) return null
                  return (
                    <div key={g.key} className="mb-2">
                      <div className="flex items-center gap-2 px-3 py-1.5">
                        <g.icon className={`w-3.5 h-3.5 ${g.color}`} />
                        <span className="text-xs font-semibold text-slate-500">{g.label}</span>
                        <span className="text-xs text-slate-300">{items.length}</span>
                      </div>
                      {items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(g.key, item)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-right"
                        >
                          <div className={`w-8 h-8 rounded-lg ${g.bg} flex items-center justify-center`}>
                            <g.icon className={`w-4 h-4 ${g.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-700 truncate">{item.name || item.busNumber || item.studentName}</div>
                            <div className="text-xs text-slate-400 truncate">{item.phone || item.plateNumber || item.major || ''}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}

            {!query && (
              <div className="p-6 text-center text-sm text-slate-400">
                <div className="flex items-center justify-center gap-1.5 mb-2">
                  <Clock className="w-4 h-4" />
                  <span>ابحث عن أي شيء في النظام</span>
                </div>
                <div className="flex items-center justify-center gap-3 text-xs text-slate-300">
                  <span>Ctrl + K للبحث السريع</span>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
