import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bus, MapPin, Calendar, AlertTriangle, Check, RefreshCw, X, Play, List, Sun } from 'lucide-react'
import { api } from '../../lib/api'
import Modal from '../../components/ui/Modal'
import PageHeader from '../../components/ui/PageHeader'
import StatusBadge from '../../components/ui/StatusBadge'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { onDailyExceptionsUpdate, offDailyExceptionsUpdate } from '../../lib/socket'

export default function DailySubscriptionManagement() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'saturday'

  const [saturdaySubs, setSaturdaySubs] = useState([])
  const [saturdayOp, setSaturdayOp] = useState(null)
  const [dailySubs, setDailySubs] = useState([])
  const [buses, setBuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [assigningId, setAssigningId] = useState(null)
  const [selectedSub, setSelectedSub] = useState(null)
  const [busesLoading, setBusesLoading] = useState(false)

  useEffect(() => {
    onDailyExceptionsUpdate(() => { load() })
    return () => offDailyExceptionsUpdate()
  }, [])

  async function load() {
    const calls = [api.saturday.subscriptions(), api.dailySubscriptions.manage(), api.operations.getToday()]
    const [satRes, dailyRes, opRes] = await Promise.allSettled(calls)
    if (satRes.status === 'fulfilled') {
      setSaturdaySubs(satRes.value.subscribers || [])
      setSaturdayOp(satRes.value.operation || null)
    }
    if (dailyRes.status === 'fulfilled') {
      setDailySubs(dailyRes.value.dailySubscriptions || [])
    }
    if (opRes.status === 'fulfilled') {
      setBuses(opRes.value?.buses || [])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleOpenAssign(studentId) {
    setSelectedSub(studentId)
    setBusesLoading(true)
    try {
      const op = await api.operations.getToday()
      setBuses(op?.buses || [])
    } catch {
      setBuses([])
    } finally {
      setBusesLoading(false)
    }
  }

  async function handleConfirmBus(busId) {
    const studentId = selectedSub
    if (!studentId) return
    setAssigningId(studentId)
    try {
      await api.operations.addStudent(busId, studentId)
      setSelectedSub(null)
      await load()
    } catch (err) {
      alert(err.message)
    } finally {
      setAssigningId(null)
    }
  }

  const subscriberCount = saturdaySubs.length
  const dailyCount = dailySubs.length
  const saturdayActiveBuses = saturdayOp?.buses?.length || 0
  const saturdayAssigned = saturdayOp?.buses?.reduce((sum, b) => sum + (b.loads?.length || 0), 0) || 0

  if (loading) {
    return (
      <div>
        <PageHeader title="إدارة الاشتراكات اليومية" subtitle="الطلاب ذوو الاشتراكات اليومية والسبتية" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="إدارة الاشتراكات اليومية" subtitle="جميع الاشتراكات غير الموزعة">
        <button onClick={load} className="btn-ghost btn-sm">
          <RefreshCw size={16} /> تحديث
        </button>
      </PageHeader>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSearchParams({ tab: 'saturday' })}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
            tab === 'saturday'
              ? 'bg-purple-100 text-purple-700 shadow-sm'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-border-light)]'
          }`}
        >
          <Sun size={16} />
          السبت
          {subscriberCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-500 text-white text-[10px] font-bold">
              {subscriberCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setSearchParams({ tab: 'daily' })}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
            tab === 'daily'
              ? 'bg-blue-100 text-blue-700 shadow-sm'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-border-light)]'
          }`}
        >
          <List size={16} />
          الأيام العادية
          {dailyCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold">
              {dailyCount}
            </span>
          )}
        </button>
      </div>

      {tab === 'saturday' ? (
        <SaturdayTab
          subscribers={saturdaySubs}
          operation={saturdayOp}
          hasActiveBuses={saturdayActiveBuses > 0}
          assignedCount={saturdayAssigned}
          navigate={navigate}
        />
      ) : (
        <DailyTab
          subscriptions={dailySubs}
          buses={buses}
          busesLoading={busesLoading}
          assigningId={assigningId}
          selectedSub={selectedSub}
          onOpenAssign={handleOpenAssign}
          onConfirmBus={handleConfirmBus}
          onClose={() => setSelectedSub(null)}
        />
      )}
    </div>
  )
}

