import { StatsRow } from "@/components/student/stats-cards"
import { getRefunds } from "@/actions/refunds"
import { ClientStudentDashboard } from "./client-student-dashboard"

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

      {/* Client Component handles stats AND requests list with React Query */}
      <ClientStudentDashboard
        initialData={result.data}
        initialTotalActive={totalActive}
        initialPendingAction={pendingAction}
      />
    </div>
  )
}
