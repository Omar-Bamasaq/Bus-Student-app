import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required')
  }

  if (process.env.NODE_ENV === 'production' && process.env.CREATE_INITIAL_ADMIN !== 'true') {
    throw new Error('Refusing to run in production without CREATE_INITIAL_ADMIN=true')
  }

  const username = requireEnv('ADMIN_USERNAME')
  const password = requireEnv('ADMIN_PASSWORD')
  const phone = process.env.ADMIN_PHONE?.trim() || null

  const existingAdmin = await prisma.user.findFirst({ where: { role: 'admin' } })
  if (existingAdmin) {
    console.log(existingAdmin.username)
    return
  }

  const existingUser = await prisma.user.findUnique({ where: { username } })
  if (existingUser) {
    throw new Error(`User already exists: ${username}`)
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const createdUser = await prisma.user.create({
    data: {
      username,
      name: username,
      phone,
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      mustChangePassword: false,
    },
    select: { username: true },
  })

  console.log(createdUser.username)
}

main()
  .catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
