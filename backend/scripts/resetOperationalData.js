import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting operational data reset...\n')

  const counts = {}

  // 1. BusLoads (return trip student manifests)
  counts.busLoads = await prisma.busLoad.deleteMany()

  // 2. ReturnQueue
  counts.returnQueue = await prisma.returnQueue.deleteMany()

  // 3. ActiveBuses
  counts.activeBuses = await prisma.activeBus.deleteMany()

  // 4. Assignments (daily student-to-bus)
  counts.assignments = await prisma.assignment.deleteMany()

  // 5. Attendance records
  counts.attendances = await prisma.attendance.deleteMany()

  // 6. WeeklySheetStudents (children of weekly sheets)
  counts.weeklySheetStudents = await prisma.weeklySheetStudent.deleteMany()

  // 7. WeeklySheetVersions
  counts.weeklySheetVersions = await prisma.weeklySheetVersion.deleteMany()

  // 8. WeeklySheets
  counts.weeklySheets = await prisma.weeklySheet.deleteMany()

  // 9. StudentTransfers (temporary bus-to-bus transfers)
  counts.studentTransfers = await prisma.studentTransfer.deleteMany()

  // 10. Notifications (test-generated)
  counts.notifications = await prisma.notification.deleteMany()

  // 11. AuditLogs (test-generated, no impact on system)
  counts.auditLogs = await prisma.auditLog.deleteMany()

  // 12. DailyOperations (parent of activeBuses, returnQueue)
  counts.dailyOperations = await prisma.dailyOperation.deleteMany()

  // 13. BusStudentOrders — only temporary per-day orders; keep permanent defaults
  counts.tempBusStudentOrders = await prisma.busStudentOrder.deleteMany({
    where: { isTemporary: true },
  })

  console.log('تم حذف:\n')
  for (const [key, value] of Object.entries(counts)) {
    const labelMap = {
      busLoads: 'Bus Loads (رحلات العودة)',
      returnQueue: 'Return Queue (قائمة انتظار العودة)',
      activeBuses: 'Active Buses (الباصات النشطة)',
      assignments: 'Assignments (التعيينات)',
      attendances: 'Attendance (الحضور)',
      weeklySheetStudents: 'Weekly Sheet Students (طلاب الكشوف)',
      weeklySheetVersions: 'Weekly Sheet Versions (نسخ الكشوف)',
      weeklySheets: 'Weekly Sheets (الكشوف الأسبوعية)',
      studentTransfers: 'Student Transfers (التحويلات)',
      notifications: 'Notifications (الإشعارات)',
      auditLogs: 'Audit Logs (سجل التدقيق)',
      dailyOperations: 'Daily Operations (عمليات التشغيل)',
      tempBusStudentOrders: 'Temporary Bus Orders (الترتيبات المؤقتة)',
    }
    console.log(`  ${labelMap[key] || key}: ${value.count}`)
  }

  console.log('\nOperational data reset completed successfully.')
}

main()
  .catch((e) => {
    console.error('Error during reset:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
