import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'
import { hasActiveSameTypeSubscription } from '../services/subscriptionService.js'
import { getLocalDate } from '../utils/dateUtils.js'
import { createAndBroadcast } from '../services/notificationService.js'

const router = Router()
router.use(authenticate)

async function resolveStudentId(user) {
  if (user.studentId) return user.studentId
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  return dbUser?.studentId
}

async function getOrCreateDraftCart(studentId) {
  let cart = await prisma.cart.findFirst({
    where: { studentId, status: 'DRAFT' },
    include: {
      items: {
        include: { zone: { select: { id: true, name: true } }, destination: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
  if (!cart) {
    cart = await prisma.cart.create({
      data: { studentId, totalAmount: 0 },
      include: {
        items: {
          include: { zone: { select: { id: true, name: true } }, destination: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    })
  }
  return cart
}

async function recalcTotal(cartId) {
  const items = await prisma.cartItem.findMany({ where: { cartId }, select: { amount: true } })
  const total = items.reduce((sum, i) => sum + Number(i.amount), 0)
  await prisma.cart.update({ where: { id: cartId }, data: { totalAmount: total } })
  return total
}

router.post('/items', async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ error: 'غير مصرح' })
    const studentId = await resolveStudentId(req.user)
    if (!studentId) return res.status(404).json({ error: 'الطالب غير موجود' })

    const { type, zoneId, destinationId, amount, homeDeliveryFee, data } = req.body

    if (!type || !amount || amount <= 0) {
      return res.status(400).json({ error: 'بيانات غير صالحة' })
    }

    const student = await prisma.student.findUnique({ where: { id: studentId } })
    if (!student) return res.status(404).json({ error: 'الطالب غير موجود' })

    const activeSame = await hasActiveSameTypeSubscription(studentId, type)
    if (activeSame) {
      return res.status(400).json({ error: 'لديك اشتراك نشط من هذا النوع بالفعل' })
    }

    const cart = await getOrCreateDraftCart(studentId)

    const item = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        type,
        zoneId: zoneId || null,
        destinationId: destinationId || null,
        amount,
        homeDeliveryFee: homeDeliveryFee || null,
        data: data || {},
      },
      include: { zone: { select: { id: true, name: true } }, destination: { select: { id: true, name: true } } },
    })

    const total = await recalcTotal(cart.id)
    res.status(201).json({ item, cart: { ...cart, totalAmount: total } })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/items/:itemId', async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ error: 'غير مصرح' })
    const studentId = await resolveStudentId(req.user)
    if (!studentId) return res.status(404).json({ error: 'الطالب غير موجود' })

    const item = await prisma.cartItem.findUnique({
      where: { id: req.params.itemId },
      include: { cart: { select: { studentId: true } } },
    })
    if (!item) return res.status(404).json({ error: 'العنصر غير موجود' })
    if (item.cart.studentId !== studentId) return res.status(403).json({ error: 'غير مصرح' })

    const cartId = item.cartId
    await prisma.cartItem.delete({ where: { id: req.params.itemId } })

    const remaining = await prisma.cartItem.count({ where: { cartId } })
    if (remaining === 0) {
      await prisma.cart.delete({ where: { id: cartId } })
      return res.json({ cart: null })
    }

    const total = await recalcTotal(cartId)
    res.json({ cart: { id: cartId, totalAmount: total } })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/', async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ error: 'غير مصرح' })
    const studentId = await resolveStudentId(req.user)
    if (!studentId) return res.json({ cart: null })

    const cart = await prisma.cart.findFirst({
      where: { studentId, status: 'DRAFT' },
      include: {
        items: {
          include: { zone: { select: { id: true, name: true } }, destination: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    })
    res.json({ cart })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/submit', async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ error: 'غير مصرح' })
    const studentId = await resolveStudentId(req.user)
    if (!studentId) return res.status(404).json({ error: 'الطالب غير موجود' })

    const { receiptImage } = req.body

    const cart = await prisma.cart.findFirst({
      where: { studentId, status: 'DRAFT' },
      include: { items: true },
    })
    if (!cart) return res.status(400).json({ error: 'السلة فارغة' })
    if (cart.items.length === 0) return res.status(400).json({ error: 'السلة فارغة' })
    if (!receiptImage) return res.status(400).json({ error: 'يرجى رفع صورة سند التحويل' })

    const updated = await prisma.cart.update({
      where: { id: cart.id },
      data: { status: 'PENDING', receiptImage, submittedAt: new Date() },
    })

    const admins = await prisma.user.findMany({ where: { role: 'admin' }, select: { id: true } })
    for (const admin of admins) {
      await createAndBroadcast({
        userId: admin.id,
        type: 'cart_submitted',
        title: 'طلب سلة اشتراكات',
        message: `طلب سلة اشتراكات بقيمة ${Number(updated.totalAmount).toLocaleString()} ريال`,
        dedupKey: `cart_submitted_${admin.id}_${cart.id}`,
      })
    }

    res.status(201).json({ cart: updated })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
