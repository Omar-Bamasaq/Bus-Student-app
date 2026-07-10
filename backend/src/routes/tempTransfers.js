import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { createAuditLog } from '../lib/audit.js'
import { getLocalDate } from '../utils/dateUtils.js'

const router = Router()
router.use(authenticate)

// Get all active temporary transfers with full bus info
router.get('/active', authorize('admin'), async (req, res) => {
  try {
    const transfers = await prisma.studentTransfer.findMany({
      where: { type: 'TEMPORARY', isActive: true, endDate: { gte: new Date() } },
      include: {
        student: { select: { id: true, name: true } },
        fromBus: { select: { id: true, busNumber: true } },
        toBus: { select: { id: true, busNumber: true } },
      },
      orderBy: { endDate: 'asc' },
    })
    res.json(transfers)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get active temporary transfers for a specific bus (both incoming and outgoing)
router.get('/bus/:busId', authorize('admin'), async (req, res) => {
  try {
    const { busId } = req.params
    const now = new Date()
    const [incoming, outgoing] = await Promise.all([
      prisma.studentTransfer.findMany({
        where: { toBusId: busId, type: 'TEMPORARY', isActive: true, startDate: { lte: now }, endDate: { gte: now } },
        include: { student: { select: { id: true, name: true } }, fromBus: { select: { id: true, busNumber: true } } },
      }),
      prisma.studentTransfer.findMany({
        where: { fromBusId: busId, type: 'TEMPORARY', isActive: true, startDate: { lte: now }, endDate: { gte: now } },
        include: { student: { select: { id: true, name: true } }, toBus: { select: { id: true, busNumber: true } } },
      }),
    ])
    res.json({ incoming, outgoing })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create a temporary transfer
router.post('/', authorize('admin'), async (req, res) => {
  try {
    const { studentId, fromBusId, toBusId, durationDays } = req.body
    if (!studentId || !fromBusId || !toBusId || !durationDays) {
      return res.status(400).json({ error: 'جميع الحقول مطلوبة' })
    }
    const days = parseInt(durationDays)
    if (days < 1 || days > 7) {
      return res.status(400).json({ error: 'المدة يجب أن تكون بين 1 و 7 أيام' })
    }
    if (fromBusId === toBusId) {
      return res.status(400).json({ error: 'لا يمكن التحويل إلى نفس الباص' })
    }

    // Check student is in source bus template
    const busStudent = await prisma.busStudent.findUnique({ where: { studentId } })
    if (!busStudent || busStudent.busId !== fromBusId) {
      return res.status(400).json({ error: 'الطالب ليس في قالب الباص الأصلي' })
    }

    // Check no active transfer exists for this student
    const existing = await prisma.studentTransfer.findFirst({
      where: { studentId, isActive: true, endDate: { gte: new Date() } },
    })
    if (existing) {
      return res.status(400).json({ error: 'يوجد تحويل نشط لهذا الطالب بالفعل' })
    }

    const today = getLocalDate()
    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() + days - 1)

    const transfer = await prisma.studentTransfer.create({
      data: {
        studentId, fromBusId, toBusId,
        startDate: today,
        endDate,
        type: 'TEMPORARY',
        reason: `تحويل مؤقت لمدة ${days} يوم`,
      },
      include: {
        student: { select: { name: true } },
        fromBus: { select: { busNumber: true } },
        toBus: { select: { busNumber: true } },
      },
    })

    await createAuditLog({
      userId: req.user.id, action: 'TEMP_TRANSFER_CREATE', entityType: 'StudentTransfer', entityId: transfer.id,
      newValue: { studentId, fromBusId, toBusId, durationDays, startDate: today, endDate },
    })

    res.status(201).json(transfer)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Cancel a temporary transfer early
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const transfer = await prisma.studentTransfer.findUnique({ where: { id: req.params.id } })
    if (!transfer) return res.status(404).json({ error: 'التحويل غير موجود' })
    await prisma.studentTransfer.update({ where: { id: req.params.id }, data: { isActive: false } })
    await createAuditLog({
      userId: req.user.id, action: 'TEMP_TRANSFER_CANCEL', entityType: 'StudentTransfer', entityId: req.params.id,
    })
    res.json({ message: 'تم إلغاء التحويل المؤقت' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Manually trigger expiry check
router.post('/expire', authorize('admin'), async (req, res) => {
  try {
    const today = getLocalDate()
    const result = await prisma.studentTransfer.updateMany({
      where: { type: 'TEMPORARY', isActive: true, endDate: { lt: today } },
      data: { isActive: false },
    })
    await createAuditLog({
      userId: req.user.id, action: 'TEMP_TRANSFER_EXPIRE', entityType: 'StudentTransfer',
      newValue: { expiredCount: result.count },
    })
    res.json({ expired: result.count })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
