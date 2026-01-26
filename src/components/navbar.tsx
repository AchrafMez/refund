"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { PlusCircle, Menu, X, LogOut, Info, FileText, Upload, CheckCircle2, ArrowRight, Award } from "lucide-react"
import { useSession, signOut } from "@/lib/auth-client"
import { NotificationBell } from "@/components/notification-bell"
import { getUserRole } from "@/actions/user"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const studentLinks = [
  { href: "/student", label: "Dashboard" },
  { href: "/student/history", label: "History" },
]

const staffLinks = [
  { href: "/staff", label: "Inbox" },
  { href: "/staff/analytics", label: "Analytics" },
]

export function Navbar({ initialRole }: { initialRole: string | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(initialRole)

  useEffect(() => {
    if (session) {
      getUserRole().then(setUserRole)
    }
  }, [session])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    const timer = setTimeout(() => setMounted(true), 0)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', checkMobile)
    }
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (!isMobile) {
      const timer = setTimeout(() => setMobileMenuOpen(false), 0)
      return () => clearTimeout(timer)
    }
  }, [isMobile])

  useEffect(() => {
    if (session) {
      const hasSeenWelcome = localStorage.getItem('refundme-welcome-seen')
      if (!hasSeenWelcome) {
        const timer = setTimeout(() => setAboutOpen(true), 0)
        localStorage.setItem('refundme-welcome-seen', 'true')
        return () => clearTimeout(timer)
      }
    }
  }, [session])

  const handleSignOut = async () => {
    // Clear cookies manually first
    document.cookie = "better-auth.session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    document.cookie = "__Secure-better-auth.session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure;"
    
    try {
      await signOut()
    } catch (error) {
      // Ignore errors during signout - the session might already be invalid
      console.error("Sign out error:", error)
    }
    
    // Always redirect to login after signout attempt
    window.location.href = "/login"
  }

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          width: '100%',
          backgroundColor: 'white',
          borderBottom: '1px solid #e4e4e7',
          height: '3.5rem',
          overflowX: 'clip',
          overflowY: 'visible'
        }}
      >

        <div
          style={{
            maxWidth: '1152px',
            margin: '0 auto',
            padding: '0 1.5rem',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            zIndex: 10
          }}
        >
          {/* Diagonal Background Accent - Pinned to the centered content */}
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: '-100vw', 
              right: (mounted && isMobile) ? 'calc(100% - 220px)' : 'calc(100% - 200px)', 
              bottom: 0,
              backgroundColor: '#f4f4f5',
              clipPath: 'polygon(0 0, 100% 0, calc(100% - 20px) 100%, 0 100%)',
              zIndex: -1,
              transition: 'right 200ms ease'
            }} 
          />
          {/* Left: Logo + Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <Link
              href={userRole === 'STAFF' ? "/staff" : "/student"}
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: '#18181b',
                textDecoration: 'none',
                letterSpacing: '-0.025em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Image 
                src="/1337.png" 
                alt="Logo" 
                width={20}
                height={20}
                style={{ height: '1.25rem', width: 'auto' }} 
              />
              Refunds
            </Link>

            {/* Desktop Navigation Links - only show when role is loaded */}
            {userRole && (mounted ? !isMobile : true) && (
              <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {(userRole === 'STAFF' ? staffLinks : studentLinks)
                  .map((link) => {
                    const isBaseLink = link.href === '/staff' || link.href === '/student'
                    const isActive = isBaseLink 
                      ? pathname === link.href 
                      : pathname === link.href || pathname?.startsWith(link.href + '/')
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        style={{
                          padding: '0.375rem 0.75rem',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          color: isActive ? '#18181b' : '#71717a',
                          textDecoration: 'none',
                          borderRadius: '0.375rem',
                          transition: 'color 150ms'
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) e.currentTarget.style.color = '#18181b'
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) e.currentTarget.style.color = '#71717a'
                        }}
                      >
                        {link.label}
                      </Link>
                    )
                  })}
              </nav>
            )}
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Desktop: Full New Request Button - for all users (after role is loaded) */}
            {userRole && (mounted ? !isMobile : true) && (
              <Link
                href="/student/create"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  backgroundColor: '#18181b',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  height: '2.5rem',
                  padding: '0 0.875rem',
                  borderRadius: '0.375rem',
                  textDecoration: 'none',
                  transition: 'background-color 150ms',
                  boxSizing: 'border-box'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#27272a'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#18181b'
                }}
              >
                <PlusCircle style={{ width: '1rem', height: '1rem' }} />
                New Request
              </Link>
            )}

            {/* Mobile: Icon-only New Request Button - for all users (after role is loaded) */}
            {mounted && isMobile && userRole && (
              <Link
                href="/student/create"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                   backgroundColor: '#18181b',
                   color: 'white',
                   width: '2.5rem',
                   height: '2.5rem',
                   borderRadius: '0.375rem',
                   textDecoration: 'none',
                   boxSizing: 'border-box'
                }}
              >
                <PlusCircle style={{ width: '1.125rem', height: '1.125rem' }} />
              </Link>
            )}

            {/* Mobile: Notification Bell */}
            {mounted && isMobile && session && (
              <NotificationBell />
            )}

            {/* Desktop: Notifications + User Menu */}
            {mounted && !isMobile && session && (
              <>
                <NotificationBell />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        borderRadius: '50%',
                        outline: 'none'
                      }}
                    >
                      <Avatar
                        style={{
                          width: '2.5rem',
                          height: '2.5rem',
                          border: '1px solid #e4e4e7',
                          overflow: 'hidden',
                          borderRadius: '0.375rem'
                        }}
                      >
                        <AvatarImage
                          src={session.user.image || ""}
                          alt={session.user.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <AvatarFallback
                          style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#f4f4f5',
                            color: '#18181b',
                            fontSize: '0.875rem',
                            fontWeight: 500
                          }}
                        >
                          {session.user.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-56"
                    align="end"
                    sideOffset={16}
                    style={{
                      backgroundColor: 'white',
                      border: '1px solid #e4e4e7',
                      borderRadius: '0.75rem',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                      padding: '0.5rem',
                      zIndex: 100
                    }}
                  >
                    <DropdownMenuLabel style={{ padding: '0.75rem 0.5rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#18181b', margin: 0 }}>{session.user.name}</p>
                        <p style={{ fontSize: '0.75rem', color: '#71717a', margin: 0, fontWeight: 400 }}>{session.user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator style={{ backgroundColor: '#f4f4f5', margin: '0.25rem 0' }} />

                    <DropdownMenuItem
                      onClick={() => setAboutOpen(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.625rem',
                        padding: '0.625rem 0.5rem',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        color: '#3f3f46',
                        fontSize: '0.875rem',
                        transition: 'all 150ms'
                      }}
                      className="group hover:bg-zinc-50 hover:text-zinc-900"
                    >
                      <Info style={{ width: '1rem', height: '1rem', color: '#a1a1aa' }} />
                      <span>About</span>
                    </DropdownMenuItem>

                    {userRole === 'STAFF' && (
                      <DropdownMenuItem
                        onClick={() => router.push('/staff/certificates')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.625rem',
                          padding: '0.625rem 0.5rem',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          color: '#3f3f46',
                          fontSize: '0.875rem',
                          transition: 'all 150ms'
                        }}
                        className="group hover:bg-zinc-50 hover:text-zinc-900"
                      >
                        <Award style={{ width: '1rem', height: '1rem', color: '#a1a1aa' }} />
                        <span>Manage Certs</span>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator style={{ backgroundColor: '#f4f4f5', margin: '0.375rem 0' }} />

                    <DropdownMenuItem
                      onClick={handleSignOut}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.625rem',
                        padding: '0.625rem 0.5rem',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        color: '#ef4444',
                        fontSize: '0.875rem',
                        transition: 'all 150ms'
                      }}
                      className="hover:bg-red-50"
                    >
                      <LogOut style={{ width: '1rem', height: '1rem' }} />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            {/* Mobile: Hamburger Menu Button */}
            {mounted && isMobile && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '2.5rem',
                  height: '2.5rem',
                  backgroundColor: 'transparent',
                  border: '1px solid #e4e4e7',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  color: '#71717a'
                }}
              >
                {mobileMenuOpen ? (
                  <X style={{ width: '1.25rem', height: '1.25rem' }} />
                ) : (
                  <Menu style={{ width: '1.25rem', height: '1.25rem' }} />
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mounted && isMobile && mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: '3.5rem',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            zIndex: 40
          }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Panel */}
      {mounted && isMobile && mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: '3.5rem',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            borderBottom: '1px solid #e4e4e7',
            zIndex: 45,
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}
        >
          <nav style={{ padding: '0.5rem' }}>
            {userRole && (userRole === 'STAFF' ? staffLinks : studentLinks)
              .map((link) => {
                const isBaseLink = link.href === '/staff' || link.href === '/student'
                const isActive = isBaseLink 
                  ? pathname === link.href 
                  : pathname === link.href || pathname?.startsWith(link.href + '/')
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'block',
                      padding: '0.75rem 1rem',
                      fontSize: '0.9375rem',
                      fontWeight: 500,
                      color: isActive ? '#18181b' : '#71717a',
                      textDecoration: 'none',
                      borderRadius: '0.375rem',
                      backgroundColor: isActive ? '#f4f4f5' : 'transparent'
                    }}
                  >
                    {link.label}
                  </Link>
                )
              })}
          </nav>

          {/* Mobile User Info */}
          {session && (
            <div
              style={{
                padding: '1rem',
                borderTop: '1px solid #f4f4f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem'
              }}
            >
              {/* Left: Avatar + Name/Email */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                <Avatar
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    border: '1px solid #e4e4e7',
                    overflow: 'hidden',
                    borderRadius: '0.375rem',
                    flexShrink: 0
                  }}
                >
                  <AvatarImage
                    src={session.user.image || ""}
                    alt={session.user.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <AvatarFallback
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f4f4f5',
                      color: '#18181b',
                      fontSize: '0.875rem',
                      fontWeight: 500
                    }}
                  >
                    {session.user.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#18181b', lineHeight: 1.2, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.user.name}</p>
                  <p style={{ fontSize: '0.75rem', color: '#71717a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.user.email}</p>
                </div>
              </div>

              {/* Right: Icon Buttons (Certs + About + Logout) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                {userRole === 'STAFF' && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      router.push('/staff/certificates')
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '2.5rem',
                      height: '2.5rem',
                      backgroundColor: 'white',
                      border: '1px solid #e4e4e7',
                      borderRadius: '0.375rem',
                      color: '#71717a',
                      cursor: 'pointer'
                    }}
                    title="Manage Certificates"
                  >
                    <Award style={{ width: '1.125rem', height: '1.125rem' }} />
                  </button>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    setAboutOpen(true)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '2.5rem',
                    height: '2.5rem',
                    backgroundColor: 'white',
                    border: '1px solid #e4e4e7',
                    borderRadius: '0.375rem',
                    color: '#71717a',
                    cursor: 'pointer'
                  }}
                >
                  <Info style={{ width: '1.125rem', height: '1.125rem' }} />
                </button>
                <button
                  onClick={handleSignOut}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '2.5rem',
                    height: '2.5rem',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fee2e2',
                    borderRadius: '0.375rem',
                    color: '#dc2626',
                    cursor: 'pointer'
                  }}
                >
                  <LogOut style={{ width: '1.125rem', height: '1.125rem' }} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* About Dialog */}
      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent
          showCloseButton={false}
          style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            padding: 0,
            maxWidth: '24rem',
            width: '100%',
            overflow: 'hidden',
            border: '1px solid #e4e4e7',
            boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '1.5rem 1.5rem 0',
            }}
          >
            <DialogHeader>
              <DialogTitle
                style={{
                  color: '#18181b',
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  letterSpacing: '-0.025em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Image 
                  src="/1337.png" 
                  alt="Logo" 
                  width={24}
                  height={24} 
                  style={{ height: '1.5rem', width: 'auto' }} 
                />
                Refunds
              </DialogTitle>
            </DialogHeader>
          </div>

          {/* Content */}
          <div style={{ padding: '1.25rem 1.5rem' }}>
            <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.875rem' }}>
              How it works
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {/* Step 1 */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '2rem',
                      height: '2rem',
                      backgroundColor: '#f4f4f5',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <FileText style={{ width: '0.875rem', height: '0.875rem', color: '#52525b' }} strokeWidth={1.5} />
                  </div>
                  <div style={{ width: '1px', height: '1.5rem', backgroundColor: '#e4e4e7' }} />
                </div>
                <div style={{ paddingBottom: '1rem', transform: 'translateY(-1px)' }}>
                  <p style={{ fontWeight: 500, color: '#18181b', fontSize: '0.8125rem', margin: 0 }}>
                    Submit an estimate
                  </p>
                  <p style={{ color: '#71717a', fontSize: '0.75rem', margin: 0, marginTop: '0.125rem' }}>
                    Create a request with expense details
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '2rem',
                      height: '2rem',
                      backgroundColor: '#f4f4f5',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Upload style={{ width: '0.875rem', height: '0.875rem', color: '#52525b' }} strokeWidth={1.5} />
                  </div>
                  <div style={{ width: '1px', height: '1.5rem', backgroundColor: '#e4e4e7' }} />
                </div>
                <div style={{ paddingBottom: '1rem', transform: 'translateY(-1px)' }}>
                  <p style={{ fontWeight: 500, color: '#18181b', fontSize: '0.8125rem', margin: 0 }}>
                    Upload your receipt
                  </p>
                  <p style={{ color: '#71717a', fontSize: '0.75rem', margin: 0, marginTop: '0.125rem' }}>
                    Attach proof after staff approval
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '2rem',
                      height: '2rem',
                      backgroundColor: '#18181b',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <CheckCircle2 style={{ width: '0.875rem', height: '0.875rem', color: 'white' }} strokeWidth={1.5} />
                  </div>
                </div>
                <div style={{ transform: 'translateY(-1px)' }}>
                  <p style={{ fontWeight: 500, color: '#18181b', fontSize: '0.8125rem', margin: 0 }}>
                    Get reimbursed
                  </p>
                  <p style={{ color: '#71717a', fontSize: '0.75rem', margin: 0, marginTop: '0.125rem' }}>
                    Receive your refund after verification
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #f4f4f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <p style={{ fontSize: '0.6875rem', color: '#a1a1aa', margin: 0 }}>
              v1.0
            </p>
            <button
              onClick={() => setAboutOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 0.75rem',
                backgroundColor: '#18181b',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.8125rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background-color 150ms'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#27272a'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#18181b'}
            >
              Get started
              <ArrowRight style={{ width: '0.75rem', height: '0.75rem' }} />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
