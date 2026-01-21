"use client"

import { useRef } from "react"
import Link from "next/link"
import { submitReceipt, getRefundRequestById } from "@/actions/refunds"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { StatusBadge, RequestStatus } from "@/components/status-badge"
import { MultiReceiptUpload } from "@/components/student/multi-receipt-upload"
import { ReceiptList } from "@/components/receipt-list"
import { ChevronLeft, CalendarDays, CheckCircle2, Clock, FileText, CreditCard, CircleDot, Download } from "lucide-react"

interface Receipt {
    id: string
    url: string
    amount: number
    createdAt: string
}

interface RequestDetailsViewProps {
    request: {
        id: string
        title: string
        amount: number
        totalAmount?: number
        date: string
        status: string
        category: string
        description: string | null
        receiptUrl: string | null
        receipts: Receipt[]
        user: {
            name: string | null
            email: string
            image: string | null
        }
    }
    isStaff?: boolean
}

// Timeline step configuration
// Timeline step configuration
const getTimelineSteps = (status: RequestStatus, createdDate: string) => {
    const steps = [
        {
            id: 'created',
            label: 'Request Created',
            description: 'You submitted the expense estimate.',
            date: createdDate,
            icon: FileText,
            completed: true,
            current: status === 'ESTIMATED'
        },
        {
            id: 'approved',
            label: 'Approved/Rejected',
            description: 'Staff reviewed your request.',
            date: null,
            icon: CheckCircle2,
            completed: ['DECLINED', 'PENDING_RECEIPTS', 'VERIFIED_READY', 'PAID', 'REJECTED'].includes(status),
            current: status === 'PENDING_RECEIPTS'
        },
        {
            id: 'receipt',
            label: 'Receipt Submitted',
            description: 'Receipt uploaded for verification.',
            date: null,
            icon: FileText,
            completed: ['VERIFIED_READY', 'PAID'].includes(status),
            current: false
        },
        {
            id: 'review',
            label: 'In Review',
            description: 'Receipt is being verified.',
            date: null,
            icon: Clock,
            completed: ['PAID'].includes(status),
            current: status === 'VERIFIED_READY'
        },
        {
            id: 'paid',
            label: 'Payment Complete',
            description: 'Funds have been transferred.',
            date: null,
            icon: CreditCard,
            completed: status === 'PAID',
            current: false
        }
    ]
    return steps
}

