import type { LucideIcon } from 'lucide-react'
import {
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Coffee,
  Moon,
  ReceiptText,
  Settings2,
  ShieldCheck,
  Sun,
  UtensilsCrossed,
  WalletCards,
} from 'lucide-react'
import {
  CurrentAppScreen,
  TourScrollContent,
  TourSectionCard,
} from '@/components/mobile-tour/mobile-tour-primitives'

const mealStats = [
  { label: 'Breakfast', value: '0.5', icon: Coffee, tone: 'aqua' },
  { label: 'Lunch', value: '1', icon: Sun, tone: 'teal' },
  { label: 'Dinner', value: '1', icon: Moon, tone: 'deep' },
  { label: 'Total', value: '2.5', icon: UtensilsCrossed, tone: 'teal' },
] as const

const billStats = [
  { label: 'Total Deposit', value: '৳ 7,570', icon: CircleDollarSign },
  { label: 'Total Cost', value: '৳ 2,135.71', icon: ReceiptText },
  { label: 'Total Due', value: '৳ 0', icon: WalletCards },
  { label: 'Total Remaining', value: '৳ 6,927.29', icon: ShieldCheck },
] as const

const memberBills = [
  { initials: 'MR', name: 'Mahabur Rahman', email: 'mahabur@example.com', status: 'Paid' },
  { initials: 'RA', name: 'Rahim Ahmed', email: 'rahim@example.com', status: 'Paid' },
  { initials: 'SH', name: 'Sabbir Hossain', email: 'sabbir@example.com', status: 'Due' },
  { initials: 'NH', name: 'Nayeem Hasan', email: 'nayeem@example.com', status: 'Paid' },
] as const

const mealTones = {
  aqua: { background: '#edfafa', foreground: '#4bbfc0' },
  teal: { background: '#dff4f3', foreground: '#008d8c' },
  deep: { background: '#edfafa', foreground: '#00777a' },
} as const

function OverviewCard({ label, value, icon: Icon, tone = 'teal' }: { label: string; value: string; icon: LucideIcon; tone?: keyof typeof mealTones }) {
  const color = mealTones[tone]
  return (
    <article className="min-h-[76px] rounded-[16px] border border-[#cfeeed] bg-white p-3.5 shadow-[0_8px_20px_rgba(0,119,122,.06)]">
      <div className="flex items-start gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-[12px]" style={{ backgroundColor: color.background, color: color.foreground }}><Icon className="w-4" /></span>
        <div className="min-w-0"><p className="min-h-[20px] text-[7px] font-semibold leading-[1.2] text-[#69838a]">{label}</p><p className="mt-1 truncate text-[10px] font-semibold text-[#1d3a42]">{value}</p></div>
      </div>
    </article>
  )
}

function MonthSelector() {
  return (
    <div className="mx-auto grid min-h-[52px] w-[86%] grid-cols-[42px_1fr_42px] items-center overflow-hidden rounded-full border border-[#dfe8ea] bg-white shadow-[0_12px_24px_rgba(18,55,72,.12)]">
      <span className="text-center text-[15px] font-semibold text-[#008d8c]">‹</span>
      <span className="flex items-center justify-center gap-1.5 text-[9px] font-bold text-[#123748]"><CalendarDays className="w-4 text-[#008d8c]" /> August 2026⌄</span>
      <span className="text-center text-[15px] font-semibold text-[#008d8c]">›</span>
    </div>
  )
}

function AssistantSummary({ title, value, unit }: { title: string; value?: string; unit?: string }) {
  return (
    <section className="relative min-h-[96px] overflow-hidden rounded-[18px] border border-violet-200/70 bg-[radial-gradient(circle_at_94%_7%,rgba(197,188,255,.5),transparent_26%),radial-gradient(circle_at_7%_100%,rgba(223,244,243,.72),transparent_31%),linear-gradient(135deg,#fff_0%,#faf9ff_52%,#f1efff_100%)] p-4 shadow-[0_10px_28px_rgba(73,61,145,.12)]">
      <span className="absolute -right-8 -top-9 size-28 rounded-full border-[18px] border-white/30 bg-violet-200/20" />
      <div className="relative flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-[14px] border border-[#4f70a5]/15 bg-gradient-to-br from-[#f1efff] to-[#dff4f3] text-[#4f70a5] shadow-[0_7px_16px_rgba(58,82,125,.11)]"><CalendarDays className="w-5" /></span>
        <div className="min-w-0 flex-1"><p className="text-[8px] font-bold text-[#123748]">{title}</p>{value ? <p className="mt-1 text-[14px] font-black text-[#123748]">{value} <small className="text-[7px] font-bold text-[#008d8c]">{unit}</small></p> : <p className="mt-1 truncate text-[7px] font-semibold text-[#65838b]">Meals, deposits, expenses and utility</p>}</div>
        <span className="relative rounded-[12px] border border-violet-200/70 bg-white/80 px-3 py-2 text-[7px] font-bold text-violet-700">Details</span>
      </div>
    </section>
  )
}

