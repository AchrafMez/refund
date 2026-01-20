/**
 * WebSocket Event Emitter Utility
 * Uses BullMQ queue for reliable delivery with fallback to direct emit
 */

type NotificationPayload = {
    id: string
    title: string
    message: string
    type: string
    refundId?: string | null
    createdAt: Date
}

type RefundPayload = {
    id: string
    userId: string
    title: string
    type: string
    amountEst: number
    status: string
    createdAt: Date
}

type RefundUpdatePayload = {
    refundId: string
    status: string
    receiptUrl?: string | null
}

/**
 * Direct emit to user (fallback method)
 */
function emitDirectToUser(userId: string, event: string, data: unknown) {
    if (global.io) {
        global.io.to(`user:${userId}`).emit(event, data)
        console.log(`[WS] Emitted ${event} to user:${userId}`)
    }
}

/**
 * Direct emit to staff (fallback method)
 */
function emitDirectToStaff(event: string, data: unknown) {
    if (global.io) {
        global.io.to("staff").emit(event, data)
        console.log(`[WS] Emitted ${event} to staff room`)
    }
}

/**
 * Try to use queue, fallback to direct emit
 */
async function tryQueueOrDirect(
    queueFn: () => Promise<void>,
    directFn: () => void
) {
    try {
        // Only try queue if Redis is configured
        if (process.env.REDIS_URL) {
            await queueFn()
        } else {
            directFn()
        }
    } catch {
        directFn()
    }
}

// Public API

/**
 * Emit event to a specific user
 */
export function emitToUser(userId: string, event: string, data: unknown) {
    emitDirectToUser(userId, event, data)
}

/**
 * Emit event to all staff members
 */
export function emitToStaff(event: string, data: unknown) {
    emitDirectToStaff(event, data)
}

/**
 * Emit event to all connected users
 */
export function emitToAll(event: string, data: unknown) {
    if (global.io) {
        global.io.emit(event, data)
        console.log(`[WS] Emitted ${event} to all`)
    }
}

// Specific event emitters for type safety

/**
 * Notify user of a new notification
 */
export async function emitNotificationNew(userId: string, notification: NotificationPayload) {
    await tryQueueOrDirect(
        async () => {
            const { queueNotificationNew } = await import("./queue")
            await queueNotificationNew(userId, { notification })
        },
        () => emitDirectToUser(userId, "notification:new", { notification })
    )
}

/**
 * Notify staff of a new refund request
 */
export async function emitRefundNew(refund: RefundPayload) {
    await tryQueueOrDirect(
        async () => {
            const { queueRefundNew } = await import("./queue")
            await queueRefundNew({ refund })
        },
        () => emitDirectToStaff("refund:new", { refund })
    )
}

/**
 * Notify about refund status update
 */
export async function emitRefundUpdated(userId: string, update: RefundUpdatePayload) {
    await tryQueueOrDirect(
        async () => {
            const { queueRefundUpdated } = await import("./queue")
            await queueRefundUpdated(userId, update.refundId, update.status)
        },
        () => {
            emitDirectToUser(userId, "refund:updated", update)
            emitDirectToStaff("refund:updated", update)
        }
    )
}

/**
 * Notify staff about a new receipt upload
 */
export async function emitReceiptUploaded(data: { refundId: string; userId: string; title: string }) {
    await tryQueueOrDirect(
        async () => {
            const { queueReceiptUploaded } = await import("./queue")
            await queueReceiptUploaded(data.refundId)
        },
        () => emitDirectToStaff("refund:receipt", data)
    )
}