function SaturdayTab({ subscribers, operation, assignedCount, navigate }) {
  const hasOperation = operation && operation.status === 'OPEN'

  return (
    <div>
      {!hasOperation ? (
        <div>
          {subscribers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center min-h-[40vh]"
            >
              <div className="card p-10 text-center max-w-md w-full">
                <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-4">
                  <Sun size={32} className="text-purple-600" strokeWidth={1.5} />
                </div>
                <h2 className="text-xl font-bold mb-2">لا يوجد مشتركون للسبت</h2>
                <p className="text-sm text-[var(--color-text-muted)]">
                  لا يوجد طلاب لديهم اشتراك يوم السبت
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--color-text-muted)]">
                  {subscribers.length} طالب لديهم اشتراك يوم السبت
                </p>
              </div>

              <button
                onClick={() => navigate('/admin/saturday/operation')}
                className="w-full py-4 rounded-2xl bg-gradient-to-l from-purple-600 to-purple-500 text-white font-bold text-lg shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                <Play size={22} />
                بدء تشغيل السبت
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {subscribers.map((sub, idx) => {
                  const bs = sub.student?.busStudents?.[0]
                  return (
                    <motion.div
                      key={sub.subscriptionId}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="card p-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-sm font-bold text-purple-700 shrink-0">
                          {sub.student?.name?.[0] || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold mb-0.5">{sub.student?.name}</div>
                          <div className="space-y-0.5 text-xs text-[var(--color-text-muted)]">
                            <div className="flex items-center gap-1.5">
                              <MapPin size={12} />
                              <span>{sub.student?.zone || 'بدون منطقة'}</span>
                              {sub.student?.destination?.name && (
                                <><span className="text-[var(--color-border)]">|</span><span>{sub.student.destination.name}</span></>
                              )}
                            </div>
                            {bs ? (
                              <div className="flex items-center gap-1.5">
                                <Bus size={12} />
                                <span>الباص الأساسي: {bs.bus?.busNumber}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-amber-600">
                                <AlertTriangle size={12} />
                                <span>لا يوجد باص أساسي</span>
                              </div>
                            )}
                            {sub.executionDate && (
                              <div className="flex items-center gap-1.5">
                                <Calendar size={12} />
                                <span>{new Date(sub.executionDate).toLocaleDateString('ar-SA')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <StatusBadge status="warning" label="غير موزع" />
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium">تشغيل السبت نشط</span>
              <span className="text-xs text-[var(--color-text-muted)]">
                {operation?.buses?.length || 0} باصات · {assignedCount} طالب موزع
              </span>
            </div>
            <button
              onClick={() => navigate('/admin/saturday/operation')}
              className="btn-primary btn-sm"
            >
              فتح التشغيل
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {operation?.buses?.map(bd => (
              <div key={bd.id} className="card p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <Bus size={14} className="text-purple-700" />
                    </div>
                    <div>
                      <div className="font-bold text-sm">{bd.bus?.busNumber}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">{bd.driver?.name || 'بدون سائق'}</div>
                    </div>
                  </div>
                  <span className="text-xs font-medium">
                    {bd.loads?.length || 0} / {bd.capacitySnapshot}
                  </span>
                </div>
                {bd.loads?.length > 0 && (
                  <div className="space-y-1">
                    {bd.loads.map(ld => (
                      <div key={ld.id} className="flex items-center justify-between text-xs py-1 px-2 bg-[var(--color-border-light)] rounded-lg">
                        <span>{ld.student?.name}</span>
                        {ld.pickupTime && <span className="text-[var(--color-text-muted)]">{ld.pickupTime}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function DailyTab({ subscriptions, buses, busesLoading, assigningId, selectedSub, onOpenAssign, onConfirmBus, onClose }) {
  if (subscriptions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center min-h-[40vh]"
      >
        <div className="card p-10 text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-green-600" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-bold mb-2">جميع الطلاب موزعون</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            لا يوجد طلاب باشتراك يومي غير موزعين على باصات اليوم
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subscriptions.map((sub, idx) => {
          const isAssigning = assigningId === sub.studentId
          const bs = sub.defaultBus
          return (
            <motion.div
              key={sub.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-lg">{sub.student.name}</span>
                    {sub.isOffDay && <StatusBadge status="in_progress" label="تجاوز إجازة" />}
                  </div>

                  <div className="space-y-1 text-sm text-[var(--color-text-muted)]">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} />
                      <span>{sub.student.zone || 'بدون منطقة'}</span>
                      {sub.student.destinationName && (
                        <><span className="text-[var(--color-border)]">|</span><span>{sub.student.destinationName}</span></>
                      )}
                    </div>

                    {bs ? (
                      <div className="flex items-center gap-2">
                        <Bus size={14} />
                        <span>الباص الأساسي: {bs.busNumber}</span>
                        {sub.pickupTime && <span>· {sub.pickupTime}</span>}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle size={14} />
                        <span>لا يوجد باص افتراضي</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span>{new Date(sub.createdAt).toLocaleDateString('ar-SA')}</span>
                      {sub.amount && <><span className="text-[var(--color-border)]">|</span><span>{Number(sub.amount).toFixed(2)} ر.س</span></>}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <StatusBadge status="warning" label="غير مربوط" />
                  <button
                    onClick={() => onOpenAssign(sub.studentId)}
                    disabled={isAssigning}
                    className="btn-primary btn-sm"
                  >
                    {isAssigning ? <RefreshCw size={14} className="animate-spin" /> : <Bus size={14} />}
                    إضافة لباص
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      <Modal
        show={!!selectedSub}
        onClose={onClose}
        title="اختر باص لإضافة الطالب"
        footer={<button onClick={onClose} className="btn-ghost min-h-[44px]">إلغاء</button>}
        wide
      >
        {busesLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="skeleton h-20 w-full rounded-xl" />)}
          </div>
        ) : buses.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle size={32} className="mx-auto mb-2 text-amber-500" strokeWidth={1.5} />
            <p className="text-sm text-[var(--color-text-muted)]">لا توجد باصات عاملة اليوم</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">يجب إنشاء تشغيل اليوم أولاً</p>
          </div>
        ) : (
          <div className="space-y-2">
            {buses.map(bd => {
              const capacity = bd.bus?.capacity || 0
              const used = bd.studentCount || 0
              const remaining = capacity - used
              const isFull = remaining <= 0
              const fillPercent = capacity > 0 ? Math.round((used / capacity) * 100) : 0
              return (
                <button
                  key={bd.bus?.id}
                  onClick={() => !isFull && onConfirmBus(bd.bus?.id)}
                  disabled={isFull}
                  className={`w-full text-right px-4 py-3.5 rounded-xl border transition-all flex items-center gap-3 ${
                    isFull ? 'border-red-200 bg-red-50 opacity-60 cursor-not-allowed' : 'border-[var(--color-border)] hover:bg-[var(--color-primary-lighter)] hover:border-[var(--color-primary-light)]'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isFull ? 'bg-red-100 text-red-500' : 'bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)]'
                  }`}>
                    <Bus size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold">{bd.bus?.busNumber}</span>
                      <span className={`text-xs font-medium ${isFull ? 'text-red-600' : 'text-green-600'}`}>
                        {isFull ? 'ممتلئ' : `متبقي ${remaining}`}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[var(--color-text-muted)] mb-2">
                      <span>{bd.driver?.name || 'بدون سائق'}</span>
                      <span>{used} / {capacity}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[var(--color-border-light)] overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{
                        width: `${Math.min(fillPercent, 100)}%`,
                        backgroundColor: isFull ? '#DC2626' : fillPercent >= 80 ? '#D97706' : '#16A34A',
                      }} />
                    </div>
                  </div>
                  {isFull && <X size={16} className="text-red-400 shrink-0" />}
                </button>
              )
            })}
          </div>
        )}
      </Modal>
    </div>
  )
}
