import { Worker, Job } from "bullmq"
import { Server as SocketIOServer } from "socket.io"
import { NotificationJobData } from "./notification-queue"

// Redis connection URL for worker
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379"

let worker: Worker<NotificationJobData> | null = null

/**
 * Initialize the notification queue worker
 * Must be called after Socket.IO server is ready
 */
export function initNotificationWorker(io: SocketIOServer) {
    if (worker) {
        console.log("[Worker] Already initialized")
        return worker
    }

    worker = new Worker<NotificationJobData>(
        "notifications",
        async (job: Job<NotificationJobData>) => {
            const { type, payload, target } = job.data
            console.log(`[Worker] Processing job ${job.id}: ${type}`)

            try {
                // Emit to appropriate target
                switch (target.type) {
                    case "user":
                        if (target.userId) {
                            io.to(`user:${target.userId}`).emit(type, payload)
                            console.log(`[Worker] Emitted ${type} to user:${target.userId}`)
                        }
                        break
                    case "staff":
                        io.to("staff").emit(type, payload)
                        console.log(`[Worker] Emitted ${type} to staff room`)
                        break
                    case "all":
                        io.emit(type, payload)
                        console.log(`[Worker] Emitted ${type} to all`)
                        break
                }

                return { success: true, emittedAt: new Date().toISOString() }
            } catch (error) {
                console.error(`[Worker] Failed to process job ${job.id}:`, error)
                throw error // This will trigger a retry
            }
        },
        {
            connection: {
                url: redisUrl,
            },
            concurrency: 5, // Process up to 5 jobs concurrently
        }
    )

    // Event handlers
    worker.on("completed", (job) => {
        console.log(`[Worker] Job ${job.id} completed`)
    })

    worker.on("failed", (job, err) => {
        console.error(`[Worker] Job ${job?.id} failed:`, err.message)
    })

    worker.on("error", (err) => {
        console.error("[Worker] Error:", err)
    })

    console.log("[Worker] Notification worker initialized")
    return worker
}

/**
 * Gracefully shutdown the worker
 */
export async function shutdownWorker() {
    if (worker) {
        await worker.close()
        worker = null
        console.log("[Worker] Shutdown complete")
    }
}
