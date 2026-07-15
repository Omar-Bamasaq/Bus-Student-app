import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, RefreshCw, Bus, Users, Eye, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '../../lib/api'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import StatusBadge from '../../components/ui/StatusBadge'
import { SkeletonCard } from '../../components/ui/Skeleton'
import ResponsiveKpiGrid from '../../components/ui/ResponsiveKpiGrid'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmModal from '../../components/ui/ConfirmModal'

function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function snapToSaturday(date) {
  const d = typeof date === 'string' ? parseDate(date) : new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = d.getDay()
  if (day === 6) return d
  const diff = day + 1
  d.setDate(d.getDate() - diff)
  return d
}

function formatDate(d) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function AdminSheets() {
  const [sheets, setSheets] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [weekStart, setWeekStart] = useState(formatDate(snapToSaturday(new Date())))
  const [showConfirm, setShowConfirm] = useState(null)
  const navigate = useNavigate()

  const load = useCallback(async () => {
    try {
      const data = await api.weeklySheets.getForWeek(weekStart)
      setSheets(Array.isArray(data) ? data : [])
    } catch (err) {
      setSheets([])
    } finally {
      setLoading(false)
    }
  }, [weekStart])

  useEffect(() => { load() }, [load])

  async function handleGenerate() {
    setGenerating(true)
    try {
      const result = await api.weeklySheets.generate(weekStart)
      await load()
    } catch (err) {
      alert(err.message)
    } finally {
      setGenerating(false)
    }
  }

  async function handleDelete(sheetId) {
    setShowConfirm(sheetId)
  }

  async function handleConfirmed() {
    const sheetId = showConfirm
    setShowConfirm(null)
    setDeleting(sheetId)
    try {
      await api.weeklySheets.delete(sheetId)
      await load()
    } catch (err) {
      alert(err.message)
    } finally {
      setDeleting(null)
    }
  }

  const weekEnd = parseDate(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 5)

  return (
    <div>
      <PageHeader title="الكشوف الأسبوعية" subtitle="إنشاء وإدارة كشوف الباصات الأسبوعية">
        <button onClick={handleGenerate} disabled={generating} className="btn-primary">
          <RefreshCw size={16} className={generating ? 'animate-spin' : ''} />
          {generating ? 'جاري الإنشاء...' : 'إنشاء الكشوف'}
        </button>
      </PageHeader>

      {/* Week pagination */}
      <div className="card p-4 mb-6">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => {
              const prev = parseDate(weekStart)
              prev.setDate(prev.getDate() - 7)
              setWeekStart(formatDate(prev))
            }}
            className="btn-ghost btn-sm"
          >
            <ChevronRight size={18} />
            الأسبوع السابق
          </button>

          <div className="text-center">
            <p className="font-bold">{parseDate(weekStart).toLocaleDateString('ar-SA', { month: 'long', day: 'numeric' })} - {weekEnd.toLocaleDateString('ar-SA', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            <p className="text-xs text-[var(--color-text-muted)]">الأسبوع يبدأ يوم السبت</p>
          </div>

          <button
            onClick={() => {
              const next = parseDate(weekStart)
              next.setDate(next.getDate() + 7)
              setWeekStart(formatDate(next))
            }}
            className="btn-ghost btn-sm"
          >
            الأسبوع التالي
            <ChevronLeft size={18} />
          </button>
        </div>
      </div>

      {/* Sheets */}
      {loading ? (
        <ResponsiveKpiGrid>{[1,2,3,4].map(i => <SkeletonCard key={i} />)}</ResponsiveKpiGrid>
      ) : sheets.length === 0 ? (
        <Section>
          <EmptyState icon={FileText} title="لا توجد كشوف" description={`لم يتم إنشاء كشوف لهذا الأسبوع بعد. اضغط على "إنشاء الكشوف" للبدء.`}
            action={handleGenerate} actionText="إنشاء الكشوف" />
        </Section>
      ) : (
        <ResponsiveKpiGrid>
          {sheets.map((sheet, idx) => (
            <motion.div
              key={sheet.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="card-hover p-2"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <p className="font-bold text-sm">باص {sheet.busNumber || sheet.bus?.busNumber || sheet.busId}</p>
                  {sheet.bus?.driver?.name && <p className="text-[10px] text-[var(--color-text-muted)]">{sheet.bus.driver.name}</p>}
                </div>
                {sheet.version > 1 && <StatusBadge status="active" label={`إصدار ${sheet.version}`} />}
              </div>

              <div className="flex items-center gap-2 text-[10px] text-[var(--color-text-muted)] mb-1.5">
                <span><Users size={10} className="inline" /> {sheet.studentCount || 0} طالب</span>
                <span>إصدار {sheet.version}</span>
              </div>

              <div className="flex gap-1.5 pt-2 border-t border-[var(--color-border)]">
                <button onClick={() => navigate(`/admin/reports/weekly-sheets/${sheet.id}`)} className="btn-ghost btn-sm px-2">
                  <Eye size={12} /> عرض
                </button>
                <button 
                  onClick={() => handleDelete(sheet.id)} 
                  disabled={deleting === sheet.id}
                  className="btn-ghost btn-sm px-2 text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={12} /> حذف
                </button>
              </div>
            </motion.div>
          ))}
        </ResponsiveKpiGrid>
      )}

      {sheets.length > 0 && (
        <div className="mt-4 text-center">
          <button onClick={() => navigate('/admin/reports/archive')} className="btn-ghost">
            <FileText size={16} /> أرشيف الكشوف الأسبوعية
          </button>
        </div>
      )}

      <ConfirmModal
        show={!!showConfirm}
        onClose={() => setShowConfirm(null)}
        onConfirm={handleConfirmed}
        title="تأكيد حذف الكشف"
        danger
      >
        هل أنت متأكد من حذف هذا الكشف؟
      </ConfirmModal>
    </div>
  )
}
