import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Users, Bus, FileText, DollarSign, Calendar, ArrowLeftRight, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'

const searchSources = [
  { key: 'students', label: 'الطلاب', icon: Users, path: '/admin/students' },
  { key: 'buses', label: 'الحافلات', icon: Bus, path: '/admin/buses' },
  { key: 'campaigns', label: 'الحملات', icon: FileText, path: '/admin/finance/campaigns' },
  { key: 'transfers', label: 'التحويلات', icon: ArrowLeftRight, path: '/admin/control/transfers' },
]

export default function GlobalSearch({ open, onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setResults({})
      setSelectedIdx(0)
    }
  }, [open])

  useEffect(() => {
    if (!query.trim()) { setResults({}); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const q = query.toLowerCase()
        const [students, buses] = await Promise.all([
          api.students.list({ search: q }).catch(() => []),
          api.buses.list({}).catch(() => []),
        ])
        setResults({
          students: students.filter(s => s.name?.toLowerCase().includes(q) || s.phone?.includes(q)).slice(0, 5),
          buses: buses.filter(b => b.busNumber?.includes(q) || b.plateNumber?.includes(q) || b.driver?.name?.toLowerCase().includes(q)).slice(0, 5),
        })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  const flatResults = Object.entries(results).flatMap(([key, items]) =>
    items.map((item, idx) => ({ key, item, idx }))
  )

  function handleSelect(key, item) {
    onClose()
    if (key === 'students') navigate(`/admin/students?search=${item.name}`)
    else if (key === 'buses') navigate(`/admin/buses`)
    else if (key === 'campaigns') navigate('/admin/finance/campaigns')
    else if (key === 'transfers') navigate('/admin/control/transfers')
  }

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIdx(i => Math.min(i + 1, flatResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && flatResults[selectedIdx]) {
      handleSelect(flatResults[selectedIdx].key, flatResults[selectedIdx].item)
    } else if (e.key === 'Escape') {
      onClose()
    }
  }, [flatResults, selectedIdx, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 border-b border-[var(--color-border)]">
              <Search size={20} className="text-[var(--color-text-muted)] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="ابحث عن طلاب، حافلات، مسارات..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedIdx(0) }}
                className="flex-1 py-4 text-base bg-transparent outline-none border-none"
              />
              {loading && <div className="w-4 h-4 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />}
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--color-border-light)]">
                <X size={18} className="text-[var(--color-text-muted)]" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto p-2">
              {!query.trim() ? (
                <div className="text-center py-8 text-sm text-[var(--color-text-muted)]">
                  ابدأ الكتابة للبحث في النظام
                </div>
              ) : flatResults.length === 0 && !loading ? (
                <div className="text-center py-8 text-sm text-[var(--color-text-muted)]">
                  لا توجد نتائج لـ &quot;{query}&quot;
                </div>
              ) : (
                Object.entries(results).map(([key, items]) => {
                  if (!items.length) return null
                  const source = searchSources.find(s => s.key === key)
                  const Icon = source?.icon || Search
                  return (
                    <div key={key}>
                      <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-[var(--color-text-muted)]">
                        <Icon size={14} />
                        {source?.label || key}
                      </div>
                      {items.map((item, idx) => {
                        const globalIdx = flatResults.findIndex(r => r.key === key && r.item === item)
                        return (
                          <button
                            key={item.id}
                            className={`w-full text-right px-3 py-2 rounded-xl text-sm flex items-center gap-3 transition-colors ${
                              globalIdx === selectedIdx ? 'bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)]' : 'hover:bg-[var(--color-border-light)]'
                            }`}
                            onClick={() => handleSelect(key, item)}
                            onMouseEnter={() => setSelectedIdx(globalIdx)}
                          >
                            <div className="w-8 h-8 rounded-lg bg-[var(--color-border-light)] flex items-center justify-center shrink-0">
                              <Icon size={14} className="text-[var(--color-text-secondary)]" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{item.name || item.busNumber || item.studentName}</p>
                              <p className="text-xs text-[var(--color-text-muted)] truncate">
                                {item.phone || item.plateNumber || item.area || item.major || ''}
                              </p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer hints */}
            <div className="flex items-center gap-4 px-4 py-2 border-t border-[var(--color-border)] text-[10px] text-[var(--color-text-muted)]">
              <span>↑↓ للتنقل</span>
              <span>↵ للاختيار</span>
              <span>Esc للإغلاق</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
