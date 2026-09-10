'use client'

import { useEffect, useState } from 'react'
import {
  Bell,
  CalendarClock,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  CreditCard,
  FileBarChart,
  LayoutDashboard,
  ListFilter,
  ReceiptText,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
  WalletCards,
  type LucideIcon,
} from 'lucide-react'
import { useTranslations } from '@/lib/i18n'

const currency = '\u09F3'

type PreviewId = 'dashboard' | 'quick-add' | 'meal-patterns' | 'bazar-schedule' | 'expenses' | 'deposit' | 'monthly-bill' | 'reports'

type PreviewItem = {
  id: PreviewId
  icon: LucideIcon
}

const previewItems: PreviewItem[] = [
  { id: 'dashboard', icon: LayoutDashboard },
  { id: 'quick-add', icon: Sparkles },
  { id: 'meal-patterns', icon: CalendarClock },
  { id: 'bazar-schedule', icon: CalendarDays },
  { id: 'expenses', icon: ShoppingBag },
  { id: 'deposit', icon: CreditCard },
  { id: 'monthly-bill', icon: ReceiptText },
  { id: 'reports', icon: FileBarChart },
]

const activityRows: Record<PreviewId, ReadonlyArray<readonly [string, string, string]>> = {
  dashboard: [['Mudi bazar', 'Sep 04', currency + ' 1,500'], ['alu + 2 more', 'Sep 04', currency + ' 1,900'], ['Rice', 'Sep 01', currency + ' 1,650']],
  'quick-add': [['AI entry', 'Today', '2 items'], ['Meal entry', 'Today', 'Rahim'], ['Expense', 'Today', currency + ' 500']],
  'meal-patterns': [['Breakfast plan', 'Today', '7 meals'], ['Lunch plan', 'Tomorrow', '6 meals'], ['Dinner plan', 'Friday', '7 meals']],
  'bazar-schedule': [['Rahim', 'Today', 'Assigned'], ['Karim', 'Saturday', 'Assigned'], ['Sakib', 'Monday', 'Pending']],
  expenses: [['Bazar expense', 'Today', currency + ' 2,450'], ['Gas bill', 'Yesterday', currency + ' 1,200'], ['Vegetables', 'Yesterday', currency + ' 780']],
  deposit: [['Rahim', 'Today', currency + ' 3,000'], ['Karim', 'Yesterday', currency + ' 2,500'], ['Sakib', 'Yesterday', currency + ' 3,200']],
  'monthly-bill': [['Meal cost', 'August', currency + ' 2,080'], ['Other cost', 'August', currency + ' 500'], ['Payable', 'August', currency + ' 2,580']],
  reports: [['Meal summary', 'August', '52 meals'], ['Expense summary', 'August', currency + ' 12,540'], ['Member balance', 'August', '7 members']],
}

