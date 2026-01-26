"use client"

import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Banknote,
  UploadCloud,
  LucideIcon
} from "lucide-react"

export type RequestStatus =
  | "ESTIMATED"
  | "DECLINED"
  | "PENDING_RECEIPTS"
  | "VERIFIED_READY"
  | "PAID"
  | "REJECTED"

interface StatusBadgeProps {
  status: RequestStatus
}

const badgeContent: Record<RequestStatus, { icon: LucideIcon; label: string }> = {
  ESTIMATED: { icon: Loader2, label: "Estimate" },
  DECLINED: { icon: AlertCircle, label: "Declined" },
  PENDING_RECEIPTS: { icon: UploadCloud, label: "Needs Receipts" },
  VERIFIED_READY: { icon: CheckCircle2, label: "Receipt Submitted" },
  PAID: { icon: Banknote, label: "Paid" },
  REJECTED: { icon: AlertCircle, label: "Rejected" }
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const content = badgeContent[status] || { icon: Loader2, label: status }
  const Icon = content.icon

  // Subtle, monochrome-ish badge styles
  const getStyle = () => {
    switch (status) {
      case "ESTIMATED":
        return { bg: '#fafafa', text: '#71717a', border: '#e4e4e7' }
      case "DECLINED":
        return { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' }
      case "PENDING_RECEIPTS":
        return { bg: '#fffbeb', text: '#b45309', border: '#fde68a' }
      case "VERIFIED_READY":
        return { bg: '#fdf4ff', text: '#86198f', border: '#f0abfc' }
      case "PAID":
        return { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' }
      case "REJECTED":
        return { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' }
      default:
        return { bg: '#fafafa', text: '#71717a', border: '#e4e4e7' }
    }
  }

  const style = getStyle()

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.25rem 0.625rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 500,
        backgroundColor: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
        whiteSpace: 'nowrap'
      }}
    >
      <Icon
        style={{
          width: '0.75rem',
          height: '0.75rem',
          animation: status === 'ESTIMATED' ? 'spin 2s linear infinite' : 'none'
        }}
      />
      {content.label}
    </span>
  )
}
