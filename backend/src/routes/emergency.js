import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import {
  getEmergencyBuses,
  declareBreakdown,
  autoTransferStudents,
  manualTransferStudents,
  replaceBus,
  getEmergencyLogs,
  createEmergencyReport,
  getPendingReports,
  approveReport,
  rejectReport,
  getDriverReportStatus,
} from '../services/emergencyService.js'

const router = Router()
router.use(authenticate)

router.get('/buses', authorize('admin'), async (req, res) => {
  try {
    const data = await getEmergencyBuses()
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/breakdown', authorize('admin'), async (req, res) => {
  try {
    const { busId, reason } = req.body
    if (!busId) return res.status(400).json({ error: 'معرف الباص مطلوب' })
    const result = await declareBreakdown(busId, req.user.id, reason || 'OTHER')
    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.post('/auto-transfer', authorize('admin'), async (req, res) => {
  try {
    const { fromBusId, toBusIds, reason } = req.body
    if (!fromBusId) return res.status(400).json({ error: 'معرف الباص المعطل مطلوب' })
    const result = await autoTransferStudents(fromBusId, toBusIds, req.user.id, reason)
    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.post('/manual-transfer', authorize('admin'), async (req, res) => {
  try {
    const { fromBusId, transfers, reason } = req.body
    if (!fromBusId) return res.status(400).json({ error: 'معرف الباص المعطل مطلوب' })
    if (!transfers || !Array.isArray(transfers)) return res.status(400).json({ error: 'قائمة النقل مطلوبة' })
    const result = await manualTransferStudents(fromBusId, transfers, req.user.id, reason)
    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.post('/replace-bus', authorize('admin'), async (req, res) => {
  try {
    const { fromBusId, toBusId, reason } = req.body
    if (!fromBusId || !toBusId) return res.status(400).json({ error: 'معرف الباص القديم والجديد مطلوب' })
    const result = await replaceBus(fromBusId, toBusId, req.user.id, reason)
    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.get('/logs', authorize('admin'), async (req, res) => {
  try {
    const logs = await getEmergencyLogs()
    res.json(logs)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ─── Emergency Reports (Driver → Admin) ───

router.post('/report', authorize('driver'), async (req, res) => {
  try {
    const { busId, reason, notes } = req.body
    if (!busId) return res.status(400).json({ error: 'معرف الباص مطلوب' })
    if (!reason) return res.status(400).json({ error: 'سبب البلاغ مطلوب' })
    const result = await createEmergencyReport(busId, req.user.id, reason, notes)
    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.get('/reports/pending', authorize('admin'), async (req, res) => {
  try {
    const data = await getPendingReports()
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/reports/:id/approve', authorize('admin'), async (req, res) => {
  try {
    const result = await approveReport(req.params.id, req.user.id)
    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.post('/reports/:id/reject', authorize('admin'), async (req, res) => {
  try {
    const { rejectionReason } = req.body
    if (!rejectionReason) return res.status(400).json({ error: 'سبب الرفض مطلوب' })
    const result = await rejectReport(req.params.id, req.user.id, rejectionReason)
    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.get('/report/:busId', authorize('driver'), async (req, res) => {
  try {
    const data = await getDriverReportStatus(req.params.busId, req.user.id)
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
