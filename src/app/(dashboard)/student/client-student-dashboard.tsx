"use client"

import { useQuery } from "@tanstack/react-query"
import { PlusCircle } from "lucide-react"
import Link from "next/link"
import { ActiveRequestCard } from "@/components/student/active-request-card"
import { StatsRow } from "@/components/student/stats-cards"
import { getRefunds } from "@/actions/refunds"

type RefundRequest = {
  id: string;
  status: string;
  title: string;
  description: string | null;
  amountEst: number;
  amountFinal: number | null;
  createdAt: Date;
  updatedAt: Date;
  type: string;
  user: { name: string | null; email: string };
  receipts: Array<{ id: string; url: string; amount: number }>;
}

interface ClientStudentDashboardProps {
    initialData: RefundRequest[]
}

export function ClientStudentDashboard({
    initialData
}: ClientStudentDashboardProps) {
    const { data: result } = useQuery({
        queryKey: ["refunds", { page: 1, pageSize: 50 }],
        queryFn: () => getRefunds({ page: 1, pageSize: 50 }),
        initialData: { data: initialData, pagination: { page: 1, pageSize: 50, totalItems: initialData.length, totalPages: 1 } },
        refetchInterval: 5000,
    })

    const activeRequests = result.data.filter((r: RefundRequest) => r.status !== "PAID" && r.status !== "DECLINED")

    const totalActive = activeRequests.reduce((sum: number, req: RefundRequest) => sum + req.amountEst, 0)
    const pendingAction = activeRequests.filter((r: RefundRequest) => r.status === "PENDING_RECEIPTS" || r.status === "ESTIMATED").length

    return (
        <>
            <StatsRow
                totalActive={totalActive}
                pendingAction={pendingAction}
            />

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
                        {activeRequests.map((req: RefundRequest) => {
                            // Calculate total amount from receipts that have been evaluated (amount > 0)
                            const evaluatedReceiptTotal = req.receipts.reduce((sum, receipt) => sum + (receipt.amount || 0), 0)
                            return (
                                <ActiveRequestCard
                                    key={req.id}
                                    id={req.id}
                                    title={req.title}
                                    amount={req.amountEst}
                                    date={new Date(req.createdAt).toISOString()}
                                    status={req.status as 'ESTIMATED' | 'DECLINED' | 'PENDING_RECEIPTS' | 'VERIFIED_READY' | 'PAID' | 'REJECTED'}
                                    receipts={req.receipts}
                                    totalAmount={evaluatedReceiptTotal > 0 ? evaluatedReceiptTotal : undefined}
                                    receiptsCount={req.receipts.length}
                                />
                            )
                        })}
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
                            You don&apos;t have any ongoing refund requests. Start a new one to get reimbursed.
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
        </>
    )
}
