import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const destinations = await prisma.destination.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })
    res.json(destinations)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/active', async (req, res) => {
  try {
    const destinations = await prisma.destination.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })
    res.json(destinations)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/:id', authorize('admin'), async (req, res) => {
  try {
    const dest = await prisma.destination.findUnique({ where: { id: req.params.id } })
    if (!dest) return res.status(404).json({ error: 'الوجهة غير موجودة' })
    res.json(dest)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', authorize('admin'), async (req, res) => {
  try {
    const { name, sortOrder } = req.body
    if (!name) return res.status(400).json({ error: 'اسم الوجهة مطلوب' })

    const dest = await prisma.destination.create({
      data: { name, sortOrder: sortOrder != null ? Number(sortOrder) : 0 },
    })
    res.status(201).json(dest)
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'الوجهة موجودة مسبقاً' })
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', authorize('admin'), async (req, res) => {
  try {
    const { name, isActive, sortOrder } = req.body
    const dest = await prisma.destination.update({
      where: { id: req.params.id },
      data: {
        name: name !== undefined ? name : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
      },
    })
    res.json(dest)
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'الوجهة موجودة مسبقاً' })
    if (error.code === 'P2025') return res.status(404).json({ error: 'الوجهة غير موجودة' })
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const count = await prisma.student.count({ where: { destinationId: req.params.id } })
    if (count > 0) return res.status(400).json({ error: `لا يمكن حذف الوجهة لأن ${count} طالب مسجل بها` })

    await prisma.pricing.deleteMany({ where: { destinationId: req.params.id } })
    await prisma.destination.delete({ where: { id: req.params.id } })
    res.json({ message: 'تم حذف الوجهة بنجاح' })
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'الوجهة غير موجودة' })
    res.status(500).json({ error: error.message })
  }
})

export default router
