"use server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { createNotification, notifyAllStaff } from "./notifications"
import { emitRefundNew, emitRefundUpdated, emitReceiptUploaded } from "@/lib/ws-emitter"
import { logActivity } from "@/lib/audit"
import { AuditAction } from "@prisma/client"
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
            take: pageSize,
            include: { receipts: true } // Include receipts for display
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

// Fetch Certificate Catalog for dropdown - Returns ALL for management, frontend filters for dropdown
export async function getCertificates() {
    const certificates = await prisma.certificateCatalog.findMany({
        select: {
            id: true,
            name: true,
            provider: true,
            fixedCost: true,
            currency: true,
            active: true
        },
        orderBy: { name: 'asc' }
    })
    return certificates
}

export async function createCertificate(data: {
    name: string;
    provider: string;
    fixedCost: number;
    currency?: string;
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'ADMIN')) {
        throw new Error("Unauthorized");
    }

    const certificate = await prisma.certificateCatalog.create({
        data: {
            name: data.name,
            provider: data.provider,
            fixedCost: data.fixedCost,
            currency: data.currency || "USD",
            active: true
        }
    })

    revalidatePath('/', 'layout')
    return certificate
}

export async function deleteCertificate(id: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'ADMIN')) {
        throw new Error("Unauthorized");
    }

    try {
        await prisma.certificateCatalog.update({
            where: { id },
            data: { active: false }
        });
        revalidatePath('/', 'layout')
        return { success: true };
    } catch (error) {
        console.error("Failed to delete certificate:", error);
        throw new Error("Failed to delete certificate.");
    }
}

export async function restoreCertificate(id: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'ADMIN')) {
        throw new Error("Unauthorized");
    }

    try {
        await prisma.certificateCatalog.update({
            where: { id },
            data: { active: true }
        });
        revalidatePath('/', 'layout')
        return { success: true };
    } catch (error) {
        console.error("Failed to restore certificate:", error);
        throw new Error("Failed to restore certificate.");
    }
}

export async function createEstimate(data: {
    title: string;
    description: string;
    amount: number; // User's estimate
    type: "EQUIPMENT" | "CERTIFICATION" | "TRAVEL" | "OTHER";
    receiptUrl?: string; // Optional initial receipt (legacy support or single upload)
    certificateId?: string;
    targetDate?: Date;
    departure?: string;
    destination?: string;
    invoiceAddressedTo?: string;
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

    let finalAmount = data.amount;
    let finalTotalAmount = 0; // Default for non-certs

    // Logic for Certificates
    if (data.type === "CERTIFICATION" && data.certificateId) {
        const cert = await prisma.certificateCatalog.findUnique({
            where: { id: data.certificateId }
        });
        if (cert) {
            finalAmount = cert.fixedCost;
            finalTotalAmount = cert.fixedCost; // Auto-set total for certs
        }
    }

    // Create the request
    const request = await prisma.refundRequest.create({
        data: {
            userId: session.user.id,
            title: data.title,
            description: data.description,
            amountEst: finalAmount,
            totalAmount: finalTotalAmount, // Set cached total
            type: data.type,
            status,
            // New fields
            certificateId: data.certificateId,
            targetDate: data.targetDate,
            departure: data.departure,
            destination: data.destination,
            invoiceAddressedTo: data.invoiceAddressedTo,
            // Create a receipt if URL provided (legacy/compat)
            ...(data.receiptUrl ? {
                receipts: {
                    create: {
                        url: data.receiptUrl,
                        amount: 0 // Initial receipts might determine cost later
                    }
                }
            } : {})
        }
    })

    // Log Activity
    await logActivity(session.user.id, AuditAction.CREATE, request.id, {
        type: data.type,
        amountEst: finalAmount,
        title: data.title
    });

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
            },
            receipts: {
                orderBy: { createdAt: 'asc' }
            },
            certificate: true
        }
    })

    if (!request) return null

    // Check if user is owner or staff
    const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    const isStaff = currentUser?.role === 'STAFF' || currentUser?.role === 'ADMIN'
    const isOwner = request.userId === session.user.id

    if (!isStaff && !isOwner) {
        return null
    }

    return request
}

