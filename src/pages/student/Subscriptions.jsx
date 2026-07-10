import { useState, useEffect, useMemo } from 'react'
import { NavLink, Navigate, useLocation } from 'react-router-dom'
import { CalendarDays, CreditCard, Clock, FileText, Upload, ShoppingCart, Trash2 } from 'lucide-react'
import { resolveDailyExecutionDates } from '../../../backend/src/utils/dateUtils.js'
import { api } from '../../lib/api'

const PLAN_LABELS = {
  DAILY: 'يومي',
  THREE_WEEKS: 'ثلاثة أسابيع',
  FOUR_WEEKS: 'أربعة أسابيع',
}

const STATUS_LABELS = {
  pending: 'قيد المراجعة',
  active: 'نشط',
  expired: 'منتهي',
  rejected: 'مرفوض',
  cancelled: 'ملغي',
}

const DAY_NAMES_AR = {
  SATURDAY: 'السبت',
  SUNDAY: 'الأحد',
  MONDAY: 'الإثنين',
  TUESDAY: 'الثلاثاء',
  WEDNESDAY: 'الأربعاء',
  THURSDAY: 'الخميس',
}

const WEEKDAYS = [
  { value: 'SATURDAY', label: 'السبت' },
  { value: 'SUNDAY', label: 'الأحد' },
  { value: 'MONDAY', label: 'الإثنين' },
  { value: 'TUESDAY', label: 'الثلاثاء' },
  { value: 'WEDNESDAY', label: 'الأربعاء' },
  { value: 'THURSDAY', label: 'الخميس' },
]

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([])
  const [pricing, setPricing] = useState([])
  const [student, setStudent] = useState(null)
  const [campaigns, setCampaigns] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)

  const [dailyWeeks, setDailyWeeks] = useState(1)
  const [dailyDays, setDailyDays] = useState([])
  const [dailyAddingToCart, setDailyAddingToCart] = useState(false)
  const [dailySuccess, setDailySuccess] = useState('')
  const [dailyError, setDailyError] = useState('')

  const [campaignEnrolling, setCampaignEnrolling] = useState(null)
  const [campaignSubmitting, setCampaignSubmitting] = useState(false)
  const [campaignSuccess, setCampaignSuccess] = useState('')
  const [campaignError, setCampaignError] = useState('')

  const [cart, setCart] = useState(null)
  const [cartReceipt, setCartReceipt] = useState('')
  const [cartSubmitting, setCartSubmitting] = useState(false)
  const [cartSuccess, setCartSuccess] = useState('')
  const [cartError, setCartError] = useState('')

  const [destPricing, setDestPricing] = useState([])

  useEffect(() => {
    let cancelled = false
    async function loadData() {
      const results = await Promise.allSettled([
        api.studentPortal.getSubscriptions(),
        api.studentPortal.getPricing(),
        api.studentPortal.getDashboard(),
        api.campaigns.active(),
        api.enrollments.list({}),
        api.cart.get(),
      ])
      if (cancelled) return
      const [subsResult, pricesResult, dashResult, campsResult, enrsResult, cartResult] = results
      if (subsResult.status === 'fulfilled') setSubscriptions(subsResult.value)
      if (pricesResult.status === 'fulfilled') setPricing(pricesResult.value)
      if (dashResult.status === 'fulfilled') {
        const studentData = dashResult.value.student
        setStudent(studentData)
        if (studentData?.destinationId) {
          try {
            const dp = await api.studentPortal.getPricingByDestination(studentData.destinationId)
            if (dp) setDestPricing(dp)
          } catch (_) {}
        }
      }
      if (campsResult.status === 'fulfilled') {
        const camps = campsResult.value
        const subCamps = (Array.isArray(camps) ? camps : []).filter(
          c => c.type === 'subscription_3weeks' || c.type === 'subscription_4weeks'
        )
        setCampaigns(subCamps)
      }
      if (enrsResult.status === 'fulfilled') {
        setEnrollments(Array.isArray(enrsResult.value) ? enrsResult.value : [])
      }
      if (cartResult.status === 'fulfilled' && cartResult.value.cart) {
        setCart(cartResult.value.cart)
      }
      setLoading(false)
    }
    loadData()
    return () => { cancelled = true }
  }, [])

  const today = useMemo(() => { const d = new Date(); d.setUTCHours(0,0,0,0); return d }, [])
  const activeCampaigns = useMemo(() => {
    return campaigns.filter(c => new Date(c.startDate) <= today)
  }, [campaigns, today])
  const upcomingCampaigns = useMemo(() => {
    return campaigns.filter(c => new Date(c.startDate) > today)
  }, [campaigns, today])

  const zone = student?.zone
  const destId = student?.destinationId
  const zonePricing = useMemo(() => {
    if (!zone) return null
    return pricing.find(z => z.name === zone) || null
  }, [zone, pricing])

  const destZonePricing = useMemo(() => {
    if (!zone || !destId) return null
    return destPricing.find(z => z.name === zone) || null
  }, [zone, destId, destPricing])

  const location = useLocation()

  const dailyPrice = useMemo(() => {
    const zp = destZonePricing
    if (!zp) return 0
    const p = zp.prices?.find(pr => pr.plan === 'DAILY')
    return p ? Number(p.price) : 0
  }, [zonePricing, destZonePricing])

  const weeklyPrices = useMemo(() => {
    const zp = destZonePricing
    if (!zp) return { THREE_WEEKS: 0, FOUR_WEEKS: 0 }
    const three = zp.prices?.find(pr => pr.plan === 'THREE_WEEKS')
    const four = zp.prices?.find(pr => pr.plan === 'FOUR_WEEKS')
    return {
      THREE_WEEKS: three ? Number(three.price) : 0,
      FOUR_WEEKS: four ? Number(four.price) : 0,
    }
  }, [zonePricing, destZonePricing])

  const dailyHomeFee = useMemo(() => {
    if (!student?.homeDeliveryActive || !zonePricing) return 0
    if (dailyWeeks === 1 && student.homeDeliveryFeeDaily != null && Number(student.homeDeliveryFeeDaily) > 0) {
      return Number(student.homeDeliveryFeeDaily)
    }
    if (dailyWeeks === 3 && student.homeDeliveryFeeThreeWeeks != null && Number(student.homeDeliveryFeeThreeWeeks) > 0) {
      return Number(student.homeDeliveryFeeThreeWeeks)
    }
    if (dailyWeeks === 4 && student.homeDeliveryFeeFourWeeks != null && Number(student.homeDeliveryFeeFourWeeks) > 0) {
      return Number(student.homeDeliveryFeeFourWeeks)
    }
    return Number(zonePricing.homeNearSurcharge || 0)
  }, [student, zonePricing])

  const { dates: computedDates } = useMemo(() => {
    if (!dailyDays.length) return { dates: [], startDate: null, endDate: null, weekCount: 0 }
    return resolveDailyExecutionDates({ selectedDays: dailyDays, durationWeeks: dailyWeeks })
  }, [dailyDays, dailyWeeks])

  const dailyTotal = useMemo(() => {
    return (dailyPrice + dailyHomeFee) * computedDates.length
  }, [dailyPrice, dailyHomeFee, computedDates])

  function toggleDay(day) {
    setDailyDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
    setDailyError('')
    setDailySuccess('')
  }

  const handleAddDailyToCart = async () => {
    setDailyError('')
    setDailySuccess('')
    if (!dailyDays.length) {
      setDailyError('يرجى اختيار يوم واحد على الأقل')
      return
    }
    if (computedDates.length === 0) {
      setDailyError('لا توجد تواريخ صالحة')
      return
    }
    setDailyAddingToCart(true)
    try {
      await api.cart.addItem({
        type: 'DAILY',
        zoneId: zonePricing?.id || null,
        destinationId: student?.destinationId || null,
        amount: dailyTotal,
        homeDeliveryFee: dailyHomeFee > 0 ? dailyHomeFee : null,
        data: {
          selectedDays: dailyDays,
          weeksCount: dailyWeeks,
          computedDates: computedDates.map(d => d.toISOString()),
        },
      })
      setDailySuccess('تمت إضافة الاشتراك اليومي إلى السلة')
      setDailyDays([])
      setDailyWeeks(1)
      const cartRes = await api.cart.get()
      setCart(cartRes.cart)
    } catch (e) {
      setDailyError(e.message)
    } finally {
      setDailyAddingToCart(false)
    }
  }

  const handleAddCampaignToCart = async (campaign) => {
    setCampaignError('')
    setCampaignSuccess('')
    setCampaignSubmitting(true)
    try {
      const price = getCampaignPrice(campaign)
      const plan = campaign.type === 'subscription_3weeks' ? 'THREE_WEEKS' : 'FOUR_WEEKS'
      const weeksCount = plan === 'THREE_WEEKS' ? 3 : 4
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const snapStart = new Date(today)
      const snapEnd = new Date(today)
      snapEnd.setDate(snapEnd.getDate() + weeksCount * 7 - 1)
      const itemData = {
        weeksCount,
        campaignId: campaign.id,
        campaignTitle: campaign.title,
        baseAmount: price.baseAmount,
        discount: price.discount,
        startDate: snapStart.toISOString(),
        endDate: snapEnd.toISOString(),
      }
      if (price.extraFee?.type && price.extraFee?.amount) {
        itemData.extraFeeType = price.extraFee.type
        itemData.extraFeeAmount = price.extraFee.amount
      }
      await api.cart.addItem({
        type: plan,
        zoneId: zonePricing?.id || null,
        destinationId: student?.destinationId || null,
        amount: price.finalAmount,
        homeDeliveryFee: price.surcharge > 0 ? price.surcharge : null,
        data: itemData,
      })
      setCampaignSuccess(`تمت إضافة "${campaign.title}" إلى السلة`)
      setCampaignEnrolling(null)
      const cartRes = await api.cart.get()
      setCart(cartRes.cart)
    } catch (e) {
      setCampaignError(e.message)
    } finally {
      setCampaignSubmitting(false)
    }
  }

  function isEarlyDiscountActive(campaign) {
    if (!campaign.hasEarlyDiscount) return false
    if (!campaign.discountStart || !campaign.discountExpiry) return false
    if (!campaign.discountAmount || Number(campaign.discountAmount) <= 0) return false
    const now = new Date()
    const start = new Date(campaign.discountStart)
    const end = new Date(campaign.discountExpiry)
    return now >= start && now <= end
  }

  function isLateRegistration(campaign) {
    if (!campaign.hasEarlyDiscount || !campaign.discountExpiry) return false
    return new Date() > new Date(campaign.discountExpiry)
  }

  function isNewStudent() {
    const hasActiveOrExpiredSub = subscriptions.some(s => s.status === 'active' || s.status === 'expired')
    if (hasActiveOrExpiredSub) return false
    const hasApprovedEnrollment = enrollments.some(e => e.receiptStatus === 'APPROVED')
    if (hasApprovedEnrollment) return false
    return true
  }

  function getExtraFeeInfo(campaign) {
    if (!campaign.enableExtraRegistrationFee) {
      return { type: null, amount: 0, label: null }
    }
    if (campaign.extraFeeStart && new Date() < new Date(campaign.extraFeeStart)) {
      return { type: null, amount: 0, label: null }
    }
    if (isLateRegistration(campaign)) {
      return { type: 'LATE_REGISTRATION', amount: Number(campaign.extraRegistrationFee), label: 'رسوم طالب متأخر' }
    }
    if (isNewStudent()) {
      return { type: 'NEW_STUDENT', amount: Number(campaign.extraRegistrationFee), label: 'رسوم طالب جديد' }
    }
    return { type: null, amount: 0, label: null }
  }

  function getCampaignPrice(campaign) {
    const plan = campaign.type === 'subscription_3weeks' ? 'THREE_WEEKS' : 'FOUR_WEEKS'
    // Prefer destination-specific prices (destZonePricing) then fall back to zone defaults
    const pricingRow = destZonePricing?.prices?.find(p => p.plan === plan) || zonePricing?.prices?.find(p => p.plan === plan)
    // If still not found, fall back to zone-level default fields
    const baseAmount = pricingRow ? Number(pricingRow.price) : (plan === 'THREE_WEEKS' ? Number(zonePricing?.threeWeeksPrice || 0) : Number(zonePricing?.fourWeeksPrice || 0))
    const surcharge = student?.homeDeliveryActive
      ? Number(
          plan === 'THREE_WEEKS'
            ? (student.homeDeliveryFeeThreeWeeks != null && Number(student.homeDeliveryFeeThreeWeeks) > 0
                ? student.homeDeliveryFeeThreeWeeks
                : (zonePricing?.homeMediumSurcharge || 0))
            : (student.homeDeliveryFeeFourWeeks != null && Number(student.homeDeliveryFeeFourWeeks) > 0
                ? student.homeDeliveryFeeFourWeeks
                : (zonePricing?.homeFarSurcharge || 0))
        )
      : 0

    const originalPrice = baseAmount
    const earlyDiscount = isEarlyDiscountActive(campaign)
    let discountVal = 0
    let discountedPrice = originalPrice
    if (earlyDiscount) {
      discountVal = Number(campaign.discountAmount) || 0
      discountedPrice = Math.max(0, originalPrice - discountVal)
    }

    const extraFee = getExtraFeeInfo(campaign)
    const finalAmount = discountedPrice + surcharge + extraFee.amount
    return { baseAmount, surcharge, discount: discountVal, discountedPrice, finalAmount, originalPrice, hasDiscount: earlyDiscount, extraFee }
  }

  function getExistingEnrollment(campaignId) {
    return enrollments.find(e => e.campaignId === campaignId && e.studentId === student?.id)
  }

  const activeDailySubscriptions = subscriptions.filter(s => s.type === 'DAILY' && s.status === 'active')
  const activeWeeklySubscriptions = subscriptions.filter(s => s.type !== 'DAILY' && s.status === 'active')
  const nonActiveSubscriptions = subscriptions.filter(s => s.status !== 'active')
  const sortedAreaPrices = useMemo(() => {
    return [...pricing].sort((a, b) => {
      const aPrice = Number(a.prices?.find(p => p.plan === 'FOUR_WEEKS')?.price || 0)
      const bPrice = Number(b.prices?.find(p => p.plan === 'FOUR_WEEKS')?.price || 0)
      return bPrice - aPrice
    })
  }, [pricing])

  if (loading) {
    return <div className="text-center py-12 text-slate-400 text-sm">جاري التحميل...</div>
  }

  const tabItems = [
    { key: 'daily', label: 'اليومي' },
    { key: 'weekly', label: 'الأسبوعي' },
    { key: 'current', label: 'الأسعار' },
    { key: 'history', label: 'السجل' },
  ]

  function StatusBadge({ status }) {
    const colors = {
      expired: 'bg-red-100 text-red-600',
      cancelled: 'bg-yellow-100 text-yellow-600',
      pending: 'bg-orange-100 text-orange-600',
      rejected: 'bg-red-100 text-red-600',
      active: 'bg-green-100 text-green-600',
    }
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${colors[status] || 'bg-slate-100 text-slate-600'}`}>
        {STATUS_LABELS[status] || status}
      </span>
    )
  }

  function DailySubscriptionCard({ sub }) {
    return (
      <div className="rounded-lg border border-slate-200 p-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <CalendarDays size={14} className="text-slate-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-800">اشتراك يومي</div>
              <div className="text-[10px] text-slate-500 truncate">
                {new Date(sub.startDate).toLocaleDateString('ar-SA')} - {new Date(sub.endDate).toLocaleDateString('ar-SA')}
              </div>
            </div>
          </div>
          <StatusBadge status={sub.status} />
        </div>
      </div>
    )
  }

  function CampaignCard({ campaign, isUpcoming }) {
    const plan = campaign.type === 'subscription_3weeks' ? 'THREE_WEEKS' : 'FOUR_WEEKS'
    const price = getCampaignPrice(campaign)
    const isEnrolling = campaignEnrolling === campaign.id
    const existingEnrollment = getExistingEnrollment(campaign.id)
    const hasActiveDiscount = price.hasDiscount
    const displayOriginal = existingEnrollment
      ? Number(existingEnrollment.baseAmount)
      : price.baseAmount
    const displayPrice = existingEnrollment
      ? (Number(existingEnrollment.baseAmount) - Number(existingEnrollment.discount || 0))
      : price.discountedPrice

    return (
      <div className={`rounded-lg border p-2.5 ${isUpcoming ? 'border-amber-200 bg-amber-50/30' : hasActiveDiscount ? 'border-green-200 bg-green-50/30' : 'border-slate-200'}`}>
        <div className="flex items-start justify-between mb-1.5">
          <h4 className="text-xs font-bold text-slate-800">{campaign.title}</h4>
          <div className="flex gap-1">
            {isUpcoming && (
              <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">
                قادمة
              </span>
            )}
            {hasActiveDiscount && !existingEnrollment && !isUpcoming && (
              <span className="bg-green-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">
                خصم مبكر
              </span>
            )}
          </div>
        </div>
        {campaign.description && (
          <p className="text-[10px] text-slate-500 mb-1.5">{campaign.description}</p>
        )}
        <div className="space-y-0.5 text-[10px] text-slate-600 mb-1.5">
          <div className="flex justify-between">
            <span>الفترة</span>
            <span>{new Date(campaign.startDate).toLocaleDateString('ar-SA')} ↓ {new Date(campaign.endDate).toLocaleDateString('ar-SA')}</span>
          </div>
          <div className="flex justify-between">
            <span>النوع:</span>
            <span>{PLAN_LABELS[plan]}</span>
          </div>
          {hasActiveDiscount ? (
            <>
              <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-100 mt-1">
                <span>السعر الأصلي</span>
                <span className="line-through">{displayOriginal.toLocaleString()} ريال</span>
              </div>
              <div className="flex justify-between font-bold text-slate-800">
                <span>السعر بعد الخصم</span>
                <span className="text-green-600">{displayPrice.toLocaleString()} ريال</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between font-medium text-slate-800 pt-1 border-t border-slate-100 mt-1">
              <span>السعر</span>
              <span className="text-[var(--color-primary)]">{displayOriginal.toLocaleString()} ريال</span>
            </div>
          )}
          {(existingEnrollment ? Number(existingEnrollment.surcharge || 0) : Number(price.surcharge || 0)) > 0 && (
            <div className="flex justify-between text-slate-600 mt-0.5">
              <span>رسوم التوصيل المنزلي:</span>
              <span className="font-medium">{(existingEnrollment ? Number(existingEnrollment.surcharge) : Number(price.surcharge)).toLocaleString()} ريال</span>
            </div>
          )}
          {(() => {
            const efType = existingEnrollment ? existingEnrollment.extraFeeType : price.extraFee?.type
            const efAmount = existingEnrollment ? Number(existingEnrollment.extraFeeAmount || 0) : (price.extraFee?.amount || 0)
            const efLabel = existingEnrollment
              ? (efType === 'NEW_STUDENT' ? 'رسوم طالب جديد' : efType === 'LATE_REGISTRATION' ? 'رسوم طالب متأخر' : null)
              : price.extraFee?.label || null
            if (efType && efAmount > 0) {
              return (
                <div className="flex justify-between text-slate-600 mt-0.5">
                  <span>{efLabel}:</span>
                  <span className="font-medium text-amber-600">+{efAmount.toLocaleString()} ريال</span>
                </div>
              )
            }
            return null
          })()}
          <div className="flex justify-between font-bold text-slate-800 pt-1 border-t border-slate-100 mt-0.5">
            <span>الإجمالي</span>
            <span className="text-[var(--color-primary)]">{Number(existingEnrollment ? existingEnrollment.finalAmount : price.finalAmount).toLocaleString()} ريال</span>
          </div>
        </div>

        {existingEnrollment && !isEnrolling ? (
          existingEnrollment.receiptStatus === 'REJECTED' ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700">
              <div className="font-medium">تم رفض الطلب</div>
              {existingEnrollment.rejectionReason && (
                <div className="mt-1"><span className="font-medium">السبب:</span> {existingEnrollment.rejectionReason}</div>
              )}
              <button onClick={() => { setCampaignEnrolling(campaign.id); setCampaignError(''); setCampaignSuccess('') }}
                className="mt-1.5 w-full rounded-lg bg-[var(--color-primary)] py-1.5 text-xs font-medium text-white">
                إعادة تقديم الطلب
              </button>
            </div>
          ) : (
            <div className="rounded-lg bg-slate-50 p-2 text-xs">
              <span className="font-medium text-slate-700">
                {existingEnrollment.receiptStatus === 'PENDING' ? 'طلب قيد الانتظار' :
                 existingEnrollment.receiptStatus === 'APPROVED' ? 'تمت الموافقة' : ''}
              </span>
            </div>
          )
        ) : isEnrolling ? (
          <div className="space-y-2">
            {campaignError && <p className="text-red-500 text-xs">{campaignError}</p>}
            {campaignSuccess && <p className="text-green-600 text-xs bg-green-50 p-2 rounded-lg">{campaignSuccess}</p>}
            <div className="flex gap-1.5">
              <button onClick={() => handleAddCampaignToCart(campaign)} disabled={campaignSubmitting}
                className="flex-1 bg-[var(--color-primary)] text-white py-2 rounded-lg text-xs font-medium disabled:opacity-50">
                {campaignSubmitting ? 'جاري...' : 'إضافة إلى السلة'}
              </button>
              <button onClick={() => { setCampaignEnrolling(null); setCampaignError(''); setCampaignSuccess('') }}
                className="px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 text-slate-600">
                إلغاء
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {campaignError && <p className="text-red-500 text-xs">{campaignError}</p>}
            {campaignSuccess && <p className="text-green-600 text-xs bg-green-50 p-2 rounded-lg">{campaignSuccess}</p>}
            <button onClick={() => handleAddCampaignToCart(campaign)} disabled={campaignSubmitting}
              className="w-full bg-[var(--color-primary)] text-white py-2 rounded-lg text-xs font-medium disabled:opacity-50">
              {campaignSubmitting ? 'جاري...' : 'إضافة إلى السلة'}
            </button>
          </div>
        )}
      </div>
    )
  }

  function renderDailyTab() {
    return (
      <div className="space-y-2">
        {/* Active daily subscriptions */}
        <div className="bg-white rounded-xl p-3">
          <h3 className="text-xs font-bold text-slate-700 mb-2">الاشتراكات اليومية النشطة</h3>
          {activeDailySubscriptions.length > 0 ? (
            <div className="space-y-1.5">
              {activeDailySubscriptions.map(sub => (
                <DailySubscriptionCard key={sub.id} sub={sub} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">لا توجد اشتراكات يومية نشطة</p>
          )}
        </div>

        {/* New daily request */}
        <div className="bg-white rounded-xl p-3">
          <h3 className="text-xs font-bold text-slate-700 mb-3">طلب اشتراك يومي جديد</h3>
          <div className="space-y-2.5">
            {/* Duration */}
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">المدة</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map(w => (
                  <button key={w} onClick={() => setDailyWeeks(w)}
                    className={`py-2 rounded-lg text-xs font-medium transition-all ${
                      dailyWeeks === w
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'bg-slate-50 text-slate-600 border border-slate-200'
                    }`}>
                    {w === 1 ? 'أسبوع' : `${w} أسابيع`}
                  </button>
                ))}
              </div>
            </div>

            {/* Days selection */}
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">الأيام</label>
              <div className="grid grid-cols-3 gap-1.5">
                {WEEKDAYS.map(day => (
                  <button key={day.value} onClick={() => toggleDay(day.value)}
                    className={`py-2 rounded-lg text-xs font-medium transition-all ${
                      dailyDays.includes(day.value)
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'bg-slate-50 text-slate-600 border border-slate-200'
                    }`}>
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            {computedDates.length > 0 && (
              <div className="bg-slate-50 rounded-lg p-2.5 space-y-1.5">
                <div className="text-xs font-bold text-slate-700">ملخص الطلب</div>
                <div className="space-y-0.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>المدة:</span>
                    <span className="font-medium">{dailyWeeks === 1 ? 'أسبوع واحد' : `${dailyWeeks} أسابيع`}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>الأيام:</span>
                    <span className="font-medium truncate max-w-[60%]">{dailyDays.map(d => DAY_NAMES_AR[d]).join('، ')}</span>
                  </div>
                </div>
                <div className="pt-1.5 border-t border-slate-200">
                  <div className="text-[10px] text-slate-500 mb-1">التواريخ ({computedDates.length}):</div>
                  <div className="flex flex-wrap gap-1">
                    {computedDates.map((d, i) => (
                      <span key={i} className="text-[10px] bg-white px-1.5 py-0.5 rounded text-slate-600 border border-slate-100">
                        {DAY_NAMES_AR[['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'][d.getDay()]]}
                        {' '}{d.toLocaleDateString('en-GB')}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between font-bold text-slate-800 pt-1.5 border-t border-slate-200">
                  <span className="text-xs">الإجمالي:</span>
                  <span className="text-xs text-[var(--color-primary)]">{dailyTotal.toLocaleString()} ريال</span>
                </div>
                {dailyHomeFee > 0 && (
                  <div className="text-[10px] text-slate-400">* شامل رسوم التوصيل المنزلي {dailyHomeFee.toLocaleString()} ريال لكل يوم</div>
                )}
              </div>
            )}

            {dailyError && <p className="text-red-500 text-xs">{dailyError}</p>}
            {dailySuccess && <p className="text-green-600 text-xs bg-green-50 p-2 rounded-lg">{dailySuccess}</p>}

            <button onClick={handleAddDailyToCart} disabled={dailyAddingToCart || computedDates.length === 0}
              className="w-full bg-[var(--color-primary)] text-white py-2.5 rounded-lg text-xs font-medium disabled:opacity-50 min-h-[44px]">
              {dailyAddingToCart ? 'جاري الإضافة...' : 'إضافة إلى السلة'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  function renderWeeklyTab() {
    return (
      <div className="space-y-2">
        {/* Active weekly subs compact */}
        <div className="bg-white rounded-xl p-3">
          <h3 className="text-xs font-bold text-slate-700 mb-2">الاشتراكات الأسبوعية النشطة</h3>
          {activeWeeklySubscriptions.length > 0 ? (
            <div className="space-y-1.5">
              {activeWeeklySubscriptions.map(sub => (
                <div key={sub.id} className="rounded-lg border border-slate-200 p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <CreditCard size={14} className="text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-slate-800">{PLAN_LABELS[sub.type] || sub.type}</div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {new Date(sub.startDate).toLocaleDateString('ar-SA')} - {new Date(sub.endDate).toLocaleDateString('ar-SA')}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={sub.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">لا توجد اشتراكات أسبوعية نشطة</p>
          )}
        </div>

        {/* Campaigns - Active */}
        {activeCampaigns.length > 0 && (
          <div className="bg-white rounded-xl p-3">
            <h3 className="text-xs font-bold text-slate-700 mb-2">الحملات النشطة</h3>
            <div className="space-y-2">
              {activeCampaigns.map(campaign => <CampaignCard key={campaign.id} campaign={campaign} />)}
            </div>
          </div>
        )}

        {/* Campaigns - Upcoming */}
        {upcomingCampaigns.length > 0 && (
          <div className="bg-white rounded-xl p-3 border border-amber-200">
            <h3 className="text-xs font-bold text-amber-700 mb-2">الحملات القادمة</h3>
            <div className="space-y-2">
              {upcomingCampaigns.map(campaign => <CampaignCard key={campaign.id} campaign={campaign} isUpcoming />)}
            </div>
          </div>
        )}

        {campaigns.length === 0 && (
          <div className="bg-white rounded-xl p-3">
            <p className="text-xs text-slate-400 text-center py-4">لا توجد حالياً حملات اشتراك مفتوحة</p>
          </div>
        )}
      </div>
    )
  }

  function renderCurrentTab() {
    return (
      <div className="bg-white rounded-xl p-3">
        <h3 className="text-xs font-bold text-slate-700 mb-2">
          {destId ? 'أسعار الاشتراكات حسب وجهتي' : 'أسعار الاشتراكات حسب المنطقة'}
        </h3>
        <div className="overflow-x-auto -mx-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="px-3 py-2 text-right font-semibold">المنطقة</th>
                <th className="px-3 py-2 text-right font-semibold">4 أسابيع</th>
                <th className="px-3 py-2 text-right font-semibold">3 أسابيع</th>
                <th className="px-3 py-2 text-right font-semibold">يومي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(destId ? destPricing : sortedAreaPrices).length > 0 ? (destId ? destPricing : sortedAreaPrices).map(zone => {
                // Prefer destination-specific prices; fall back to zone defaults when missing
                const dailyEntry = zone.prices?.find(p => p.plan === 'DAILY' && String(p.destinationId) === String(destId))
                const threeEntry = zone.prices?.find(p => p.plan === 'THREE_WEEKS' && String(p.destinationId) === String(destId))
                const fourEntry = zone.prices?.find(p => p.plan === 'FOUR_WEEKS' && String(p.destinationId) === String(destId))
                const dailyPrice = dailyEntry ? Number(dailyEntry.price) : (zone.dailyPrice != null ? Number(zone.dailyPrice) : null)
                const threeWeeksPrice = threeEntry ? Number(threeEntry.price) : (zone.threeWeeksPrice != null ? Number(zone.threeWeeksPrice) : null)
                const fourWeeksPrice = fourEntry ? Number(fourEntry.price) : (zone.fourWeeksPrice != null ? Number(zone.fourWeeksPrice) : null)
                const isMyZone = zone.name === zonePricing?.name || zone.id === zonePricing?.id
                const isDestPrice = Boolean(zone.prices?.some(p => String(p.destinationId) === String(destId)))
                return (
                  <tr key={zone.id} className={isMyZone ? 'bg-blue-50' : ''}>
                    <td className={`px-3 py-2 text-xs font-medium ${isMyZone ? 'text-[var(--color-primary)]' : 'text-slate-700'}`}>
                      {zone.name || 'غير محددة'}
                      {isMyZone && <span className="mr-1 text-[9px] text-slate-400">(منطقتي)</span>}
                    </td>
                    <td className={`px-3 py-2 text-xs ${isDestPrice ? 'text-green-600 font-semibold' : isMyZone ? 'text-[var(--color-primary)] font-semibold' : 'text-slate-700'}`}>
                      {(fourWeeksPrice != null) ? fourWeeksPrice.toLocaleString() : '-'}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">{(threeWeeksPrice != null) ? threeWeeksPrice.toLocaleString() : '-'}</td>
                    <td className="px-3 py-2 text-xs text-slate-600">{(dailyPrice != null) ? dailyPrice.toLocaleString() : '-'}</td>
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-xs text-slate-400">لا توجد بيانات أسعار متاحة</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-1 text-[10px] text-slate-400">* الأسعار بالريال اليمني</div>
      </div>
    )
  }

  function renderHistoryTab() {
    return (
      <div className="bg-white rounded-xl p-3">
        <h3 className="text-xs font-bold text-slate-700 mb-2">سجل الاشتراكات</h3>
        {nonActiveSubscriptions.length > 0 ? (
          <div className="space-y-1.5">
            {nonActiveSubscriptions.map(sub => (
              <div key={sub.id} className="rounded-lg border border-slate-200 p-2.5">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <FileText size={14} className="text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-800">{PLAN_LABELS[sub.type] || sub.type}</div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {new Date(sub.startDate).toLocaleDateString('ar-SA')} - {new Date(sub.endDate).toLocaleDateString('ar-SA')}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={sub.status} />
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-slate-600">
                  <span>المبلغ: <b>{Number(sub.amount).toLocaleString()} ريال</b></span>
                  {sub.homeDeliveryFee != null && Number(sub.homeDeliveryFee) > 0 && (
                    <span>التوصيل: {Number(sub.homeDeliveryFee).toLocaleString()} ريال</span>
                  )}
                  <span>المدفوع: {Number(sub.paidAmount).toLocaleString()} ريال</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-4">لا توجد اشتراكات محفوظة في السجل</p>
        )}
      </div>
    )
  }

  async function handleCartSubmit() {
    setCartError('')
    setCartSuccess('')
    if (!cartReceipt) {
      setCartError('يرجى رفع صورة سند التحويل')
      return
    }
    setCartSubmitting(true)
    try {
      await api.cart.submit(cartReceipt)
      setCartSuccess('تم إرسال طلب السلة بنجاح، بانتظار الموافقة')
      setCart(null)
      setCartReceipt('')
    } catch (e) {
      setCartError(e.message)
    } finally {
      setCartSubmitting(false)
    }
  }

  async function handleRemoveItem(itemId) {
    const res = await api.cart.removeItem(itemId)
    if (res.cart) {
      const cartRes = await api.cart.get()
      setCart(cartRes.cart)
    } else {
      setCart(null)
    }
  }

  return (
    <div className="space-y-2">
      {cart && (
        <div className="bg-white rounded-xl border border-[var(--color-primary)]/20 p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart size={16} className="text-[var(--color-primary)]" />
            <h3 className="text-xs font-bold text-[var(--color-primary)]">سلة الاشتراكات</h3>
            <span className="text-[10px] text-slate-400">({(cart.items || []).length} {(cart.items || []).length === 1 ? 'عنصر' : 'عناصر'})</span>
          </div>

          <div className="space-y-1.5">
            {(cart.items || []).map((item, idx) => (
              <div key={item.id} className="flex items-center justify-between gap-2 py-1.5 px-2 bg-slate-50 rounded-lg">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-slate-800">
                    {item.type === 'DAILY' ? 'اشتراك يومي' : item.type === 'FOUR_WEEKS' ? 'اشتراك 4 أسابيع' : item.type === 'THREE_WEEKS' ? 'اشتراك 3 أسابيع' : item.type}
                    {item.data?.campaignTitle && <span className="text-slate-500"> - {item.data.campaignTitle}</span>}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {item.data?.selectedDays?.length > 0 && (
                      <span>{item.data.selectedDays.map(d => DAY_NAMES_AR[d]).join('، ')} · </span>
                    )}
                    {item.data?.weeksCount && <span>{item.data.weeksCount} {item.data.weeksCount === 1 ? 'أسبوع' : 'أسابيع'} · </span>}
                    {Number(item.amount).toLocaleString()} ريال
                  </div>
                </div>
                <button onClick={() => handleRemoveItem(item.id)} className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-200">
            <span className="text-xs font-bold text-slate-800">الإجمالي</span>
            <span className="text-sm font-bold text-[var(--color-primary)]">{Number(cart.totalAmount).toLocaleString()} ريال</span>
          </div>

          {cartSuccess ? (
            <p className="mt-2 text-green-600 text-xs bg-green-50 p-2 rounded-lg">{cartSuccess}</p>
          ) : (
            <div className="mt-2 space-y-2">
              <div>
                <label className="flex items-center justify-center gap-1.5 border-2 border-dashed border-slate-200 rounded-lg py-2 cursor-pointer hover:border-[var(--color-primary)] transition-colors">
                  <Upload size={14} className="text-slate-400" />
                  <span className="text-xs text-slate-500">{cartReceipt ? 'تغيير السند' : 'صورة سند التحويل'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const reader = new FileReader()
                    reader.onload = (ev) => setCartReceipt(ev.target.result)
                    reader.readAsDataURL(file)
                  }} />
                </label>
                {cartReceipt && <img src={cartReceipt} alt="السند" className="mt-1 max-h-16 rounded-lg border border-slate-200" />}
              </div>
              {cartError && <p className="text-red-500 text-xs">{cartError}</p>}
              <button onClick={handleCartSubmit} disabled={cartSubmitting || !cartReceipt}
                className="w-full bg-[var(--color-primary)] text-white py-2.5 rounded-lg text-xs font-medium disabled:opacity-50 min-h-[44px]">
                {cartSubmitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-4 gap-1 bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
        {tabItems.map((tab) => (
          <NavLink key={tab.key} to={tab.key} end
            className={({ isActive }) =>
              `rounded-lg py-2 text-[11px] font-semibold text-center transition-all ${
                isActive
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`
            }>
            {tab.label}
          </NavLink>
        ))}
      </div>

      {(() => {
        const validTabs = tabItems.map(item => item.key)
        const normalizedPath = location.pathname.replace(/\/+$/, '')
        const pathParts = normalizedPath.split('/').filter(Boolean)
        const lastSegment = pathParts[pathParts.length - 1]
        const currentTab = validTabs.includes(lastSegment) ? lastSegment : 'daily'

        const isBaseStudentSubscriptionsPath = normalizedPath === '/student/subscriptions'
        if (isBaseStudentSubscriptionsPath) {
          return <Navigate to="daily" replace />
        }

        if (currentTab === 'daily') return renderDailyTab()
        if (currentTab === 'weekly') return renderWeeklyTab()
        if (currentTab === 'current') return renderCurrentTab()
        if (currentTab === 'history') return renderHistoryTab()
        return renderDailyTab()
      })()}
    </div>
  )
}
