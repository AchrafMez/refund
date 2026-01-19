"use client"

import { useState, useEffect } from "react"
import { Wallet, Clock, LucideIcon } from "lucide-react"

interface StatCardProps {
  label: string
  value: string
  icon: LucideIcon
  compact?: boolean
}

function StatCard({ label, value, icon: Icon, compact = false }: StatCardProps) {
  return (
    <div 
      style={{ 
        backgroundColor: 'white',
        border: '1px solid #e4e4e7',
        borderRadius: compact ? '0.625rem' : '0.75rem',
        padding: compact ? '0.3rem 1rem' : '0.2rem 1.25rem',
        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
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
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        gap: compact ? '0.75rem' : '0'
      }}>
        <div style={{ 
          display: compact ? 'flex' : 'block',
          alignItems: 'baseline',
          gap: compact ? '0.5rem' : '0',
          flex: 1,
          minWidth: 0
        }}>
          <p style={{ 
            fontSize: compact ? '0.8125rem' : '0.875rem', 
            color: '#71717a', 
            marginBottom: compact ? 0 : '0.25rem',
            whiteSpace: 'nowrap'
          }}>
            {label}
          </p>
          <p style={{ 
            fontSize: compact ? '1.125rem' : '1.5rem', 
            fontWeight: 600, 
            color: '#18181b', 
            letterSpacing: '-0.025em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {value}
          </p>
        </div>
        <div 
          style={{ 
            backgroundColor: '#f4f4f5',
            borderRadius: compact ? '0.375rem' : '0.5rem',
            width: compact ? '2rem' : '2.75rem',
            height: compact ? '2rem' : '2.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Icon style={{ 
            width: compact ? '1rem' : '1.5rem', 
            height: compact ? '1rem' : '1.5rem', 
            color: '#71717a' 
          }} />
        </div>
      </div>
    </div>
  )
}

interface StatsRowProps {
  totalActive: number
  pendingAction: number
}

export function StatsRow({ totalActive, pendingAction }: StatsRowProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 480)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div 
      style={{ 
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
        gap: isMobile ? '0.625rem' : '1rem'
      }}
    >
      <StatCard 
        label="Total Active"
        value={`${totalActive.toFixed(2)} Dhs`}
        icon={Wallet}
        compact={isMobile}
      />
      <StatCard 
        label="Pending Action"
        value={`${pendingAction} Request${pendingAction !== 1 ? 's' : ''}`}
        icon={Clock}
        compact={isMobile}
      />
    </div>
  )
}
