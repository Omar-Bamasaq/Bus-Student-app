import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

router.get('/bus/:busId', async (req, res) => {
  try {
    const { busId } = req.params
    const bus = await prisma.bus.findUnique({
      where: { id: busId },
      include: {
        driver: { select: { name: true, phone: true } },
        templateStudents: {
          where: { isActive: true },
          include: {
            student: {
              select: {
                id: true, name: true, major: true, level: true,
                pickupLocation: true, zone: true, phone: true,
                transportMode: true, homeAddress: true, offDays: true,
              },
            },
          },
          orderBy: { pickupTime: 'asc' },
        },
      },
    })
    if (!bus) return res.status(404).json({ error: 'الحافلة غير موجودة' })
    const enrollments = await prisma.campaignEnrollment.findMany({
      where: {
        studentId: { in: bus.templateStudents.map(bs => bs.studentId) },
        receiptStatus: 'APPROVED',
      },
      select: { studentId: true, campaign: { select: { name: true } } },
    })
    const paidStudents = new Set(enrollments.map(e => e.studentId))
    const students = bus.templateStudents.map(bs => ({
      ...bs.student,
      pickupTime: bs.pickupTime,
      paymentStatus: paidStudents.has(bs.studentId) ? 'paid' : 'unpaid',
    }))
    res.json({
      busNumber: bus.busNumber,
      plateNumber: bus.plateNumber,
      capacity: bus.capacity,
      vehicleType: bus.vehicleType,
      driver: bus.driver,
      students,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
