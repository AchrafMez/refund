import { Navbar } from "@/components/navbar"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardClientWrapper } from "@/components/dashboard-client-wrapper"

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  let userRole: string | null = null
  let sessionToken: string | null = null

  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })
    userRole = user?.role || null
    sessionToken = session.session.token
  }

  return (
    <div 
      style={{ 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fafafa'
      }}
    >
      <Navbar initialRole={userRole} />
      <main 
        style={{ 
          flex: 1,
          padding: '2rem 1.5rem'
        }}
      >
        <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
          <DashboardClientWrapper sessionToken={sessionToken}>
            {children}
          </DashboardClientWrapper>
        </div>
      </main>
    </div>
  )
}

