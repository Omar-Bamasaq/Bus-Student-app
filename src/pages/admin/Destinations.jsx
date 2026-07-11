import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Plus, X, Check, Edit2, Trash2 } from 'lucide-react'
import { api } from '../../lib/api'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import ResponsiveKpiGrid from '../../components/ui/ResponsiveKpiGrid'
import { SkeletonCard } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'

export default function AdminDestinations() {
  const [destinations, setDestinations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [name, setName] = useState('')
  const [sortOrder, setSortOrder] = useState(0)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await api.destinations.list()
      setDestinations(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openAdd() {
    setEditing(null)
    setName('')
    setSortOrder(0)
    setShowForm(true)
  }

  function openEdit(dest) {
    setEditing(dest.id)
    setName(dest.name)
    setSortOrder(dest.sortOrder || 0)
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return alert('اسم الوجهة مطلوب')
    setSaving(true)
    try {
      if (editing) {
        await api.destinations.update(editing, { name: name.trim(), sortOrder })
      } else {
        await api.destinations.create({ name: name.trim(), sortOrder })
      }
      setShowForm(false)
      setEditing(null)
      load()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(dest) {
    try {
      await api.destinations.update(dest.id, { isActive: !dest.isActive })
      load()
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleDelete(dest) {
    if (!confirm(`هل تريد حذف الوجهة "${dest.name}"؟`)) return
    try {
      await api.destinations.delete(dest.id)
      load()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="الوجهات"
        subtitle="إدارة وجهات الطلاب (جامعات وكليات)"
        actions={
          <button onClick={openAdd} className="btn-primary">
            <Plus size={16} /> إضافة وجهة
          </button>
        }
      />

      <ResponsiveKpiGrid
        items={[
          { label: 'إجمالي الوجهات', value: destinations.length, icon: MapPin, color: 'blue' },
          { label: 'الوجهات النشطة', value: destinations.filter(d => d.isActive).length, icon: Check, color: 'green' },
          { label: 'الوجهات المعطلة', value: destinations.filter(d => !d.isActive).length, icon: X, color: 'red' },
        ]}
      />

      {showForm && (
        <Section title={editing ? 'تعديل وجهة' : 'إضافة وجهة جديدة'}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">اسم الوجهة *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  placeholder="مثال: جامعة حضرموت (فلك)"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ترتيب العرض</label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="input"
                  min={0}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'جاري الحفظ...' : editing ? 'تحديث' : 'إضافة'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                إلغاء
              </button>
            </div>
          </form>
        </Section>
      )}

      <Section title="قائمة الوجهات">
        <div className="flex justify-end mb-4">
          <button onClick={openAdd} className="btn-primary">
            <Plus size={16} /> إضافة وجهة جديدة
          </button>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : destinations.length === 0 ? (
          <div className="space-y-4">
            <EmptyState icon={MapPin} title="لا توجد وجهات" description="أضف وجهة جديدة للبدء" />
          </div>
        ) : (
          <div className="grid gap-4">
            {destinations.map(dest => (
              <motion.div
                key={dest.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${dest.isActive ? 'gradient-accent' : 'bg-gray-200'}`}>
                    <MapPin size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-medium">{dest.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      الترتيب: {dest.sortOrder} | {dest.isActive ? 'نشط' : 'معطل'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(dest)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${dest.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                  >
                    {dest.isActive ? 'نشط' : 'معطل'}
                  </button>
                  <button onClick={() => openEdit(dest)} className="btn-icon" title="تعديل">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(dest)} className="btn-icon text-red-500" title="حذف">
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}
