'use client'

import { useEffect, useState } from 'react'
import {
  Bell,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  LayoutDashboard,
  MousePointer2,
  ReceiptText,
  Sparkles,
  TrendingUp,
  UsersRound,
  UtensilsCrossed,
  WalletCards,
} from 'lucide-react'

const tourSteps = [
  { id: 'dashboard', title: 'Your whole mess, in one view', detail: 'Start with a live operational overview.', x: 12, y: 26 },
  { id: 'members', title: 'Members stay visible', detail: 'See active members at a glance.', x: 38, y: 34 },
  { id: 'meals', title: 'Meals update live', detail: 'Today\'s count and monthly total stay current.', x: 61, y: 34 },
  { id: 'expenses', title: 'Track every shared cost', detail: 'Food and utility expenses remain transparent.', x: 84, y: 52 },
  { id: 'deposit', title: 'Know the available balance', detail: 'Deposits and dues update together.', x: 61, y: 52 },
  { id: 'analytics', title: 'Understand the month', detail: 'Spot trends without calculating manually.', x: 43, y: 78 },
  { id: 'quick-add', title: 'Add anything faster', detail: 'Use Quick Add or ask Messzen AI.', x: 76, y: 12 },
] as const

type TourStepId = (typeof tourSteps)[number]['id']

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'members', label: 'Members', icon: UsersRound },
  { id: 'meals', label: 'Meal Sheet', icon: UtensilsCrossed },
  { id: 'expenses', label: 'Expenses', icon: ReceiptText },
  { id: 'bills', label: 'Monthly Bills', icon: WalletCards },
]

const metrics = [
  { id: 'members', label: 'Total members', value: '7', icon: UsersRound, tone: 'from-[#087d72] to-[#0a9485]' },
  { id: 'meals', label: 'Meals today', value: '4.5', icon: UtensilsCrossed, tone: 'from-[#13b986] to-[#35d4a3]' },
  { id: 'total-meals', label: 'Total meals', value: '65', icon: CalendarDays, tone: 'from-[#6d3cf3] to-[#8954f7]' },
  { id: 'rate', label: 'Meal rate', value: '৳ 89.38', icon: CircleDollarSign, tone: 'from-[#079aca] to-[#2671e9]' },
  { id: 'deposit', label: 'Total deposit', value: '৳ 6,569', icon: WalletCards, tone: 'from-[#16b77b] to-[#39ca91]' },
  { id: 'expenses', label: 'Food expenses', value: '৳ 5,809', icon: ReceiptText, tone: 'from-[#f59a08] to-[#ff7d17]' },
]

function isHighlighted(active: TourStepId, id: string) {
  if (active === 'dashboard') return id === 'dashboard'
  return active === id
}

