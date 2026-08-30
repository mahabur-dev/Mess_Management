'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, Check, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useNativeBackAction } from '@/components/native-back-actions'
import { useDialogFocus } from '@/hooks/use-dialog-focus'
import { FieldCard } from '@/components/mobile/form-controls'
import { formatIsoDate, intlLocale, useLocale, useLocaleFormatters, useTranslations } from '@/lib/i18n'

function parseDateValue(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return new Date()
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12)
}

function dateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12)
}

function shiftMonth(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1, 12)
}

function formatSelectedDate(value: string, locale: 'en' | 'bn') {
  const date = parseDateValue(value)
  return new Intl.DateTimeFormat(intlLocale(locale), {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function DatePicker({
  label,
  hint,
  value,
  onChange,
  disabled = false,
}: {
  label: string
  hint?: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}) {
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const common = useTranslations('common')
  const meals = useTranslations('meals')
  const [open, setOpen] = useState(false)
  const [draftValue, setDraftValue] = useState(value)
  const [visibleMonth, setVisibleMonth] = useState(() => monthStart(parseDateValue(value)))
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const titleId = useId()
  const today = formatIsoDate()
  const weekdays = Array.from({ length: 7 }, (_item, index) =>
    format.weekday(new Date(2026, 7, 2 + index, 12), 'short'),
  )

  const calendarCells = useMemo(() => {
    const leadingDays = visibleMonth.getDay()
    const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate()
    return [
      ...Array.from({ length: leadingDays }, () => null),
      ...Array.from({ length: daysInMonth }, (_item, index) => index + 1),
    ]
  }, [visibleMonth])

  const monthLabel = format.month(visibleMonth)

  function showPicker() {
    if (disabled) return
    setDraftValue(value || today)
    setVisibleMonth(monthStart(parseDateValue(value || today)))
    setOpen(true)
  }

  function closePicker() {
    setOpen(false)
  }

  function selectDay(day: number) {
    setDraftValue(dateValue(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day, 12)))
  }

  function selectToday() {
    setDraftValue(today)
    setVisibleMonth(monthStart(parseDateValue(today)))
  }

  function applyDate() {
    onChange(draftValue)
    setOpen(false)
  }

  useNativeBackAction(open, () => {
    closePicker()
    return true
  })

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  useDialogFocus({ open, containerRef: dialogRef, initialFocusRef: closeButtonRef, onClose: closePicker })

  return (
    <>
      <FieldCard label={label} hint={hint}>
        <button
          type="button"
          onClick={showPicker}
          disabled={disabled}
          className="date-picker-trigger"
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <span className="date-picker-trigger__icon" aria-hidden="true">
            <CalendarDays size={19} strokeWidth={2.3} />
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-body font-semibold text-[#123748]">{formatSelectedDate(value, locale)}</span>
            <span className="mt-0.5 block text-caption font-medium text-[#65838b]">{meals('tapChooseDate')}</span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-[#789096]" aria-hidden="true" />
        </button>
      </FieldCard>

      {open && typeof document !== 'undefined'
        ? createPortal(
            <div className="date-picker-overlay" role="presentation" onPointerDown={closePicker}>
              <div
                ref={dialogRef}
                className="date-picker-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <div className="date-picker-dialog__header">
                  <div>
                    <span className="date-picker-dialog__eyebrow">{meals('selectDateEyebrow')}</span>
                    <h2 id={titleId}>{meals('mealDate')}</h2>
                  </div>
                  <button ref={closeButtonRef} type="button" onClick={closePicker} aria-label={meals('closeDatePicker')}>
                    <X size={19} strokeWidth={2.4} />
                  </button>
                </div>

                <div className="date-picker-selected">
                  <CalendarDays size={18} strokeWidth={2.35} aria-hidden="true" />
                  <span>{formatSelectedDate(draftValue, locale)}</span>
                </div>

                <div className="date-picker-month-nav">
                  <button type="button" onClick={() => setVisibleMonth((month) => shiftMonth(month, -1))} aria-label={meals('previousMonth')}>
                    <ChevronLeft size={19} strokeWidth={2.5} />
                  </button>
                  <strong>{monthLabel}</strong>
                  <button type="button" onClick={() => setVisibleMonth((month) => shiftMonth(month, 1))} aria-label={meals('nextMonth')}>
                    <ChevronRight size={19} strokeWidth={2.5} />
                  </button>
                </div>

                <div className="date-picker-weekdays" aria-hidden="true">
                  {weekdays.map((weekday, index) => <span key={index}>{weekday}</span>)}
                </div>

                <div className="date-picker-calendar" role="grid" aria-label={monthLabel}>
                  {calendarCells.map((day, index) => {
                    if (day === null) return <span key={`empty-${index}`} aria-hidden="true" />
                    const cellValue = dateValue(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day, 12))
                    const selected = cellValue === draftValue
                    const isToday = cellValue === today

                    return (
                      <button
                        key={cellValue}
                        type="button"
                        role="gridcell"
                        aria-selected={selected}
                        aria-label={`${formatSelectedDate(cellValue, locale)}${isToday ? `, ${meals('todaySuffix')}` : ''}`}
                        data-selected={selected}
                        data-today={isToday}
                        onClick={() => selectDay(day)}
                      >
                        <span>{format.number(day)}</span>
                        {selected ? <Check size={11} strokeWidth={3} aria-hidden="true" /> : null}
                      </button>
                    )
                  })}
                </div>

                <div className="date-picker-dialog__footer">
                  <button type="button" className="date-picker-today" onClick={selectToday}>{meals('today')}</button>
                  <span className="flex-1" />
                  <button type="button" className="date-picker-cancel" onClick={closePicker}>{common('cancel')}</button>
                  <button type="button" className="date-picker-apply" onClick={applyDate}>{meals('apply')}</button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
