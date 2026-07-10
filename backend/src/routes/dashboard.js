import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'
import { expireSubscriptions } from '../services/subscriptionService.js'
import { getLocalDate } from '../utils/dateUtils.js'

const router = Router()
router.use(authenticate)

router.get('/stats', async (req, res) => {
  try {
    await expireSubscriptions()

    const today = getLocalDate()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      totalStudents,
      activeStudents,
      totalBuses,
      activeBuses,
      todayMorningAssignments,
      todayBusesOperating,
      activeDrivers,
      activeSubscriptions,
      revenueAggregate,
      revenueTodayAggregate,
      revenueMonthlyAggregate,
      homeDeliveryStudents,
      monthlyHomeFees,
      waitingStudents,
      availableBuses,
      departedBuses,
      returnedStudents,
      activeCampaigns,
      pendingEnrollments,
      activeTransfers,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.student.count({ where: { status: 'active' } }),
      prisma.bus.count(),
      prisma.bus.count({ where: { status: 'active' } }),
      prisma.assignment.count({
        where: { date: { gte: today, lt: tomorrow }, period: 'MORNING' },
      }),
      prisma.assignment.groupBy({
        by: ['busId'],
        where: { date: { gte: today, lt: tomorrow }, period: 'MORNING' },
        _count: { id: true },
      }).then(r => r.length),
      prisma.user.count({ where: { role: 'driver', status: 'active' } }),
      prisma.subscription.count({ where: { status: 'active' } }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { subscription: { status: { in: ['active', 'expired', 'cancelled'] } } },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          date: { gte: today, lt: tomorrow },
          subscription: { status: { in: ['active', 'expired', 'cancelled'] } },
        },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          date: { gte: startOfMonth },
          subscription: { status: { in: ['active', 'expired', 'cancelled'] } },
        },
      }),
      prisma.student.count({ where: { transportMode: 'HOME', homeDeliveryActive: true } }),
      // Sum home delivery fees from subscriptions created this month (uses per-subscription stored fee)
      prisma.subscription.aggregate({
        _sum: { homeDeliveryFee: true },
        where: { createdAt: { gte: startOfMonth }, homeDeliveryFee: { not: null } },
      }),
      prisma.returnQueue.count({ where: { status: 'WAITING' } }).catch(() => 0),
      prisma.activeBus.count({ where: { status: { in: ['AVAILABLE', 'LOADING'] } } }).catch(() => 0),
      prisma.activeBus.count({ where: { status: 'DEPARTED' } }).catch(() => 0),
      prisma.returnQueue.count({ where: { status: 'DEPARTED' } }).catch(() => 0),
      prisma.campaign.count({ where: { status: 'ACTIVE', isActive: true } }).catch(() => 0),
      prisma.campaignEnrollment.count({ where: { receiptStatus: 'PENDING' } }).catch(() => 0),
      prisma.studentTransfer.count({ where: { isActive: true } }).catch(() => 0),
    ])

    res.json({
      totalStudents,
      activeStudents,
      homeDeliveryStudents,
      totalBuses,
      activeBuses,
      todayAssignments: todayMorningAssignments,
      todayBusesOperating,
      activeDrivers,
      activeSubscriptions,
      totalRevenue: Number(revenueAggregate._sum.amount || 0),
      todayRevenue: Number(revenueTodayAggregate._sum.amount || 0),
      monthlyRevenue: Number(revenueMonthlyAggregate._sum.amount || 0),
      monthlyHomeDeliveryFees: Number(monthlyHomeFees._sum.homeDeliveryFee || 0),
      waitingStudents,
      availableBuses,
      departedBuses,
      returnedStudents,
      activeCampaigns,
      pendingEnrollments,
      activeTransfers,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/recent-payments', async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      take: 10,
      orderBy: { date: 'desc' },
      include: {
        subscription: {
          include: { student: { select: { id: true, name: true } } },
        },
      },
    })

    res.json(payments)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/today-assignments', async (req, res) => {
  try {
    const today = getLocalDate()

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const assignments = await prisma.assignment.findMany({
      where: { date: { gte: today, lt: tomorrow } },
      include: {
        student: { select: { id: true, name: true, zone: true } },
        bus: { select: { id: true, plateNumber: true } },
      },
      orderBy: { pickupTime: 'asc' },
    })

    res.json(assignments)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/monthly-revenue', async (req, res) => {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const result = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        date: { gte: startOfMonth },
        subscription: { status: { in: ['active', 'expired', 'cancelled'] } },
      },
    })

    res.json({ month: now.getMonth() + 1, year: now.getFullYear(), revenue: Number(result._sum.amount || 0) })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
