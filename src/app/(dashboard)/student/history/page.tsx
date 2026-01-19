import { FileText } from "lucide-react"
import { getRefunds } from "@/actions/refunds"
import { HistoryList } from "./history-list"

export default async function HistoryPage() {
  const result = await getRefunds({ page: 1, pageSize: 10 })

  const totalReimbursed = result.data
    .filter(r => r.status === "PAID")
    .reduce((sum, r) => sum + r.amountEst, 0)

  const pendingCount = result.data.filter(r =>
    r.status === "ESTIMATED" || r.status === "PENDING_RECEIPTS" || r.status === "VERIFIED_READY"
  ).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 600, color: '#18181b', letterSpacing: '-0.025em' }}>
          Request History
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#71717a', marginTop: '0.25rem' }}>
          View all your past and current refund requests.
        </p>
      </div>

      {/* Stats Summary */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}
      >
        <div
          style={{
            backgroundColor: 'white',
            border: '1px solid #e4e4e7',
            borderRadius: '0.75rem',
            padding: '1.25rem',
            boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
          }}
        >
          <p style={{ fontSize: '0.8125rem', color: '#71717a', marginBottom: '0.25rem' }}>Total Requests</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 500, color: '#18181b' }}>{result.pagination.totalItems}</p>
        </div>
        <div
          style={{
            backgroundColor: 'white',
            border: '1px solid #e4e4e7',
            borderRadius: '0.75rem',
            padding: '1.25rem',
            boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
          }}
        >
          <p style={{ fontSize: '0.8125rem', color: '#71717a', marginBottom: '0.25rem' }}>Total Reimbursed</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 500, color: '#18181b' }}>{totalReimbursed.toFixed(2)} Dhs</p>
        </div>
        <div
          style={{
            backgroundColor: 'white',
            border: '1px solid #e4e4e7',
            borderRadius: '0.75rem',
            padding: '1.25rem',
            boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
          }}
        >
          <p style={{ fontSize: '0.8125rem', color: '#71717a', marginBottom: '0.25rem' }}>Pending</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 500, color: '#18181b' }}>{pendingCount} request{pendingCount !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Request List with Pagination */}
      <HistoryList initialData={result as any} />
    </div>
  )
}
