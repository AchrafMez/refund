"use server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { createNotification, notifyAllStaff } from "./notifications"
import { emitRefundNew, emitRefundUpdated, emitReceiptUploaded } from "@/lib/ws-emitter"
import {
    PaginationParams,
    PaginatedResult,
    DEFAULT_PAGE,
    DEFAULT_PAGE_SIZE,
    calculatePagination,
    getSkip
} from "@/types/pagination"

type RefundRequest = Awaited<ReturnType<typeof prisma.refundRequest.findFirst>>

export async function getRefunds(params?: PaginationParams): Promise<PaginatedResult<NonNullable<RefundRequest>>> {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session) {
        return {
            data: [],
            pagination: calculatePagination(1, DEFAULT_PAGE_SIZE, 0)
        }
    }

    const page = params?.page ?? DEFAULT_PAGE
    const pageSize = params?.pageSize ?? DEFAULT_PAGE_SIZE

    const [data, totalItems] = await Promise.all([
        prisma.refundRequest.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            skip: getSkip(page, pageSize),
            take: pageSize
        }),
        prisma.refundRequest.count({
            where: { userId: session.user.id }
        })
    ])

    return {
        data,
        pagination: calculatePagination(page, pageSize, totalItems)
    }
}

export async function createEstimate(data: {
    title: string;
    description: string;
    amount: number;
    type: "EQUIPMENT" | "CERTIFICATION" | "TRAVEL" | "OTHER";
    receiptUrl?: string;
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session) {
        throw new Error("Unauthorized")
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    const isStaff = user?.role === "STAFF" || user?.role === "ADMIN"
    const status = isStaff ? "VERIFIED_READY" : "ESTIMATED"

    const request = await prisma.refundRequest.create({
        data: {
            userId: session.user.id,
            title: data.title,
            description: data.description,
            amountEst: data.amount,
            type: data.type,
            status,
            receiptUrl: data.receiptUrl
        }
    })

    if (!isStaff) {
        await notifyAllStaff({
            title: "New Refund Request",
            message: `${session.user.name || session.user.email} submitted a new request: "${data.title}"`,
            type: "NEW_REQUEST",
            refundId: request.id
        })
    }

    emitRefundNew({
        id: request.id,
        userId: request.userId,
        title: request.title,
        type: request.type,
        amountEst: request.amountEst,
        status: request.status,
        createdAt: request.createdAt
    })

    return request
}

export async function getRefundRequestById(id: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session) return null

    const request = await prisma.refundRequest.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                    image: true
                }
            }
        }
    })

    if (!request || request.userId !== session.user.id) {
        return null
    }

    return request
}

type RefundRequestWithUser = Awaited<ReturnType<typeof prisma.refundRequest.findFirst>> & {
    user: { name: string | null; email: string; image: string | null }
}

interface StaffRequestsParams extends PaginationParams {
    statusFilter?: "estimates" | "receipts" | "payouts" | "all"
}

function getStatusWhereClause(statusFilter?: string) {
    switch (statusFilter) {
        case "estimates":
            return { status: "ESTIMATED" as const }
        case "receipts":
            return { status: { in: ["PENDING_RECEIPTS", "VERIFIED_READY"] as ("PENDING_RECEIPTS" | "VERIFIED_READY")[] } }
        case "payouts":
            return { status: { in: ["PAID", "DECLINED"] as ("PAID" | "DECLINED")[] } }
        default:
            return {}
    }
}

export async function getAllRefundRequests(params?: StaffRequestsParams): Promise<PaginatedResult<NonNullable<RefundRequestWithUser>>> {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session) {
        return {
            data: [],
            pagination: calculatePagination(1, DEFAULT_PAGE_SIZE, 0)
        }
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    if (!user || (user.role !== "STAFF" && user.role !== "ADMIN")) {
        return {
            data: [],
            pagination: calculatePagination(1, DEFAULT_PAGE_SIZE, 0)
        }
    }

    const page = params?.page ?? DEFAULT_PAGE
    const pageSize = params?.pageSize ?? DEFAULT_PAGE_SIZE
    const statusWhere = getStatusWhereClause(params?.statusFilter)

    const [data, totalItems] = await Promise.all([
        prisma.refundRequest.findMany({
            where: statusWhere,
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        image: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip: getSkip(page, pageSize),
            take: pageSize
        }),
        prisma.refundRequest.count({ where: statusWhere })
    ])

    return {
        data: data as NonNullable<RefundRequestWithUser>[],
        pagination: calculatePagination(page, pageSize, totalItems)
    }
}

