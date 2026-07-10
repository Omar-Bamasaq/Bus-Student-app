import { prisma } from '../lib/prisma.js'
import { broadcastNotification, broadcastUnreadCount, broadcastNotificationRead, broadcastNotificationReadAll, broadcastNotificationDeleted, broadcastNotificationDeletedAll } from './socketService.js'
import { getNotificationDefaults, PRIORITY } from '../config/notificationConfig.js'

const DEDUP_WINDOW_MS = 30 * 1000

export async function createAndBroadcast({ userId, type, title, message, data, priority, targetRoute, icon, dedupKey }) {
  if (dedupKey) {
    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        dedupKey,
        createdAt: { gte: new Date(Date.now() - DEDUP_WINDOW_MS) },
      },
    })
    if (existing) return existing
  }

  const defaults = getNotificationDefaults(type)
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      priority: priority || defaults.priority,
      targetRoute: targetRoute !== undefined ? targetRoute : defaults.route,
      dedupKey: dedupKey || null,
      data: { ...(data || {}), icon: icon || defaults.icon },
    },
  })

  broadcastNotification(userId, notification)
  broadcastUnreadCount(userId)

  return notification
}

export async function getUnreadCount(userId) {
  return prisma.notification.count({ where: { userId, isRead: false } })
}

export async function listNotifications(userId, { filter, priority: priorityFilter, limit, offset } = {}) {
  const where = { userId }
  if (filter === 'unread') where.isRead = false
  else if (filter === 'read') where.isRead = true
  if (priorityFilter) where.priority = priorityFilter

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit || 100,
      skip: offset || 0,
    }),
    prisma.notification.count({ where }),
  ])

  return { notifications, total }
}

export async function markAsRead(id, userId) {
  const notification = await prisma.notification.update({
    where: { id, userId },
    data: { isRead: true },
  })
  broadcastNotificationRead(userId, id)
  broadcastUnreadCount(userId)
  return notification
}

export async function markAllAsRead(userId) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  })
  broadcastNotificationReadAll(userId)
  broadcastUnreadCount(userId)
}

export async function deleteNotification(id, userId) {
  await prisma.notification.delete({ where: { id, userId } })
  broadcastNotificationDeleted(userId, id)
  broadcastUnreadCount(userId)
}

export async function deleteAllNotifications(userId) {
  await prisma.notification.deleteMany({ where: { userId } })
  broadcastNotificationDeletedAll(userId)
  broadcastUnreadCount(userId)
}

export async function getUnreadCountsForAdmins() {
  const admins = await prisma.user.findMany({
    where: { role: 'admin' },
    select: { id: true },
  })
  const results = await Promise.all(
    admins.map(async (admin) => ({
      userId: admin.id,
      count: await prisma.notification.count({ where: { userId: admin.id, isRead: false } }),
    }))
  )
  return results
}
