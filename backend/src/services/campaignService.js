import { prisma } from '../lib/prisma.js'

const validSubscriptionStatuses = ['active', 'expired']

export async function isNewStudent(studentId) {
  const hasSubscription = await prisma.subscription.findFirst({
    where: {
      studentId,
      status: { in: validSubscriptionStatuses },
    },
  })
  if (hasSubscription) return false

  const hasApprovedEnrollment = await prisma.campaignEnrollment.findFirst({
    where: { studentId, receiptStatus: 'APPROVED' },
  })
  if (hasApprovedEnrollment) return false

  const hasApprovedCart = await prisma.cart.findFirst({
    where: { studentId, status: 'APPROVED' },
  })
  if (hasApprovedCart) return false

  return true
}

export function isLateRegistration(campaign) {
  const now = new Date()
  return !!(campaign.extraFeeStart && now > new Date(campaign.extraFeeStart))
}

export async function computeExtraRegistrationFee(campaign, studentId) {
  if (!campaign.enableExtraRegistrationFee) {
    return { type: null, amount: 0, label: null }
  }

  const isNew = await isNewStudent(studentId)
  if (isNew) {
    return {
      type: 'NEW_STUDENT',
      amount: Number(campaign.extraRegistrationFee),
      label: 'رسوم طالب جديد',
    }
  }

  if (isLateRegistration(campaign)) {
    return {
      type: 'LATE_REGISTRATION',
      amount: Number(campaign.extraRegistrationFee),
      label: 'رسوم تسجيل متأخر',
    }
  }

  return { type: null, amount: 0, label: null }
}
