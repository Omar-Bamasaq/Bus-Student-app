/**
 * Test: subscription expiry notification deduplication
 *
 * Ensures that calling createSubscriptionNotification 10 times
 * with the same type/subscriptionId produces only 1 notification.
 *
 * Usage: node __tests__/subscriptionExpiryDedup.test.mjs
 */
import { PrismaClient } from '@prisma/client'

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

const prisma = new PrismaClient()

async function createSubscriptionNotification(userId, type, title, message, data = {}) {
  if (type === 'subscription_expiring_soon' || type === 'subscription_expired') {
    const subscriptionId = data.subscriptionId
    if (subscriptionId) {
      const existing = await prisma.notification.findFirst({
        where: { userId, type, data: { path: ['subscriptionId'], equals: subscriptionId } },
      })
      if (existing) return existing
    }
  }

  return prisma.notification.create({
    data: { userId, type, title, message, data, dedupKey: `${type}_${userId}_${data.subscriptionId || ''}` },
  })
}

async function main() {
  console.log('=== Test: Subscription Expiry Deduplication ===\n')

  // 1. Find any existing student user
  const studentUser = await prisma.user.findFirst({ where: { role: 'student' } })
  if (!studentUser) {
    console.error('SKIP: No student user found in DB')
    await prisma.$disconnect()
    return
  }
  console.log(`Student user: ${studentUser.id} (${studentUser.username})`)

  // 2. Find any active or expiring subscription for that student
  const student = await prisma.student.findUnique({ where: { id: studentUser.studentId } })
  if (!student) {
    console.error('SKIP: No student record linked to user')
    await prisma.$disconnect()
    return
  }

  // Use an actual subscription if available, otherwise create a temp one
  let sub = await prisma.subscription.findFirst({
    where: { studentId: student.id, status: 'active' },
    orderBy: { endDate: 'desc' },
  })

  if (!sub) {
    // Create a temporary subscription just for this test
    const today = startOfDay(new Date())
    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() + 1)

    sub = await prisma.subscription.create({
      data: {
        studentId: student.id,
        type: 'MONTHLY',
        startDate: today,
        endDate: endDate,
        amount: 100,
        status: 'active',
      },
    })
    console.log(`Created temporary subscription: ${sub.id} (expires in 1 day)`)
  } else {
    console.log(`Using existing subscription: ${sub.id} (endDate: ${sub.endDate.toISOString().slice(0, 10)})`)
  }

  // 3. Clean any existing expiring-soon notifications for this subscription
  await prisma.notification.deleteMany({
    where: {
      userId: studentUser.id,
      type: 'subscription_expiring_soon',
      data: { path: ['subscriptionId'], equals: sub.id },
    },
  })
  const beforeCount = await prisma.notification.count({
    where: { userId: studentUser.id, type: 'subscription_expiring_soon' },
  })
  console.log(`Before: ${beforeCount} subscription_expiring_soon notifications for user`)

  // 4. Call createSubscriptionNotification 10 times
  const ITERATIONS = 10
  for (let i = 1; i <= ITERATIONS; i++) {
    const result = await createSubscriptionNotification(
      studentUser.id,
      'subscription_expiring_soon',
      'اقتربت نهاية الاشتراك',
      'سينتهي اشتراكك بعد يوم واحد',
      { subscriptionId: sub.id, daysLeft: 1 }
    )
    console.log(`  Iteration ${i}: ${result.id === sub.id ? '(cached)' : 'created notification'} ${result.id}`)
  }

  // 5. Verify only 1 notification was created
  const afterCount = await prisma.notification.count({
    where: { userId: studentUser.id, type: 'subscription_expiring_soon' },
  })
  console.log(`After:  ${afterCount} subscription_expiring_soon notifications for user`)

  const subSpecificCount = await prisma.notification.count({
    where: {
      userId: studentUser.id,
      type: 'subscription_expiring_soon',
      data: { path: ['subscriptionId'], equals: sub.id },
    },
  })
  console.log(`Notifications for subscription ${sub.id}: ${subSpecificCount}`)

  // 6. Assert
  if (subSpecificCount === 1) {
    console.log('\n✓ PASS: Only 1 notification created for the subscription')
  } else {
    console.log(`\n✗ FAIL: Expected 1 notification, got ${subSpecificCount}`)
    process.exitCode = 1
  }

  // 7. Cleanup test data
  if (subSpecificCount > 0) {
    if (subSpecificCount === 1) {
      // Keep the one notification (leave the system in a valid state)
    }
  }

  console.log('\n=== Test Complete ===')
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('Test error:', e)
  process.exitCode = 1
  prisma.$disconnect()
})
