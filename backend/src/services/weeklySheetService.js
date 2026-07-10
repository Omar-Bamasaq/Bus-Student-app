import { prisma } from '../lib/prisma.js'
import { createAuditLog } from '../lib/audit.js'
import { canStudentOperateOnDate, DAY_NAMES } from './studentService.js'
import { parseSubscriptionNotes } from './subscriptionService.js'
import { getLocalDate, formatLocalDate, snapToSaturday } from '../utils/dateUtils.js'
import { getStudentIdsToExclude, computeFinancialStatus, FinancialStatus } from './financialService.js'

/** Convert a local-midnight Date to a UTC-midnight Date so Prisma's
 *  UTC-write / local-read round-trip preserves the intended date. */
function toUTC(d) {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
}

function getWeekEnd(start) {
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return end
}

function startOfDay(date = new Date()) {
  return getLocalDate(date)
}

async function getStudentWeeklyStatus(studentId, weekStart, weekEnd) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { offDays: true },
  })

  const baseOffDays = student?.offDays || []
  const status = {}

  // Get active daily subscriptions for the week
  const dailySubscriptions = await prisma.subscription.findMany({
    where: {
      studentId,
      type: 'DAILY',
      status: 'active',
    },
  })

  for (let i = 0; i < 7; i++) {
    const checkDate = getLocalDate(weekStart)
    checkDate.setDate(checkDate.getDate() + i)
    const normalizedDate = getLocalDate(checkDate)
    const dayName = DAY_NAMES[normalizedDate.getDay()]

    // Check if student can operate on this specific date
    const canOperate = await canStudentOperateOnDate(studentId, checkDate)

    let hasActiveDailyOverride = false
    for (const sub of dailySubscriptions) {
      const executionDate = sub.executionDate ? startOfDay(sub.executionDate) : null
      const checkDateStart = startOfDay(checkDate)
      if (executionDate && executionDate.getTime() === checkDateStart.getTime()) {
        hasActiveDailyOverride = true
        break
      }
      const subStart = startOfDay(sub.startDate)
      const subEnd = startOfDay(sub.endDate)
      if (checkDateStart >= subStart && checkDateStart <= subEnd) {
        const notes = parseSubscriptionNotes(sub.notes)
        const selectedDays = Array.isArray(notes.days) ? notes.days : []
        if (selectedDays.length === 0 || selectedDays.includes(dayName)) {
          hasActiveDailyOverride = true
          break
        }
      }
    }

    status[dayName] = {
      canOperate,
      originalOff: baseOffDays.includes(dayName),
      hasActiveDailyOverride,
    }
  }

  return {
    baseOffDays,
    dailyStatus: status,
  }
}

