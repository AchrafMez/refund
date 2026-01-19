
import { PlusCircle } from "lucide-react"
import { ActiveRequestCard } from "@/components/student/active-request-card"
import { StatsRow } from "@/components/student/stats-cards"
import { RequestStatus } from "@/components/status-badge"
import Link from "next/link"
import { getRefunds } from "@/actions/refunds"

export default async function StudentDashboard() {
  // Get a larger page size to show active requests (most users won't have many)
  const result = await getRefunds({ page: 1, pageSize: 50 })
  
  // Filter out completed requests (PAID, DECLINED) - they go to History
  const activeRequests = result.data.filter(r => r.status !== "PAID" && r.status !== "DECLINED")

  const totalActive = activeRequests.reduce((sum, req) => sum + req.amountEst, 0)
  const pendingAction = activeRequests.filter(r => r.status === "PENDING_RECEIPTS" || r.status === "ESTIMATED").length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 600, color: '#18181b', letterSpacing: '-0.025em' }}>
          Dashboard
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#71717a', marginTop: '0.25rem' }}>
          Track your refunds and submit new requests.
        </p>
      </div>

      {/* Stats Row */}
      <StatsRow
        totalActive={totalActive}
        pendingAction={pendingAction}
      />

      {/* Active Requests Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2
            className="text-lg font-medium"
            style={{ color: '#18181b' }}
          >
            Active Requests
          </h2>
          <span
            className="text-sm"
            style={{ color: '#71717a' }}
          >
            {activeRequests.length} request{activeRequests.length !== 1 ? 's' : ''}
          </span>
        </div>

        {activeRequests.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1rem'
            }}
          >
            {activeRequests.map((req) => (
              <ActiveRequestCard
                key={req.id}
                id={req.id}
                title={req.title}
                amount={req.amountEst}
                date={req.createdAt.toISOString()}
                status={req.status as any}
              />
            ))}
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center rounded-xl text-center"
            style={{
              backgroundColor: 'white',
              border: '1px dashed #e4e4e7',
              padding: '3rem'
            }}
          >
            <div
              className="flex items-center justify-center rounded-full mb-4"
              style={{
                width: '3rem',
                height: '3rem',
                backgroundColor: '#f4f4f5'
              }}
            >
              <PlusCircle className="size-6" style={{ color: '#71717a' }} />
            </div>
            <h3
              className="font-medium mb-1"
              style={{ color: '#18181b' }}
            >
              No active requests
            </h3>
            <p
              className="text-sm mb-4"
              style={{ color: '#71717a', maxWidth: '20rem' }}
            >
              You don't have any ongoing refund requests. Start a new one to get reimbursed.
            </p>
            <Link
              href="/student/create"
              className="hover:bg-zinc-800"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#18181b',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: 500,
                padding: '0.625rem 1.25rem',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                transition: 'all 150ms'
              }}
            >
              <PlusCircle className="size-4" />
              New Request
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
