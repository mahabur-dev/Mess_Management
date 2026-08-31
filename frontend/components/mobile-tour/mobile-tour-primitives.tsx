import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Bell, CalendarClock, Check, ChevronDown, ChevronLeft, House, LayoutGrid, ReceiptText } from 'lucide-react'

const currentBottomTabs = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'expenses', label: 'Expenses', icon: ReceiptText },
  { id: 'meal-pattern', label: 'Meal Pattern', icon: CalendarClock },
  { id: 'more', label: 'More', icon: LayoutGrid },
]

export function CurrentAppStatusBar() {
  return <div className="flex h-[4.4%] items-center justify-between bg-[#008986] px-[4%] text-[10px] font-semibold text-white"><span>10:15</span><span className="tracking-[.12em]">▰ ◆ ◢ ▯20%</span></div>
}

export function CurrentAppHeader({
  title,
  subtitle,
  back = true,
  trailing,
}: {
  title: string
  subtitle?: string
  back?: boolean
  trailing?: ReactNode
}) {
  return (
    <header className="flex min-h-[9.2%] items-center bg-gradient-to-br from-[#007f7c] to-[#17aaa5] px-[4%] pb-[2%] text-white">
      <span className="grid size-9 shrink-0 place-items-center rounded-full border border-white/15 bg-white/10">{back ? <ChevronLeft className="w-4" /> : <span className="text-[9px] font-semibold">MR</span>}</span>
      <div className="min-w-0 flex-1 text-center"><h1 className="truncate text-[14px] font-semibold">{title}</h1>{subtitle ? <p className="mt-0.5 truncate text-[8px] font-medium text-white/80">{subtitle}</p> : null}</div>
      {trailing ?? <span className="grid size-9 shrink-0 place-items-center rounded-full border border-white/15 bg-white/10"><Bell className="w-4" /></span>}
    </header>
  )
}

export function CurrentAppBottomNav({ active }: { active: string }) {
  return (
    <nav className="absolute inset-x-0 bottom-0 z-20 grid h-[8.3%] grid-cols-4 border-t border-[#dfe9ea] bg-white px-1 shadow-[0_-8px_25px_rgba(18,55,72,.07)]">
      {currentBottomTabs.map(({ id, label, icon: Icon }) => <div key={id} className={`flex flex-col items-center justify-center gap-0.5 text-[7px] font-bold ${active === id ? 'text-[#008d8c]' : 'text-[#708388]'}`}><Icon className="w-4" strokeWidth={2.4} /><span>{label}</span></div>)}
    </nav>
  )
}

export function CurrentAppScreen({
  title,
  subtitle,
  activeTab,
  trailing,
  children,
}: {
  title: string
  subtitle?: string
  activeTab?: string
  trailing?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="absolute inset-0 bg-[#f7fbfb] text-[#123748]">
      <CurrentAppStatusBar />
      <CurrentAppHeader title={title} subtitle={subtitle} trailing={trailing} />
      <main className={`absolute inset-x-0 top-[13.6%] overflow-hidden px-[4%] py-[4%] ${activeTab ? 'bottom-[8.3%]' : 'bottom-0'}`}>{children}</main>
      {activeTab ? <CurrentAppBottomNav active={activeTab} /> : null}
    </div>
  )
}

