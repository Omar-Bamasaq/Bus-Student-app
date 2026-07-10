import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
const [u, st, b, sub, pay, att, ab, do_, pa, pr_, em] = await Promise.all([
  p.user.count(), p.student.count(), p.bus.count(),
  p.subscription.count(), p.payment.count(), p.attendance.count(),
  p.activeBus.count(), p.dailyOperation.count(),
  p.pricingArea.count(), p.pricing.count(),
  p.emergencyReport.count(),
])
const users = await p.user.findMany({ select: { username: true, role: true } })
console.log('Users:', JSON.stringify(users))
console.log('students='+st+' buses='+b+' subs='+sub+' payments='+pay)
console.log('attend='+att+' activeBuses='+ab+' dailyOps='+do_)
console.log('areas='+pa+' pricing='+pr_+' emergency='+em)
await p.$disconnect()