export function MarketingDashboardPreview() {
  const t = useTranslations('marketing')
  const [activeIndex, setActiveIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const active = previewItems[activeIndex]
  const labels = {
    dashboard: { title: t('hero.previewDashboard'), description: t('hero.previewDescription') },
    'quick-add': { title: t('hero.previewQuickAddAi'), description: t('hero.previewQuickAddAiDescription') },
    'meal-patterns': { title: t('hero.previewMealPatterns'), description: t('hero.previewMealPatternsDescription') },
    'bazar-schedule': { title: t('hero.previewBazarSchedule'), description: t('hero.previewBazarScheduleDescription') },
    expenses: { title: t('hero.previewExpenses'), description: t('hero.previewExpensesDescription') },
    deposit: { title: t('hero.previewDeposit'), description: t('hero.previewDepositDescription') },
    'monthly-bill': { title: t('hero.previewMonthlyBill'), description: t('hero.previewMonthlyBillDescription') },
    reports: { title: t('hero.previewReports'), description: t('hero.previewReportsDescription') },
  }

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (paused || media.matches) return
    const interval = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % previewItems.length)
    }, 3000)
    return () => window.clearInterval(interval)
  }, [paused])

  return (
    <>
      <MobileMarketingDashboardPreview active={active} labels={labels} />
      <section
        className="hidden overflow-hidden rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] text-[var(--dashboard-ink)] md:block"
        aria-label={t('hero.previewAriaLabel')}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
      <div className="grid aspect-[2.1/1] min-h-[260px] grid-cols-[19%_81%]">
        <aside className="flex min-w-0 flex-col overflow-hidden border-r border-[var(--dashboard-line)] bg-[var(--dashboard-surface)]">
          <div className="flex h-[10%] shrink-0 items-center border-b border-[var(--dashboard-line)] px-[9%]">
            <span className="grid size-[clamp(18px,2.4vw,27px)] place-items-center rounded-md border-[1.5px] border-[var(--brand)] text-[clamp(7px,.9vw,10px)] font-bold text-[var(--brand)]">M</span>
            <span className="ml-[8%] truncate text-[clamp(8px,1.4vw,15px)] font-semibold tracking-tight text-[var(--brand)]">messzen</span>
          </div>
          <nav className="min-h-0 flex-1 space-y-0 overflow-hidden px-[6%] py-[3%]" aria-label={t('hero.previewNavigation')}>
            {previewItems.map((item, index) => (
              <PreviewNav key={item.id} icon={item.icon} label={labels[item.id].title} active={index === activeIndex} />
            ))}
          </nav>
          <div className="shrink-0 border-t border-[var(--dashboard-line)] p-[4%]">
            <div className="flex items-center gap-[8%]">
              <span className="grid size-[clamp(17px,2.2vw,25px)] place-items-center rounded-md bg-primary/10 text-[clamp(5px,.7vw,8px)] font-medium text-primary">MR</span>
              <div className="min-w-0">
                <p className="truncate text-[clamp(5px,.78vw,9px)] font-medium">Mahabur Rahman</p>
                <p className="truncate text-[clamp(4px,.6vw,7px)] text-muted-foreground">{t('hero.previewManager')}</p>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 bg-background">
          <header className="flex h-[10%] items-center justify-between gap-[3%] border-b border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] px-[3%]">
            <div className="min-w-0">
              <h2 className="truncate text-[clamp(9px,1.45vw,16px)] font-semibold tracking-tight">{labels[active.id].title}</h2>
              <p className="mt-[2%] truncate text-[clamp(5px,.7vw,8px)] text-muted-foreground">Together We Dine · {labels[active.id].description}</p>
            </div>
            <div className="flex shrink-0 items-center gap-[5%]">
              <span className="hidden items-center gap-1 rounded-md border border-[var(--dashboard-line)] px-2 py-1 text-[clamp(5px,.68vw,8px)] font-medium sm:flex"><CalendarDays className="size-3 text-primary" /> {t('hero.previewMonth')}</span>
              <span className="flex items-center gap-1 rounded-md border border-[var(--dashboard-line)] px-2 py-1 text-[clamp(5px,.68vw,8px)] font-medium"><Sparkles className="size-3 text-primary" /> {t('hero.previewQuickAdd')}</span>
              <Bell className="size-[clamp(10px,1.3vw,15px)] text-muted-foreground" />
              <span className="grid size-[clamp(13px,1.8vw,20px)] place-items-center rounded-full bg-primary/10 text-[clamp(4px,.55vw,6px)] font-medium text-primary">MR</span>
              <ChevronDown className="size-[clamp(9px,1.1vw,13px)] text-muted-foreground" />
            </div>
          </header>

          <main key={active.id} className="marketing-dashboard-preview-enter h-[90%] min-h-0 overflow-hidden p-[2.5%]">
            <PreviewPage page={active.id} title={labels[active.id].title} description={labels[active.id].description} />
          </main>
        </div>
      </div>
      </section>
    </>
  )
}

