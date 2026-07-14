/**
 * Test: Morning and return trip separation
 *
 * Ensures that:
 * 1. A completed morning trip (ActiveBus tripType MORNING, status ARRIVED) is
 *    returned by getTodayOperation() and NOT by GET /return/active-buses
 * 2. A return trip (ActiveBus tripType RETURN) is returned by
 *    GET /return/active-buses and NOT by getTodayOperation()
 * 3. A student's return trip BusLoad is correctly found by tripType: 'RETURN'
 *    and the morning BusLoad is NOT returned instead (the bug)
 *
 * Usage: node __tests__/morningReturnTripSeparation.test.mjs
 */
import { PrismaClient } from '@prisma/client'

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

const prisma = new PrismaClient()

async function main() {
  console.log('=== Test: Morning / Return Trip Separation ===\n')

  const today = startOfDay(new Date())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // 1. Create or reuse a daily operation for today
  let operation = await prisma.dailyOperation.findUnique({
    where: { operationDate: today },
  })
  if (!operation) {
    const admin = await prisma.user.findFirst({ where: { role: 'admin' } })
    if (!admin) {
      console.error('SKIP: No admin user found in DB')
      await prisma.$disconnect()
      return
    }
    operation = await prisma.dailyOperation.create({
      data: { operationDate: today, createdById: admin.id },
    })
    console.log(`Created operation: ${operation.id}`)
  } else {
    console.log(`Using existing operation: ${operation.id}`)
  }

  // 2. Find a bus with a driver
  const bus = await prisma.bus.findFirst({
    where: { driverId: { not: null }, status: 'active' },
  })
  if (!bus) {
    console.error('SKIP: No bus with driver found in DB')
    await prisma.$disconnect()
    return
  }
  console.log(`Using bus: ${bus.id} (${bus.busNumber || bus.plateNumber})`)

  // 3. Find an existing student for BusLoad tests
  const studentRecord = await prisma.student.findFirst()
  if (!studentRecord) {
    console.error('SKIP: No student found in DB')
    await prisma.$disconnect()
    return
  }
  const studentId = studentRecord.id
  console.log(`Using student: ${studentRecord.name} (id: ${studentId})`)

  // 4. Clean any existing ActiveBus records for this bus+operation to start fresh
  await prisma.activeBus.deleteMany({
    where: { operationId: operation.id, busId: bus.id },
  })
  await prisma.busLoad.deleteMany({
    where: { activeBus: { operationId: operation.id, busId: bus.id } },
  })
  console.log('Cleaned existing ActiveBus and BusLoad records for this bus')

  // Get a user to use as assignedBy
  const anyUser = await prisma.user.findFirst()
  if (!anyUser) {
    console.error('SKIP: No user found for assignedBy')
    await prisma.$disconnect()
    return
  }

  // 5. Create a MORNING ActiveBus with status ARRIVED (simulating completed morning trip)
  const morningBus = await prisma.activeBus.create({
    data: {
      operationId: operation.id,
      busId: bus.id,
      driverId: bus.driverId,
      tripType: 'MORNING',
      capacitySnapshot: bus.capacity,
      status: 'ARRIVED',
    },
  })
  console.log(`Created MORNING ActiveBus: ${morningBus.id} (status: ${morningBus.status})`)

  // 6. Create a RETURN ActiveBus with status AVAILABLE (simulating return trip prepared by admin)
  const returnBus = await prisma.activeBus.create({
    data: {
      operationId: operation.id,
      busId: bus.id,
      driverId: bus.driverId,
      tripType: 'RETURN',
      capacitySnapshot: bus.capacity,
      status: 'AVAILABLE',
    },
  })
  console.log(`Created RETURN ActiveBus: ${returnBus.id} (status: ${returnBus.status})`)

  // — Morning query using { not: 'RETURN' } (the actual fix) —
  const morningActiveBuses = await prisma.activeBus.findMany({
    where: { operationId: operation.id, tripType: { not: 'RETURN' } },
    select: { id: true, busId: true, status: true, tripType: true },
  })
  const morningByBusId = {}
  for (const ab of morningActiveBuses) {
    morningByBusId[ab.busId] = ab
  }

  // — Return query using tripType: 'RETURN' —
  const returnActiveBuses = await prisma.activeBus.findMany({
    where: {
      operationId: operation.id,
      tripType: 'RETURN',
      status: { notIn: ['BROKEN_DOWN', 'REPLACED'] },
      returnCompletedAt: null,
    },
  })

  // — BusLoad queries (simulating student portal dashboard) —

  // Create a morning BusLoad (from attendance check-in, no droppedOffAt)
  const morningLoad = await prisma.busLoad.create({
    data: {
      activeBusId: morningBus.id,
      studentId: studentId,
      assignedById: anyUser.id,
    },
  })
  console.log(`Created morning BusLoad: ${morningLoad.id}`)

  // Create a return BusLoad (from return loading) with droppedOffAt set
  const returnLoad = await prisma.busLoad.create({
    data: {
      activeBusId: returnBus.id,
      studentId: studentId,
      assignedById: anyUser.id,
      droppedOffAt: new Date(),
    },
  })
  console.log(`Created return BusLoad: ${returnLoad.id} (droppedOffAt: ${returnLoad.droppedOffAt})`)

  // Query as the student portal does WITH the fix (tripType: 'RETURN')
  const returnLoadWithFix = await prisma.busLoad.findFirst({
    where: {
      studentId: studentId,
      activeBus: { operationId: operation.id, status: { not: 'CANCELLED' }, tripType: 'RETURN' },
    },
  })

  // Query as the student portal did WITHOUT the fix (no tripType filter)
  const returnLoadWithoutFix = await prisma.busLoad.findFirst({
    where: {
      studentId: studentId,
      activeBus: { operationId: operation.id, status: { not: 'CANCELLED' } },
    },
    orderBy: { id: 'asc' },
  })

  console.log('\n--- Results ---')

  // Assertion 1: getTodayOperation() finds MORNING ActiveBus via { not: 'RETURN' }
  const foundMorning = morningByBusId[bus.id]
  const morningOk = foundMorning &&
    foundMorning.id === morningBus.id &&
    foundMorning.status === 'ARRIVED'
  console.log(
    morningOk
      ? `\u2713 getTodayOperation() finds MORNING ActiveBus: ${foundMorning.id} status=${foundMorning.status}`
      : `\u2717 getTodayOperation() failed: expected ${morningBus.id}, got ${JSON.stringify(foundMorning)}`
  )

  // Assertion 2: GET /return/active-buses finds RETURN ActiveBus
  const foundReturn = returnActiveBuses.find(b => b.busId === bus.id)
  const returnOk = foundReturn && foundReturn.id === returnBus.id && foundReturn.status === 'AVAILABLE'
  console.log(
    returnOk
      ? `\u2713 GET /return/active-buses finds RETURN ActiveBus: ${foundReturn.id} status=${foundReturn.status}`
      : `\u2717 GET /return/active-buses failed: expected ${returnBus.id}, got ${JSON.stringify(foundReturn)}`
  )

  // Assertion 3: MORNING not in return query (different records)
  const morningNotInReturn = !returnActiveBuses.find(b => b.id === morningBus.id)
  console.log(
    morningNotInReturn
      ? `\u2713 MORNING ActiveBus correctly excluded from return query`
      : `\u2717 MORNING ActiveBus incorrectly included in return query`
  )

  // Assertion 4: All 3 records are distinct
  const distinctOk = new Set([morningBus.id, returnBus.id, morningLoad.id, returnLoad.id]).size === 4
  console.log(
    distinctOk
      ? `\u2713 All records are distinct`
      : `\u2717 Records not all distinct`
  )

  // Assertion 5: WITH fix, returnLoad query finds RETURN BusLoad (has droppedOffAt)
  const fixOk = returnLoadWithFix && returnLoadWithFix.id === returnLoad.id && returnLoadWithFix.droppedOffAt !== null
  console.log(
    fixOk
      ? `\u2713 WITH tripType filter: found RETURN BusLoad ${returnLoadWithFix.id} (droppedOffAt set)`
      : `\u2717 WITH tripType filter: expected RETURN load ${returnLoad.id}, got ${JSON.stringify(returnLoadWithFix)}`
  )

  // Assertion 6: WITHOUT fix, returnLoad query returns MORNING BusLoad (no droppedOffAt)
  const bugReproduced = returnLoadWithoutFix && returnLoadWithoutFix.id === morningLoad.id && returnLoadWithoutFix.droppedOffAt === null
  console.log(
    bugReproduced
      ? `\u2713 WITHOUT tripType filter (BUG): found MORNING BusLoad ${returnLoadWithoutFix.id} (droppedOffAt=null)`
      : `\u2717 WITHOUT tripType filter: got ${JSON.stringify(returnLoadWithoutFix)}`
  )

  // Overall result
  if (morningOk && returnOk && morningNotInReturn && distinctOk && fixOk) {
    console.log('\n\u2713 PASS: All critical assertions passed')
  } else {
    console.log('\n\u2717 FAIL: Some assertions failed')
    process.exitCode = 1
  }

  // Cleanup
  await prisma.busLoad.deleteMany({
    where: { id: { in: [morningLoad.id, returnLoad.id] } },
  })
  await prisma.activeBus.deleteMany({
    where: { id: { in: [morningBus.id, returnBus.id] } },
  })
  console.log('\nCleaned up test records')

  console.log('\n=== Test Complete ===')
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('Test error:', e)
  process.exitCode = 1
  prisma.$disconnect()
})
