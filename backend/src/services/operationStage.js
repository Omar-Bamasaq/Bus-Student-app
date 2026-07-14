import { prisma } from '../lib/prisma.js'
import { getLocalDate } from '../utils/dateUtils.js'

export const Stage = {
  NO_TRIP: 'NO_TRIP',
  BEFORE_PICKUP: 'BEFORE_PICKUP',
  PICKUP_IN_PROGRESS: 'PICKUP_IN_PROGRESS',
  BOARDED: 'BOARDED',
  ABSENT: 'ABSENT',
  MORNING_COMPLETED: 'MORNING_COMPLETED',
}

function todayRange() {
  const today = getLocalDate()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return { today, tomorrow }
}

export async function getStudentOperationStage(studentId) {
  const { today, tomorrow } = todayRange()

  const assignment = await prisma.assignment.findFirst({
    where: { studentId, date: { gte: today, lt: tomorrow }, period: 'MORNING', status: { not: 'cancelled' } },
    include: { bus: true },
  })
  if (!assignment) return { stage: Stage.NO_TRIP }

  const attendance = await prisma.attendance.findUnique({
    where: { studentId_date: { studentId, date: today } },
  })
  if (attendance && attendance.status === 'absent') return { stage: Stage.ABSENT, assignment, attendance }

  if (attendance && (attendance.status === 'present' || attendance.status === 'late')) {
    const activeBus = await prisma.activeBus.findFirst({
      where: { busId: assignment.busId, tripType: { not: 'RETURN' }, operation: { operationDate: { gte: today, lt: tomorrow } } },
    })
    if (activeBus && activeBus.status === 'ARRIVED') return { stage: Stage.MORNING_COMPLETED, assignment, attendance, activeBus }
    return { stage: Stage.BOARDED, assignment, attendance, activeBus }
  }

  const anyAttendance = await prisma.attendance.findFirst({
    where: { busId: assignment.busId, date: { gte: today, lt: tomorrow } },
  })

  if (anyAttendance) return { stage: Stage.PICKUP_IN_PROGRESS, assignment, attendance }
  return { stage: Stage.BEFORE_PICKUP, assignment, attendance }
}