// Type for refund request with user
type RefundRequestWithUser = Awaited<ReturnType<typeof prisma.refundRequest.findFirst>> & {
    user: { name: string | null; email: string; image: string | null }
}

interface StaffRequestsParams extends PaginationParams {
    statusFilter?: "Validation" | "Processing" | "Completed" | "Fails" | "all"
}

function getStatusWhereClause(statusFilter?: string) {
    switch (statusFilter) {
        case "Validation":
            return { status: "ESTIMATED" as const }
        case "Processing":
            return { status: { in: ["PENDING_RECEIPTS", "VERIFIED_READY"] as ("PENDING_RECEIPTS" | "VERIFIED_READY")[] } }
        case "Completed":
            return { status: "PAID" as const }
        case "Fails":
            return { status: "DECLINED" as const }
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
                },
                certificate: true,
                receipts: true
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

export async function getStaffTabCounts(): Promise<{ Validation: number; receipts: number; payouts: number; fails: number }> {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session) {
        return { Validation: 0, receipts: 0, payouts: 0, fails: 0 }
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    if (!user || (user.role !== "STAFF" && user.role !== "ADMIN")) {
        return { Validation: 0, receipts: 0, payouts: 0, fails: 0 }
    }

    const [Validation, receipts, payouts, fails] = await Promise.all([
        prisma.refundRequest.count({ where: { status: "ESTIMATED" } }),
        prisma.refundRequest.count({ where: { status: { in: ["PENDING_RECEIPTS", "VERIFIED_READY"] } } }),
        prisma.refundRequest.count({ where: { status: "PAID" } }),
        prisma.refundRequest.count({ where: { status: "DECLINED" } })
    ])

    return { Validation, receipts, payouts, fails }
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

    // Log Activity
    const action = newStatus === "DECLINED" ? AuditAction.REJECT :
        newStatus === "PAID" || newStatus === "VERIFIED_READY" ? AuditAction.APPROVE :
            AuditAction.UPDATE;

    await logActivity(session.user.id, action, id, {
        oldStatus: request.status,
        newStatus,
        reason
    });

    // Notification and WebSocket logic remains...
    if (newStatus === "PENDING_RECEIPTS") {
        // Check if this is a "request more receipts" scenario (coming from VERIFIED_READY)
        const wasVerified = request.status === "VERIFIED_READY"
        const receiptCount = await prisma.receipt.count({ where: { refundRequestId: id } });

        if (wasVerified || receiptCount > 0) {
            // Staff is requesting additional receipts
            const reasonText = reason ? ` Note: ${reason}` : ""
            await createNotification({
                userId: request.userId,
                title: "Additional Receipt Requested",
                message: `Staff has requested additional receipt(s) for "${request.title}". Please upload more documentation.${reasonText}`,
                type: "INFO",
                refundId: id
            })
        } else {
            // Initial approval
            await createNotification({
                userId: request.userId,
                title: "Request Approved!",
                message: `Your request "${request.title}" was approved. Please upload your receipt.`,
                type: "APPROVED",
                refundId: id
            })
        }
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
        // receiptUrl: request.receiptUrl // No longer single URL
    })
}

export async function submitReceipt(id: string, receiptUrl: string, amount: number = 0) {
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

    // 1. Create Receipt Record via Transaction to ensure sum is correct?
    // For now simple await chain.
    await prisma.receipt.create({
        data: {
            url: receiptUrl,
            amount: amount,
            refundRequestId: id
        }
    });

    // 2. Recalculate Total
    const aggregate = await prisma.receipt.aggregate({
        where: { refundRequestId: id },
        _sum: { amount: true }
    });
    const newTotal = aggregate._sum.amount || 0;

    // 3. Update Request
    await prisma.refundRequest.update({
        where: { id },
        data: {
            status: "VERIFIED_READY",
            totalAmount: newTotal
        }
    })

    // Log Activity
    await logActivity(session.user.id, AuditAction.UPLOAD, id, {
        receiptUrl,
        amount
    });

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
        // receiptUrl: receiptUrl // Legacy prop
    })
}

