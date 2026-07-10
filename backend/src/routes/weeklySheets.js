import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import {
  generateWeeklySheets,
  getSheetsForWeek,
  getSheetDetail,
  getSheetArchive,
  getSheetVersionSnapshots,
  getSheetQRData,
} from '../services/weeklySheetService.js'

const router = Router()
router.use(authenticate)

router.post('/generate', authorize('admin'), async (req, res) => {
  try {
    const { weekStart } = req.body
    if (!weekStart) return res.status(400).json({ error: 'تاريخ بداية الأسبوع مطلوب' })
    const result = await generateWeeklySheets(weekStart, req.user.id)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/week/:weekStart', async (req, res) => {
  try {
    const sheets = await getSheetsForWeek(req.params.weekStart)
    res.json(sheets)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const detail = await getSheetDetail(req.params.id)
    res.json(detail)
  } catch (error) {
    res.status(error.message.includes('غير موجود') ? 404 : 500).json({ error: error.message })
  }
})

router.get('/:id/qr', async (req, res) => {
  try {
    const data = await getSheetQRData(req.params.id)
    res.json(data)
  } catch (error) {
    res.status(error.message.includes('غير موجود') ? 404 : 500).json({ error: error.message })
  }
})

router.get('/:id/versions', async (req, res) => {
  try {
    const versions = await getSheetVersionSnapshots(req.params.id)
    res.json(versions)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/archive/search', async (req, res) => {
  try {
    const result = await getSheetArchive(req.query)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const { prisma } = await import('../lib/prisma.js')
    await prisma.weeklySheet.delete({
      where: { id: req.params.id }
    })
    res.json({ message: 'تم حذف الكشف بنجاح' })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'الكشف غير موجود' })
    }
    res.status(500).json({ error: error.message })
  }
})

export default router
