import { prisma } from '../lib/prisma.js'
import { createAndBroadcast } from './notificationService.js'
import { getLocalDate, resolveExecutionDate, resolveDailyExecutionDates } from '../utils/dateUtils.js'

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

function startOfDay(date = new Date()) {
  return getLocalDate(date)
}

export function parseSubscriptionNotes(notes) {
  if (!notes) return {}
  if (typeof notes === 'string') {
    try {
      const parsed = JSON.parse(notes)
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  }
  return notes && typeof notes === 'object' ? notes : {}
}

export function generateExecutionDates(selectedDays, durationWeeks, startNow = true, referenceDate = new Date()) {
  const { dates } = resolveDailyExecutionDates({ selectedDays, durationWeeks, referenceDate })
  const sorted = dates.sort((a, b) => a - b)
  if (startNow) return sorted
  return sorted.map(d => {
    const next = new Date(d)
    next.setDate(next.getDate() + 7)
    return next
  })
}

export async function setExecutionDates(subscriptionId, dates) {
  await prisma.dailyExecutionDate.deleteMany({ where: { subscriptionId } })
  if (dates.length === 0) return []
  await prisma.dailyExecutionDate.createMany({
    data: dates.map(d => ({
      subscriptionId,
      executionDate: startOfDay(d),
    })),
  })
  return prisma.dailyExecutionDate.findMany({
    where: { subscriptionId },
    orderBy: { executionDate: 'asc' },
  })
}

export async function getExecutionDates(subscriptionId) {
  return prisma.dailyExecutionDate.findMany({
    where: { subscriptionId },
    orderBy: { executionDate: 'asc' },
  })
}

export async function hasDailyExecutionForDate(studentId, date = new Date()) {
  const checkDate = startOfDay(date)
  const count = await prisma.dailyExecutionDate.count({
    where: {
      subscription: { studentId, type: 'DAILY', status: 'active' },
      executionDate: checkDate,
    },
  })
  return count > 0
}

export function isSubscriptionActiveForDate(subscription, date = new Date()) {
  if (!subscription) return false
  if (subscription.type !== 'DAILY') return true

  const checkDate = startOfDay(date)

  const execDates = subscription.executionDates
  if (execDates && execDates.length > 0) {
    return execDates.some(ed => {
      const edDate = startOfDay(ed.executionDate)
      return edDate.getTime() === checkDate.getTime()
    })
  }

  const executionDate = startOfDay(subscription.executionDate || subscription.startDate)
  const legacyStartDate = startOfDay(subscription.startDate)
  const legacyEndDate = startOfDay(subscription.endDate)

  if (subscription.executionDate || subscription.startDate) {
    if (subscription.executionDate) {
      return checkDate.getTime() === executionDate.getTime()
    }
    if (checkDate < legacyStartDate || checkDate > legacyEndDate) return false
  }

  const notes = parseSubscriptionNotes(subscription.notes)
  const selectedDays = Array.isArray(notes.days) ? notes.days : []
  if (selectedDays.length === 0) return true

  return selectedDays.includes(DAY_NAMES[checkDate.getDay()])
}

export function buildDailySubscriptionDateRange(selectedDays, weeks, referenceDate = new Date()) {
  const dayMap = { SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6 }
  const normalizedDays = [...new Set((selectedDays || []).filter(Boolean).map(day => String(day).toUpperCase()))]
  const sortedDays = normalizedDays.filter(d => d !== 'SATURDAY').sort((a, b) => dayMap[a] - dayMap[b])

  const startDate = sortedDays.length > 0
    ? resolveExecutionDate(sortedDays[0], referenceDate)
    : startOfDay(referenceDate)

  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + (Math.max(Number(weeks) || 1, 1) * 7) - 1)

  return {
    startDate,
    endDate,
    days: sortedDays,
  }
}

export async function expireSubscriptions() {
  const today = startOfDay(new Date())
  const expiredSubscriptions = await prisma.subscription.findMany({
    where: { status: 'active', startDate: { lte: today }, endDate: { lt: today } },
    include: { student: { select: { id: true, user: { select: { id: true } } } } },
    orderBy: { endDate: 'asc' },
  })

  for (const sub of expiredSubscriptions) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: 'expired' },
    })

    const user = sub.student?.user
    if (user?.id) {
      await createSubscriptionNotification(
        user.id,
        'subscription_expired',
        'انتهاء الاشتراك',
        'انتهى اشتراكك',
        { subscriptionId: sub.id }
      )
    }
  }

  const activeSubscriptions = await prisma.subscription.findMany({
    where: { status: 'active', startDate: { lte: today }, endDate: { gte: today } },
    include: { student: { select: { id: true, user: { select: { id: true } } } } },
    orderBy: { endDate: 'asc' },
  })

  for (const sub of activeSubscriptions) {
    const endDate = startOfDay(sub.endDate)
    const diffDays = Math.ceil((endDate - today) / 86400000)
    if (diffDays >= 0 && diffDays <= 2) {
      const user = sub.student?.user
      if (user?.id) {
        const message = diffDays === 1 ? 'سينتهي اشتراكك بعد يوم واحد' : 'سينتهي اشتراكك بعد يومين'
        await createSubscriptionNotification(
          user.id,
          'subscription_expiring_soon',
          'اقتربت نهاية الاشتراك',
          message,
          { subscriptionId: sub.id, daysLeft: diffDays }
        )
      }
    }
  }

  const expiredExecDates = await prisma.dailyExecutionDate.findMany({
    where: { executionDate: { lt: today }, status: 'pending' },
    include: { subscription: { select: { id: true, studentId: true } } },
  })

  for (const ed of expiredExecDates) {
    await prisma.dailyExecutionDate.update({
      where: { id: ed.id },
      data: { status: 'expired' },
    })
  }

  return { count: expiredSubscriptions.length }
}

export async function hasActiveSameTypeSubscription(studentId, type, referenceDate = new Date()) {
  const today = startOfDay(referenceDate)
  const where = { studentId, type, status: 'active' }

  if (type === 'DAILY') {
    const hasExecDate = await prisma.dailyExecutionDate.count({
      where: {
        subscription: { ...where },
        executionDate: { gte: today },
      },
    })
    if (hasExecDate > 0) return true

    const existing = await prisma.subscription.findFirst({
      where: {
        ...where,
        OR: [
          { executionDate: today },
          { AND: [{ executionDate: null }, { startDate: { lte: today } }, { endDate: { gte: today } }] },
        ],
      },
    })
    return Boolean(existing)
  }

  const existing = await prisma.subscription.findFirst({
    where: {
      ...where,
      startDate: { lte: today },
      endDate: { gte: today },
    },
  })

  return Boolean(existing)
}

export async function canTransitionSubscription(currentStatus, nextStatus) {
  const allowedTransitions = {
    pending: ['active', 'rejected'],
    active: ['expired', 'cancelled'],
    expired: [],
    rejected: [],
    cancelled: [],
  }

  return (allowedTransitions[currentStatus] || []).includes(nextStatus)
}

export async function createSubscriptionNotification(userId, type, title, message, data = {}) {
  // When a subscription is approved, clear old unread expired notifications
  // so the student sees only the latest state
  if (type === 'subscription_approved') {
    await prisma.notification.updateMany({
      where: { userId, type: 'subscription_expired', isRead: false },
      data: { isRead: true },
    })
  }

  return createAndBroadcast({
    userId,
    type,
    title,
    message,
    data,
    dedupKey: `${type}_${userId}_${data.subscriptionId || ''}`,
  })
}
