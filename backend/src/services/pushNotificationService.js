import webpush from 'web-push'
import { prisma } from '../lib/prisma.js'

const PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY

if (PUBLIC_KEY && PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_MAILTO || 'mailto:admin@mashawerk.app',
    PUBLIC_KEY,
    PRIVATE_KEY
  )
}

export function getVapidPublicKey() {
  return PUBLIC_KEY
}

export function hasVapidKeys() {
  return !!(PUBLIC_KEY && PRIVATE_KEY)
}

export async function sendPushToUser(userId, payload) {
  if (!hasVapidKeys()) return

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  })

  if (!subscriptions.length) return

  const data = JSON.stringify({
    title: payload.title,
    message: payload.message,
    type: payload.type,
    priority: payload.priority,
    targetRoute: payload.targetRoute,
    notificationId: payload.id,
    data: payload.data,
    createdAt: payload.createdAt,
  })

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification({
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      }, data).catch(async (err) => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } })
        }
      })
    )
  )

  return results
}

export async function saveSubscription(userId, subscription, userAgent) {
  const existing = await prisma.pushSubscription.findUnique({
    where: { endpoint: subscription.endpoint },
  })

  if (existing) {
    return prisma.pushSubscription.update({
      where: { id: existing.id },
      data: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth, userAgent, userId },
    })
  }

  return prisma.pushSubscription.create({
    data: {
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent,
    },
  })
}

export async function removeSubscription(endpoint) {
  await prisma.pushSubscription.deleteMany({ where: { endpoint } })
}
