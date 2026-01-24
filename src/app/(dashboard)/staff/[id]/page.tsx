
import { getRefundRequestById } from "@/actions/refunds"
import { RequestDetailsView } from "../../student/[id]/request-details-view"
import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"

export default async function StaffRequestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Check staff access
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    notFound()
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  })

  if (!currentUser || (currentUser.role !== 'STAFF')) {
    notFound()
  }

  const request = await getRefundRequestById(id)

  if (!request) {
    notFound()
  }

  // Serialize receipts
  const serializedReceipts = request.receipts?.map(r => ({
    id: r.id,
    url: r.url,
    amount: r.amount,
    createdAt: r.createdAt.toISOString()
  })) || []

  const serializedRequest = {
    id: request.id,
    title: request.title,
    date: request.createdAt.toISOString(),
    status: request.status,
    category: request.type.charAt(0).toUpperCase() + request.type.slice(1).toLowerCase(),
    description: request.description,
    amount: request.amountEst,
    totalAmount: request.totalAmount,
    receiptUrl: serializedReceipts[0]?.url || null,
    receipts: serializedReceipts,
    user: request.user
  }

  return <RequestDetailsView request={serializedRequest} isStaff={true} />
}
