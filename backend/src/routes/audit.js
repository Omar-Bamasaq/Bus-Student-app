import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

router.get('/', authorize('admin'), async (req, res) => {
  try {
    const { entityType, entityId, action, limit } = req.query
    const where = {}
    if (entityType) where.entityType = entityType
    if (entityId) where.entityId = entityId
    if (action) where.action = action
    const logs = await prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit ? Number(limit) : 100,
    })
    res.json(logs)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
