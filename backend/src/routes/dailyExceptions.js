import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import { getTodayExceptions } from '../services/dailyExceptionsService.js'
import { broadcastDailyExceptionsUpdate } from '../services/socketService.js'

const router = Router()
router.use(authenticate)

router.get('/', authorize('admin'), async (req, res) => {
  try {
    const data = await getTodayExceptions()
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
