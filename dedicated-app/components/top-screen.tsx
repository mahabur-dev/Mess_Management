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
    <header className="top-hero px-4 pb-6 pt-3">
      <div className="grid grid-cols-[40px_1fr_40px] items-center gap-2">
        {backHref ? (
          <Link href={backHref} className="grid h-10 w-10 place-items-center rounded-full bg-white/12 text-white">
            <ChevronLeft size={19} />
          </Link>
        ) : (
          <div className="h-10 w-10" />
        )}
        <div className="min-w-0 text-center">
          <div className="truncate text-[16px] font-extrabold leading-tight">{title}</div>
          {subtitle ? <div className="mt-1 truncate text-[11px] leading-tight text-white/80">{subtitle}</div> : null}
        </div>
        <button className="grid h-10 w-10 place-items-center rounded-full bg-white/12 text-white">
          <Bell size={18} />
        </button>
      </div>
    </header>
  )
}
