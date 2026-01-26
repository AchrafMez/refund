"use client"

import Link from "next/link"
import { StatusBadge, RequestStatus } from "@/components/status-badge"
import { ArrowRight, CalendarDays } from "lucide-react"

interface ActiveRequestCardProps {
  id: string
  title: string
  amount: number
  date: string
  status: RequestStatus
  receiptsCount?: number
  currency?: string
  totalAmount?: number
  receipts?: Array<{ id: string; url: string; amount: number }>
}

// Status-based progress configuration
const statusConfig: Record<RequestStatus, { progress: number; message: string }> = {
  ESTIMATED: { progress: 25, message: "Waiting for staff approval..." },
  PENDING_RECEIPTS: { progress: 50, message: "Receipt upload required." },
  VERIFIED_READY: { progress: 75, message: "Receipt submitted. Awaiting verification." },
  PAID: { progress: 100, message: "Payment successfully transferred." },
  DECLINED: { progress: 0, message: "Request declined." },
  REJECTED: { progress: 0, message: "Request was rejected." }
}

export function ActiveRequestCard({ id, title, amount, date, status, receiptsCount = 0, currency = 'DH', totalAmount, receipts = [] }: ActiveRequestCardProps) {
  // When PENDING_RECEIPTS but has receipts, show as Receipt Submitted
  const hasReceipts = receiptsCount > 0
  const effectiveStatus = (status === 'PENDING_RECEIPTS' && hasReceipts) ? 'VERIFIED_READY' : status
  
  // Calculate if receipts have been evaluated by staff (have amounts > 0)
  const receiptsEvaluated = receipts.some(r => r.amount > 0) || (totalAmount && totalAmount > 0)
  const displayAmount = receiptsEvaluated && totalAmount ? totalAmount : amount
  const showEstimated = !receiptsEvaluated
  
  // Get config based on effective status, but adjust message for PENDING_RECEIPTS with receipts
  const baseConfig = statusConfig[effectiveStatus]
  const config = (status === 'PENDING_RECEIPTS' && hasReceipts) 
    ? { ...baseConfig, progress: 75, message: "Receipt submitted. Awaiting staff review." }
    : baseConfig

  return (
    <div
      style={{
        backgroundColor: 'white',
        border: '1px solid #e4e4e7',
        borderRadius: '0.75rem',
        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 150ms'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#d4d4d8'
        e.currentTarget.style.boxShadow = '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#e4e4e7'
        e.currentTarget.style.boxShadow = '0 1px 2px 0 rgb(0 0 0 / 0.05)'
      }}
    >
      {/* Header */}
      <div style={{ padding: '1.25rem 1.25rem 1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                fontWeight: 500,
                color: '#18181b',
                fontSize: '0.9375rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {title}
            </h3>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                fontSize: '0.8125rem',
                color: '#71717a',
                marginTop: '0.375rem'
              }}
            >
              <CalendarDays style={{ width: '0.875rem', height: '0.875rem' }} />
              <span suppressHydrationWarning>
                {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
          <StatusBadge status={effectiveStatus} />
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '0 1.25rem 1.25rem 1.25rem', flex: 1 }}>
        {/* Amount */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 500, color: '#18181b' }}>
            {displayAmount.toFixed(2)}
          </span>
          <span style={{ fontSize: '0.875rem', color: '#71717a' }}>{currency}</span>
          {showEstimated && (
            <span style={{ fontSize: '0.75rem', color: '#a1a1aa', marginLeft: '0.25rem' }}>
              (estimated)
            </span>
          )}
        </div>

        {/* Progress */}
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
            <span style={{ color: '#71717a' }}>Progress</span>
            <span style={{ color: '#18181b', fontWeight: 500 }}>{config.progress}%</span>
          </div>

          {/* Progress bar */}
          <div
            style={{
              width: '100%',
              height: '0.25rem',
              backgroundColor: '#f4f4f5',
              borderRadius: '0.125rem',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                height: '100%',
                backgroundColor: '#18181b',
                borderRadius: '0.125rem',
                transition: 'width 300ms',
                width: `${config.progress}%`
              }}
            />
          </div>
        </div>

        <p style={{ fontSize: '0.8125rem', color: '#71717a' }}>
          {config.message}
        </p>
      </div>

      {/* Footer */}
      <div style={{ padding: '0 1.25rem 1.25rem 1.25rem' }}>
        <Link
          href={`/student/${id}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '0.625rem 0.875rem',
            borderRadius: '0.375rem',
            backgroundColor: 'white',
            border: '1px solid #e4e4e7',
            color: '#3f3f46',
            fontSize: '0.875rem',
            fontWeight: 500,
            textDecoration: 'none',
            transition: 'background-color 150ms'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#fafafa'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white'
          }}
        >
          View Details
          <ArrowRight style={{ width: '1rem', height: '1rem' }} />
        </Link>
      </div>
    </div>
  )
}
