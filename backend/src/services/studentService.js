import { prisma } from '../lib/prisma.js'
import { getLocalDate } from '../utils/dateUtils.js'

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

function startOfDay(date = new Date()) {
  return getLocalDate(date)
}

export async function canStudentOperateOnDate(studentId, checkDate = new Date(), tx) {
  const db = tx || prisma
  const date = startOfDay(checkDate)
  const dayName = DAY_NAMES[date.getDay()]

  // 1. Daily subscription for today → always allowed (overrides all)
  const hasExecDate = await db.dailyExecutionDate.count({
    where: {
      subscription: { studentId, type: 'DAILY', status: 'active' },
      executionDate: date,
    },
  })
  if (hasExecDate > 0) return true

  // 2. Friday → fixed day off for everyone
  if (dayName === 'FRIDAY') return false

  // 3. Saturday → default day off for everyone (needs daily subscription)
  if (dayName === 'SATURDAY') return false

  // 4. Student-specific off days
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { offDays: true },
  })
  if (!student) return false

  const offDays = student.offDays || []
  if (Array.isArray(offDays) && offDays.includes(dayName)) return false

  // 5. Otherwise → allowed
  return true
}

export async function getStudentOffDays(studentId) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { offDays: true },
  })
  return student?.offDays || []
}

export { DAY_NAMES }
