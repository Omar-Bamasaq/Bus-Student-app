import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const admins = await prisma.user.findMany({
    where: { role: 'admin' },
    orderBy: { createdAt: 'asc' },
  })

  if (!admins.length) {
    throw new Error('No admin users found. Aborting to avoid losing access.')
  }

  const primaryAdmin = admins[0]

  await prisma.$transaction([
    prisma.busLoad.deleteMany(),
    prisma.returnQueue.deleteMany(),
    prisma.activeBus.deleteMany(),
    prisma.dailyOperation.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.subscription.deleteMany(),
    prisma.attendance.deleteMany(),
    prisma.assignment.deleteMany(),
    prisma.campaignEnrollment.deleteMany(),
    prisma.weeklySheetVersion.deleteMany(),
    prisma.weeklySheetStudent.deleteMany(),
    prisma.weeklySheet.deleteMany(),
    prisma.studentTransfer.deleteMany(),
    prisma.busStudentOrder.deleteMany(),
    prisma.busStudent.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.messageTemplate.deleteMany(),
    prisma.campaign.deleteMany(),
    prisma.student.deleteMany(),
    prisma.bus.deleteMany(),
  ])

  await prisma.user.deleteMany({ where: { role: { not: 'admin' } } })

  if (admins.length > 1) {
    await prisma.user.deleteMany({ where: { role: 'admin', id: { not: primaryAdmin.id } } })
  }

  await prisma.user.update({
    where: { id: primaryAdmin.id },
    data: {
      status: 'active',
      failedAttempts: 0,
      lockedUntil: null,
      mustChangePassword: primaryAdmin.mustChangePassword,
    },
  })

  console.log('Database reset completed. Preserved admin account:', primaryAdmin.username)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
