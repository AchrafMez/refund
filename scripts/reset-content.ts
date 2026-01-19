
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🗑️  Starting database cleanup...')

    // Delete matching notifications first
    const deletedNotifications = await prisma.notification.deleteMany({})
    console.log(`✅ Deleted ${deletedNotifications.count} notifications`)

    // Delete matching refund requests
    const deletedRequests = await prisma.refundRequest.deleteMany({})
    console.log(`✅ Deleted ${deletedRequests.count} refund requests`)

    console.log('🎉 Cleanup finished.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
