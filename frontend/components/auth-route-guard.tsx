'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

import { useAuth } from '@/app/context/auth-context'
import { EnterpriseAsyncState } from '@/components/ui/enterprise-async-state'
import { useTranslations } from '@/lib/i18n'

/** Prevents authenticated sessions from returning to public-only auth screens. */
export function AuthRouteGuard({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const shared = useTranslations('shared')

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace('/dashboard')
  }, [isAuthenticated, isLoading, router])

  if (isLoading || isAuthenticated) {
    return (
      <main className="auth-page marketing-page grid min-h-screen place-items-center px-4">
        <EnterpriseAsyncState
          status="loading"
          title={shared('loadingWorkspace')}
          surface="plain"
          compact
        />
      </main>
    )
  }

  return children
}
