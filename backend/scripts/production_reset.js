import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('=== Production Reset: Wiping all experimental data ===\n')

  // 1. Find & verify admin account
  const admins = await prisma.user.findMany({
    where: { role: 'admin' },
    orderBy: { createdAt: 'asc' },
  })

  if (!admins.length) {
    throw new Error('No admin user found! Aborting to preserve access.')
  }

  const admin = admins[0]
  console.log(`Admin preserved: ${admin.username} (${admin.id})`)

  const stats = {}

  // 2. Emergency system
  stats.emergencyReports = await prisma.emergencyReport.deleteMany()
  stats.emergencyLogs = await prisma.emergencyLog.deleteMany()

  // 3. Operational data (order respects FK constraints)
  stats.busLoads = await prisma.busLoad.deleteMany()
  stats.returnQueue = await prisma.returnQueue.deleteMany()
  stats.activeBuses = await prisma.activeBus.deleteMany()
  stats.dailyOperations = await prisma.dailyOperation.deleteMany()

  // 4. Student-related transactional data
  stats.dailyExecutionDates = await prisma.dailyExecutionDate.deleteMany()
  stats.payments = await prisma.payment.deleteMany()
  stats.subscriptions = await prisma.subscription.deleteMany()
  stats.attendances = await prisma.attendance.deleteMany()
  stats.assignments = await prisma.assignment.deleteMany()
  stats.studentTransfers = await prisma.studentTransfer.deleteMany()
  stats.busStudentOrders = await prisma.busStudentOrder.deleteMany()
  stats.busStudents = await prisma.busStudent.deleteMany()

  // 5. Campaigns
  stats.campaignEnrollments = await prisma.campaignEnrollment.deleteMany()
  stats.campaigns = await prisma.campaign.deleteMany()

  // 6. Weekly sheets
  stats.weeklySheetVersions = await prisma.weeklySheetVersion.deleteMany()
  stats.weeklySheetStudents = await prisma.weeklySheetStudent.deleteMany()
  stats.weeklySheets = await prisma.weeklySheet.deleteMany()

  // 7. Financial
  stats.studentFinancials = await prisma.studentFinancial.deleteMany()

  // 8. Notifications & audit logs
  stats.notifications = await prisma.notification.deleteMany()
  stats.auditLogs = await prisma.auditLog.deleteMany()

  // 9. Students (will cascade to linked user accounts except admin)
  stats.students = await prisma.student.deleteMany()

  // 10. Buses (driverId set to null, no drivers lost)
  stats.buses = await prisma.bus.deleteMany()

  // 11. Non-admin users (drivers, supervisors, student accounts)
  stats.nonAdminUsers = await prisma.user.deleteMany({
    where: { role: { not: 'admin' } },
  })

  // 12. Extra admins (keep only the first/primary admin)
  if (admins.length > 1) {
    stats.extraAdmins = await prisma.user.deleteMany({
      where: { role: 'admin', id: { not: admin.id } },
    })
  }

  // 13. Reset admin account state
  await prisma.user.update({
    where: { id: admin.id },
    data: {
      status: 'active',
      failedAttempts: 0,
      lockedUntil: null,
    },
  })

  // === Summary ===
  console.log('\n=== Deletion Summary ===')
  const labels = {
    emergencyReports: 'Emergency Reports (بلاغات الطوارئ)',
    emergencyLogs: 'Emergency Logs (سجل الطوارئ)',
    busLoads: 'Bus Loads (رحلات العودة)',
    returnQueue: 'Return Queue (قائمة انتظار العودة)',
    activeBuses: 'Active Buses (الباصات النشطة)',
    dailyOperations: 'Daily Operations (عمليات التشغيل)',
    dailyExecutionDates: 'Daily Execution Dates (تواريخ التنفيذ)',
    payments: 'Payments (المدفوعات)',
    subscriptions: 'Subscriptions (الاشتراكات)',
    attendances: 'Attendance (الحضور)',
    assignments: 'Assignments (التعيينات)',
    studentTransfers: 'Student Transfers (التحويلات)',
    busStudentOrders: 'Bus Student Orders (ترتيبات الطلاب)',
    busStudents: 'Bus-Student Assignments (ربط الباص-طالب)',
    campaignEnrollments: 'Campaign Enrollments (التسجيلات بالحملات)',
    campaigns: 'Campaigns (الحملات)',
    weeklySheetVersions: 'Weekly Sheet Versions (نسخ الكشوف)',
    weeklySheetStudents: 'Weekly Sheet Students (طلاب الكشوف)',
    weeklySheets: 'Weekly Sheets (الكشوف الأسبوعية)',
    studentFinancials: 'Student Financial (البيانات المالية للطلاب)',
    notifications: 'Notifications (الإشعارات)',
    auditLogs: 'Audit Logs (سجل التدقيق)',
    students: 'Students (الطلاب)',
    buses: 'Buses (الباصات)',
    nonAdminUsers: 'Non-admin Users (المستخدمون غير الأدمن)',
    extraAdmins: 'Extra Admin Accounts (حسابات أدمن إضافية)',
  }

  for (const [key, result] of Object.entries(stats)) {
    if (result?.count !== undefined) {
      console.log(`  ${labels[key] || key}: ${result.count}`)
    }
  }

  console.log('\n=== Preserved Data ===')
  console.log('  Admin account:', admin.username)
  console.log('  Pricing Areas (المناطق السعرية)')
  console.log('  Pricing (أسعار الاشتراكات)')
  console.log('  Message Templates (قوالب الرسائل)')

  console.log('\n✅ Production reset complete. System is clean and ready.')
}

main()
  .catch((error) => {
    console.error('\n❌ Reset failed:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
