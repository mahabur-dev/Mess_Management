'use client'

import { useCallback, useState } from 'react'
import { Bot, CalendarCheck2, ReceiptText, UtensilsCrossed, WalletCards, type LucideIcon } from 'lucide-react'
import { MarketingExpenseTour } from '@/components/marketing-expense-tour'
import {
  MarketingAiQuickAddTour,
  MarketingDepositTour,
  MarketingManualMealTour,
  MarketingMealPatternTour,
} from '@/components/marketing-operations-tours'
import { useTranslations, type MessageKey } from '@/lib/i18n'

type TourId = 'expense' | 'deposit' | 'manual-meal' | 'meal-pattern' | 'ai'

type TourCopyKey = MessageKey<'marketing'>

const tours: Array<{ id: TourId; labelKey: TourCopyKey; descriptionKey: TourCopyKey; icon: LucideIcon }> = [
  { id: 'expense', labelKey: 'tour.expense', descriptionKey: 'tour.expenseText', icon: ReceiptText },
  { id: 'deposit', labelKey: 'tour.deposit', descriptionKey: 'tour.depositText', icon: WalletCards },
  { id: 'manual-meal', labelKey: 'tour.manualMeal', descriptionKey: 'tour.manualMealText', icon: UtensilsCrossed },
  { id: 'meal-pattern', labelKey: 'tour.mealPattern', descriptionKey: 'tour.mealPatternText', icon: CalendarCheck2 },
  { id: 'ai', labelKey: 'tour.ai', descriptionKey: 'tour.aiText', icon: Bot },
]

function SelectedTour({ id, onComplete }: { id: TourId; onComplete: () => void }) {
  if (id === 'deposit') return <MarketingDepositTour loop={false} onComplete={onComplete} />
  if (id === 'manual-meal') return <MarketingManualMealTour loop={false} onComplete={onComplete} />
  if (id === 'meal-pattern') return <MarketingMealPatternTour loop={false} onComplete={onComplete} />
  if (id === 'ai') return <MarketingAiQuickAddTour loop={false} onComplete={onComplete} />
  return <MarketingExpenseTour loop={false} onComplete={onComplete} />
}

export function ProductTourPreviewSuite() {
  const t = useTranslations('marketing')
  const [selected, setSelected] = useState<TourId>('expense')
  const selectedTour = tours.find((tour) => tour.id === selected) ?? tours[0]
  const playNextTour = useCallback(() => {
    setSelected((current) => {
      const currentIndex = tours.findIndex((tour) => tour.id === current)
      return tours[(currentIndex + 1) % tours.length].id
    })
  }, [])

  return (
    <div className="marketing-animation">
      <div className="mb-3 grid gap-2 sm:grid-cols-5" role="tablist" aria-label={t('tour.tabsLabel')}>
        {tours.map(({ id, labelKey, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={selected === id}
            onClick={() => setSelected(id)}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${selected === id ? 'border-[var(--brand)] bg-[var(--brand)] text-white' : 'border-[var(--marketing-line)] bg-[var(--marketing-surface)] text-muted-foreground hover:border-[var(--brand-border)] hover:bg-[var(--brand-soft)]'}`}
          >
            <Icon className="w-4" /> {t(labelKey)}
          </button>
        ))}
      </div>
      <div className="mb-3 flex h-24 items-start justify-between gap-4 overflow-hidden rounded-xl border border-[var(--marketing-line)] bg-[var(--marketing-surface)] px-4 py-3 sm:h-[4.5rem] sm:items-center">
        <div className="min-w-0"><h2 className="text-sm font-semibold text-foreground">{t(selectedTour.labelKey)}</h2><p className="mt-0.5 line-clamp-2 text-xs font-medium text-muted-foreground">{t(selectedTour.descriptionKey)}</p></div>
        <span className="max-w-36 shrink-0 rounded-full bg-[var(--brand-soft)] px-3 py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-[var(--brand)]">{t('tour.autoplay')}</span>
      </div>
      <div role="tabpanel" key={selected} className="animate-in fade-in duration-300">
        <SelectedTour id={selected} onComplete={playNextTour} />
      </div>
    </div>
  )
}