export function RequestDetailsView({ request: initialRequest, isStaff = false }: RequestDetailsViewProps) {
    const printRef = useRef<HTMLDivElement>(null)
    const queryClient = useQueryClient()

    // Use Query for real-time data
    const { data: request } = useQuery({
        queryKey: ["refund", initialRequest.id],
        queryFn: async () => {
             const updated = await getRefundRequestById(initialRequest.id)
             if (!updated) throw new Error("Request not found")
             return {
                id: updated.id,
                title: updated.title,
                amount: updated.amountEst,
                totalAmount: updated.totalAmount,
                date: updated.createdAt.toISOString(),
                status: updated.status,
                category: updated.type,
                description: updated.description,
                receiptUrl: updated.receiptUrl,
                receipts: (updated.receipts || []).map((r: any) => ({
                    id: r.id,
                    url: r.url,
                    amount: r.amount,
                    createdAt: typeof r.createdAt === 'string' ? r.createdAt : r.createdAt.toISOString()
                })),
                user: updated.user
             }
        },
        initialData: initialRequest
    })

    const status = request.status as RequestStatus
    const receipts = request.receipts || []
    const totalAmount = request.totalAmount || receipts.reduce((sum: number, r: Receipt) => sum + r.amount, 0)

    const handleUploadComplete = () => {
        queryClient.invalidateQueries({ queryKey: ["refund", request.id] })
    }

    const timelineSteps = getTimelineSteps(status, request.date)

    const handleDownloadPDF = async () => {
        try {
            const { jsPDF } = await import('jspdf')

            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            })

            const pageWidth = doc.internal.pageSize.getWidth()
            const pageHeight = doc.internal.pageSize.getHeight()
            const margin = 20
            const contentWidth = pageWidth - (margin * 2)
            let yPos = margin

            const dateFormatted = new Date(request.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            })

            // ========================================
            // HEADER - Clean style matching export
            // ========================================

            // Logo on left
            try {
                const response = await fetch('/1337.png')
                const blob = await response.blob()
                const base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader()
                    reader.onloadend = () => resolve(reader.result as string)
                    reader.readAsDataURL(blob)
                })
                doc.addImage(base64, 'PNG', margin, yPos, 30, 8)
            } catch {
                doc.setFont('helvetica', 'bold')
                doc.setFontSize(20)
                doc.setTextColor(0, 0, 0)
                doc.text('1337', margin, yPos + 6)
            }

            // Title on right
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(14)
            doc.setTextColor(0, 0, 0)
            doc.text('Refund Request', pageWidth - margin, yPos + 3, { align: 'right' })

            // Request ID and date
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(9)
            doc.setTextColor(100, 100, 100)
            doc.text(`#${request.id.slice(0, 8)} • ${dateFormatted}`, pageWidth - margin, yPos + 10, { align: 'right' })

            yPos += 20

            // Separator line
            doc.setDrawColor(0, 0, 0)
            doc.setLineWidth(0.5)
            doc.line(margin, yPos, pageWidth - margin, yPos)

            yPos += 12

            // ========================================
            // REQUEST DETAILS - Simple table style
            // ========================================

            // Title
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(16)
            doc.setTextColor(0, 0, 0)
            doc.text(request.title, margin, yPos)
            yPos += 10

            // Status badge
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(9)
            const statusText = status
            const statusColor = status === 'PAID' ? [22, 163, 74] : status === 'DECLINED' ? [220, 38, 38] : [0, 0, 0]
            doc.setTextColor(statusColor[0], statusColor[1], statusColor[2])
            doc.text(statusText, margin, yPos)
            yPos += 15

            // Details table
            const detailsData = [
                ['Submitted By', request.user.name || 'Unknown'],
                ['Email', request.user.email],
                ['Category', request.category],
                ['Date Submitted', new Date(request.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })],
                ['Status', status]
            ]

            detailsData.forEach(([label, value]) => {
                doc.setFont('helvetica', 'normal')
                doc.setFontSize(9)
                doc.setTextColor(100, 100, 100)
                doc.text(label, margin, yPos)

                doc.setFont('helvetica', 'bold')
                doc.setTextColor(0, 0, 0)
                doc.text(value, margin + 45, yPos)
                yPos += 7
            })

            yPos += 8

            // Description box
            doc.setDrawColor(200, 200, 200)
            doc.setLineWidth(0.2)
            doc.rect(margin, yPos, contentWidth, 30)

            doc.setFont('helvetica', 'bold')
            doc.setFontSize(9)
            doc.setTextColor(100, 100, 100)
            doc.text('DESCRIPTION', margin + 5, yPos + 7)

            doc.setFont('helvetica', 'normal')
            doc.setFontSize(10)
            doc.setTextColor(0, 0, 0)
            const descriptionLines = doc.splitTextToSize(request.description || 'No description provided', contentWidth - 10)
            doc.text(descriptionLines, margin + 5, yPos + 15)

            yPos += 40

            // ========================================
            // AMOUNT BOX
            // ========================================
            doc.setDrawColor(0, 0, 0)
            doc.setLineWidth(0.3)
            doc.rect(margin, yPos, contentWidth, 20)

            doc.setFont('helvetica', 'bold')
            doc.setFontSize(10)
            doc.setTextColor(0, 0, 0)
            doc.text('Amount:', margin + 5, yPos + 12)

            doc.setFontSize(14)
            doc.text(`${request.amount.toFixed(2)} DH`, pageWidth - margin - 5, yPos + 12, { align: 'right' })

            yPos += 30

            // ========================================
            // RECEIPT SECTION (if exists)
            // ========================================
            if (request.receiptUrl) {
                const isImage = /\.(jpeg|jpg|png|gif|webp)$/i.test(request.receiptUrl)

                if (isImage) {
                    // Add receipt on a new page for proper sizing
                    doc.addPage()
                    let receiptY = margin

                    // Header for receipt page
                    try {
                        const response = await fetch('/1337.png')
                        const blob = await response.blob()
                        const logoBase64 = await new Promise<string>((resolve) => {
                            const reader = new FileReader()
                            reader.onloadend = () => resolve(reader.result as string)
                            reader.readAsDataURL(blob)
                        })
                        doc.addImage(logoBase64, 'PNG', margin, receiptY, 30, 8)
                    } catch {
                        doc.setFont('helvetica', 'bold')
                        doc.setFontSize(20)
                        doc.setTextColor(0, 0, 0)
                        doc.text('1337', margin, receiptY + 6)
                    }

                    doc.setFont('helvetica', 'bold')
                    doc.setFontSize(14)
                    doc.setTextColor(0, 0, 0)
                    doc.text('Receipt Attachment', pageWidth - margin, receiptY + 3, { align: 'right' })

                    doc.setFont('helvetica', 'normal')
                    doc.setFontSize(9)
                    doc.setTextColor(100, 100, 100)
                    doc.text(`${request.title}`, pageWidth - margin, receiptY + 10, { align: 'right' })

                    receiptY += 20

                    // Separator line
                    doc.setDrawColor(0, 0, 0)
                    doc.setLineWidth(0.5)
                    doc.line(margin, receiptY, pageWidth - margin, receiptY)

                    receiptY += 15

                    // Try to embed the actual image
                    try {
                        const response = await fetch(request.receiptUrl)
                        const blob = await response.blob()
                        const base64 = await new Promise<string>((resolve) => {
                            const reader = new FileReader()
                            reader.onloadend = () => resolve(reader.result as string)
                            reader.readAsDataURL(blob)
                        })

                        // Calculate available space (page height minus margins and footer)
                        const availableHeight = pageHeight - receiptY - 25

                        // Add image - jsPDF will auto-scale maintaining aspect ratio
                        doc.addImage(base64, 'JPEG', margin, receiptY, contentWidth, availableHeight, undefined, 'FAST')

                    } catch {
                        // Fallback to link if image fetch fails
                        doc.setFont('helvetica', 'normal')
                        doc.setFontSize(10)
                        doc.setTextColor(0, 0, 0)
                        doc.text('Image could not be loaded. View online:', margin, receiptY + 10)

                        doc.setTextColor(0, 0, 255)
                        doc.textWithLink(request.receiptUrl, margin, receiptY + 18, { url: request.receiptUrl })
                    }

                    // Footer for receipt page
                    doc.setDrawColor(200, 200, 200)
                    doc.setLineWidth(0.2)
                    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15)

                    doc.setFont('helvetica', 'normal')
                    doc.setFontSize(8)
                    doc.setTextColor(100, 100, 100)
                    doc.text('1337 Refund Management System', margin, pageHeight - 10)
                    doc.text('Page 2', pageWidth - margin, pageHeight - 10, { align: 'right' })

                } else {
                    // For PDFs and other files, show link on same page
                    doc.setDrawColor(200, 200, 200)
                    doc.setLineWidth(0.2)
                    doc.rect(margin, yPos, contentWidth, 25)

                    doc.setFont('helvetica', 'bold')
                    doc.setFontSize(9)
                    doc.setTextColor(100, 100, 100)
                    doc.text('RECEIPT ATTACHMENT (PDF)', margin + 5, yPos + 7)

                    doc.setFont('helvetica', 'normal')
                    doc.setFontSize(9)
                    doc.setTextColor(0, 0, 255)
                    const displayUrl = request.receiptUrl.length > 70
                        ? request.receiptUrl.substring(0, 67) + '...'
                        : request.receiptUrl
                    doc.textWithLink(displayUrl, margin + 5, yPos + 17, { url: request.receiptUrl })
                }
            }

            // ========================================
            // FOOTER (Page 1)
            // ========================================
            doc.setPage(1)
            doc.setDrawColor(200, 200, 200)
            doc.setLineWidth(0.2)
            doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15)

            doc.setFont('helvetica', 'normal')
            doc.setFontSize(8)
            doc.setTextColor(100, 100, 100)
            doc.text('1337 Refund Management System', margin, pageHeight - 10)
            const totalPages = (doc as any).internal.getNumberOfPages()
            doc.text(`Page 1${totalPages > 1 ? ` of ${totalPages}` : ''} • Generated: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`, pageWidth - margin, pageHeight - 10, { align: 'right' })

            // Save the PDF
            doc.save(`refund-${request.id.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.pdf`)

        } catch (error) {
            console.error('Failed to generate PDF:', error)
            alert('PDF generation failed. Please try again.')
        }
    }

    return (
        <div style={{ maxWidth: '64rem', margin: '0 auto' }} ref={printRef}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <Link
                    href="/student"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '50%',
                        backgroundColor: 'transparent',
                        color: '#71717a',
                        border: '1px solid #e4e4e7',
                        transition: 'all 150ms',
                        flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#18181b'
                        e.currentTarget.style.color = 'white'
                        e.currentTarget.style.borderColor = '#18181b'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = '#71717a'
                        e.currentTarget.style.borderColor = '#e4e4e7'
                    }}
                >
                    <ChevronLeft style={{ width: '1.25rem', height: '1.25rem' }} />
                </Link>
                <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: '#18181b', letterSpacing: '-0.025em' }}>
                            {request.title}
                        </h1>
                        <StatusBadge status={status} />
                    </div>
                </div>

                {/* Download button - right oriented */}
                {(status === 'PAID' || status === 'REJECTED' || status === 'DECLINED') && (
                    <div style={{ marginLeft: 'auto' }}>
                        <button
                            onClick={handleDownloadPDF}
                            title="Download as PDF"
                            style={{
                                width: '2.5rem',
                                height: '2.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '0.375rem',
                                backgroundColor: '#18181b',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 150ms'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#27272a'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#18181b'
                            }}
                        >
                            <Download style={{ width: '1.125rem', height: '1.125rem' }} />
                        </button>
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                {/* @media query alternative: Use CSS classes for responsive */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 flex flex-col gap-6">

                        {/* Status Action Card - Only show upload for request owner (not staff) */}
                        {status === "PENDING_RECEIPTS" && !isStaff && (
                            <div
                                style={{
                                    backgroundColor: receipts.length > 0 ? '#fff7ed' : '#fffbeb',
                                    border: receipts.length > 0 ? '1px solid #fdba74' : '1px solid #fde68a',
                                    borderRadius: '0.75rem',
                                    padding: '1.5rem',
                                    display: 'flex',
                                    gap: '1rem',
                                    marginBottom: '1rem'
                                }}
                            >
                                <div style={{
                                    width: '2.5rem',
                                    height: '2.5rem',
                                    borderRadius: '50%',
                                    backgroundColor: receipts.length > 0 ? '#f97316' : '#fbbf24',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <FileText style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: receipts.length > 0 ? '#c2410c' : '#92400e', marginBottom: '0.25rem' }}>
                                        {receipts.length > 0 ? 'Additional Receipt Requested' : 'Action Required'}
                                    </h3>
                                    <p style={{ fontSize: '0.875rem', color: receipts.length > 0 ? '#ea580c' : '#a16207', marginBottom: '1rem' }}>
                                        {receipts.length > 0 
                                            ? 'Staff has requested additional receipt(s). Please upload more documentation to proceed.'
                                            : 'Please upload your receipt(s) for this expense to proceed with verification.'
                                        }
                                    </p>
                                    <MultiReceiptUpload 
                                        requestId={request.id} 
                                        onUploadComplete={handleUploadComplete} 
                                    />
                                </div>
                            </div>
                        )}

                        {/* Receipt List - Show for all statuses after receipts are uploaded */}
                        {receipts.length > 0 && (
                            <div
                                style={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e4e4e7',
                                    borderRadius: '0.75rem',
                                    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                                    overflow: 'hidden',
                                    marginBottom: '1rem'
                                }}
                            >
                                <div style={{
                                    padding: '1rem 1.5rem',
                                    borderBottom: '1px solid #f4f4f5',
                                    backgroundColor: '#fafafa',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#18181b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Receipts
                                    </h3>
                                    {totalAmount > 0 && (
                                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#18181b' }}>
                                            Total: ${totalAmount.toFixed(2)}
                                        </div>
                                    )}
                                </div>
                                <div style={{ padding: '1rem 1.5rem' }}>
                                    <ReceiptList 
                                        receipts={receipts.map((r: Receipt) => ({ ...r, createdAt: new Date(r.createdAt) }))}
                                        isStaff={isStaff}
                                        requestId={request.id}
                                    />
                                </div>
                            </div>
                        )}


                        {/* Details Card */}
                        <div
                            style={{
                                backgroundColor: 'white',
                                border: '1px solid #e4e4e7',
                                borderRadius: '0.75rem',
                                boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{
                                padding: '1rem 1.5rem',
                                borderBottom: '1px solid #f4f4f5',
                                backgroundColor: '#fafafa'
                            }}>
                                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#18181b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Expense Details
                                </h3>
                            </div>
                            <div style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem 2rem', fontSize: '0.875rem' }}>
                                    <div style={{ color: '#71717a', fontWeight: 500 }}>Reference</div>
                                    <div style={{ fontWeight: 500, color: '#18181b', fontFamily: 'monospace' }}>
                                        #{request.id.slice(0, 12)}
                                    </div>

                                    <div style={{ color: '#71717a', fontWeight: 500 }}>Category</div>
                                    <div style={{
                                        fontWeight: 500,
                                        color: '#18181b',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}>
                                        <span style={{
                                            width: '0.5rem',
                                            height: '0.5rem',
                                            borderRadius: '50%',
                                            backgroundColor: '#18181b'
                                        }} />
                                        {request.category}
                                    </div>

                                    <div style={{ color: '#71717a', fontWeight: 500 }}>Estimate</div>
                                    <div style={{ fontWeight: 500, color: '#71717a', fontSize: '0.875rem' }}>
                                        {request.amount.toFixed(2)} DH
                                    </div>

                                    <div style={{ color: '#71717a', fontWeight: 500 }}>Total Amount</div>
                                    <div style={{ fontWeight: 600, color: '#18181b', fontSize: '1.125rem' }}>
                                        {totalAmount.toFixed(2)} DH
                                    </div>

                                    <div style={{ color: '#71717a', fontWeight: 500 }}>Submitted</div>
                                    <div style={{ fontWeight: 500, color: '#18181b' }} suppressHydrationWarning>
                                        {new Date(request.date).toLocaleDateString('en-US', {
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })}
                                    </div>

                                    <div style={{ color: '#71717a', fontWeight: 500 }}>Status</div>
                                    <div>
                                        <StatusBadge status={status} />
                                    </div>
                                </div>

                                <div style={{ height: '1px', backgroundColor: '#f4f4f5', margin: '1.5rem 0' }} />

                                <div>
                                    <div style={{ color: '#71717a', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.75rem' }}>
                                        Description
                                    </div>
                                    <div
                                        style={{
                                            padding: '1rem 1.25rem',
                                            backgroundColor: '#fafafa',
                                            borderRadius: '0.5rem',
                                            fontSize: '0.875rem',
                                            color: '#3f3f46',
                                            lineHeight: 1.6,
                                            border: '1px solid #f4f4f5'
                                        }}
                                    >
                                        {request.description || "No description provided."}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Timeline */}
                    <div className="lg:col-span-1 mt-6 lg:mt-0">
                        <div
                            style={{
                                backgroundColor: 'white',
                                border: '1px solid #e4e4e7',
                                borderRadius: '0.75rem',
                                boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                                overflow: 'hidden',
                                position: 'sticky',
                                top: '1.5rem',
                                marginTop: '1.5rem'
                            }}
                        >
                            <div style={{
                                padding: '1rem 1.5rem',
                                borderBottom: '1px solid #f4f4f5',
                                backgroundColor: '#fafafa'
                            }}>
                                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#18181b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Timeline
                                </h3>
                            </div>
                            <div style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                    {timelineSteps.map((step, index) => {
                                        const Icon = step.icon
                                        const isLast = index === timelineSteps.length - 1

                                        return (
                                            <div key={step.id} style={{ display: 'flex', gap: '1rem' }}>
                                                {/* Icon & Line */}
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    <div style={{
                                                        width: '2rem',
                                                        height: '2rem',
                                                        borderRadius: '50%',
                                                        backgroundColor: step.completed ? '#18181b' : step.current ? '#fbbf24' : '#f4f4f5',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0,
                                                        border: step.current ? '2px solid #fde68a' : 'none',
                                                        boxShadow: step.current ? '0 0 0 4px #fef3c7' : 'none'
                                                    }}>
                                                        {step.completed ? (
                                                            <CheckCircle2 style={{ width: '1rem', height: '1rem', color: 'white' }} />
                                                        ) : step.current ? (
                                                            <CircleDot style={{ width: '1rem', height: '1rem', color: 'white' }} />
                                                        ) : (
                                                            <Icon style={{ width: '0.875rem', height: '0.875rem', color: '#a1a1aa' }} />
                                                        )}
                                                    </div>
                                                    {!isLast && (
                                                        <div style={{
                                                            width: '2px',
                                                            flex: 1,
                                                            minHeight: '2rem',
                                                            backgroundColor: step.completed ? '#18181b' : '#e4e4e7'
                                                        }} />
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div style={{ paddingBottom: isLast ? 0 : '1.5rem', flex: 1 }}>
                                                    <div style={{
                                                        fontSize: '0.875rem',
                                                        fontWeight: 600,
                                                        color: step.completed || step.current ? '#18181b' : '#a1a1aa',
                                                        marginBottom: '0.125rem'
                                                    }}>
                                                        {step.label}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '0.75rem',
                                                        color: step.completed || step.current ? '#71717a' : '#d4d4d8',
                                                        lineHeight: 1.4
                                                    }}>
                                                        {step.description}
                                                    </div>
                                                    {step.date && (
                                                        <div style={{
                                                            fontSize: '0.6875rem',
                                                            color: '#a1a1aa',
                                                            marginTop: '0.375rem'
                                                        }} suppressHydrationWarning>
                                                            {new Date(step.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
