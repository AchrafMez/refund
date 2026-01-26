
import { getRefunds } from "@/actions/refunds"
import { ClientStudentDashboard } from "./client-student-dashboard"

export default async function StudentDashboard() {
  const result = await getRefunds({ page: 1, pageSize: 50 })

  return (
    <div className="space-y-8">
      <div>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 600, color: '#18181b', letterSpacing: '-0.025em' }}>
          Dashboard
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#71717a', marginTop: '0.25rem' }}>
          Track your refunds and submit new requests.
        </p>
      </div>

      <ClientStudentDashboard initialData={result.data} />
    </div>
  )
}