export async function generateWeeklySheets(weekStart, userId) {
  const rawStart = snapToSaturday(weekStart)
  const start = toUTC(rawStart)
  const end = toUTC(getWeekEnd(rawStart))
  console.log('=== CREATE WEEKLY SHEET ===', { weekStart, rawStart: rawStart.toString(), start: start.toISOString(), end: end.toISOString() })

  const buses = await prisma.bus.findMany({
    where: { status: 'active', templateStudents: { some: { isActive: true } } },
    include: {
      driver: { select: { id: true, name: true, phone: true } },
      templateStudents: {
        where: { isActive: true },
        include: {
          student: true,
        },
        orderBy: [{ pickupTime: 'asc' }, { createdAt: 'asc' }],
      },
      outgoingTransfers: {
        where: { isActive: true, startDate: { lte: end }, endDate: { gte: start } },
      },
      incomingTransfers: {
        where: { isActive: true, startDate: { lte: end }, endDate: { gte: start } },
        include: { fromBus: { select: { busNumber: true } } },
      },
    },
  })

  const excludedIds = await getStudentIdsToExclude()

  const results = []

  for (const bus of buses) {
    const busOutgoing = new Set(bus.outgoingTransfers.map(t => t.studentId))
    const incomingMap = new Map(bus.incomingTransfers.map(t => [t.studentId, t]))

    const studentRows = []
    const incomingStudentIds = bus.incomingTransfers
      .filter(t => !bus.templateStudents.some(bs => bs.studentId === t.studentId))
      .map(t => t.studentId)

    const extraStudents = incomingStudentIds.length > 0
      ? await prisma.student.findMany({
          where: { id: { in: incomingStudentIds } },
        })
      : []

    const extraMap = new Map(extraStudents.map(s => [s.id, s]))
    let sortOrder = 1

    for (const bs of bus.templateStudents) {
      if (busOutgoing.has(bs.studentId)) continue
      if (excludedIds.has(bs.studentId)) continue
      const transfer = incomingMap.get(bs.studentId)
      const { status: finStatus } = await computeFinancialStatus(bs.studentId, start)
      studentRows.push({
        studentId: bs.student.id,
        studentName: bs.student.name,
        major: bs.student.major,
        level: bs.student.level,
        institutionName: bs.student.institutionName,
        pickupLocation: bs.student.address || bs.student.pickupLocation,
        pickupTime: bs.pickupTime,
        transportMode: bs.student.transportMode,
        sortOrder: sortOrder++,
        isTransfer: !!transfer,
        transferFrom: transfer?.fromBus?.busNumber || null,
        offDays: bs.student.offDays || [],
        homeNotes: bs.student.homeNotes,
        notes: finStatus === FinancialStatus.OVERDUE ? JSON.stringify({ financialStatus: 'OVERDUE' }) : null,
      })
    }

    for (const t of bus.incomingTransfers) {
      if (bus.templateStudents.some(bs => bs.studentId === t.studentId)) continue
      if (excludedIds.has(t.studentId)) continue
      const s = extraMap.get(t.studentId)
      if (!s) continue
      const { status: finStatus } = await computeFinancialStatus(t.studentId, start)
      studentRows.push({
        studentId: s.id,
        studentName: s.name,
        major: s.major,
        level: s.level,
        institutionName: s.institutionName,
        pickupLocation: s.address || s.pickupLocation,
        pickupTime: null,
        transportMode: s.transportMode,
        sortOrder: sortOrder++,
        isTransfer: true,
        transferFrom: t.fromBus?.busNumber || null,
        offDays: s.offDays || [],
        homeNotes: s.homeNotes,
        notes: finStatus === FinancialStatus.OVERDUE
          ? JSON.stringify({ financialStatus: 'OVERDUE', transferFrom: t.fromBus?.busNumber || '' })
          : `تحويل مؤقت من باص ${t.fromBus?.busNumber || ''}`,
      })
    }

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.weeklySheet.findUnique({
        where: { busId_weekStart: { busId: bus.id, weekStart: start } },
        include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
      })

      let sheetId
      const newVersion = existing ? existing.version + 1 : 1

      if (existing) {
        const oldStudents = await tx.weeklySheetStudent.findMany({
          where: { sheetId: existing.id },
          select: {
            studentId: true, studentName: true, major: true, level: true,
            pickupLocation: true, pickupTime: true, transportMode: true,
            sortOrder: true, isTransfer: true, transferFrom: true,
            offDays: true, homeNotes: true, notes: true,
          },
          orderBy: { sortOrder: 'asc' },
        })

        await tx.weeklySheetVersion.create({
          data: {
            sheetId: existing.id,
            version: existing.version,
            generatedById: userId,
            studentCount: oldStudents.length,
            snapshot: oldStudents,
          },
        })

        await tx.weeklySheetStudent.deleteMany({ where: { sheetId: existing.id } })

        await tx.weeklySheet.update({
          where: { id: existing.id },
          data: { version: newVersion, studentCount: studentRows.length, generatedById: userId },
        })

        sheetId = existing.id
      } else {
        const sheet = await tx.weeklySheet.create({
          data: {
            busId: bus.id,
            weekStart: start,
            weekEnd: end,
            version: 1,
            generatedById: userId,
            studentCount: studentRows.length,
          },
        })
        sheetId = sheet.id
      }

      if (studentRows.length > 0) {
        await tx.weeklySheetStudent.createMany({
          data: studentRows.map(s => ({ ...s, sheetId })),
        })
      }

      return { sheetId, busNumber: bus.busNumber, driverName: bus.driver?.name, version: newVersion, studentCount: studentRows.length }
    })

    results.push(result)
  }

  await createAuditLog({
    userId,
    action: 'GENERATE_WEEKLY_SHEETS',
    entityType: 'WeeklySheet',
    newValue: { weekStart: formatLocalDate(start), weekEnd: formatLocalDate(end), sheets: results.length },
    reason: 'إنشاء الكشوف الأسبوعية',
  })

  return results
}

export async function getSheetsForWeek(weekStart) {
  const rawStart = snapToSaturday(weekStart)
  const start = toUTC(rawStart)

  const sheets = await prisma.weeklySheet.findMany({
    where: { weekStart: start },
    include: {
      bus: {
        select: { id: true, busNumber: true, plateNumber: true, capacity: true, vehicleType: true, driverName: true, driver: { select: { id: true, name: true, phone: true } } },
      },
      generatedBy: { select: { name: true } },
    },
    orderBy: { bus: { busNumber: 'asc' } },
  })

  return sheets.map(s => ({
    id: s.id,
    busId: s.busId,
    busNumber: s.bus.busNumber,
    plateNumber: s.bus.plateNumber,
    vehicleType: s.bus.vehicleType,
    capacity: s.bus.capacity,
    driver: s.bus.driver,
    driverName: s.bus.driverName,
    weekStart: formatLocalDate(s.weekStart),
    weekEnd: formatLocalDate(s.weekEnd),
    version: s.version,
    studentCount: s.studentCount,
    generatedByName: s.generatedBy?.name,
    createdAt: s.createdAt,
  }))
}

