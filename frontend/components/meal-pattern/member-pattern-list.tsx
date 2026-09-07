'use client'

import { ArrowRight, CalendarPlus, Eye, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EnterpriseTableActionCell, EnterpriseTableActionHeader } from '@/components/ui/enterprise-table-actions'
import type { MealPattern, MessMembership } from '@/lib/api-client'
import { roleLabel, useLocale, useLocaleFormatters, useTranslations } from '@/lib/i18n'
import { getInitials, getPatternWeeklyTotal, isPatternConfigurable } from '@/lib/meal-pattern'
import { PatternStatusBadge } from './pattern-status-badge'
import { SchedulePreview } from './schedule-preview'

export interface MemberPatternRow {
  membership: MessMembership
  pattern: MealPattern | null
  history: MealPattern[]
}

interface MemberPatternListProps {
  rows: MemberPatternRow[]
  onView: (row: MemberPatternRow) => void
  onSetup: (row: MemberPatternRow) => void
}

function MemberIdentity({ row }: { row: MemberPatternRow }) {
  const { locale } = useLocale()
  const t = useTranslations('mealPatterns')
  const name = row.membership.user?.name ?? t('list.memberFallback')
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--brand-soft)] text-xs font-semibold text-[var(--brand-dark)] dark:text-[var(--brand-bright)]">
        {getInitials(name)}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{name}</p>
        <p className="truncate text-xs font-semibold text-muted-foreground">{row.membership.user?.email ?? roleLabel(row.membership.role, locale)}</p>
      </div>
    </div>
  )
}

export function MemberPatternList({ rows, onView, onSetup }: MemberPatternListProps) {
  const format = useLocaleFormatters()
  const t = useTranslations('mealPatterns')
  const tableColumns = [
    t('list.member'), t('list.status'), t('list.routine'), t('list.weeklyTotal'), t('list.starts'), t('list.actions'),
  ]

  if (!rows.length) {
    return (
      <div className="dashboard-card px-5 py-12 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--dashboard-surface-subtle)] text-muted-foreground"><UserRound className="size-6" /></span>
        <h3 className="mt-4 text-lg font-semibold text-foreground">{t('list.emptyTitle')}</h3>
        <p className="mt-1 text-sm font-semibold text-muted-foreground">{t('list.emptyDescription')}</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {rows.map((row) => {
          const pattern = row.pattern
          const canEdit = isPatternConfigurable(pattern)
          return (
            <article key={row.membership.id} className="dashboard-card p-4">
              <div className="flex items-start justify-between gap-3">
                <MemberIdentity row={row} />
                {pattern ? <PatternStatusBadge status={pattern.status} /> : <span className="rounded-full bg-[var(--dashboard-surface-subtle)] px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">{t('list.notSet')}</span>}
              </div>

              <div className="mt-4 rounded-xl bg-[var(--dashboard-surface-subtle)] p-3">
                {pattern ? (
                  <>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-foreground">{t(pattern.pattern_type === 'DAILY' ? 'list.sameEveryDay' : 'list.weeklyRoutine')}</p>
                      <p className="text-[11px] font-semibold text-muted-foreground">{t('list.perWeek', { count: format.number(getPatternWeeklyTotal(pattern)) })}</p>
                    </div>
                    <SchedulePreview pattern={pattern} compact />
                  </>
                ) : <p className="text-xs font-semibold text-muted-foreground">{t('list.noRoutine')}</p>}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {pattern && <Button variant="outline" onClick={() => onView(row)} className="min-h-11 rounded-xl font-semibold"><Eye className="size-4" /> {t('list.details')}</Button>}
                <Button onClick={() => onSetup(row)} className={`${pattern ? '' : 'col-span-2'} min-h-11 rounded-xl bg-[var(--brand)] font-semibold text-primary-foreground hover:bg-[var(--brand-hover)]`}>
                  {t(pattern && canEdit ? 'list.change' : 'list.setPattern')} <ArrowRight className="size-4" />
                </Button>
              </div>
            </article>
          )
        })}
      </div>

      <div className="dashboard-card hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="border-b border-[var(--dashboard-line)] bg-[var(--dashboard-surface-subtle)]">
                {tableColumns.map((label, index) =>
                  index === tableColumns.length - 1
                    ? <EnterpriseTableActionHeader key={label}>{label}</EnterpriseTableActionHeader>
                    : <th key={label} className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</th>,
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const pattern = row.pattern
                const canEdit = isPatternConfigurable(pattern)
                return (
                  <tr key={row.membership.id} className="border-b border-[var(--dashboard-line)] last:border-0 hover:bg-[var(--brand-softer)]/60">
                    <td className="px-5 py-4"><MemberIdentity row={row} /></td>
                    <td className="px-5 py-4">{pattern ? <PatternStatusBadge status={pattern.status} /> : <span className="text-xs font-semibold text-muted-foreground">{t('list.notConfigured')}</span>}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-foreground">{pattern ? t(pattern.pattern_type === 'DAILY' ? 'list.sameEveryDay' : 'list.weekly') : '—'}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-foreground">{pattern ? format.number(getPatternWeeklyTotal(pattern)) : '—'}</td>
                    <td className="px-5 py-4 text-xs font-semibold text-muted-foreground">{pattern ? format.date(pattern.start_date) : '—'}</td>
                    <EnterpriseTableActionCell>
                        {pattern && <Button size="icon" variant="outline" onClick={() => onView(row)} aria-label={t('list.viewPattern', { name: row.membership.user?.name ?? t('drawer.memberFallback') })} className="size-10 rounded-xl"><Eye className="size-4" /></Button>}
                        <Button onClick={() => onSetup(row)} className="min-h-10 rounded-xl bg-[var(--brand)] px-4 font-semibold text-primary-foreground hover:bg-[var(--brand-hover)]">
                          {pattern && canEdit ? t('list.change') : <><CalendarPlus className="size-4" /> {t('list.setPattern')}</>}
                        </Button>
                    </EnterpriseTableActionCell>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
