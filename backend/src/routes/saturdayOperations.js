import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { getLocalDate } from '../utils/dateUtils.js'
import {
  getSaturdaySubscribers,
  getOrCreateSaturdayOperation,
  createSaturdayOperation,
  addStudentToSaturdayBus,
  removeStudentFromSaturdayBus,
  updateSaturdayPickupTime,
  closeSaturdayOperation,
  removeSaturdayBus,
} from '../services/saturdayService.js'

const router = Router()
router.use(authenticate)

router.get('/subscriptions', authorize('admin'), async (req, res) => {
  try {
    const today = getLocalDate()
    const subscribers = await getSaturdaySubscribers(today)
    const operation = await getOrCreateSaturdayOperation(today)
    res.json({ subscribers, operation })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/create', authorize('admin'), async (req, res) => {
  try {
    const { busIds } = req.body
    if (!busIds || !Array.isArray(busIds) || busIds.length === 0) {
      return res.status(400).json({ error: 'يجب اختيار باص واحد على الأقل' })
    }
    const today = getLocalDate()
    const operation = await createSaturdayOperation(today, busIds, req.user.id)
    res.status(201).json({ operation })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.get('/operation', authorize('admin'), async (req, res) => {
  try {
    const today = getLocalDate()
    const operation = await getOrCreateSaturdayOperation(today)
    res.json({ operation })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/buses/:busId/students', authorize('admin'), async (req, res) => {
  try {
    const { studentId, pickupTime } = req.body
    if (!studentId) return res.status(400).json({ error: 'الطالب مطلوب' })
    const load = await addStudentToSaturdayBus(req.params.busId, studentId, pickupTime)
    res.status(201).json({ load })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.delete('/buses/:busId/students/:studentId', authorize('admin'), async (req, res) => {
  try {
    await removeStudentFromSaturdayBus(req.params.busId, req.params.studentId)
    res.json({ message: 'تم حذف الطالب' })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.patch('/buses/:busId/students/:studentId/pickup-time', authorize('admin'), async (req, res) => {
  try {
    const { pickupTime } = req.body
    const load = await updateSaturdayPickupTime(req.params.busId, req.params.studentId, pickupTime)
    res.json({ load })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.post('/close', authorize('admin'), async (req, res) => {
  try {
    const today = getLocalDate()
    const result = await closeSaturdayOperation(today)
    res.json({ operation: result })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.delete('/buses/:busId', authorize('admin'), async (req, res) => {
  try {
    const today = getLocalDate()
    const op = await prisma.saturdayOperation.findUnique({ where: { operationDate: today } })
    if (!op) return res.status(404).json({ error: 'لا يوجد تشغيل سبت' })
    await removeSaturdayBus(op.id, req.params.busId)
    res.json({ message: 'تم حذف الباص' })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.get('/available-buses', authorize('admin'), async (req, res) => {
  try {
    const today = getLocalDate()
    const op = await prisma.saturdayOperation.findUnique({
      where: { operationDate: today },
      include: { buses: { select: { busId: true } } },
    })
    const usedBusIds = op?.buses?.map(b => b.busId) || []
    const buses = await prisma.bus.findMany({
      where: { status: 'active' },
      include: { driver: { select: { id: true, name: true } } },
      orderBy: { busNumber: 'asc' },
    })
    const available = buses.map(b => ({
      ...b,
      isSelected: usedBusIds.includes(b.id),
    }))
    res.json({ buses: available })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
