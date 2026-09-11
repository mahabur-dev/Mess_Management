import { AppHeader } from '@/components/app-header'
import type { ReactNode } from 'react'

export function TopScreen({
  title,
  subtitle,
  backHref,
  leading,
  trailing,
}: {
  title: string
  subtitle?: string
  backHref?: string
  leading?: ReactNode
  trailing?: ReactNode
}) {
  return <AppHeader title={title} subtitle={subtitle} backHref={backHref} leading={leading} trailing={trailing} />
}
