'use client'

import { AuthProvider, useAuth } from '@/app/context/auth-context'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { ReactNode } from 'react'

function DashboardLayoutContent({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-border border-t-accent animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Redirect will be handled by middleware
    return null
  }

  return (
    <div className="dashboard-theme flex h-screen">
      <DashboardSidebar />
      <main className="dashboard-main flex-1 overflow-auto md:ml-[248px]">
        {children}
      </main>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </AuthProvider>
  )
}
