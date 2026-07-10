import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const { date, busId, studentId, status, period, line } = req.query
    const where = {}

    if (date) {
      const d = new Date(date)
      where.date = d
    }
    if (busId) where.busId = busId
    if (studentId) where.studentId = studentId
    if (status) where.status = status
    if (period) where.period = period
    if (line) where.line = line

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, zone: true, phone: true, transportMode: true, homeAddress: true, homeNotes: true } },
        bus: {
          include: {
            driver: { select: { id: true, name: true, phone: true } },
          },
        },
      },
      orderBy: [{ date: 'desc' }, { pickupTime: 'asc' }],
    })

    res.json(assignments)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: req.params.id },
      include: {
        student: true,
        bus: { include: { driver: { select: { name: true, phone: true } } } },
      },
    })

    if (!assignment) {
      return res.status(404).json({ error: 'الرحلة غير موجودة' })
    }

    res.json(assignment)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/bus/:busId/template-students', async (req, res) => {
  try {
    const { busId } = req.params;
    const { date } = req.query;
    const busStudents = await prisma.busStudent.findMany({
      where: { busId, isActive: true },
      include: { student: true }
    });

    if (date) {
      const d = new Date(date);
      const existingAssignments = await prisma.assignment.findMany({
        where: { date: d, busId },
        select: { studentId: true }
      });
      const existingIds = new Set(existingAssignments.map(a => a.studentId));
      const available = busStudents.filter(bs => !existingIds.has(bs.studentId));
      return res.json(available.map(bs => bs.student));
    }

    res.json(busStudents.map(bs => bs.student));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authorize('admin'), async (req, res) => {
  try {
    const { studentId, busId, date, period, line, pickupTime, dropoffTime, notes } = req.body

    if (!studentId || !busId || !date) {
      return res.status(400).json({ error: 'الطالب والحافلة والتاريخ مطلوبون' })
    }

    const assignment = await prisma.assignment.create({
      data: {
        studentId,
        busId,
        date: new Date(date),
        period: period || 'MORNING',
        line: line || 'JEBALI',
        pickupTime,
        dropoffTime,
        notes,
      },
      include: {
        student: true,
        bus: { include: { driver: { select: { name: true } } } },
      },
    })

    res.status(201).json(assignment)
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        error: 'هذا الطالب لديه رحلة مسجلة في هذا التاريخ والفترة بالفعل',
      })
    }
    res.status(500).json({ error: error.message })
  }
})

router.post('/batch', authorize('admin'), async (req, res) => {
  try {
    const { busId, date, period, line, studentIds, pickupTime, dropoffTime } = req.body

    if (!busId || !date || !studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({ error: 'بيانات غير كاملة' })
    }

    const d = new Date(date)
    const created = []

    for (const studentId of studentIds) {
      try {
        const assignment = await prisma.assignment.create({
          data: {
            studentId,
            busId,
            date: d,
            period: period || 'MORNING',
            line: line || 'JEBALI',
            pickupTime: pickupTime || undefined,
            dropoffTime: dropoffTime || undefined,
          },
        })
        created.push(assignment)
      } catch (e) {
        // skip duplicates
      }
    }

    res.status(201).json({ created: created.length, total: studentIds.length })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', authorize('admin'), async (req, res) => {
  try {
    const { studentId, busId, date, period, line, pickupTime, dropoffTime, notes } = req.body

    const assignment = await prisma.assignment.update({
      where: { id: req.params.id },
      data: {
        studentId,
        busId,
        date: date ? new Date(date) : undefined,
        period,
        line,
        pickupTime,
        dropoffTime,
        notes,
      },
    })

    res.json(assignment)
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'الرحلة غير موجودة' })
    }
    res.status(500).json({ error: error.message })
  }
})

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body
    const allowed = ['scheduled', 'in_progress', 'completed', 'cancelled']

    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ error: 'حالة غير صالحة' })
    }

    const assignment = await prisma.assignment.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        student: { select: { name: true } },
        bus: { select: { plateNumber: true } },
      },
    })

    res.json(assignment)
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'الرحلة غير موجودة' })
    }
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    await prisma.assignment.delete({ where: { id: req.params.id } })
    res.json({ message: 'تم حذف الرحلة بنجاح' })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'الرحلة غير موجودة' })
    }
    res.status(500).json({ error: error.message })
  }
})

export default router
