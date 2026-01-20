"use client"

import { AlertCircle, Home } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Link from "next/link"

function ErrorContent() {
    const searchParams = useSearchParams()
    const errorCode = searchParams.get("error") || "unknown_error"

    // Format error code for display
    const formatErrorCode = (code: string) => {
        return code.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
    }

    return (
        <div
            style={{
                display: 'flex',
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                overflow: 'hidden'
            }}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: '24rem',
                    backgroundColor: 'white',
                    border: '1px solid #e4e4e7',
                    borderRadius: '0.75rem',
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                    padding: '2.5rem',
                    textAlign: 'center'
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1.5rem'
                    }}
                >
                    <div
                        style={{
                            width: '3rem',
                            height: '3rem',
                            borderRadius: '50%',
                            backgroundColor: '#fef2f2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <AlertCircle style={{ width: '1.5rem', height: '1.5rem', color: '#ef4444' }} />
                    </div>
                </div>

                {/* Title */}
                <h1
                    style={{
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        letterSpacing: '-0.025em',
                        color: '#18181b',
                        marginBottom: '0.5rem'
                    }}
                >
                    Something went wrong
                </h1>

                {/* Error Description */}
                <p style={{ fontSize: '0.875rem', color: '#71717a', marginBottom: '1.5rem' }}>
                    {formatErrorCode(errorCode)}
                </p>

                {/* Back to Home Button */}
                <Link
                    href="/login"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        backgroundColor: '#18181b',
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        padding: '0.75rem 1.5rem',
                        borderRadius: '0.375rem',
                        border: 'none',
                        cursor: 'pointer',
                        textDecoration: 'none',
                        transition: 'all 150ms'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#27272a'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#18181b'
                    }}
                >
                    <Home style={{ width: '1rem', height: '1rem' }} />
                    Back to Login
                </Link>
            </div>
        </div>
    )
}

export default function ErrorPage() {
    return (
        <Suspense fallback={
            <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: '#71717a' }}>Loading...</div>
            </div>
        }>
            <ErrorContent />
        </Suspense>
    )
}
