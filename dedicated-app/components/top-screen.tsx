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
    <header className="top-hero px-4 pb-5 pt-4">
      <div className="flex items-center justify-between">
        {backHref ? (
          <Link href={backHref} className="grid h-10 w-10 place-items-center rounded-full bg-white/12 text-white">
            <ChevronLeft size={19} />
          </Link>
        ) : (
          <div className="h-10 w-10" />
        )}
        <div className="text-center">
          <div className="text-sm font-bold">{title}</div>
          {subtitle ? <div className="mt-0.5 text-[11px] text-white/80">{subtitle}</div> : null}
        </div>
        <button className="grid h-10 w-10 place-items-center rounded-full bg-white/12 text-white">
          <Bell size={18} />
        </button>
      </div>
    </header>
  )
}
