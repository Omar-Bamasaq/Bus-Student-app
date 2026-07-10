import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { createAuditLog } from '../lib/audit.js'

const router = Router()
router.use(authenticate)

router.get('/', authorize('admin'), async (req, res) => {
  try {
    const { isActive } = req.query
    const where = {}
    if (isActive !== undefined) where.isActive = isActive === 'true'
    const transfers = await prisma.studentTransfer.findMany({
      where,
      include: {
        student: { select: { id: true, name: true } },
        fromBus: { select: { id: true, busNumber: true, plateNumber: true } },
        toBus: { select: { id: true, busNumber: true, plateNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(transfers)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', authorize('admin'), async (req, res) => {
  try {
    const { studentId, fromBusId, toBusId, startDate, endDate, reason } = req.body
    if (!studentId || !fromBusId || !toBusId || !startDate || !endDate) {
      return res.status(400).json({ error: 'جميع الحقول مطلوبة' })
    }
    const transfer = await prisma.studentTransfer.create({
      data: {
        studentId, fromBusId, toBusId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
      },
      include: {
        student: { select: { name: true } },
        fromBus: { select: { busNumber: true } },
        toBus: { select: { busNumber: true } },
      },
    })
    await createAuditLog({
      userId: req.user.id, action: 'TRANSFER_CREATE', entityType: 'StudentTransfer', entityId: transfer.id,
      newValue: { studentId, fromBusId, toBusId, startDate, endDate, reason },
    })
    res.status(201).json(transfer)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const transfer = await prisma.studentTransfer.findUnique({ where: { id: req.params.id } })
    if (!transfer) return res.status(404).json({ error: 'التحويل غير موجود' })
    await prisma.studentTransfer.update({ where: { id: req.params.id }, data: { isActive: false } })
    await createAuditLog({ userId: req.user.id, action: 'TRANSFER_CANCEL', entityType: 'StudentTransfer', entityId: req.params.id })
    res.json({ message: 'تم إلغاء التحويل' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
