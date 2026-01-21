"use server"

import { prisma } from "@/lib/prisma"
import { getCertificateStats as getCertificateStatsLib } from "@/lib/analytics"

export interface AnalyticsStats {
    totalRequests: number
    pendingApproval: number
    totalPayouts: number
    avgProcessingTime: number
}

export interface TimelineItem {
    id: string
    user: string
    image: string | null
    type: string
    amount: number
    submittedAt: Date
    completedAt: Date | null
    status: string
}

export async function getAnalyticsData(startDate: Date, endDate: Date, types: string[] = []) {
    const start = new Date(startDate)
    const end = new Date(endDate)

    const requests = await prisma.refundRequest.findMany({
        where: {
            createdAt: {
                gte: start,
                lte: end,
            },
            ...(types.length > 0 && {
                type: {
                    in: types.map(t => t as any) // Cast to any to avoid enum type issues since we receive strings
                }
            })
        },
        include: {
            user: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    })

    const totalRequests = requests.length
    
    // Pending Approval = ESTIMATED requests waiting for staff to approve/reject
    const pendingApproval = requests.filter(r => r.status === 'ESTIMATED').length
    
    // Requests that have been paid out
    const paidRequests = requests.filter(r => r.status === 'PAID')

    // Total Payouts = sum of totalAmount (actual verified receipt amounts), fallback to amountEst
    const totalPayouts = paidRequests.reduce((sum: number, r) => {
        // Use totalAmount (from receipts) if available, otherwise use estimate
        return sum + (r.totalAmount || r.amountEst || 0)
    }, 0)

    let totalProcessingTime = 0
    let countForAvg = 0

    for (const r of paidRequests) {
        if (r.updatedAt && r.createdAt) {
            const diffTime = r.updatedAt.getTime() - r.createdAt.getTime()
            const diffDays = diffTime / (1000 * 60 * 60 * 24)
            totalProcessingTime += diffDays
            countForAvg++
        }
    }

    const avgProcessingTime = countForAvg > 0 ? parseFloat((totalProcessingTime / countForAvg).toFixed(1)) : 0

    const stats: AnalyticsStats = {
        totalRequests,
        pendingApproval,
        totalPayouts,
        avgProcessingTime
    }

    const timeline: TimelineItem[] = requests.map(r => ({
        id: r.id,
        user: r.user.name || r.user.email, // Fallback to email if name missing
        image: r.user.image,
        type: r.type, // Enum value, e.g., 'EQUIPMENT'
        // For paid requests, use actual totalAmount; otherwise use estimate
        amount: r.status === 'PAID' ? (r.totalAmount || r.amountEst || 0) : (r.amountEst || 0),
        submittedAt: r.createdAt,
        completedAt: r.status === 'PAID' ? r.updatedAt : null,
        status: r.status
    }))

    return { stats, timeline }
}

// Async wrapper for getCertificateStats (re-exports not allowed in "use server" files)
export async function getCertificateStats() {
    return await getCertificateStatsLib();
}
