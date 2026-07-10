import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  await prisma.busLoad.deleteMany()
  await prisma.returnQueue.deleteMany()
  await prisma.activeBus.deleteMany()
  await prisma.dailyOperation.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.subscription.deleteMany()
  await prisma.attendance.deleteMany()
  await prisma.assignment.deleteMany()
  await prisma.campaignEnrollment.deleteMany()
  await prisma.weeklySheetStudent.deleteMany()
  await prisma.weeklySheetVersion.deleteMany()
  await prisma.weeklySheet.deleteMany()
  await prisma.studentTransfer.deleteMany()
  await prisma.busStudent.deleteMany()
  await prisma.student.deleteMany()
  await prisma.bus.deleteMany()
  await prisma.user.deleteMany()
  await prisma.destination.deleteMany()
  await prisma.pricingArea.deleteMany()
  await prisma.pricing.deleteMany()

  const defaultDestinations = await Promise.all([
    prisma.destination.create({
      data: { name: 'جامعة حضرموت (فلك)', sortOrder: 1 },
    }),
    prisma.destination.create({
      data: { name: 'جامعة العلوم والتكنولوجيا (بويش)', sortOrder: 2 },
    }),
    prisma.destination.create({
      data: { name: 'كلية الريان التقنية (جول مسحة)', sortOrder: 3 },
    }),
  ])

  const hash = (p) => bcrypt.hash(p, 10)

  const adminPassword = await hash('123')
  const driver1Password = await hash('0500000001')
  const driver2Password = await hash('0500000002')

  const admin = await prisma.user.create({
    data: { username: 'admin1', password: adminPassword, name: 'مشرف النظام', phone: '0500000000', role: 'admin', mustChangePassword: false },
  })

  const driver1 = await prisma.user.create({
    data: { username: 'سامر33', password: driver1Password, name: 'سامر الأحمد', phone: '0500000001', role: 'driver', mustChangePassword: true },
  })

  const driver2 = await prisma.user.create({
    data: { username: 'خالد22', password: driver2Password, name: 'خالد علي', phone: '0500000002', role: 'driver', mustChangePassword: true },
  })

  const bus1 = await prisma.bus.upsert({
    where: { busNumber: '1' },
    update: { capacity: 24, model: 'تويوتا كوستر', color: 'أبيض', driverId: driver1.id, plateNumber: 'ABC 1234', primaryPhone: '0501111111' },
    create: { busNumber: '1', plateNumber: 'ABC 1234', capacity: 24, model: 'تويوتا كوستر', color: 'أبيض', driverId: driver1.id, primaryPhone: '0501111111' },
  })

  const bus2 = await prisma.bus.upsert({
    where: { busNumber: '2' },
    update: { capacity: 20, model: 'هيونداي كاونتي', color: 'أزرق', driverId: driver2.id, plateNumber: 'XYZ 5678', primaryPhone: '0502222222' },
    create: { busNumber: '2', plateNumber: 'XYZ 5678', capacity: 20, model: 'هيونداي كاونتي', color: 'أزرق', driverId: driver2.id, primaryPhone: '0502222222' },
  })

  const students = await Promise.all([
    prisma.student.create({ data: { name: 'أحمد محمد', phone: '0551111111', parentName: 'محمد أحمد', parentPhone: '0551111110', zone: 'الروضة', destinationId: defaultDestinations[0].id, address: 'شارع الملك فهد' } }),
    prisma.student.create({ data: { name: 'سارة خالد', phone: '0552222222', parentName: 'خالد علي', parentPhone: '0552222220', zone: 'النزهة', destinationId: defaultDestinations[0].id, address: 'شارع الأمير سلطان' } }),
    prisma.student.create({ data: { name: 'فيصل عمر', phone: '0553333333', parentName: 'عمر فيصل', parentPhone: '0553333330', zone: 'الزهراء', destinationId: defaultDestinations[1].id, address: 'شارع التخصصي' } }),
    prisma.student.create({ data: { name: 'نورة عبدالله', phone: '0554444444', parentName: 'عبدالله نورة', parentPhone: '0554444440', zone: 'المصيف', destinationId: defaultDestinations[1].id, address: 'شارع العليا' } }),
    prisma.student.create({ data: { name: 'تركي سعد', phone: '0555555555', parentName: 'سعد تركي', parentPhone: '0555555550', zone: 'الروضة', destinationId: defaultDestinations[2].id, address: 'شارع الثمانين' } }),
    prisma.student.create({
      data: {
        name: 'منى فهد', phone: '0556666666', parentName: 'فهد منى', parentPhone: '0556666660',
        zone: 'العليا', destinationId: defaultDestinations[2].id, address: 'شارع التخصصي',
        transportMode: 'HOME', homeAddress: 'حي النرجس، شارع 15، فيلا 22',
        homeDeliveryFee: 150, homeNotes: 'الباب الأيمن - جرس البواب',
        homeDeliveryActive: true,
      },
    }),
  ])

  for (const s of students) {
    const baseUsername = `${s.name.split(' ')[0]}.${s.name.split(' ').pop()}`
    let username = baseUsername
    let counter = 2
    while (await prisma.user.findUnique({ where: { username } })) { username = `${baseUsername}${counter}`; counter++ }
    const pwd = await hash(s.phone || '12345678')
    await prisma.user.create({
      data: { username, password: pwd, name: s.name, phone: s.phone || '', role: 'student', mustChangePassword: true, studentId: s.id },
    })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  await Promise.all([
    prisma.assignment.create({ data: { studentId: students[0].id, busId: bus1.id, date: today, pickupTime: '06:30', dropoffTime: '13:00', line: 'JEBALI', period: 'MORNING' } }),
    prisma.assignment.create({ data: { studentId: students[1].id, busId: bus1.id, date: today, pickupTime: '06:45', dropoffTime: '13:15', line: 'JEBALI', period: 'MORNING' } }),
    prisma.assignment.create({ data: { studentId: students[2].id, busId: bus1.id, date: today, pickupTime: '07:00', dropoffTime: '13:30', line: 'JEBALI', period: 'MORNING' } }),
    prisma.assignment.create({ data: { studentId: students[3].id, busId: bus2.id, date: today, pickupTime: '06:30', dropoffTime: '13:00', line: 'BAHRY', period: 'MORNING' } }),
    prisma.assignment.create({ data: { studentId: students[4].id, busId: bus2.id, date: today, pickupTime: '06:50', dropoffTime: '13:20', line: 'BAHRY', period: 'MORNING' } }),
  ])

  const startDate = new Date(today)
  startDate.setDate(1)
  const endDate = new Date(today)
  endDate.setMonth(endDate.getMonth() + 1)

  const sub = await prisma.subscription.create({
    data: { studentId: students[0].id, type: 'MONTHLY', startDate, endDate, amount: 300, paymentStatus: 'paid', status: 'active' },
  })

  await prisma.payment.create({
    data: { subscriptionId: sub.id, amount: 300, method: 'cash', notes: 'مدفوعة كاملة' },
  })

  console.log('Seed completed with sample data')
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
