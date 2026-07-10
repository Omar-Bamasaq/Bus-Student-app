import crypto from 'crypto'

export function generateRandomPassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars[crypto.randomInt(chars.length)]
  }
  return password
}

export function requireDev(message = 'This operation is only allowed in development mode') {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(message)
  }
}

export function getAdminInitialPassword() {
  const envPassword = process.env.ADMIN_INITIAL_PASSWORD
  if (envPassword) return envPassword
  if (process.env.NODE_ENV === 'production') {
    const generated = generateRandomPassword(16)
    console.log(`\n⚠️  ADMIN_INITIAL_PASSWORD not set. Generated temporary password: ${generated}`)
    console.log(`   Set ADMIN_INITIAL_PASSWORD environment variable to use a custom password.\n`)
    return generated
  }
  return '123'
}
