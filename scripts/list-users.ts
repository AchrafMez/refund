import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const users = await prisma.user.findMany({
        orderBy: {
            createdAt: 'desc',
        },
        include: {
            _count: {
                select: { requests: true }
            }
        }
    })

    console.log('--- Available Users ---')
    if (users.length === 0) {
        console.log('No users found.')
    } else {
        users.forEach((user) => {
            console.log(`
ID: ${user.id}
Name: ${user.name}
Email: ${user.email}
Role: ${user.role}
Intra ID: ${user.intraId || 'N/A'}
Requests: ${user._count.requests}
Created: ${user.createdAt.toISOString()}
-------------------------`)
        })
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
