import { prisma } from './prisma.js'

export async function createAuditLog({ userId, action, entityType, entityId, oldValue, newValue, reason }) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entityType,
        entityId: entityId || null,
        oldValue: oldValue || undefined,
        newValue: newValue || undefined,
        reason: reason || null,
      },
    })
  } catch (e) {
  }
}
