"use server"

import { prisma } from "@/lib/prisma"

export interface ExportDataItem {
    fullName: string
    refundType: string
    amount: number
    dateCreated: Date
    isRefunded: boolean
}

export interface ExportSummary {
    totalRefunded: number
    totalWaiting: number
    dateRange: { start: Date; end: Date }
    generatedAt: Date
}

export interface ExportData {
    items: ExportDataItem[]
    summary: ExportSummary
}

export interface ExportOptions {
    includeRefunded: boolean
    includeWaiting: boolean
}

export async function getExportData(
    startDate: Date,
    endDate: Date,
    types: string[] = [],
    options: ExportOptions = { includeRefunded: true, includeWaiting: true }
): Promise<ExportData> {
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
                    in: types.map(t => t as any)
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

    const filteredRequests = requests.filter(r => {
        const isRefunded = r.status === 'PAID'
        const isWaiting = r.status !== 'PAID' && r.status !== 'DECLINED'

        if (options.includeRefunded && options.includeWaiting) {
            return isRefunded || isWaiting
        } else if (options.includeRefunded) {
            return isRefunded
        } else if (options.includeWaiting) {
            return isWaiting
        }
        return false
    })

    const items: ExportDataItem[] = filteredRequests.map(r => ({
        fullName: r.user.name || r.user.email,
        refundType: formatRefundType(r.type),
        amount: r.amountEst || 0,
        dateCreated: r.createdAt,
        isRefunded: r.status === 'PAID'
    }))

    const totalRefunded = requests.filter(r => r.status === 'PAID').length
    const totalWaiting = requests.filter(r => r.status !== 'PAID' && r.status !== 'DECLINED').length

    const summary: ExportSummary = {
        totalRefunded,
        totalWaiting,
        dateRange: { start, end },
        generatedAt: new Date()
    }

    return { items, summary }
}

function formatRefundType(type: string): string {
    const typeMap: Record<string, string> = {
        'EQUIPMENT': 'Hardware & Equipment',
        'CERTIFICATION': 'Training & Certification',
        'TRAVEL': 'Transport & Travel',
        'OTHER': 'Other Expenses'
    }
    return typeMap[type] || type
}
