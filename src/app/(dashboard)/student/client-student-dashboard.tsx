"use client"

import { useQuery } from "@tanstack/react-query"
import { PlusCircle } from "lucide-react"
import Link from "next/link"
import { ActiveRequestCard } from "@/components/student/active-request-card"
import { getRefunds } from "@/actions/refunds"
import { PaginatedResult } from "@/types/pagination"

// Define a type for the RefundRequest based on what getRefunds returns
// We need to infer this or import it if exported
type RefundRequest = PaginatedResult<any>["data"][0]

interface ClientStudentDashboardProps {
    initialData: RefundRequest[]
}

export function ClientStudentDashboard({ initialData }: ClientStudentDashboardProps) {
    // We fetch all "active" refunds client-side or filtered client-side?
    // The server component filtered them. Ideally we should have a query that returns active requests.
    // For now, let's fetch 'all' and filter client side to match the server logic, 
    // OR just use the server's initial data and invalidate "refunds".
    // Since getRefunds returns paginated data, we should probably just use the initial data 
    // and rely on invalidation to re-fetch.
    
    // However, getRefunds takes pagination. The dashboard shows "active" requests.
    // If we want real-time updates, we need to re-run the `getRefunds` logic.
    // But `getRefunds` is a server action. 
    // We can use useQuery to call the server action.

    const { data: result } = useQuery({
        queryKey: ["refunds", { page: 1, pageSize: 50 }], // Matches server call
        queryFn: () => getRefunds({ page: 1, pageSize: 50 }),
        initialData: { data: initialData, pagination: { page: 1, pageSize: 50, totalItems: initialData.length, totalPages: 1 } } as any // Approximate initial structure
    })

    // Filter logic must match server component
    const activeRequests = result.data.filter((r: RefundRequest) => r.status !== "PAID" && r.status !== "DECLINED")

    return (
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
                    {activeRequests.map((req: RefundRequest) => (
                        <ActiveRequestCard
                            key={req.id}
                            id={req.id}
                            title={req.title}
                            amount={req.amountEst}
                            date={new Date(req.createdAt).toISOString()}
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
    )
}
