
import { getRefundRequestById } from "@/actions/refunds"
import { RequestDetailsView } from "./request-details-view"
import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"

export default async function RequestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const request = await getRefundRequestById(id)

  if (!request) {
    notFound()
  }

  // Check if viewer is staff
  const session = await auth.api.getSession({ headers: await headers() })
  let isStaff = false
  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })
    isStaff = user?.role === 'STAFF'
  }

  // Serialize receipts
  const serializedReceipts = request.receipts?.map(r => ({
    id: r.id,
    url: r.url,
    amount: r.amount,
    createdAt: r.createdAt.toISOString()
  })) || []

  const serializedRequest = {
    ...request,
    date: request.createdAt.toISOString(),
    status: request.status,
    category: request.type.charAt(0).toUpperCase() + request.type.slice(1).toLowerCase(),
    description: request.description,
    amount: request.amountEst,
    totalAmount: request.totalAmount,
    receiptUrl: request.receipts?.[0]?.url || null,
    receipts: serializedReceipts,
    user: request.user
  }

  return <RequestDetailsView request={serializedRequest} isStaff={isStaff} />
}

