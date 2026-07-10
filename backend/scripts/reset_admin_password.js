import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

const prisma = new PrismaClient()

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('This script is not allowed in production. Set ADMIN_INITIAL_PASSWORD env var instead.')
    process.exit(1)
  }

  const password = process.env.ADMIN_INITIAL_PASSWORD || randomBytes(6).toString('hex')
  const hash = await bcrypt.hash(password, 10)

  const admins = await prisma.user.findMany({ where: { role: 'admin' } })
  if (!admins || admins.length === 0) {
    console.error('No admin users found.')
    process.exit(1)
  }

  for (const a of admins) {
    await prisma.user.update({ where: { id: a.id }, data: { password: hash, mustChangePassword: false } })
    console.log(`Reset password for ${a.username}`)
  }

  console.log(`\nNew admin password: ${password}`)
  console.log('Make sure to change this immediately after login.\n')
}

main().catch(e=>{ console.error(e); process.exit(1) }).finally(()=>prisma.$disconnect())
