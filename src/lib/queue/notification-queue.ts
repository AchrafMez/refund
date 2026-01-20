import { Queue } from "bullmq"

// Redis connection URL
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379"

// Job types
export interface NotificationJobData {
    type: "notification:new" | "refund:new" | "refund:updated" | "refund:receipt"
    payload: Record<string, unknown>
    target: {
        type: "user" | "staff" | "all"
        userId?: string
    }
}

// Create the notification queue
export const notificationQueue = new Queue<NotificationJobData, unknown, NotificationJobData["type"]>("notifications", {
    connection: {
        url: redisUrl,
    },
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 1000, // 1s, 2s, 4s
        },
        removeOnComplete: {
            age: 3600, // Keep completed jobs for 1 hour
            count: 100, // Keep last 100 completed jobs
        },
        removeOnFail: {
            age: 86400, // Keep failed jobs for 24 hours
        },
    },
})

/**
 * Add a notification job to the queue
 */
export async function queueNotification(data: NotificationJobData) {
    try {
        // Replace colons with dashes in job ID (BullMQ doesn't allow colons)
        const safeType = data.type.replace(/:/g, "-")
        const job = await notificationQueue.add(data.type, data, {
            jobId: `${safeType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        })
        console.log(`[Queue] Added job ${job.id}: ${data.type}`)
        return job
    } catch (error) {
        console.error("[Queue] Failed to add job:", error)
        throw error
    }
}

// Helper functions for specific notification types
export async function queueNotificationNew(userId: string, payload: Record<string, unknown>) {
    return queueNotification({
        type: "notification:new",
        payload,
        target: { type: "user", userId },
    })
}

export async function queueNotificationToStaff(payload: Record<string, unknown>) {
    return queueNotification({
        type: "notification:new",
        payload,
        target: { type: "staff" },
    })
}

export async function queueRefundNew(payload: Record<string, unknown>) {
    return queueNotification({
        type: "refund:new",
        payload,
        target: { type: "staff" },
    })
}

export async function queueRefundUpdated(
    userId: string,
    refundId: string,
    status: string
) {
    // Notify both user and staff
    await queueNotification({
        type: "refund:updated",
        payload: { refundId, status },
        target: { type: "user", userId },
    })
    await queueNotification({
        type: "refund:updated",
        payload: { refundId, status },
        target: { type: "staff" },
    })
}

export async function queueReceiptUploaded(refundId: string) {
    return queueNotification({
        type: "refund:receipt",
        payload: { refundId },
        target: { type: "staff" },
    })
}