export function CurrentMealsOverviewScreen({ scrollY = 0 }: { scrollY?: number }) {
  return (
    <CurrentAppScreen title="Meal Management" subtitle="Together We Dine">
      <TourScrollContent scrollY={scrollY} className="space-y-4 pb-6">
        <TourSectionCard>
          <div className="mb-3 flex items-center justify-between"><p className="text-[7px] font-bold uppercase tracking-[.16em] text-[#65838b]">Today Overview</p><span className="inline-flex min-h-7 items-center rounded-full bg-[#edfafa] px-3 text-[6px] font-semibold uppercase text-[#65838b]">Closed</span></div>
          <div className="grid grid-cols-2 gap-3">{mealStats.map((stat) => <OverviewCard key={stat.label} {...stat} />)}</div>
          <div className="mt-4"><AssistantSummary title="Total Meals This Month" value="67.5" unit="meals" /></div>
        </TourSectionCard>

        <TourSectionCard>
          <div className="flex items-start justify-between gap-3"><div><h2 className="text-[10px] font-bold text-[#123748]">My Meal Status</h2><p className="mt-1 flex items-center gap-1 text-[7px] font-bold text-[#008d8c]"><Clock3 className="w-3" /> 10:00 PM - 3:00 PM</p></div><span className="inline-flex min-h-7 items-center rounded-full bg-[#fff0f0] px-3 text-[6px] font-semibold uppercase text-[#ee1f2f]">Closed</span></div>
          <div className="mt-3 rounded-[16px] border border-[#cfeeed] bg-[#fbffff] p-4"><div className="flex items-center justify-between gap-2"><div><p className="text-[8px] font-bold text-[#123748]">Breakfast, Lunch, Dinner</p><p className="mt-1 text-[7px] text-[#65838b]">Your meal is added</p></div><span className="rounded-full bg-[#dff4f3] px-3 py-1.5 text-[6px] font-semibold uppercase text-[#008d8c]">Added</span></div></div>
          <div className="mt-4 flex min-h-[50px] items-center justify-center gap-2 rounded-[16px] bg-gradient-to-br from-[#008d8c] to-[#00777a] text-[9px] font-bold text-white shadow-[0_14px_28px_rgba(0,119,122,.18)]"><UtensilsCrossed className="w-4" /> Add My Meal</div>
        </TourSectionCard>

        <div className="flex min-h-[78px] items-center gap-3 border-y border-[#dfe9ea] bg-white py-3"><span className="grid size-12 shrink-0 place-items-center rounded-[16px] bg-[#fff8e9] text-[#e29a16]"><Settings2 className="w-5" /></span><div className="min-w-0 flex-1"><p className="text-[9px] font-bold">Manager Controls</p><p className="mt-1 text-[7px] font-semibold text-[#65838b]">Manage meal time, locks and members meals</p></div><ChevronRight className="w-4 text-[#789096]" /></div>
      </TourScrollContent>
    </CurrentAppScreen>
  )
}

function MemberBillRow({ initials, name, email, status }: (typeof memberBills)[number]) {
  const paid = status === 'Paid'
  return (
    <div className="flex min-h-[76px] items-center gap-3 border-b border-[#e3ebed] bg-white px-0.5 py-3 last:border-0">
      <span className="grid size-[46px] shrink-0 place-items-center rounded-full border border-[#008d8c]/15 bg-[#edfafa] text-[8px] font-black text-[#00777a]">{initials}</span>
      <div className="min-w-0 flex-1"><p className="truncate text-[8px] font-bold text-[#123748]">{name}</p><p className="mt-1 truncate text-[6px] font-semibold text-[#65838b]">{email}</p></div>
      <span className={`inline-flex min-h-7 min-w-14 items-center justify-center rounded-full px-2 text-[6px] font-black ${paid ? 'bg-[#eaf7ee] text-[#147a37]' : 'bg-[#fff0f0] text-[#c5333d]'}`}>{status}</span>
    </div>
  )
}

export function CurrentMonthlyBillOverviewScreen({ scrollY = 0 }: { scrollY?: number }) {
  return (
    <CurrentAppScreen title="Monthly Bill Management" subtitle="August 2026" activeTab="monthly-bill">
      <TourScrollContent scrollY={scrollY} className="space-y-4 pb-6">
        <MonthSelector />
        <section><p className="mb-2.5 text-[7px] font-bold uppercase tracking-[.16em] text-[#65838b]">My Overview</p><div className="grid grid-cols-2 gap-3">{billStats.map((stat) => <OverviewCard key={stat.label} {...stat} />)}</div></section>
        <AssistantSummary title="My Bill Summary" />
        <section className="bg-white"><div className="flex items-end justify-between gap-3 px-0.5 pb-3"><div><p className="text-[7px] font-black tracking-[.11em] text-[#00777a]">MEMBER BILLS</p><h2 className="mt-1 text-[11px] font-bold tracking-[-.02em]">Member overview</h2></div><span className="grid size-[30px] place-items-center rounded-[10px] border border-[#dfe9ea] bg-[#f8fbfb] text-[7px] font-black text-[#65838b]">7</span></div><div className="border-t border-[#dfe9ea]">{memberBills.map((member) => <MemberBillRow key={member.name} {...member} />)}</div></section>
      </TourScrollContent>
    </CurrentAppScreen>
  )
}
