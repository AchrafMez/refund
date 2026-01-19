
import { getRefundRequestById } from "@/actions/refunds"
import { RequestDetailsView } from "./request-details-view"
import { notFound } from "next/navigation"

export default async function RequestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const request = await getRefundRequestById(id)

  if (!request) {
    notFound()
  }

  // Transform to plain object if needed, though Prisma Date objects are usually fine to pass to client components in recent Next.js versions if not using "use client" directly on this page.
  // Actually, passing Date objects across Server/Client boundary can warn.

  const serializedRequest = {
    ...request,
    date: request.createdAt.toISOString(),
    status: request.status,
    category: request.type.charAt(0).toUpperCase() + request.type.slice(1).toLowerCase(), // format enum to readable string
    description: request.description,
    amount: request.amountEst, // Use amountEst for the display
    receiptUrl: request.receiptUrl || null,
    user: request.user
  }

  return <RequestDetailsView request={serializedRequest} />
}