export function TourScrollContent({
  scrollY = 0,
  children,
  className = '',
}: {
  scrollY?: number
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] will-change-transform ${className}`}
      style={{ transform: `translateY(-${Math.max(0, scrollY)}px)` }}
    >
      {children}
    </div>
  )
}

export function TourSectionCard({
  title,
  caption,
  action,
  children,
  className = '',
  variant = 'default',
}: {
  title?: string
  caption?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  variant?: 'default' | 'flat' | 'tint' | 'flush'
}) {
  const surfaces = {
    default: 'rounded-[20px] border border-[#dfe9ea] bg-white p-4 shadow-[0_10px_24px_rgba(0,119,122,.08)]',
    flat: 'rounded-[16px] border border-[#edf2f3] bg-white p-4 shadow-none',
    tint: 'rounded-[20px] border border-[#cfeeed] bg-gradient-to-br from-white to-[#edfafa] p-4 shadow-[0_10px_24px_rgba(0,119,122,.08)]',
    flush: 'border-y border-[#dfe9ea] bg-white py-3 shadow-none',
  } as const

  return (
    <section className={`${surfaces[variant]} ${className}`}>
      {title || caption || action ? (
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            {title ? <h2 className="text-[11px] font-bold tracking-[-.01em] text-[#123748]">{title}</h2> : null}
            {caption ? <p className="mt-1 truncate text-[7px] font-semibold leading-3 text-[#65838b]">{caption}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export function TourField({
  label,
  value,
  placeholder,
  icon: Icon,
  active = false,
  select = false,
  hint,
  multiline = false,
}: {
  label: string
  value?: string
  placeholder?: string
  icon?: LucideIcon
  active?: boolean
  select?: boolean
  hint?: string
  multiline?: boolean
}) {
  return (
    <div
      className={`relative rounded-[16px] border bg-white px-3.5 py-3 transition-all duration-300 ${
        active
          ? 'border-[#008d8c] bg-white shadow-[0_0_0_3px_rgba(0,141,140,.13)]'
          : 'border-[#dce8ea]'
      } ${multiline ? 'min-h-[72px]' : 'min-h-[50px]'}`}
    >
      <div className="flex items-center gap-2">
        {Icon ? (
          <span className="grid size-8 shrink-0 place-items-center rounded-[12px] bg-[#edfafa] text-[#008d8c]">
            <Icon className="w-3.5" />
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-[7px] font-bold text-[#658087]">{label}</p>
          <p className={`mt-1 truncate text-[9px] font-semibold ${value ? 'text-[#123748]' : 'text-[#9aabb0]'}`}>
            {value || placeholder || 'Enter value'}
            {active && value ? <span className="ml-0.5 inline-block h-[10px] w-px animate-pulse bg-[#008d8c] align-[-1px]" /> : null}
          </p>
          {hint ? <p className="mt-1 text-[6px] font-semibold text-[#7b9095]">{hint}</p> : null}
        </div>
        {select ? <ChevronDown className="w-3.5 shrink-0 text-[#698087]" /> : null}
      </div>
    </div>
  )
}

export function TourChoiceGrid({
  options,
  selected,
  active,
}: {
  options: Array<{ value: string; label: string; caption?: string; icon: LucideIcon }>
  selected: string
  active?: boolean
}) {
  return (
    <div className={`grid grid-cols-2 gap-2 rounded-xl transition-all ${active ? 'ring-3 ring-[#008d8c]/12' : ''}`}>
      {options.map(({ value, label, caption, icon: Icon }) => {
        const checked = value === selected
        return (
          <div
            key={value}
            className={`relative min-h-[78px] overflow-hidden rounded-[16px] border bg-gradient-to-b from-white to-[#f8fdfd] p-2.5 shadow-[0_8px_20px_rgba(18,55,72,.045)] ${
              checked ? 'border-[#008d8c] ring-3 ring-[#008d8c]/8' : 'border-[#cfe5e8]'
            }`}
          >
            {checked ? <span className="absolute right-2 top-2 grid size-4 place-items-center rounded-full bg-[#008d8c] text-white"><Check className="w-2.5" strokeWidth={3} /></span> : null}
            <span className="grid size-10 place-items-center rounded-[14px] bg-[#e7f7f6] text-[#008d8c]"><Icon className="w-4" /></span>
            <p className="mt-1.5 text-[8px] font-semibold text-[#123748]">{label}</p>
            {caption ? <p className="mt-0.5 text-[6px] font-semibold text-[#71858a]">{caption}</p> : null}
          </div>
        )
      })}
    </div>
  )
}

export function TourPrimaryAction({
  children,
  active = false,
  tone = 'brand',
}: {
  children: ReactNode
  active?: boolean
  tone?: 'brand' | 'success'
}) {
  return (
    <div
      className={`flex min-h-[50px] items-center justify-center gap-2 rounded-[16px] px-4 text-[9px] font-bold text-white shadow-[0_10px_22px_rgba(0,119,122,.18)] transition-all ${
        tone === 'success' ? 'bg-emerald-600' : 'bg-[#008d8c]'
      } ${active ? 'scale-[1.02] ring-4 ring-[#008d8c]/15' : ''}`}
    >
      {children}
    </div>
  )
}

export function TourStatusBanner({
  title,
  detail,
}: {
  title: string
  detail: string
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-800 shadow-sm">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-600 text-white"><Check className="w-3.5" strokeWidth={3} /></span>
      <div><p className="text-[9px] font-semibold">{title}</p><p className="mt-0.5 text-[7px] font-semibold leading-3 text-emerald-700">{detail}</p></div>
    </div>
  )
}
