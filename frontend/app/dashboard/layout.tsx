'use client'

import { useAuth } from '@/app/context/auth-context'
import { usePathname, useRouter } from 'next/navigation'
import { ReactNode, useEffect } from 'react'
import { SidebarProvider, useSidebar } from '@/app/context/sidebar-context'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { PushNotificationPermissionModal } from '@/components/push-notification-permission-modal'


function DashboardLayoutContent({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const { collapsed } = useSidebar()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])



  if (isLoading) {
    return (
      <div className="dashboard-theme flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-border border-t-primary animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const contentMargin = collapsed
    ? 'lg:ml-[var(--dashboard-sidebar-collapsed-width)]'
    : 'lg:ml-[var(--dashboard-sidebar-width)]'

  return (
    <div className="dashboard-theme flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      {/* Content - full width on tablet, margin adjusts on large screens when sidebar is fixed */}
      <main className={`dashboard-scroll-viewport min-w-0 flex-1 overflow-y-auto overflow-x-hidden transition-[margin-left] duration-300 ${contentMargin}`}>
        <div key={pathname} className="dashboard-main dashboard-route-frame min-h-screen p-0">
          {children}
        </div>
      </main>
      <PushNotificationPermissionModal />
    </div>
  )
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarProvider>
  )
}
