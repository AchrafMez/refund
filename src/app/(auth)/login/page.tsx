"use client"

import { signIn } from "@/lib/auth-client"
import { ChevronRight, AlertCircle, X } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useState, useEffect, Suspense } from "react"

function LoginContent() {
  const searchParams = useSearchParams()
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    const error = searchParams.get("error")
    if (error === "auth_required") {
      setErrorMessage("Session expired. Please sign in again.")
      setShowError(true)
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => setShowError(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  return (
    <>
      {/* Error Toast */}
      {showError && (
        <div
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            backgroundColor: '#18181b',
            color: 'white',
            padding: '0.875rem 1rem',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            zIndex: 100,
            maxWidth: 'calc(100% - 2rem)',
            animation: 'slideUp 0.3s ease-out'
          }}
        >
          <AlertCircle style={{ width: '1.125rem', height: '1.125rem', color: '#f87171', flexShrink: 0 }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{errorMessage}</span>
          <button
            onClick={() => setShowError(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#a1a1aa',
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: '0.5rem'
            }}
          >
            <X style={{ width: '1rem', height: '1rem' }} />
          </button>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(1rem);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>

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
            padding: '2.5rem'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                letterSpacing: '-0.025em',
                color: '#18181b',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <img
                src="/1337.png"
                alt="Logo"
                style={{ height: '1.5rem', width: 'auto' }}
              />
              Refunds
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#71717a' }}>
              Sign in to your account
            </p>
          </div>

          <button
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              backgroundColor: '#18181b',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: 500,
              padding: '0.75rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 150ms'
            }}
            onClick={async () => {
              console.log("[Auth] Sign in button clicked")
              console.log("[Auth] NEXT_PUBLIC_BETTER_AUTH_URL:", process.env.NEXT_PUBLIC_BETTER_AUTH_URL)
              try {
                await signIn.social({
                  provider: "42-school",
                  callbackURL: "/student"
                })
                console.log("[Auth] signIn.social completed")
              } catch (error) {
                console.error("[Auth] Sign in error:", error)
                setErrorMessage("Failed to initiate sign in. Check console for details.")
                setShowError(true)
              }
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#27272a'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#18181b'
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.98)'
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            Sign in with 42 Intra
            <ChevronRight style={{ width: '1.125rem', height: '1.125rem' }} />
          </button>
        </div>
      </div>
    </>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#71717a' }}>Loading...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}