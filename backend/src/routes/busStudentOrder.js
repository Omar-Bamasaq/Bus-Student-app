import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'
import { getLocalDate, formatLocalDate } from '../utils/dateUtils.js'

const router = Router()
router.use(authenticate)

router.get('/bus/:busId', async (req, res) => {
  try {
    const { busId } = req.params
    const { date } = req.query
    const today = formatLocalDate(getLocalDate())
    const targetDate = date || today

    let order = await prisma.busStudentOrder.findMany({
      where: {
        busId,
        date: new Date(targetDate),
        isTemporary: true,
      },
      include: { student: true },
      orderBy: { sortOrder: 'asc' },
    })

    if (order.length === 0) {
      order = await prisma.busStudentOrder.findMany({
        where: {
          busId,
          isTemporary: false,
        },
        include: { student: true },
        orderBy: { sortOrder: 'asc' },
      })
    }

    const busStudents = await prisma.busStudent.findMany({
      where: { busId, isActive: true },
      include: { student: true },
    })

    const orderedStudentIds = order.map(o => o.studentId)
    const unordered = busStudents.filter(bs => !orderedStudentIds.includes(bs.studentId))

    res.json({ order, unordered })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/bus/:busId/reorder', async (req, res) => {
  try {
    const { busId } = req.params
    const { studentIds, isTemporary, saveAsDefault } = req.body
    const today = formatLocalDate(getLocalDate())

    if (isTemporary) {
      await prisma.busStudentOrder.deleteMany({
        where: { busId, date: new Date(today), isTemporary: true },
      })
    } else {
      await prisma.busStudentOrder.deleteMany({
        where: { busId, isTemporary: false },
      })
    }

    const orderData = studentIds.map((studentId, index) => ({
      busId,
      studentId,
      sortOrder: index,
      isTemporary: isTemporary || false,
      date: isTemporary ? new Date(today) : new Date('1970-01-01'),
    }))

    await prisma.busStudentOrder.createMany({ data: orderData })

    if (saveAsDefault) {
      await prisma.busStudentOrder.deleteMany({
        where: { busId, isTemporary: false },
      })

      const defaultOrderData = studentIds.map((studentId, index) => ({
        busId,
        studentId,
        sortOrder: index,
        isTemporary: false,
        date: new Date('1970-01-01'),
      }))

      await prisma.busStudentOrder.createMany({ data: defaultOrderData })
    }

    res.json({ message: 'تم ترتيب الطلاب' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
