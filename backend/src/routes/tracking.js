import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { getTrackingState, skipStudent, unskipStudent, advanceTrackingAfterAttendance } from '../services/trackingService.js'

const router = Router()
router.use(authenticate)

router.get('/:activeBusId', async (req, res) => {
  try {
    const state = await getTrackingState(req.params.activeBusId)
    if (!state) return res.json(null)
    res.json(state)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/skip', async (req, res) => {
  try {
    if (req.user.role !== 'driver') return res.status(403).json({ error: 'غير مصرح' })
    const { activeBusId, studentId } = req.body
    if (!activeBusId || !studentId) return res.status(400).json({ error: 'البيانات غير كاملة' })
    const state = await skipStudent(activeBusId, studentId)
    res.json(state)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/unskip', async (req, res) => {
  try {
    if (req.user.role !== 'driver') return res.status(403).json({ error: 'غير مصرح' })
    const { activeBusId, studentId } = req.body
    if (!activeBusId || !studentId) return res.status(400).json({ error: 'البيانات غير كاملة' })
    const state = await unskipStudent(activeBusId, studentId)
    res.json(state)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
