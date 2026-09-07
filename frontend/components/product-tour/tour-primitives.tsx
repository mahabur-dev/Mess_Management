import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Bell,
  CalendarDays,
  ChevronDown,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Settings,
  UsersRound,
  UtensilsCrossed,
  WalletCards,
} from 'lucide-react'

const navigation: Array<{ id: string; label: string; icon: LucideIcon }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'members', label: 'Members', icon: UsersRound },
  { id: 'meals', label: 'Meal Sheet', icon: UtensilsCrossed },
  { id: 'finance', label: 'Bazar/Expenses', icon: WalletCards },
  { id: 'monthly-bills', label: 'Monthly Bills', icon: CalendarDays },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'notices', label: 'Notices', icon: Bell },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'mess-management', label: 'Mess Management', icon: Settings },
]

export function TourSidebar({ activeNav, showAccent = false }: { activeNav: string; showAccent?: boolean }) {
  return (
    <aside className="absolute inset-y-0 left-0 w-[20%] border-r border-[#dce9ec] bg-white px-[2.1%] py-[3%]">
      <div className="flex items-center gap-[7%] px-[4%] text-[clamp(7px,1.25vw,12px)] font-semibold text-[#007f76]">
        <span className="grid aspect-square w-[18%] place-items-center rounded-[30%] border-2 border-[#008d8c] text-[.8em]">M</span>
        <span>messzen</span>
      </div>
      <div className="mt-[12%] space-y-[1.5%]">
        {navigation.map(({ id, label, icon: Icon }) => {
          const selected = id === activeNav
          return (
            <div key={id} className={`flex items-center gap-[8%] rounded-[8px] px-[8%] py-[3.9%] text-[clamp(5px,.78vw,8px)] font-extrabold transition-all ${selected ? 'bg-[var(--brand)] text-white' : 'text-[#526477]'}`}>
              <Icon className="w-[14%]" strokeWidth={2.2} />
              <span>{label}</span>
            </div>
          )
        })}
      </div>
      <div className="absolute inset-x-[8%] bottom-[10%] rounded-[8px] bg-[#f2f6fb] px-[8%] py-[6%]">
        <div className="flex items-center gap-[8%]">
          <span className="grid aspect-square w-[24%] place-items-center rounded-full bg-[#ddf5f2] text-[clamp(5px,.8vw,8px)] font-semibold text-[#007f76]">MR</span>
          <div className="min-w-0"><p className="truncate text-[clamp(5px,.82vw,8px)] font-semibold">Mahabur Rahman</p><p className="text-[clamp(4px,.65vw,6px)] font-bold uppercase text-[#74869b]">Manager</p></div>
        </div>
      </div>
      <div className="absolute inset-x-[8%] bottom-[3%] flex items-center justify-center gap-1.5 rounded-[8px] border border-rose-200 bg-rose-50 py-[4%] text-[clamp(4px,.65vw,7px)] font-semibold text-rose-600"><LogOut className="w-[10%]" /> Logout</div>
      {showAccent ? <div className="absolute inset-x-0 top-0 h-1 bg-[#008d8c]" /> : null}
    </aside>
  )
}

export function TourHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return (
    <header className="flex h-[15%] items-center justify-between border-b border-[#dce9ec] bg-white px-[4%]">
      <div><p className="text-[clamp(8px,1.35vw,14px)] font-semibold">{title}</p><p className="mt-0.5 text-[clamp(4px,.7vw,7px)] font-semibold text-[#71839a]">{subtitle}</p></div>
      <div className="flex items-center gap-1.5">
        {action}
        <span className="hidden items-center gap-1 rounded-[6px] border border-[#dbe7ee] bg-white px-2 py-1.5 text-[clamp(4px,.65vw,7px)] font-extrabold shadow-sm sm:flex"><CalendarDays className="w-2.5 text-[#008d8c]" /> August 2026</span>
        <span className="grid aspect-square w-6 place-items-center rounded-[6px] border border-[#dbe7ee] bg-white"><Bell className="w-2.5" /></span>
      </div>
    </header>
  )
}

export function TourField({ label, value, placeholder, active, select, children }: { label: string; value?: string; placeholder?: string; active?: boolean; select?: boolean; children?: ReactNode }) {
  return (
    <div className={`rounded-[7px] border bg-white px-2.5 py-2 transition-all duration-300 ${active ? 'border-[var(--brand)] ring-2 ring-[var(--brand-ring)]' : 'border-[#dce7ea]'}`}>
      <p className="text-[clamp(4px,.62vw,7px)] font-bold text-[#668087]">{label}</p>
      <div className="mt-1 flex min-h-3 items-center justify-between gap-2">
        {children ?? <span className={`truncate text-[clamp(5px,.82vw,9px)] font-extrabold ${value ? 'text-[#183f48]' : 'text-[#9aabb0]'}`}>{value || placeholder || 'Select'}{active && value ? <span className="ml-px inline-block h-[1em] w-px animate-pulse bg-[#008d8c] align-[-2px]" /> : null}</span>}
        {select ? <ChevronDown className="w-2.5 shrink-0 text-[#668087]" /> : null}
      </div>
    </div>
  )
}

export function TourPanel({ title, aside, active, children, className = '' }: { title?: string; aside?: ReactNode; active?: boolean; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-[9px] border bg-white p-[4%] transition-all ${active ? 'border-[var(--brand)] ring-2 ring-[var(--brand-ring)]' : 'border-[#dce7ea]'} ${className}`}>
      {title || aside ? <div className="mb-[3%] flex items-center justify-between"><p className="text-[clamp(5px,.78vw,8px)] font-semibold">{title}</p>{aside}</div> : null}
      {children}
    </section>
  )
}

export function TourPrimaryButton({ children, active, tone = 'brand' }: { children: ReactNode; active?: boolean; tone?: 'brand' | 'ai' }) {
  const background = 'bg-[var(--brand)]'
  return <button type="button" className={`flex items-center gap-1.5 rounded-[7px] ${background} px-4 py-2 text-[clamp(5px,.75vw,8px)] font-semibold text-white transition-all ${active ? 'scale-105 ring-4 ring-[var(--brand-ring)]' : ''}`}>{children}</button>
}
