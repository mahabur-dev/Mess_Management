'use client'

import { useAuth } from '@/app/context/auth-context'
import { useRouter } from 'next/navigation'
import { ReactNode, useEffect } from 'react'
import { SidebarProvider, useSidebar } from '@/app/context/sidebar-context'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { PushNotificationPermissionModal } from '@/components/push-notification-permission-modal'


function DashboardLayoutContent({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const { collapsed } = useSidebar()
  const router = useRouter()

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
          <p className="text-sm font-bold text-[#6b7a99]">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const contentMargin = collapsed ? 'lg:ml-[88px]' : 'lg:ml-[296px]'

  return (
    <div className="dashboard-theme flex h-screen bg-background">
      <DashboardSidebar />
      {/* Content - full width on tablet, margin adjusts on large screens when sidebar is fixed */}
      <main className={`flex-1 overflow-auto transition-all duration-300 ${contentMargin}`}>
        <div className="dashboard-main min-h-screen p-0">
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