// Get counts for staff dashboard tabs
export async function getStaffTabCounts(): Promise<{ estimates: number; receipts: number; payouts: number }> {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session) {
        return { estimates: 0, receipts: 0, payouts: 0 }
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    if (!user || (user.role !== "STAFF" && user.role !== "ADMIN")) {
        return { estimates: 0, receipts: 0, payouts: 0 }
    }

    const [estimates, receipts, payouts] = await Promise.all([
        prisma.refundRequest.count({ where: { status: "ESTIMATED" } }),
        prisma.refundRequest.count({ where: { status: { in: ["PENDING_RECEIPTS", "VERIFIED_READY"] } } }),
        prisma.refundRequest.count({ where: { status: { in: ["PAID", "DECLINED"] } } })
    ])

    return { estimates, receipts, payouts }
}


export async function updateRefundStatus(
    id: string,
    newStatus: "PENDING_RECEIPTS" | "VERIFIED_READY" | "PAID" | "DECLINED",
    reason?: string,
    amountFinal?: number
) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session) {
        throw new Error("Unauthorized")
    }

    const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    if (!currentUser || (currentUser.role !== "STAFF" && currentUser.role !== "ADMIN")) {
        throw new Error("Unauthorized: Staff access required")
    }

    const request = await prisma.refundRequest.findUnique({
        where: { id },
        include: { user: true }
    })

    if (!request) {
        throw new Error("Request not found")
    }

    await prisma.refundRequest.update({
        where: { id },
        data: {
            status: newStatus,
            ...(newStatus === "DECLINED" && reason ? { staffNote: reason } : {}),
            ...(newStatus === "PAID" && amountFinal !== undefined ? { amountFinal } : {})
        }
    })

    if (newStatus === "PENDING_RECEIPTS") {
        if (request.receiptUrl) {
            await prisma.refundRequest.update({
                where: { id },
                data: { status: "VERIFIED_READY" }
            })

            await createNotification({
                userId: request.userId,
                title: "Request Approved!",
                message: `Your request "${request.title}" was approved. Since you already provided a receipt, it's now ready for verification.`,
                type: "APPROVED",
                refundId: id
            })

            emitRefundUpdated(request.userId, {
                refundId: id,
                status: "VERIFIED_READY",
                receiptUrl: request.receiptUrl
            })
            return
        }

        await createNotification({
            userId: request.userId,
            title: "Request Approved!",
            message: `Your request "${request.title}" was approved. Please upload your receipt.`,
            type: "APPROVED",
            refundId: id
        })
    } else if (newStatus === "DECLINED") {
        const reasonText = reason ? ` Reason: ${reason}` : ""
        await createNotification({
            userId: request.userId,
            title: "Request Declined",
            message: `Your request "${request.title}" was declined.${reasonText}`,
            type: "REJECTED",
            refundId: id
        })
    } else if (newStatus === "PAID") {
        await createNotification({
            userId: request.userId,
            title: "Refund Ready!",
            message: `Your refund for "${request.title}" is ready! Visit Bocal to collect your money.`,
            type: "PAID",
            refundId: id
        })
    }

    emitRefundUpdated(request.userId, {
        refundId: id,
        status: newStatus,
        receiptUrl: request.receiptUrl
    })
}

export async function submitReceipt(id: string, receiptUrl: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session) {
        throw new Error("Unauthorized")
    }

    if (!receiptUrl || typeof receiptUrl !== 'string') {
        throw new Error("Invalid receipt URL")
    }

    const request = await prisma.refundRequest.findUnique({
        where: { id },
        select: { title: true, userId: true }
    })

    if (!request || request.userId !== session.user.id) {
        throw new Error("Unauthorized: You don't own this request")
    }

    await prisma.refundRequest.update({
        where: { id },
        data: {
            status: "VERIFIED_READY",
            receiptUrl: receiptUrl
        }
    })

    if (request) {
        await notifyAllStaff({
            title: "Receipt Uploaded",
            message: `${session.user.name || session.user.email} uploaded a receipt for "${request.title}"`,
            type: "RECEIPT_UPLOADED",
            refundId: id
        })

        emitReceiptUploaded({
            refundId: id,
            userId: request.userId,
            title: request.title
        })

        emitRefundUpdated(request.userId, {
            refundId: id,
            status: "VERIFIED_READY",
            receiptUrl: receiptUrl
        })
    } else {
        console.error(`[submitReceipt] Failed to find request ${id} for notification`)
    }
}

export async function rejectReceipt(id: string, reason: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session) {
        throw new Error("Unauthorized")
    }

    const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    if (!currentUser || (currentUser.role !== "STAFF" && currentUser.role !== "ADMIN")) {
        throw new Error("Unauthorized: Staff access required")
    }

    const request = await prisma.refundRequest.findUnique({
        where: { id },
        include: { user: true }
    })

    if (!request) {
        throw new Error("Request not found")
    }

    await prisma.refundRequest.update({
        where: { id },
        data: {
            status: "PENDING_RECEIPTS",
            receiptUrl: null,
            staffNote: reason
        }
    })

    await createNotification({
        userId: request.userId,
        title: "Receipt Rejected",
        message: `Your receipt for "${request.title}" was rejected. Reason: ${reason}. Please upload a new receipt.`,
        type: "REJECTED",
        refundId: id
    })
}
