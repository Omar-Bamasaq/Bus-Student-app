import 'dotenv/config'

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { initSocketServer } from './services/socketService.js'
import trackingRoutes from './routes/tracking.js'
import authRoutes from './routes/auth.js'
import studentRoutes from './routes/students.js'
import busRoutes from './routes/buses.js'
import assignmentRoutes from './routes/assignments.js'
import subscriptionRoutes from './routes/subscriptions.js'
import dashboardRoutes from './routes/dashboard.js'
import attendanceRoutes from './routes/attendance.js'
import returnRoutes from './routes/return.js'
import busStudentRoutes from './routes/busStudents.js'
import pricingRoutes from './routes/pricing.js'
import campaignRoutes from './routes/campaigns.js'
import transferRoutes from './routes/transfers.js'
import auditRoutes from './routes/audit.js'
import enrollmentRoutes from './routes/enrollments.js'
import sheetRoutes from './routes/sheets.js'
import operationRoutes from './routes/operations.js'
import approvalsRoutes from './routes/approvals.js'
import weeklySheetRoutes from './routes/weeklySheets.js'
import userRoutes from './routes/users.js'
import studentPortalRoutes from './routes/studentPortal.js'
import notificationRoutes from './routes/notifications.js'
import messageTemplateRoutes from './routes/messageTemplates.js'
import busStudentOrderRoutes from './routes/busStudentOrder.js'
import tempTransferRoutes from './routes/tempTransfers.js'
import emergencyRoutes from './routes/emergency.js'
import financialRoutes from './routes/financial.js'
import adminRoutes from './routes/admin.js'
import dailyExceptionsRoutes from './routes/dailyExceptions.js'
import destinationRoutes from './routes/destinations.js'
import dailySubscriptionRoutes from './routes/dailySubscriptions.js'
import cartRoutes from './routes/cart.js'
import cartApprovalRoutes from './routes/cartApprovals.js'
import saturdayRoutes from './routes/saturdayOperations.js'

const app = express()
const PORT = process.env.PORT || 3000

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
  : (process.env.NODE_ENV === 'production' ? [] : ['http://localhost:5173', 'http://localhost:3000'])

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true)
    if (allowedOrigins.includes(origin)) return cb(null, true)
    if (process.env.NODE_ENV !== 'production') return cb(null, true)
    cb(new Error('Origin not allowed by CORS'))
  },
  credentials: true,
}))

app.use(helmet())
app.use(express.json({ limit: '10mb' }))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || '200'),
  message: { error: 'طلبات كثيرة جدًا، حاول لاحقًا' },
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api/auth', limiter)

app.use('/api/auth', authRoutes)
app.use('/api/students', studentRoutes)
app.use('/api/buses', busRoutes)
app.use('/api/assignments', assignmentRoutes)
app.use('/api/subscriptions', subscriptionRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/bus-students', busStudentRoutes)
app.use('/api/return', returnRoutes)
app.use('/api/pricing', pricingRoutes)
app.use('/api/campaigns', campaignRoutes)
app.use('/api/transfers', transferRoutes)
app.use('/api/audit', auditRoutes)
app.use('/api/enrollments', enrollmentRoutes)
app.use('/api/sheets', sheetRoutes)
app.use('/api/operations', operationRoutes)
app.use('/api/tracking', trackingRoutes)
app.use('/api/approvals', approvalsRoutes)
app.use('/api/weekly-sheets', weeklySheetRoutes)
app.use('/api/users', userRoutes)
app.use('/api/student-portal', studentPortalRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/message-templates', messageTemplateRoutes)
app.use('/api/bus-student-order', busStudentOrderRoutes)
app.use('/api/temp-transfers', tempTransferRoutes)
app.use('/api/emergency', emergencyRoutes)
app.use('/api/financial', financialRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/daily-exceptions', dailyExceptionsRoutes)
app.use('/api/destinations', destinationRoutes)
app.use('/api/daily-subscriptions', dailySubscriptionRoutes)
app.use('/api/student/cart', cartRoutes)
app.use('/api/approvals/carts', cartApprovalRoutes)
app.use('/api/saturday', saturdayRoutes)

// Auto-expire temporary transfers every 15 minutes
import { prisma } from './lib/prisma.js'
import { getLocalDate } from './utils/dateUtils.js'
setInterval(async () => {
  try {
    const today = getLocalDate()
    await prisma.studentTransfer.updateMany({
      where: { type: 'TEMPORARY', isActive: true, endDate: { lt: today } },
      data: { isActive: false },
    })
  } catch (e) {
  }
}, 15 * 60 * 1000)

// Auto-expire grace periods every 5 minutes
import { autoExpireGracePeriods } from './services/financialService.js'
setInterval(async () => {
  try {
    await autoExpireGracePeriods()
  } catch (e) {
  }
}, 5 * 60 * 1000)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use((_req, res) => {
  res.status(404).json({ error: 'المسار غير موجود' })
})

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err.message || err)
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'خطأ داخلي في الخادم' : err.message,
  })
})

const server = initSocketServer(app)
server.listen(PORT, () => {})