export async function getSheetDetail(sheetId) {
  const sheet = await prisma.weeklySheet.findUnique({
    where: { id: sheetId },
    include: {
      bus: {
        select: { id: true, busNumber: true, plateNumber: true, capacity: true, vehicleType: true, primaryPhone: true, secondaryPhone: true, driverName: true, driver: { select: { id: true, name: true, phone: true } } },
      },
      generatedBy: { select: { name: true } },
      students: { orderBy: { sortOrder: 'asc' } },
    },
  })
  if (!sheet) throw new Error('الكشف غير موجود')

  const studentIds = sheet.students.map(s => s.studentId)

  const [subscriptions] = await Promise.all([
    prisma.subscription.findMany({
      where: {
        studentId: { in: studentIds },
        status: 'active',
        startDate: { lte: sheet.weekEnd },
        endDate: { gte: sheet.weekStart },
      },
      select: { studentId: true, paymentStatus: true, endDate: true },
    }),
  ])

  const payMap = new Map()
  for (const sub of subscriptions) {
    const existing = payMap.get(sub.studentId)
    if (!existing || sub.endDate > existing.endDate) {
      payMap.set(sub.studentId, sub.paymentStatus)
    }
  }

  // Calculate effective offDays for each student considering daily subscriptions
  const studentsWithEffectiveStatus = []
  for (const student of sheet.students) {
    const weeklyStatus = await getStudentWeeklyStatus(student.studentId, sheet.weekStart, sheet.weekEnd)
    
    // Derive effective off days from canStudentOperateOnDate() — days where the student cannot operate
    const effectiveOffDays = Object.entries(weeklyStatus.dailyStatus)
      .filter(([, status]) => !status.canOperate)
      .map(([day]) => day)
    
    studentsWithEffectiveStatus.push({
      ...student,
      paymentStatus: payMap.get(student.studentId) || 'unpaid',
      effectiveOffDays,
      weeklyStatus: weeklyStatus.dailyStatus,
    })
  }

  return {
    ...sheet,
    weekStart: formatLocalDate(sheet.weekStart),
    weekEnd: formatLocalDate(sheet.weekEnd),
    students: studentsWithEffectiveStatus,
  }
}

export async function getSheetArchive(search) {
  const where = {}
  if (search.weekStart) {
    where.weekStart = toUTC(snapToSaturday(search.weekStart))
  }
  if (search.busId) where.busId = search.busId
  if (search.driverName) {
    where.bus = { driver: { name: { contains: search.driverName } } }
  }

  const sheets = await prisma.weeklySheet.findMany({
    where,
    include: {
      bus: { select: { busNumber: true, plateNumber: true, driver: { select: { name: true } } } },
      generatedBy: { select: { name: true } },
      versions: { orderBy: { version: 'desc' }, take: 1 },
    },
    orderBy: { weekStart: 'desc' },
    take: 50,
  })

  const result = []
  for (const s of sheets) {
    const versions = [{
      version: s.version,
      studentCount: s.studentCount,
      generatedByName: s.generatedBy?.name,
      isCurrent: true,
    }]

    const archived = await prisma.weeklySheetVersion.findMany({
      where: { sheetId: s.id },
      orderBy: { version: 'desc' },
      select: { version: true, studentCount: true, generatedBy: { select: { name: true } }, createdAt: true },
    })

    for (const v of archived) {
      versions.push({ version: v.version, studentCount: v.studentCount, generatedByName: v.generatedBy?.name, createdAt: v.createdAt, isCurrent: false })
    }

    const matchesStudent = !search.studentName || s.students?.some(st =>
      st.studentName?.includes(search.studentName)
    )

    if (search.studentName && !matchesStudent) continue

    result.push({
      id: s.id,
      busNumber: s.bus?.busNumber,
      plateNumber: s.bus?.plateNumber,
      driverName: s.bus?.driver?.name,
      weekStart: formatLocalDate(s.weekStart),
      weekEnd: formatLocalDate(s.weekEnd),
      versions,
    })
  }

  return result
}

export async function getSheetVersionSnapshots(sheetId) {
  const versions = await prisma.weeklySheetVersion.findMany({
    where: { sheetId },
    orderBy: { version: 'desc' },
    include: { generatedBy: { select: { name: true } } },
  })
  return versions
}

export async function getSheetQRData(sheetId) {
  const sheet = await prisma.weeklySheet.findUnique({
    where: { id: sheetId },
    include: {
      bus: { select: { busNumber: true, plateNumber: true, vehicleType: true, primaryPhone: true, driver: { select: { name: true, phone: true } } } },
    },
  })
  if (!sheet) throw new Error('الكشف غير موجود')

  return {
    busNumber: sheet.bus?.busNumber,
    plateNumber: sheet.bus?.plateNumber,
    vehicleType: sheet.bus?.vehicleType,
    driverName: sheet.bus?.driver?.name,
    driverPhone: sheet.bus?.driver?.phone,
    busPhone: sheet.bus?.primaryPhone,
    studentCount: sheet.studentCount,
    version: sheet.version,
    weekStart: formatLocalDate(sheet.weekStart),
    weekEnd: formatLocalDate(sheet.weekEnd),
  }
}
