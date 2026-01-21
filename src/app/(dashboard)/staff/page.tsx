
import { getAllRefundRequests, getStaffTabCounts } from "@/actions/refunds"
import { StaffDashboardView } from "./staff-dashboard-view"

export default async function StaffDashboard() {
  // Fetch initial data for the Validation tab (default)
  const [initialData, tabCounts] = await Promise.all([
    getAllRefundRequests({ page: 1, pageSize: 10, statusFilter: "Validation" }),
    getStaffTabCounts()
  ])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 600, color: '#18181b', letterSpacing: '-0.025em' }}>
          Staff Inbox
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#71717a', marginTop: '0.25rem' }}>
          Manage and approve refund requests.
        </p>
      </div>

      <StaffDashboardView initialData={initialData as any} initialCounts={tabCounts} />
    </div>
  )
}
