import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export default async function StudentLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Check if user is logged in
    const headersList = await headers()

    const session = await auth.api.getSession({
        headers: headersList
    })

    if (!session) {
        redirect("/login?callbackUrl=/student")
    }

    // Get user role from database
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    // Get current path from headers
    // headersList is already defined above
    const pathname = headersList.get("x-pathname") || headersList.get("x-invoke-path") || ""

    // Staff/Admin users can access /student/create for self-requests
    // but not other student pages
    const isStaff = user?.role === "STAFF" || user?.role === "ADMIN"
    const isCreatePage = pathname.includes("/student/create")

    if (isStaff && !isCreatePage) {
        redirect("/staff")
    }

    return <>{children}</>
}