function MobileMarketingDashboardPreview({
  active,
  labels,
}: {
  active: PreviewItem
  labels: Record<PreviewId, { title: string; description: string }>
}) {
  const t = useTranslations('marketing')
  const summaryItems = [
    [t('hero.previewDeposit'), currency + ' 6,200'],
    [t('hero.previewMeals'), '67.5'],
    [t('hero.previewExpenses'), currency + ' 5,050'],
    [t('hero.previewBillDue'), currency + ' 2,580'],
  ] as const

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] text-[var(--dashboard-ink)] md:hidden" aria-label={t('hero.previewAriaLabel')}>
      <header className="flex h-12 items-center justify-between border-b border-[var(--dashboard-line)] px-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid size-7 shrink-0 place-items-center rounded-md border border-[var(--brand)] text-[10px] font-bold text-[var(--brand)]">M</span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold">{labels[active.id].title}</p>
            <p className="truncate text-[10px] text-muted-foreground">Together We Dine</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[var(--brand)]">
          <CalendarDays className="size-4" />
          <Bell className="size-4 text-muted-foreground" />
          <span className="grid size-6 place-items-center rounded-full bg-[var(--brand-soft)] text-[8px] font-semibold">MR</span>
        </div>
      </header>

      <div className="grid grid-cols-4 border-b border-[var(--dashboard-line)] bg-[var(--dashboard-surface-subtle)] p-1.5">
        {previewItems.slice(0, 4).map((item) => {
          const Icon = item.icon
          const isActive = item.id === active.id
          return (
            <div key={item.id} className={'flex min-w-0 flex-col items-center gap-1 rounded-md px-1 py-1.5 text-[9px] font-medium ' + (isActive ? 'bg-[var(--brand-soft)] text-[var(--brand)]' : 'text-muted-foreground')}>
              <Icon className="size-3.5" />
              <span className="w-full truncate text-center">{labels[item.id].title}</span>
            </div>
          )
        })}
      </div>

      <main className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--brand)]">{t('hero.previewOverview')}</p>
            <h2 className="mt-1 truncate text-sm font-semibold">{labels[active.id].title}</h2>
          </div>
          <span className="shrink-0 rounded-md border border-[var(--brand-border)] bg-[var(--brand-softer)] px-2 py-1 text-[10px] font-semibold text-[var(--brand)]">{t('hero.previewMonth')}</span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {summaryItems.map(([label, value]) => (
            <article key={label} className="rounded-md border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] px-2.5 py-2">
              <p className="truncate text-[10px] font-medium text-muted-foreground">{label}</p>
              <p className="mt-1 text-xs font-semibold tabular-nums">{value}</p>
            </article>
          ))}
        </div>

        <section className="mt-3 overflow-hidden rounded-md border border-[var(--dashboard-line)]">
          <div className="flex items-center justify-between border-b border-[var(--dashboard-line)] px-2.5 py-2">
            <p className="text-[11px] font-semibold">{t('hero.previewActivity')}</p>
            <ListFilter className="size-3.5 text-muted-foreground" />
          </div>
          {activityRows[active.id].slice(0, 2).map(([name, date, value]) => (
            <div key={name} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 border-b border-[var(--dashboard-line)] px-2.5 py-2 last:border-b-0">
              <span className="truncate text-[10px] font-medium">{name}</span>
              <span className="text-[9px] text-muted-foreground">{date}</span>
              <span className="text-[10px] font-semibold tabular-nums">{value}</span>
            </div>
          ))}
        </section>
      </main>
    </section>
  )
}

