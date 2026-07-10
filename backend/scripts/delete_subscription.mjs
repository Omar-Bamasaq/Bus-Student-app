import { prisma } from '../src/lib/prisma.js'

const id = process.argv[2]
if (!id) {
  console.error('Usage: node delete_subscription.mjs <subscription-id>')
  process.exit(1)
}

async function run() {
  try {
    await prisma.subscription.delete({ where: { id } })
    console.log('DELETED', id)
  } catch (err) {
    console.error('ERROR', err.message)
    process.exit(2)
  } finally {
    await prisma.$disconnect()
  }
}

run()
