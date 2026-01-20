"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { emitNotificationNew, emitToStaff } from "@/lib/ws-emitter"

export async function getNotifications() {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session) return []

    return await prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 20
    })
}

export async function getUnreadCount() {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session) return 0

    return await prisma.notification.count({
        where: {
            userId: session.user.id,
            read: false
        }
    })
}

export async function markAsRead(id: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session) {
        throw new Error("Unauthorized")
    }

    await prisma.notification.update({
        where: { id },
        data: { read: true }
    })
}

export async function markAllAsRead() {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session) {
        throw new Error("Unauthorized")
    }

    await prisma.notification.updateMany({
        where: {
            userId: session.user.id,
            read: false
        },
        data: { read: true }
    })
}

export async function clearAllNotifications() {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session) {
        throw new Error("Unauthorized")
    }

    await prisma.notification.deleteMany({
        where: {
            userId: session.user.id
        }
    })
}

export async function createNotification(data: {
    userId: string
    title: string
    message: string
    type: "NEW_REQUEST" | "APPROVED" | "REJECTED" | "PAID"
    refundId?: string
}) {
    const notification = await prisma.notification.create({
        data: {
            userId: data.userId,
            title: data.title,
            message: data.message,
            type: data.type,
            refundId: data.refundId
        }
    })

    // Emit WebSocket event for real-time updates
    emitNotificationNew(data.userId, {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        refundId: notification.refundId,
        createdAt: notification.createdAt
    })
}

export async function notifyAllStaff(data: {
    title: string
    message: string
    type: "NEW_REQUEST" | "RECEIPT_UPLOADED"
    refundId?: string
}) {
    try {
        const staffUsers = await prisma.user.findMany({
            where: { role: "STAFF" },
            select: { id: true }
        })

        const adminUsers = await prisma.user.findMany({
            where: { role: "ADMIN" },
            select: { id: true }
        })

        const allStaff = [...staffUsers, ...adminUsers]

        if (allStaff.length === 0) {
            return
        }

        const notifications = allStaff.map(user => ({
            userId: user.id,
            title: data.title,
            message: data.message,
            type: data.type,
            refundId: data.refundId
        }))

        await prisma.notification.createMany({
            data: notifications
        })

        // Emit WebSocket event to staff room for real-time updates
        emitToStaff("notification:new", {
            title: data.title,
            message: data.message,
            type: data.type,
            refundId: data.refundId
        })
    } catch (error) {
        // Silent fail for notifications - don't break main flow
    }
}