function PreviewPage({ page, title, description }: { page: PreviewId; title: string; description: string }) {
  const t = useTranslations('marketing')

  if (page === 'dashboard') {
    const stats = [
      [t('hero.previewDeposit'), currency + ' 6,200', 'Including carry forward'],
      [t('hero.previewMeals'), '67.5', t('hero.previewMonth')],
      ['Meal rate', currency + ' 74.81', 'Current rate'],
      ['Food expenses', currency + ' 5,049.99', t('hero.previewMonth')],
      ['Utility expenses', currency + ' 0', t('hero.previewMonth')],
      ['Per member utility', currency + ' 0', 'Current share'],
      ['Due amount', currency + ' 0', 'Outstanding balance'],
      ['Remaining amount', currency + ' 350.01', 'Available balance'],
    ] as const

    return (
      <div className="grid h-full min-h-0 grid-rows-[auto_1fr] gap-[3%]">
        <section className="grid grid-cols-4 gap-[1.5%]">
          {stats.map(([label, value, detail], index) => (
            <article key={label} className={'min-w-0 rounded-md border p-[5%] ' + (index === 0 ? 'border-primary bg-primary text-primary-foreground' : 'border-[var(--dashboard-line)] bg-[var(--dashboard-surface)]')}>
              <p className={'truncate text-[clamp(3px,.5vw,6px)] font-medium ' + (index === 0 ? 'text-primary-foreground/75' : 'text-muted-foreground')}>{label}</p>
              <p className="mt-[8%] truncate text-[clamp(7px,.95vw,11px)] font-semibold tabular-nums">{value}</p>
              <p className={'mt-[4%] truncate text-[clamp(3px,.45vw,5px)] ' + (index === 0 ? 'text-primary-foreground/75' : 'text-muted-foreground')}>{detail}</p>
            </article>
          ))}
        </section>
        <div className="grid min-h-0 grid-cols-[1.08fr_.92fr] gap-[2%]">
          <PreviewChart title="Monthly overview" subtitle="Bazar, deposits, and meals for the selected month" />
          <PreviewActivity rows={activityRows.dashboard} />
        </div>
      </div>
    )
  }

  if (page === 'quick-add') {
    return (
      <section className="grid h-full min-h-0 grid-cols-[1.2fr_.8fr] overflow-hidden rounded-md border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)]">
        <div className="p-[6%]">
          <span className="flex size-[clamp(13px,1.8vw,21px)] items-center justify-center rounded-md bg-[var(--brand-soft)] text-[var(--brand)]"><Sparkles className="size-[62%]" /></span>
          <h3 className="mt-[5%] text-[clamp(7px,1vw,12px)] font-semibold">{title}</h3>
          <p className="mt-[2%] text-[clamp(4px,.6vw,7px)] font-medium text-muted-foreground">{description}</p>
          <div className="mt-[7%] rounded-md border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] px-[4%] py-[5%] text-[clamp(4px,.62vw,8px)] text-muted-foreground">
            {t('hero.previewAiPrompt')}
          </div>
          <div className="mt-[5%] flex items-center justify-between">
            <span className="text-[clamp(4px,.56vw,7px)] font-medium text-muted-foreground">AI</span>
            <span className="rounded-md bg-primary px-[5%] py-[3%] text-[clamp(4px,.56vw,7px)] font-semibold text-primary-foreground">{t('hero.previewAiReady')}</span>
          </div>
        </div>
        <aside className="border-l border-[var(--dashboard-line)] bg-[var(--dashboard-surface-subtle)] p-[7%]">
          <p className="text-[clamp(4px,.58vw,7px)] font-bold uppercase tracking-[0.1em] text-[var(--dashboard-muted)]">{t('hero.previewOverview')}</p>
          <div className="mt-[10%] space-y-[8%]">
            <PreviewSummary label={t('hero.previewMeals')} value="2" />
            <PreviewSummary label={t('hero.previewExpenses')} value={currency + ' 500'} />
            <PreviewSummary label={t('hero.previewStatus')} value={t('hero.previewPending')} />
          </div>
        </aside>
      </section>
    )
  }

  if (page === 'meal-patterns') {
    return (
      <div className="grid h-full min-h-0 grid-rows-[auto_1fr] gap-[4%]">
        <section className="flex items-center justify-between rounded-md border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] px-[4%] py-[3%]">
          <div><h3 className="text-[clamp(6px,.86vw,10px)] font-semibold">{title}</h3><p className="mt-[2%] text-[clamp(4px,.55vw,7px)] text-muted-foreground">{description}</p></div>
          <span className="rounded-md bg-primary px-[3%] py-[2%] text-[clamp(4px,.55vw,7px)] font-semibold text-primary-foreground">+ {t('hero.previewMealPatterns')}</span>
        </section>
        <section className="min-h-0 overflow-hidden rounded-md border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)]">
          <div className="grid grid-cols-[1fr_.65fr_.6fr] border-b border-[var(--dashboard-line)] bg-[var(--dashboard-surface-subtle)] px-[5%] py-[4%] text-[clamp(4px,.55vw,7px)] font-medium text-muted-foreground"><span>Member</span><span>{t('hero.previewMealPlan')}</span><span className="text-right">{t('hero.previewStatus')}</span></div>
          {['Rahim', 'Karim', 'Sakib'].map((member, index) => (
            <div key={member} className="grid grid-cols-[1fr_.65fr_.6fr] items-center border-b border-[var(--dashboard-line)] px-[5%] py-[5%] text-[clamp(5px,.65vw,8px)]">
              <span className="font-medium">{member}</span><span className="text-muted-foreground">{index + 5} meals</span><span className="text-right font-semibold text-primary">{t('hero.previewCompleted')}</span>
            </div>
          ))}
        </section>
      </div>
    )
  }

  if (page === 'bazar-schedule') {
    return (
      <div className="grid h-full min-h-0 grid-rows-[auto_1fr] gap-[4%]">
        <section className="flex items-center gap-[3%] rounded-md border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] p-[4%]">
          <span className="grid size-[clamp(14px,2vw,23px)] place-items-center rounded-md bg-[var(--brand-soft)] text-[var(--brand)]"><CalendarDays className="size-[60%]" /></span>
          <div><h3 className="text-[clamp(6px,.86vw,10px)] font-semibold">{title}</h3><p className="mt-[2%] text-[clamp(4px,.55vw,7px)] text-muted-foreground">{description}</p></div>
        </section>
        <section className="min-h-0 overflow-hidden rounded-md border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)]">
          {activityRows[page].map(([member, date, status]) => (
            <div key={member} className="flex items-center gap-[4%] border-b border-[var(--dashboard-line)] px-[5%] py-[5%]">
              <span className="grid size-[clamp(15px,2.1vw,25px)] place-items-center rounded-md bg-[var(--dashboard-surface-subtle)] text-[clamp(4px,.6vw,7px)] font-semibold text-primary">{date.slice(0, 2)}</span>
              <div className="min-w-0 flex-1"><p className="truncate text-[clamp(5px,.65vw,8px)] font-semibold">{member}</p><p className="mt-[2%] text-[clamp(4px,.52vw,6px)] text-muted-foreground">{date}</p></div>
              <span className="rounded-md bg-[var(--brand-soft)] px-[3%] py-[2%] text-[clamp(4px,.52vw,6px)] font-semibold text-primary">{status}</span>
            </div>
          ))}
        </section>
      </div>
    )
  }

  const value = page === 'expenses' ? currency + ' 4,430' : page === 'deposit' ? currency + ' 8,700' : page === 'monthly-bill' ? currency + ' 2,580' : 'August'
  const firstColumn = page === 'expenses' ? 'Expense' : page === 'deposit' ? 'Member' : page === 'monthly-bill' ? 'Member' : 'Member'
  const secondColumn = page === 'expenses' ? 'Category' : page === 'deposit' ? 'Method' : page === 'monthly-bill' ? 'Meals' : 'Meals'
  const thirdColumn = page === 'reports' ? 'Balance' : page === 'monthly-bill' ? 'Balance' : t('hero.previewAmount')

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_auto_1fr] gap-[3%]">
      <section className="flex items-center justify-between rounded-md border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] px-[4%] py-[3%]">
        <div><h3 className="text-[clamp(6px,.86vw,10px)] font-semibold">{title}</h3><p className="mt-[2%] text-[clamp(4px,.55vw,7px)] text-muted-foreground">{description}</p></div>
        <span className="rounded-md bg-primary px-[3%] py-[2%] text-[clamp(4px,.55vw,7px)] font-semibold text-primary-foreground">{page === 'reports' ? t('hero.previewReportReady') : '+ ' + title}</span>
      </section>
      <section className="grid grid-cols-3 gap-[2%]">
        <PreviewSummary label={page === 'monthly-bill' ? t('hero.previewBillDue') : t('hero.previewAmount')} value={value} />
        <PreviewSummary label={t('hero.previewEntries')} value="3" />
        <PreviewSummary label={t('hero.previewStatus')} value={page === 'monthly-bill' ? t('hero.previewPending') : t('hero.previewCompleted')} />
      </section>
      <section className="min-h-0 overflow-hidden rounded-md border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)]">
        <div className="grid grid-cols-[1.2fr_.8fr_.8fr] border-b border-[var(--dashboard-line)] bg-[var(--dashboard-surface-subtle)] px-[4%] py-[3%] text-[clamp(3px,.48vw,6px)] font-medium text-muted-foreground">
          <span>{firstColumn}</span><span>{secondColumn}</span><span className="text-right">{thirdColumn}</span>
        </div>
        {activityRows[page].map(([name, date, amount]) => (
          <div key={name} className="grid grid-cols-[1.2fr_.8fr_.8fr] items-center border-b border-[var(--dashboard-line)] px-[4%] py-[4%] text-[clamp(4px,.58vw,7px)]">
            <span className="truncate font-medium">{name}</span><span className="truncate text-muted-foreground">{date}</span><span className="truncate text-right font-semibold tabular-nums">{amount}</span>
          </div>
        ))}
      </section>
    </div>
  )
}