export async function rejectReceipt(id: string, reason: string) {
    // Note: In new model, we might reject a *specific* receipt found by ID, 
    // but the function signature here takes `id` which usually means Request ID in this codebase context.
    // However, if we look at previous code, it updated the REQUEST status to PENDING_RECEIPTS.
    // So this is "Reject All Receipts" effectively or "Request Re-upload".

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

    // We keep the request, but set status back to PENDING_RECEIPTS.
    // Optionally delete receipts? The prompt didn't say to delete, just "Reject".
    // Previously it wiped `receiptUrl`.
    // Let's wipe all receipts for strictness, or just leave them and ask for new ones.
    // For now, let's delete them to mimic previous "reject" behavior which cleared the slate.

    await prisma.receipt.deleteMany({
        where: { refundRequestId: id }
    });

    await prisma.refundRequest.update({
        where: { id },
        data: {
            status: "PENDING_RECEIPTS",
            staffNote: reason,
            totalAmount: 0 // Reset total since receipts are gone
        }
    })

    // Log Activity
    await logActivity(session.user.id, AuditAction.REJECT, id, {
        target: "receipts",
        reason
    });

    await createNotification({
        userId: request.userId,
        title: "Receipt Rejected",
        message: `Your receipt for "${request.title}" was rejected. Reason: ${reason}. Please upload a new receipt.`,
        type: "REJECTED",
        refundId: id
    })

    // Emit WebSocket event for real-time update
    emitRefundUpdated(request.userId, {
        refundId: id,
        status: "PENDING_RECEIPTS"
    })

    // Revalidate paths for immediate UI update
    revalidatePath("/staff")
    revalidatePath("/student")
    revalidatePath(`/student/${id}`)
}

// Staff can edit individual receipt amounts
export async function updateReceiptAmount(receiptId: string, newAmount: number) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session) {
        throw new Error("Unauthorized")
    }

    // Check staff role
    const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    if (!currentUser || (currentUser.role !== "STAFF" && currentUser.role !== "ADMIN")) {
        throw new Error("Unauthorized: Staff access required")
    }

    // Get the receipt and its parent request
    const receipt = await prisma.receipt.findUnique({
        where: { id: receiptId },
        include: {
            refundRequest: {
                select: { id: true, userId: true, title: true }
            }
        }
    })

    if (!receipt) {
        throw new Error("Receipt not found")
    }

    const oldAmount = receipt.amount

    // Update the receipt amount
    await prisma.receipt.update({
        where: { id: receiptId },
        data: { amount: newAmount }
    })

    // Recalculate parent request total
    const aggregate = await prisma.receipt.aggregate({
        where: { refundRequestId: receipt.refundRequestId },
        _sum: { amount: true }
    })
    const newTotal = aggregate._sum.amount || 0

    await prisma.refundRequest.update({
        where: { id: receipt.refundRequestId },
        data: { totalAmount: newTotal }
    })

    // Log the activity
    await logActivity(session.user.id, AuditAction.UPDATE, receipt.refundRequestId, {
        receiptId,
        oldAmount,
        newAmount,
        newTotal
    })

    // Emit update for real-time refresh
    emitRefundUpdated(receipt.refundRequest.userId, {
        refundId: receipt.refundRequestId,
        totalAmount: newTotal
    })

    return { success: true, newTotal }
}

// Get receipts for a specific request
export async function getReceiptsForRequest(requestId: string) {
    const receipts = await prisma.receipt.findMany({
        where: { refundRequestId: requestId },
        orderBy: { createdAt: 'asc' }
    })
    return receipts
}
