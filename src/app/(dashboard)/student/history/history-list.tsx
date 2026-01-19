"use client"

import { useState, useEffect } from "react"
import { FileText } from "lucide-react"
import { getRefunds } from "@/actions/refunds"
import { HistoryItem } from "./history-item"
import { Pagination } from "@/components/ui/pagination"
import { PaginatedResult, DEFAULT_PAGE_SIZE } from "@/types/pagination"

type RefundRequest = {
  id: string
  title: string
  amountEst: number
  status: string
  type: string
  createdAt: Date
  description: string | null
  receiptUrl: string | null
}

interface HistoryListProps {
  initialData: PaginatedResult<RefundRequest>
}

export function HistoryList({ initialData }: HistoryListProps) {
  const [data, setData] = useState(initialData)
  const [isLoading, setIsLoading] = useState(false)

  const fetchPage = async (page: number, pageSize: number = data.pagination.pageSize) => {
    setIsLoading(true)
    try {
      const result = await getRefunds({ page, pageSize })
      setData(result as PaginatedResult<RefundRequest>)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    fetchPage(page)
  }

  const handlePageSizeChange = (pageSize: number) => {
    fetchPage(1, pageSize) // Reset to page 1 when changing page size
  }

  return (
    <div>
      <h2 style={{ fontSize: '1rem', fontWeight: 500, color: '#18181b', marginBottom: '1rem' }}>
        All Requests
      </h2>

      <div
        style={{
          backgroundColor: 'white',
          border: '1px solid #e4e4e7',
          borderRadius: '0.75rem',
          boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          overflow: 'hidden',
          opacity: isLoading ? 0.7 : 1,
          transition: 'opacity 150ms'
        }}
      >
        {data.data.length > 0 ? (
          <>
            {data.data.map((request) => (
              <HistoryItem key={request.id} request={request} />
            ))}
          </>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '3rem',
              color: '#71717a'
            }}
          >
            <FileText style={{ width: '2.5rem', height: '2.5rem', marginBottom: '0.75rem' }} />
            <p style={{ fontWeight: 500 }}>No requests yet</p>
            <p style={{ fontSize: '0.875rem' }}>Your request history will appear here.</p>
          </div>
        )}
      </div>

      <Pagination
        pagination={data.pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  )
}
