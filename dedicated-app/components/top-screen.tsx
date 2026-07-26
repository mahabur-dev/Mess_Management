import { AppHeader } from '@/components/app-header'

export function TopScreen({
  title,
  subtitle,
  backHref,
}: {
  title: string
  subtitle?: string
  backHref?: string
}) {
  return <AppHeader title={title} subtitle={subtitle} backHref={backHref} />
}
