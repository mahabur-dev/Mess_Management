import { ChevronLeft, Bell } from 'lucide-react'
import Link from 'next/link'

export function TopScreen({
  title,
  subtitle,
  backHref,
}: {
  title: string
  subtitle?: string
  backHref?: string
}) {
  return (
    <header className="top-hero px-4 pb-7 pt-4">
      <div className="flex items-center justify-between gap-3">
        {backHref ? (
          <Link href={backHref} className="grid h-10 w-10 place-items-center rounded-full bg-white/12 text-white">
            <ChevronLeft size={19} />
          </Link>
        ) : (
          <div className="h-10 w-10" />
        )}
        <div className="flex min-w-0 flex-1 flex-col items-center text-center">
          <div className="truncate text-sm font-bold leading-none">{title}</div>
          {subtitle ? <div className="mt-1 truncate text-[11px] leading-none text-white/80">{subtitle}</div> : null}
        </div>
        <button className="grid h-10 w-10 place-items-center rounded-full bg-white/12 text-white">
          <Bell size={18} />
        </button>
      </div>
    </header>
  )
}
