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

type TourId = 'expense' | 'deposit' | 'manual-meal' | 'meal-pattern' | 'ai'

const tours: Array<{ id: TourId; label: string; description: string; icon: LucideIcon }> = [
  { id: 'expense', label: 'Add Expense', description: 'Create, split, review, and save a shared expense.', icon: ReceiptText },
  { id: 'deposit', label: 'Add Deposit', description: 'Record a member contribution and update balances.', icon: WalletCards },
  { id: 'manual-meal', label: 'Manual Meal', description: 'Add a one-off meal for a selected member.', icon: UtensilsCrossed },
  { id: 'meal-pattern', label: 'Meal Pattern', description: 'Build and activate a recurring weekly routine.', icon: CalendarCheck2 },
  { id: 'ai', label: 'AI Quick Add', description: 'Turn a natural command into a reviewed app entry.', icon: Bot },
]

function SelectedTour({ id, onComplete }: { id: TourId; onComplete: () => void }) {
  if (id === 'deposit') return <MarketingDepositTour loop={false} onComplete={onComplete} />
  if (id === 'manual-meal') return <MarketingManualMealTour loop={false} onComplete={onComplete} />
  if (id === 'meal-pattern') return <MarketingMealPatternTour loop={false} onComplete={onComplete} />
  if (id === 'ai') return <MarketingAiQuickAddTour loop={false} onComplete={onComplete} />
  return <MarketingExpenseTour loop={false} onComplete={onComplete} />
}

export function ProductTourPreviewSuite() {
  const [selected, setSelected] = useState<TourId>('expense')
  const selectedTour = tours.find((tour) => tour.id === selected) ?? tours[0]
  const playNextTour = useCallback(() => {
    setSelected((current) => {
      const currentIndex = tours.findIndex((tour) => tour.id === current)
      return tours[(currentIndex + 1) % tours.length].id
    })
  }, [])

  return (
    <>
      <div className="mb-3 grid gap-2 sm:grid-cols-5" role="tablist" aria-label="Product tour previews">
        {tours.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={selected === id}
            onClick={() => setSelected(id)}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${selected === id ? 'border-[#008d8c] bg-[#008d8c] text-white shadow-[0_8px_22px_rgba(0,141,140,.22)]' : 'border-[#d8e6e8] bg-white text-[#536e75] hover:border-[#8fc9c6] hover:bg-[#f4fbfa]'}`}
          >
            <Icon className="w-4" /> {label}
          </button>
        ))}
      </div>
      <div className="mb-3 flex items-center justify-between gap-4 rounded-xl border border-[#d8e6e8] bg-white px-4 py-2">
        <div><h2 className="text-sm font-semibold text-[#123748]">{selectedTour.label}</h2><p className="mt-0.5 text-xs font-medium text-[#607981]">{selectedTour.description}</p></div>
        <span className="shrink-0 rounded-full bg-[#e5f6f4] px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#007f76]">Autoplaying all features</span>
      </div>
      <div role="tabpanel" key={selected} className="animate-in fade-in duration-300">
        <SelectedTour id={selected} onComplete={playNextTour} />
      </div>
    </>
  )
}
