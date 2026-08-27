import { AppHeader } from '@/components/app-header'
import type { ReactNode } from 'react'

export function TopScreen({
  title,
  subtitle,
  backHref,
  trailing,
}: {
  title: string
  subtitle?: string
  backHref?: string
  trailing?: ReactNode
}) {
  return <AppHeader title={title} subtitle={subtitle} backHref={backHref} trailing={trailing} />
}
