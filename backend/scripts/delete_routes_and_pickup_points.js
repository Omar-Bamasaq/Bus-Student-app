import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Delete pickup points first to be explicit
    const deletedPoints = await prisma.routePickupPoint.deleteMany({})
    console.log('Deleted route pickup points:', deletedPoints.count)

    // Delete routes
    const deletedRoutes = await prisma.route.deleteMany({})
    console.log('Deleted routes:', deletedRoutes.count)
  } catch (err) {
    console.error('Failed to delete routes/pickup points:', err)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch(e => { console.error(e); process.exit(1) })
