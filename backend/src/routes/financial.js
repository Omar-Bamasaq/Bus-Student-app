import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'
import {
  getFinancialDashboard,
  getStudentsByFinancialStatus,
  getStudentFinancialDetail,
  suspendStudent,
  reactivateStudent,
  grantGracePeriod,
  cancelGracePeriod,
  sendReminder,
  getStudentIdsToExclude,
  FinancialStatus,
} from '../services/financialService.js'
import { addStudentToOperation } from '../services/operationService.js'

const router = Router()
router.use(authenticate)

router.get('/dashboard', authorize('admin'), async (req, res) => {
  try {
    const dashboard = await getFinancialDashboard()
    res.json(dashboard)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/students', authorize('admin'), async (req, res) => {
  try {
    const { status } = req.query
    if (status && !Object.values(FinancialStatus).includes(status)) {
      return res.status(400).json({ error: 'حالة مالية غير صالحة' })
    }
    const students = await getStudentsByFinancialStatus(status || null)
    res.json(students)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/students/:studentId', authorize('admin'), async (req, res) => {
  try {
    const detail = await getStudentFinancialDetail(req.params.studentId)
    if (!detail) return res.status(404).json({ error: 'الطالب غير موجود' })
    res.json(detail)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/students/:studentId/suspend', authorize('admin'), async (req, res) => {
  try {
    const { reason } = req.body
    const result = await suspendStudent(req.params.studentId, req.user.id, reason)
    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.post('/students/:studentId/reactivate', authorize('admin'), async (req, res) => {
  try {
    const result = await reactivateStudent(req.params.studentId, req.user.id)
    try {
      const busStudent = await prisma.busStudent.findFirst({
        where: { studentId: req.params.studentId, isActive: true },
      })
      if (busStudent) {
        await addStudentToOperation(busStudent.busId, req.params.studentId, req.user.id)
      }
    } catch (integrationErr) {
      // best-effort — reactivation itself already succeeded
    }
    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.post('/students/:studentId/grace-period', authorize('admin'), async (req, res) => {
  try {
    const { endDate, reason } = req.body
    if (!endDate) return res.status(400).json({ error: 'تاريخ انتهاء المهلة مطلوب' })
    const result = await grantGracePeriod(req.params.studentId, req.user.id, new Date(endDate), reason)
    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.post('/students/:studentId/cancel-grace-period', authorize('admin'), async (req, res) => {
  try {
    const result = await cancelGracePeriod(req.params.studentId, req.user.id)
    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.post('/students/:studentId/send-reminder', authorize('admin'), async (req, res) => {
  try {
    const result = await sendReminder(req.params.studentId, req.user.id)
    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.get('/excluded-ids', authorize('admin'), async (req, res) => {
  try {
    const excluded = await getStudentIdsToExclude()
    res.json({ studentIds: Array.from(excluded) })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