function PreviewSummary({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] px-[6%] py-[5%]"><p className="text-[clamp(4px,.52vw,6px)] text-muted-foreground">{label}</p><p className="mt-[4%] truncate text-[clamp(6px,.83vw,10px)] font-semibold">{value}</p></div>
}

function PreviewNav({ icon: Icon, label, active = false }: { icon: LucideIcon; label: string; active?: boolean }) {
  return (
    <div className={'grid h-[clamp(13px,2.15vw,26px)] grid-cols-[20%_1fr] items-center gap-[7%] rounded-md px-[7%] text-[clamp(3px,.54vw,7px)] font-medium ' + (active ? 'text-primary' : 'text-muted-foreground')}>
      <Icon className="size-[clamp(8px,1.05vw,13px)]" />
      <span className="truncate">{label}</span>
    </div>
  )
}

function PreviewChart({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <article className="min-h-0 overflow-hidden rounded-md border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)]">
      <div className="border-b border-[var(--dashboard-line)] px-[5%] py-[4%]">
        <p className="text-[clamp(5px,.74vw,9px)] font-semibold">{title}</p>
        <p className="mt-[2%] truncate text-[clamp(3px,.5vw,6px)] text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex h-[calc(100%-30%)] items-end gap-[8%] px-[10%] pb-[8%] pt-[6%]">
        {[42, 64, 49, 78, 58, 86, 71].map((height, index) => (
          <span key={index} className="flex-1 rounded-t-sm bg-primary/20" style={{ height: height + '%' }}>
            <span className={'block h-[42%] rounded-t-sm ' + (index === 5 ? 'bg-primary' : 'bg-primary/55')} />
          </span>
        ))}
      </div>
    </article>
  )
}

