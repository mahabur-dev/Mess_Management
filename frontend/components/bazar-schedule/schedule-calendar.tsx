'use client'

import { CalendarDays, CircleCheck, LockKeyhole, Settings2, UserPlus, Users } from 'lucide-react'
import type { BazarSchedule, BazarScheduleDate, BazarDutySlot } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { dateStatus, formatBazarDate, getInitials, slotStatus, WEEKDAYS } from './bazar-schedule-utils'
import { statusLabel, useLocale, useLocaleFormatters, useTranslations, weekdayLabel } from '@/lib/i18n'

interface ScheduleCalendarProps {
  schedule: BazarSchedule
  userId?: string
  canManage: boolean
  busyId?: string | null
  onClaim: (slot: BazarDutySlot) => void
  onDuty: (slot: BazarDutySlot, date: BazarScheduleDate) => void
  onManageDate: (date: BazarScheduleDate) => void
}

function CalendarSlot({
  slot,
  date,
  userId,
  canManage,
  busy,
  onClaim,
  onDuty,
}: {
  slot: BazarDutySlot
  date: BazarScheduleDate
  userId?: string
  canManage: boolean
  busy: boolean
  onClaim: (slot: BazarDutySlot) => void
  onDuty: (slot: BazarDutySlot, date: BazarScheduleDate) => void
}) {
  const { locale } = useLocale()
  const t = useTranslations('bazarSchedule')
  const effectiveStatus = slotStatus(slot)
  const mine = slot.assigned_member_id === userId

  if (effectiveStatus === 'AVAILABLE') {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={() => onClaim(slot)}
        className="group/slot flex min-h-9 w-full items-center gap-2 rounded-lg border border-dashed border-[var(--brand-border)] bg-[var(--brand-softer)] px-2.5 py-1.5 text-left text-[11px] font-semibold text-[var(--brand-dark)] transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] disabled:opacity-50"
      >
        <UserPlus className="size-3.5 shrink-0" />
        <span>{busy ? t('taking') : canManage ? t('assignMember') : t('takeDuty')}</span>
      </button>
    )
  }

  if (effectiveStatus === 'CLOSED') {
    return (
      <div className="flex min-h-9 items-center gap-2 rounded-lg bg-[var(--dashboard-surface-subtle)] px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground">
        <LockKeyhole className="size-3.5" /> {statusLabel('CLOSED', locale)}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onDuty(slot, date)}
      className={cn(
        'flex min-h-9 w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition',
        mine
          ? 'border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-dark)] '
          : 'border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] text-[var(--dashboard-ink)] hover:border-[var(--brand-border)]',
      )}
    >
      <span className={cn('grid size-6 shrink-0 place-items-center rounded-md text-[9px] font-bold', mine ? 'bg-[var(--brand)] text-primary-foreground' : 'bg-[var(--dashboard-surface-subtle)] text-muted-foreground')}>
        {getInitials(slot.assigned_member?.name ?? 'Member')}
      </span>
      <span className="min-w-0 flex-1 truncate text-[11px] font-semibold">
        {mine ? t('you') : slot.assigned_member?.name ?? statusLabel('ASSIGNED', locale)}
      </span>
      {mine && <CircleCheck className="size-3.5 shrink-0" />}
    </button>
  )
}