export function MarketingProductOverview() {
  const [step, setStep] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const activeStep = tourSteps[step]

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduceMotion(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (paused || reduceMotion) return
    const timer = window.setInterval(() => {
      setStep((current) => (current + 1) % tourSteps.length)
    }, 2300)
    return () => window.clearInterval(timer)
  }, [paused, reduceMotion])

  return (
    <div
      className="group/product-demo relative h-full w-full overflow-hidden bg-[#f4f8fb] text-[#123748]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-label="Animated Messzen dashboard product overview"
    >
      <div className="absolute inset-y-0 left-0 w-[21%] border-r border-[#dce9ec] bg-white px-[2.2%] py-[3%]">
        <div className="flex items-center gap-[6%] px-[4%] text-[clamp(7px,1.25vw,12px)] font-semibold text-[#007f76]">
          <span className="grid aspect-square w-[18%] place-items-center rounded-[30%] border-2 border-[#008d8c] text-[.8em]">M</span>
          <span>messzen</span>
        </div>
        <div className="mt-[18%] space-y-[4%]">
          {navItems.map(({ id, label, icon: Icon }) => {
            const highlighted = isHighlighted(activeStep.id, id)
            return (
              <div
                key={id}
                className={`flex items-center gap-[8%] rounded-[8px] px-[8%] py-[7%] text-[clamp(5px,.9vw,9px)] font-extrabold transition-all duration-500 ${highlighted ? 'bg-[#087f75] text-white shadow-[0_6px_16px_rgba(0,127,118,.2)]' : 'text-[#526477]'}`}
              >
                <Icon className="w-[14%]" strokeWidth={2.2} />
                <span>{label}</span>
                {highlighted ? <ChevronRight className="ml-auto w-[9%]" /> : null}
              </div>
            )
          })}
        </div>
        <div className="absolute inset-x-[11%] bottom-[5%] rounded-[8px] bg-[#f2f6fb] px-[9%] py-[8%]">
          <div className="flex items-center gap-[8%]">
            <span className="grid aspect-square w-[24%] place-items-center rounded-full bg-[#ddf5f2] text-[clamp(5px,.8vw,8px)] font-semibold text-[#007f76]">MR</span>
            <div className="min-w-0">
              <p className="truncate text-[clamp(5px,.82vw,8px)] font-semibold">Mahabur Rahman</p>
              <p className="text-[clamp(4px,.65vw,6px)] font-bold uppercase text-[#74869b]">Manager</p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-y-0 left-[21%] right-0">
        <header className="flex h-[18%] items-center justify-between border-b border-[#dce9ec] bg-white px-[4%]">
          <div>
            <p className="text-[clamp(8px,1.45vw,14px)] font-semibold">Dashboard</p>
            <p className="mt-[2%] text-[clamp(5px,.75vw,8px)] font-semibold text-[#71839a]">Together We Dine overview</p>
          </div>
          <div className="flex items-center gap-[5px]">
            <span className="hidden items-center gap-1 rounded-[6px] border border-[#dbe7ee] bg-white px-2 py-1.5 text-[clamp(5px,.72vw,7px)] font-extrabold shadow-sm sm:flex">
              <CalendarDays className="w-2.5 text-[#008d8c]" /> August 2026
            </span>
            <button
              type="button"
              onClick={() => setStep(tourSteps.findIndex((item) => item.id === 'quick-add'))}
              className={`flex items-center gap-1 rounded-[6px] border px-2 py-1.5 text-[clamp(5px,.72vw,7px)] font-extrabold shadow-sm transition-all duration-500 ${activeStep.id === 'quick-add' ? 'scale-105 border-[#008d8c] bg-[#e5f8f5] text-[#007f76] ring-2 ring-[#008d8c]/20' : 'border-[#dbe7ee] bg-white'}`}
            >
              <Sparkles className="w-2.5 text-[#008d8c]" /> Quick Add
            </button>
            <span className="grid aspect-square w-6 place-items-center rounded-[6px] border border-[#dbe7ee] bg-white"><Bell className="w-2.5" /></span>
          </div>
        </header>

        <div className="h-[82%] overflow-hidden px-[4%] py-[3%]">
          <div className="grid grid-cols-3 gap-[2.2%]">
            {metrics.map(({ id, label, value, icon: Icon, tone }) => {
              const highlighted = isHighlighted(activeStep.id, id)
              return (
                <article
                  key={id}
                  className={`relative min-h-0 rounded-[8px] bg-gradient-to-br ${tone} px-[8%] py-[7%] text-white shadow-sm transition-all duration-500 ${highlighted ? 'z-10 -translate-y-0.5 scale-[1.045] ring-2 ring-white ring-offset-2 ring-offset-[#e8f0f4]' : activeStep.id !== 'dashboard' && ['members', 'meals', 'deposit', 'expenses'].includes(activeStep.id) ? 'opacity-65' : ''}`}
                >
                  <p className="text-[clamp(4px,.65vw,7px)] font-semibold uppercase tracking-[.08em] opacity-90">{label}</p>
                  <p className="mt-[7%] text-[clamp(8px,1.5vw,15px)] font-semibold leading-none">{value}</p>
                  <Icon className="absolute bottom-[15%] right-[8%] w-[15%] opacity-70" />
                </article>
              )
            })}
          </div>

          <div className="mt-[3%] grid h-[43%] grid-cols-[1.35fr_.75fr] gap-[2.2%]">
            <article className={`rounded-[8px] border border-[#dce7ec] bg-white px-[5%] py-[4%] transition-all duration-500 ${activeStep.id === 'analytics' ? 'scale-[1.025] border-[#008d8c] shadow-lg ring-2 ring-[#008d8c]/10' : ''}`}>
              <div className="flex items-center justify-between">
                <p className="text-[clamp(5px,.82vw,8px)] font-semibold">Monthly overview</p>
                <span className="flex items-center gap-1 text-[clamp(4px,.6vw,6px)] font-bold text-emerald-600"><TrendingUp className="w-2" /> Live</span>
              </div>
              <div className="relative mt-[6%] h-[62%] border-b border-l border-[#dce7ec]">
                <div className="absolute inset-x-0 top-1/3 border-t border-dashed border-[#e5edf0]" />
                <div className="absolute inset-x-0 top-2/3 border-t border-dashed border-[#e5edf0]" />
                <svg viewBox="0 0 300 75" className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M0 65 C35 65, 37 61, 50 16 S64 64, 91 64 S122 55, 132 35 S148 64, 180 63 S220 50, 236 42 S258 61, 300 53" fill="none" stroke="#11a68f" strokeWidth="4" strokeLinecap="round" />
                  <path d="M0 67 C50 65, 76 62, 92 54 S118 58, 145 48 S170 60, 201 50 S245 57, 300 44" fill="none" stroke="#5bd49b" strokeWidth="3" strokeLinecap="round" opacity=".8" />
                </svg>
              </div>
            </article>

            <article className={`rounded-[8px] border border-[#dce7ec] bg-white px-[7%] py-[7%] transition-all duration-500 ${activeStep.id === 'quick-add' ? 'scale-[1.025] border-[#008d8c] shadow-lg ring-2 ring-[#008d8c]/10' : ''}`}>
              <p className="text-[clamp(5px,.82vw,8px)] font-semibold">Quick actions</p>
              <div className="mt-[8%] grid grid-cols-2 gap-[6%]">
                {[
                  { label: 'AI Add', icon: Sparkles },
                  { label: 'Expense', icon: ReceiptText },
                  { label: 'Meal', icon: UtensilsCrossed },
                  { label: 'Deposit', icon: WalletCards },
                ].map(({ label, icon: Icon }) => (
                  <div key={label} className="grid aspect-[1.35] place-items-center rounded-[6px] border border-[#d9e8e9] bg-[#f9fcfc] text-center">
                    <div><Icon className="mx-auto w-[22%] text-[#008d8c]" /><p className="mt-1 text-[clamp(4px,.62vw,6px)] font-extrabold">{label}</p></div>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </div>

      {!reduceMotion ? (
        <div
          className="pointer-events-none absolute z-30 transition-[left,top] duration-700 ease-[cubic-bezier(.22,1,.36,1)]"
          style={{ left: `${activeStep.x}%`, top: `${activeStep.y}%` }}
          aria-hidden="true"
        >
          <span key={step} className="absolute -left-2 -top-2 size-7 animate-ping rounded-full bg-[#ff7a1a]/35" />
          <MousePointer2 className="relative w-[clamp(16px,2.5vw,26px)] fill-[#123748] text-white drop-shadow-[0_3px_4px_rgba(0,0,0,.32)]" strokeWidth={1.5} />
          <div className={`absolute left-5 top-5 w-[150px] rounded-lg bg-[#102f39] px-3 py-2 text-white shadow-xl transition-opacity sm:w-[180px] ${activeStep.x > 65 ? '-ml-6 -translate-x-full' : ''}`}>
            <p className="text-[9px] font-semibold sm:text-[11px]">{activeStep.title}</p>
            <p className="mt-0.5 text-[7px] font-medium leading-3 text-white/70 sm:text-[9px] sm:leading-4">{activeStep.detail}</p>
          </div>
        </div>
      ) : null}

      <div className="absolute bottom-[2.5%] left-[25%] z-20 flex items-center gap-1.5 rounded-full border border-white/70 bg-white/90 px-2 py-1 shadow-md backdrop-blur-sm">
        {tourSteps.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setStep(index)}
            aria-label={`Show ${item.title}`}
            className={`h-1.5 rounded-full transition-all ${step === index ? 'w-4 bg-[#008d8c]' : 'w-1.5 bg-[#bfd3d7] hover:bg-[#7fa9ad]'}`}
          />
        ))}
        <span className="ml-1 text-[6px] font-semibold uppercase tracking-wide text-[#5e747a]">{paused ? 'Paused' : 'Overview'}</span>
      </div>
    </div>
  )
}
