import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import { connectSocket, joinDriverBusRoom, leaveDriverBusRoom, onDriverOperationUpdate, offDriverOperationUpdate } from '../../lib/socket'
import { useNotifications } from '../../context/NotificationContext'
import { MapPin, Home, Check } from 'lucide-react'

export default function ReturnTrip() {
  const { user } = useAuth()
  const { addNotification } = useNotifications()
  const [busData, setBusData] = useState(null)
  const [students, setStudents] = useState([])
  const [tripStatus, setTripStatus] = useState('idle')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [noReturnTrip, setNoReturnTrip] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [direction, setDirection] = useState(1)
  const [droppedOffCount, setDroppedOffCount] = useState(0)
  const [activeBusId, setActiveBusId] = useState(null)

  const loadData = useCallback(async () => {
    try {
      const myBuses = await api.buses.list({ driverId: user.id, status: 'active' }).catch(() => [])
      const myBus = myBuses[0]
      if (!myBus) {
        setNoReturnTrip(true)
        setLoading(false)
        return
      }

      const activeBuses = await api.return.activeBuses.list()
      const myActiveBus = activeBuses.find(b => b.bus.id === myBus.id)
      if (!myActiveBus) {
        setNoReturnTrip(true)
        setLoading(false)
        return
      }

      if (myActiveBus.returnCompletedAt || myActiveBus.status !== 'DEPARTED') {
        setNoReturnTrip(true)
        setLoading(false)
        return
      }

      setBusData(myActiveBus)
      setActiveBusId(myActiveBus.id)
      setStudents(myActiveBus.loads || [])

      if (!myActiveBus.loads || myActiveBus.loads.length === 0) {
        setNoReturnTrip(true)
      }
    } catch (err) {
      console.error(err)
      setNoReturnTrip(true)
    } finally {
      setLoading(false)
    }
  }, [user.id])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) connectSocket(token)
    loadData()
  }, [loadData])

  useEffect(() => {
    if (busData?.bus?.id) {
      joinDriverBusRoom(busData.bus.id)
      onDriverOperationUpdate((payload) => {
        if (payload.type === 'driver_bus_removed' || payload.type === 'driver_trip_cancelled') {
          setNoReturnTrip(true)
        }
        if (payload.priority === 'CRITICAL' && payload.title) {
          addNotification(payload.title, payload.message || '', 'warning')
        }
      })
      return () => {
        leaveDriverBusRoom(busData.bus.id)
        offDriverOperationUpdate()
      }
    }
  }, [busData?.bus?.id, addNotification])

  async function handleDropoff() {
    const studentId = students[currentIndex]?.studentId
    if (!studentId || submitting) return
    setSubmitting(true)
    try {
      await api.return.loads.dropoff(activeBusId, studentId)
      setDroppedOffCount(prev => prev + 1)

      if (currentIndex < students.length - 1) {
        setDirection(1)
        setCurrentIndex(prev => prev + 1)
      } else {
        setTripStatus('completed')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  function handleStartReturnTrip() {
    setCurrentIndex(0)
    setDirection(1)
    setTripStatus('in_progress')
  }

  async function handleEndReturnTrip() {
    try {
      await api.return.complete(activeBusId)
      setTripStatus('just_completed')
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-400 text-sm">جاري التحميل...</div>
      </div>
    )
  }

  if (noReturnTrip) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 max-w-sm text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800">لا توجد رحلة عودة لهذا اليوم.</h2>
        </div>
      </div>
    )
  }

  if (tripStatus === 'just_completed') {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl p-4 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-base font-bold text-slate-800">تم إنهاء رحلة العودة</h2>
        </div>
      </div>
    )
  }

  const bus = busData.bus
  const driver = busData.driver

  if (tripStatus === 'idle') {
    const lineLabel = busData.line === 'BAHRY' ? 'بحري' : busData.line === 'JEBALI' ? 'جبلي' : 'غير محدد'
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-bold text-slate-800">باص {bus.busNumber}</h1>
              <p className="text-xs text-slate-500">السائق: {driver?.name || 'غير محدد'}</p>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-green-50 text-green-700">
              <span className="w-1 h-1 rounded-full bg-green-500" />
              متصل
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-slate-50 rounded-lg p-2.5 text-center">
              <p className="text-lg font-bold text-slate-800">{students.length}</p>
              <p className="text-[10px] text-slate-500">الطلاب</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2.5 text-center">
              <p className="text-lg font-bold text-slate-800">{lineLabel}</p>
              <p className="text-[10px] text-slate-500">الطريق</p>
            </div>
          </div>
          <button
            onClick={handleStartReturnTrip}
            className="w-full bg-[var(--color-primary)] text-white py-4 rounded-xl font-bold text-base hover:brightness-110 transition-all min-h-[52px]"
          >
            بدء رحلة العودة
          </button>
        </div>
      </div>
    )
  }

  if (tripStatus === 'completed') {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl p-4 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-base font-bold text-slate-800 mb-3">اكتمل إنزال جميع الطلاب</h2>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-slate-50 rounded-lg p-2">
              <p className="text-lg font-bold text-slate-800">{students.length}</p>
              <p className="text-[10px] text-slate-500">إجمالي الطلاب</p>
            </div>
            <div className="bg-green-50 rounded-lg p-2">
              <p className="text-lg font-bold text-green-700">{droppedOffCount}</p>
              <p className="text-[10px] text-green-600">تم الإنزال</p>
            </div>
          </div>
          <button
            onClick={handleEndReturnTrip}
            className="w-full bg-[var(--color-primary)] text-white py-3.5 rounded-xl font-bold text-sm hover:brightness-110 transition-all min-h-[48px]"
          >
            إنهاء رحلة العودة
          </button>
        </div>
      </div>
    )
  }

  const currentLoad = students[currentIndex]
  const currentStudent = currentLoad?.student
  const isHomeDelivery = currentStudent?.transportMode === 'HOME'
  const dropoffLocation = isHomeDelivery
    ? (currentStudent?.homeAddress || null)
    : (currentStudent?.pickupLocation || currentStudent?.address || null)
  const remaining = students.length - (currentIndex + 1)

  return (
    <div className="max-w-lg mx-auto space-y-2 pb-4">
      {/* Progress bar */}
      <div className="bg-white rounded-xl px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-slate-800">باص {bus.busNumber}</span>
          <div className="text-left">
            <p className="text-xs font-bold text-[var(--color-primary)]">
              {currentIndex + 1} / {students.length}
            </p>
            <p className="text-[10px] text-slate-400">المتبقي: {remaining}</p>
          </div>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5">
          <div className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / students.length) * 100}%` }} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: direction * 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -60 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-xl p-3"
        >
          <div className="text-center mb-2">
            <h2 className="text-lg font-bold text-slate-800">{currentStudent?.name}</h2>
            {currentStudent?.institutionName && (
              <p className="text-xs text-slate-500 mt-0.5">{currentStudent.institutionName}</p>
            )}
          </div>

          {/* Details row */}
          <div className="flex items-center justify-center gap-2 mb-3">
            {isHomeDelivery && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 text-orange-700 px-2 py-1 text-xs font-medium whitespace-nowrap">
                <Home size={12} /> توصيل منزلي
              </span>
            )}
            <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 max-w-[60%]">
              <MapPin size={12} className="text-slate-500 shrink-0" />
              <span className="text-xs text-slate-700 truncate">{dropoffLocation || 'غير محدد'}</span>
            </div>
          </div>

          <button
            onClick={handleDropoff}
            disabled={submitting}
            className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-base hover:brightness-110 transition-all disabled:opacity-50 min-h-[52px]"
          >
            <Check size={20} className="inline ml-1 -mt-0.5" />
            تم الإنزال
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
