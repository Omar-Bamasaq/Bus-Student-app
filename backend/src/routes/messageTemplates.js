import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const templates = await prisma.messageTemplate.findMany({
      where: { isActive: true },
    })
    res.json(templates)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', authorize('admin'), async (req, res) => {
  try {
    const template = await prisma.messageTemplate.create({
      data: req.body,
    })
    res.status(201).json(template)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', authorize('admin'), async (req, res) => {
  try {
    const template = await prisma.messageTemplate.update({
      where: { id: req.params.id },
      data: req.body,
    })
    res.json(template)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    await prisma.messageTemplate.delete({
      where: { id: req.params.id },
    })
    res.json({ message: 'تم حذف النموذج' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