export function ScheduleCalendar({ schedule, userId, canManage, busyId, onClaim, onDuty, onManageDate }: ScheduleCalendarProps) {
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const t = useTranslations('bazarSchedule')
  const totalDays = new Date(Date.UTC(schedule.year, schedule.month, 0)).getUTCDate()
  const firstWeekday = new Date(Date.UTC(schedule.year, schedule.month - 1, 1)).getUTCDay()
  const saturdayFirstOffset = (firstWeekday + 1) % 7
  const byDay = new Map(
    schedule.dates.map((date) => [new Date(date.duty_date).getUTCDate(), date]),
  )
  const cells = [
    ...Array.from({ length: saturdayFirstOffset }, () => null),
    ...Array.from({ length: totalDays }, (_, index) => index + 1),
  ]
  while (cells.length % 7) cells.push(null)

  return (
    <>
      <div className="hidden overflow-hidden rounded-[1.25rem] bg-[var(--dashboard-surface)]  lg:block">
        <div className="grid grid-cols-7 border-b border-[var(--dashboard-line)] bg-[var(--dashboard-surface-subtle)]/70">
          {WEEKDAYS.map((weekday) => (
            <div key={weekday.value} className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              {weekdayLabel(weekday.label, locale).slice(0, 3)}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, index) => {
            const date = day ? byDay.get(day) : undefined
            const status = date ? dateStatus(date) : null
            return (
              <div
                key={`${day ?? 'empty'}-${index}`}
                className={cn(
                  'min-h-36 border-b border-r border-[var(--dashboard-line)] p-2.5 last:border-r-0',
                  !day && 'bg-[var(--dashboard-surface-subtle)]/30',
                  date && status === 'OPEN' && 'bg-[color-mix(in_srgb,var(--brand-softer)_45%,var(--dashboard-surface))]',
                  date && status !== 'OPEN' && 'bg-[var(--dashboard-surface-subtle)]/45',
                )}
              >
                {day && (
                  <>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className={cn('grid size-7 place-items-center rounded-lg text-xs font-bold', date ? 'bg-[var(--brand)] text-primary-foreground ' : 'text-muted-foreground')}>
                        {format.number(day)}
                      </span>
                      {date && canManage && !date.isPast && (
                        <button type="button" onClick={() => onManageDate(date)} className="grid size-7 place-items-center rounded-lg text-muted-foreground transition hover:bg-[var(--dashboard-hover)] hover:text-[var(--brand)]" aria-label={t('manageDateLabel', { date: formatBazarDate(date.duty_date, locale) })}>
                          <Settings2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                    {date ? (
                      <div className="space-y-1.5">
                        {date.slots.filter((slot) => slot.status !== 'CLOSED' || status !== 'OPEN').map((slot) => (
                          <CalendarSlot key={slot.id} slot={slot} date={date} userId={userId} canManage={canManage} busy={busyId === slot.id} onClaim={onClaim} onDuty={onDuty} />
                        ))}
                      </div>
                    ) : (
                      <p className="pt-5 text-center text-[10px] font-semibold text-muted-foreground/55">{t('noBazar')}</p>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="space-y-3 lg:hidden">
        {schedule.dates.map((date) => {
          const status = dateStatus(date)
          const available = date.slots.filter((slot) => slotStatus(slot) === 'AVAILABLE').length
          const assigned = date.slots.filter((slot) => slotStatus(slot) === 'ASSIGNED').length
          return (
            <article key={date.id} className="dashboard-card overflow-hidden p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--brand-soft)] text-sm font-bold text-[var(--brand-dark)]">
                    {format.number(new Date(date.duty_date).getUTCDate())}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[var(--dashboard-ink)]">{formatBazarDate(date.duty_date, locale, { weekday: 'long', month: 'short', day: 'numeric' })}</h3>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      <Users className="size-3.5" /> {t('assignedOpen', { assigned: format.number(assigned), required: format.number(date.required_members), available: format.number(available) })}
                    </p>
                  </div>
                </div>
                {canManage && !date.isPast && (
                  <button type="button" onClick={() => onManageDate(date)} className="grid size-9 shrink-0 place-items-center rounded-lg border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] text-muted-foreground">
                    <Settings2 className="size-4" />
                  </button>
                )}
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {date.slots.filter((slot) => slot.status !== 'CLOSED' || status !== 'OPEN').map((slot) => (
                  <CalendarSlot key={slot.id} slot={slot} date={date} userId={userId} canManage={canManage} busy={busyId === slot.id} onClaim={onClaim} onDuty={onDuty} />
                ))}
              </div>
            </article>
          )
        })}
        {!schedule.dates.length && (
          <div className="dashboard-card p-10 text-center">
            <CalendarDays className="mx-auto size-9 text-muted-foreground" />
            <p className="mt-3 text-sm font-semibold text-muted-foreground">{t('noDates')}</p>
          </div>
        )}
      </div>
    </>
  )
}
