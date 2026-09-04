'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, CalendarRange, Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type PickerSurface = 'default' | 'white'
type PickerAlign = 'start' | 'center' | 'end'

interface PickerBaseProps {
  disabled?: boolean
  className?: string
  surface?: PickerSurface
  align?: PickerAlign
  ariaLabel?: string
}

interface EnterpriseDatePickerProps extends PickerBaseProps {
  value: string
  onValueChange: (value: string) => void
  min?: string
  max?: string
  placeholder?: string
}

interface EnterpriseMonthPickerProps extends PickerBaseProps {
  value: string
  onValueChange: (value: string) => void
  min?: string
  max?: string
  placeholder?: string
  shortLabel?: boolean
}

const MONTHS = Array.from({ length: 12 }, (_, index) => ({
  index,
  short: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(2024, index, 1)),
  long: new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(2024, index, 1)),
}))

function parseDateKey(value?: string) {
  if (!value) return undefined
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return undefined
  const date = new Date(year, month - 1, day)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function currentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function parseMonthKey(value?: string) {
  const fallback = new Date()
  if (!value) return { year: fallback.getFullYear(), month: fallback.getMonth() + 1 }
  const [year, month] = value.split('-').map(Number)
  return year && month >= 1 && month <= 12
    ? { year, month }
    : { year: fallback.getFullYear(), month: fallback.getMonth() + 1 }
}

function toMonthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`
}

function triggerSurface(surface: PickerSurface) {
  return surface === 'white'
    ? 'border-[#dbe6ea] bg-white text-[#17363d] hover:bg-white dark:border-[#dbe6ea] dark:bg-white dark:text-[#17363d]'
    : 'border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] text-[var(--dashboard-ink)] hover:border-[var(--brand-border)] hover:bg-[var(--dashboard-hover)]'
}

export function EnterpriseDatePicker({
  value,
  onValueChange,
  min,
  max,
  placeholder = 'Select date',
  disabled = false,
  className,
  surface = 'default',
  align = 'end',
  ariaLabel = 'Select date',
}: EnterpriseDatePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = useMemo(() => parseDateKey(value), [value])
  const minimum = useMemo(() => parseDateKey(min), [min])
  const maximum = useMemo(() => parseDateKey(max), [max])
  const [visibleMonth, setVisibleMonth] = useState(selected ?? minimum ?? new Date())

  useEffect(() => {
    if (open) setVisibleMonth(selected ?? minimum ?? new Date())
  }, [open, selected, minimum])

  const label = selected
    ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(selected)
    : placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={ariaLabel}
          className={cn(
            'inline-flex h-11 min-w-0 items-center gap-2 rounded-xl border px-3 text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--brand-ring)] disabled:cursor-not-allowed disabled:opacity-55',
            triggerSurface(surface),
            className,
          )}
        >
          <CalendarDays className="size-4 shrink-0 text-[var(--brand)]" />
          <span className="min-w-0 flex-1 truncate text-left tabular-nums">{label}</span>
          <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform duration-200', open && 'rotate-180')} />
        </button>
      </PopoverTrigger>
      <PopoverContent align={align} sideOffset={8} className="z-[80] w-auto max-w-[calc(100vw-2rem)] rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] p-2 shadow-[0_20px_55px_rgba(15,23,42,0.18)]">
        <Calendar
          mode="single"
          month={visibleMonth}
          onMonthChange={setVisibleMonth}
          selected={selected}
          onSelect={(date) => {
            if (!date) return
            onValueChange(toDateKey(date))
            setOpen(false)
          }}
          disabled={(date) => Boolean((minimum && date < minimum) || (maximum && date > maximum))}
          startMonth={minimum}
          endMonth={maximum}
          showOutsideDays={false}
          className="bg-transparent p-2 [--cell-size:--spacing(9)] [&_[data-selected-single=true]]:!bg-[var(--brand)] [&_[data-selected-single=true]]:!text-white"
        />
      </PopoverContent>
    </Popover>
  )
}

export function EnterpriseMonthPicker({
  value,
  onValueChange,
  min,
  max,
  placeholder = 'Select month',
  disabled = false,
  className,
  surface = 'default',
  align = 'end',
  ariaLabel = 'Select month',
  shortLabel = false,
}: EnterpriseMonthPickerProps) {
  const selected = parseMonthKey(value)
  const [open, setOpen] = useState(false)
  const [visibleYear, setVisibleYear] = useState(selected.year)

  useEffect(() => {
    if (open) setVisibleYear(selected.year)
  }, [open, selected.year])

  const selectedDate = value ? new Date(selected.year, selected.month - 1, 1) : null
  const label = selectedDate
    ? new Intl.DateTimeFormat('en-US', { month: shortLabel ? 'short' : 'long', year: 'numeric' }).format(selectedDate)
    : placeholder
  const minimumYear = min ? parseMonthKey(min).year : undefined
  const maximumYear = max ? parseMonthKey(max).year : undefined
  const canGoPrevious = minimumYear === undefined || visibleYear > minimumYear
  const canGoNext = maximumYear === undefined || visibleYear < maximumYear
  const thisMonth = currentMonthKey()
  const canSelectThisMonth = !((min && thisMonth < min) || (max && thisMonth > max))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={ariaLabel}
          className={cn(
            'inline-flex h-11 min-w-0 items-center gap-2 rounded-xl border px-3 text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--brand-ring)] disabled:cursor-not-allowed disabled:opacity-55',
            triggerSurface(surface),
            className,
          )}
        >
          <CalendarRange className="size-4 shrink-0 text-[var(--brand)]" />
          <span className="min-w-0 flex-1 truncate text-left">{label}</span>
          <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform duration-200', open && 'rotate-180')} />
        </button>
      </PopoverTrigger>

      <PopoverContent align={align} sideOffset={8} className="z-[80] w-[min(19rem,calc(100vw-2rem))] rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] p-3 shadow-[0_20px_55px_rgba(15,23,42,0.18)]">
        <div className="flex items-center justify-between border-b border-[var(--dashboard-line)] pb-3">
          <button type="button" disabled={!canGoPrevious} onClick={() => setVisibleYear((year) => year - 1)} className="grid size-9 place-items-center rounded-xl border border-[var(--dashboard-line)] text-muted-foreground transition hover:border-[var(--brand-border)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand)] disabled:opacity-35" aria-label="Previous year"><ChevronLeft className="size-4" /></button>
          <div className="text-center"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Choose month</p><p className="mt-0.5 text-base font-semibold text-[var(--dashboard-ink)]">{visibleYear}</p></div>
          <button type="button" disabled={!canGoNext} onClick={() => setVisibleYear((year) => year + 1)} className="grid size-9 place-items-center rounded-xl border border-[var(--dashboard-line)] text-muted-foreground transition hover:border-[var(--brand-border)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand)] disabled:opacity-35" aria-label="Next year"><ChevronRight className="size-4" /></button>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {MONTHS.map((month) => {
            const monthValue = toMonthKey(visibleYear, month.index + 1)
            const isSelected = monthValue === value
            const isDisabled = Boolean((min && monthValue < min) || (max && monthValue > max))
            return (
              <button
                key={month.index}
                type="button"
                disabled={isDisabled}
                onClick={() => {
                  onValueChange(monthValue)
                  setOpen(false)
                }}
                className={cn(
                  'relative h-11 rounded-xl border text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--brand-ring)] disabled:cursor-not-allowed disabled:opacity-30',
                  isSelected
                    ? 'border-[var(--brand)] bg-[var(--brand)] text-white shadow-[0_8px_18px_var(--brand-shadow)]'
                    : 'border-transparent bg-[var(--dashboard-surface-subtle)] text-[var(--dashboard-ink)] hover:border-[var(--brand-border)] hover:bg-[var(--brand-soft)]',
                )}
              >
                {month.short}
                {isSelected && <Check className="absolute right-1.5 top-1.5 size-3" />}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          disabled={!canSelectThisMonth}
          onClick={() => {
            onValueChange(thisMonth)
            setOpen(false)
          }}
          className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[var(--dashboard-line)] text-xs font-semibold text-[var(--brand)] transition hover:border-[var(--brand-border)] hover:bg-[var(--brand-soft)] disabled:cursor-not-allowed disabled:opacity-35"
        >
          <CalendarDays className="size-3.5" /> This month
        </button>
      </PopoverContent>
    </Popover>
  )
}
