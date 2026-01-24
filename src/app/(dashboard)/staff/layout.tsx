import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export default async function StaffLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Check if user is staff
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session) {
        redirect("/login?callbackUrl=/staff")
    }

    // Get user role from database
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    if (!user || (user.role !== "STAFF")) {
        redirect("/student?unauthorized=staff")
    }

    return <>{children}</>
}

