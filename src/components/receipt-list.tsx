"use client"

import { useState, useTransition } from 'react'
import { FileText, Image, Save, Loader2, ExternalLink, DollarSign } from 'lucide-react'
import { updateReceiptAmount } from '@/actions/refunds'
import { useRouter } from 'next/navigation'

interface Receipt {
  id: string
  url: string
  amount: number
  createdAt: Date
}

interface ReceiptListProps {
  receipts: Receipt[]
  isStaff?: boolean
  requestId: string
}

export function ReceiptList({ receipts, isStaff = false, requestId }: ReceiptListProps) {
  const router = useRouter()

  if (receipts.length === 0) {
    return (
      <div
        style={{
          padding: '1.5rem',
          textAlign: 'center',
          backgroundColor: '#f4f4f5',
          borderRadius: '0.5rem',
          color: '#71717a',
          fontSize: '0.875rem'
        }}
      >
        No receipts uploaded yet
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#71717a', marginBottom: '0.25rem' }}>
        Receipts ({receipts.length})
      </div>
      {receipts.map((receipt) => (
        <ReceiptItem
          key={receipt.id}
          receipt={receipt}
          isStaff={isStaff}
          onUpdate={() => router.refresh()}
        />
      ))}
    </div>
  )
}

function ReceiptItem({
  receipt,
  isStaff,
  onUpdate
}: {
  receipt: Receipt
  isStaff: boolean
  onUpdate: () => void
}) {
  const [amount, setAmount] = useState(receipt.amount.toString())
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const isImage = /\.(jpeg|jpg|png|gif|webp)$/i.test(receipt.url)
  const isPdf = /\.pdf$/i.test(receipt.url)

  const handleSave = () => {
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount < 0) return

    startTransition(async () => {
      await updateReceiptAmount(receipt.id, numAmount)
      setSaved(true)
      onUpdate()
      setTimeout(() => setSaved(false), 2000)
    })
  }

  const hasChanged = parseFloat(amount) !== receipt.amount

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem',
        borderRadius: '0.5rem',
        border: '1px solid #e4e4e7',
        backgroundColor: 'white',
        gap: '0.75rem'
      }}
    >
      {/* Thumbnail / Icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flex: 1, overflow: 'hidden' }}>
        <a
          href={receipt.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '0.375rem',
            backgroundColor: '#f4f4f5',
            overflow: 'hidden',
            flexShrink: 0
          }}
        >
          {isImage ? (
            <img
              src={receipt.url}
              alt="Receipt"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : isPdf ? (
            <FileText style={{ width: '1.25rem', height: '1.25rem', color: '#dc2626' }} />
          ) : (
            <Image style={{ width: '1.25rem', height: '1.25rem', color: '#71717a' }} />
          )}
        </a>

        <div style={{ overflow: 'hidden', flex: 1 }}>
          <a
            href={receipt.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: '#18181b',
              textDecoration: 'none'
            }}
          >
            {isImage ? 'Image' : isPdf ? 'PDF Document' : 'File'}
            <ExternalLink style={{ width: '0.75rem', height: '0.75rem', color: '#71717a' }} />
          </a>
          <p style={{ fontSize: '0.6875rem', color: '#71717a' }} suppressHydrationWarning>
            {new Date(receipt.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>

      {/* Amount */}
      {isStaff ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <div style={{ position: 'relative' }}>
            <DollarSign
              style={{
                position: 'absolute',
                left: '0.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '0.875rem',
                height: '0.875rem',
                color: '#71717a'
              }}
            />
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{
                width: '5.5rem',
                padding: '0.375rem 0.5rem 0.375rem 1.625rem',
                fontSize: '0.8125rem',
                border: '1px solid',
                borderColor: hasChanged ? '#fbbf24' : '#e4e4e7',
                borderRadius: '0.25rem',
                backgroundColor: hasChanged ? '#fffbeb' : 'white',
                outline: 'none'
              }}
            />
          </div>
          <button
            onClick={handleSave}
            disabled={!hasChanged || isPending}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '1.75rem',
              height: '1.75rem',
              borderRadius: '0.25rem',
              border: 'none',
              backgroundColor: saved ? '#16a34a' : hasChanged ? '#18181b' : '#e4e4e7',
              color: saved || hasChanged ? 'white' : '#a1a1aa',
              cursor: hasChanged && !isPending ? 'pointer' : 'not-allowed',
              transition: 'all 150ms'
            }}
          >
            {isPending ? (
              <Loader2 style={{ width: '0.875rem', height: '0.875rem', animation: 'spin 1s linear infinite' }} />
            ) : saved ? (
              <span style={{ fontSize: '0.75rem' }}>✓</span>
            ) : (
              <Save style={{ width: '0.875rem', height: '0.875rem' }} />
            )}
          </button>
        </div>
      ) : (
        <div style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: receipt.amount > 0 ? '#18181b' : '#a1a1aa',
          whiteSpace: 'nowrap'
        }}>
          {receipt.amount > 0 ? `$${receipt.amount.toFixed(2)}` : 'Pending'}
        </div>
      )}
    </div>
  )
}