function PreviewActivity({ rows }: { rows: ReadonlyArray<readonly [string, string, string]> }) {
  const t = useTranslations('marketing')
  return (
    <article className="min-h-0 overflow-hidden rounded-md border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)]">
      <div className="flex items-center justify-between border-b border-[var(--dashboard-line)] px-[5%] py-[4%]">
        <p className="text-[clamp(5px,.74vw,9px)] font-semibold">{t('hero.previewActivity')}</p>
        <ListFilter className="size-[clamp(8px,1vw,12px)] text-muted-foreground" />
      </div>
      <div className="grid grid-cols-[1fr_.55fr_.7fr] border-b border-[var(--dashboard-line)] bg-[var(--dashboard-surface-subtle)] px-[5%] py-[3%] text-[clamp(3px,.48vw,6px)] font-medium text-muted-foreground">
        <span>{t('hero.previewEntries')}</span>
        <span>Date</span>
        <span className="text-right">{t('hero.previewAmount')}</span>
      </div>
      <div className="divide-y divide-[var(--dashboard-line)]">
        {rows.map(([name, date, value]) => (
          <div key={name} className="grid grid-cols-[1fr_.55fr_.7fr] items-center px-[5%] py-[5%] text-[clamp(4px,.58vw,7px)]">
            <span className="truncate font-medium">{name}</span>
            <span className="truncate text-muted-foreground">{date}</span>
            <span className="truncate text-right font-semibold tabular-nums">{value}</span>
          </div>
        ))}
      </div>
    </article>
  )
}
