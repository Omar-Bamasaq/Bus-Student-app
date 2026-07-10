import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { getLocalDate } from '../utils/dateUtils.js'
import { DAY_NAMES } from '../services/studentService.js'

const router = Router()
router.use(authenticate)

router.get('/manage', authorize('admin'), async (req, res) => {
  try {
    const today = getLocalDate()
    const dayName = DAY_NAMES[today.getDay()]

    const activeDailySubs = await prisma.subscription.findMany({
      where: {
        type: 'DAILY',
        status: 'active',
        startDate: { lte: today },
        endDate: { gte: today },
      },
      include: {
        student: {
          select: {
            id: true, name: true, zone: true, destinationId: true,
            phone: true, offDays: true, pickupLocation: true, transportMode: true,
          },
        },
        executionDates: {
          where: { executionDate: today },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const todayAssignmentIds = await prisma.assignment.findMany({
      where: { date: today, period: 'MORNING' },
      select: { studentId: true },
    })
    const assignedIds = new Set(todayAssignmentIds.map(a => a.studentId))

    let unassigned = activeDailySubs
      .filter(sub => !assignedIds.has(sub.studentId))
      .filter(sub => sub.executionDates.length > 0)

    if (unassigned.length > 0) {
      const studentIds = unassigned.map(s => s.studentId)
      const [busStudents, destinations] = await Promise.all([
        prisma.busStudent.findMany({
          where: { studentId: { in: studentIds }, isActive: true },
          include: { bus: { select: { id: true, busNumber: true } } },
        }),
        prisma.destination.findMany({
          where: { id: { in: unassigned.map(s => s.student.destinationId).filter(Boolean) } },
          select: { id: true, name: true },
        }),
      ])

      const busStudentMap = new Map(busStudents.map(bs => [bs.studentId, bs]))
      const destMap = new Map(destinations.map(d => [d.id, d.name]))

      unassigned = unassigned.map(sub => ({
        id: sub.id,
        studentId: sub.studentId,
        student: {
          ...sub.student,
          destinationName: destMap.get(sub.student.destinationId) || null,
        },
        amount: sub.amount,
        homeDeliveryFee: sub.homeDeliveryFee,
        isOffDay: Array.isArray(sub.student.offDays) && sub.student.offDays.includes(dayName),
        defaultBus: busStudentMap.get(sub.studentId)?.bus || null,
        pickupTime: busStudentMap.get(sub.studentId)?.pickupTime || null,
        createdAt: sub.createdAt,
      }))
    }

    res.json({ dailySubscriptions: unassigned, count: unassigned.length })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
