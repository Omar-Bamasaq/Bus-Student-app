import { prisma } from '../lib/prisma.js'

const DEFAULT_PLAN_PRICES = {
  DAILY: 0,
  THREE_WEEKS: 0,
  FOUR_WEEKS: 0,
}

export async function getPrice(zoneId, destinationId, plan) {
  if (!zoneId || !plan) return DEFAULT_PLAN_PRICES[plan] ?? null

  if (destinationId) {
    const exact = await prisma.pricing.findUnique({
      where: { zone_dest_plan_unique: { zoneId, destinationId, plan } },
    })
    if (exact) return Number(exact.price)
  }

  const fallback = await prisma.pricing.findFirst({
    where: { zoneId, plan, destinationId: null },
  })
  if (fallback) return Number(fallback.price)

  const zone = await prisma.pricingArea.findUnique({ where: { id: zoneId } })
  if (zone) {
    const fieldMap = { DAILY: 'dailyPrice', THREE_WEEKS: 'threeWeeksPrice', FOUR_WEEKS: 'fourWeeksPrice' }
    const val = zone[fieldMap[plan]]
    if (val != null) return Number(val)
  }

  return DEFAULT_PLAN_PRICES[plan] ?? null
}

export async function getPriceByZoneName(zoneName, destinationId, plan) {
  if (!zoneName || !plan) return DEFAULT_PLAN_PRICES[plan] ?? null
  const zone = await prisma.pricingArea.findUnique({ where: { name: zoneName } })
  if (!zone) return DEFAULT_PLAN_PRICES[plan] ?? null
  return getPrice(zone.id, destinationId, plan)
}

export async function ensurePricingRows(zoneId, destinationId, values = {}) {
  const plans = ['DAILY', 'THREE_WEEKS', 'FOUR_WEEKS']
  await Promise.all(plans.map(async (plan) => {
    const price = values[plan] != null ? Number(values[plan]) : DEFAULT_PLAN_PRICES[plan]
    await prisma.pricing.upsert({
      where: { zone_dest_plan_unique: { zoneId, destinationId: destinationId ?? 'NONE', plan } },
      create: { zoneId, destinationId: destinationId || null, plan, price },
      update: { price },
    })
  }))
}
