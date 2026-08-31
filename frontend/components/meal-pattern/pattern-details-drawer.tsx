'use client'

import { useState } from 'react'
import { CalendarClock, CalendarRange, Edit3, History, Pause, Play, StopCircle, UserRound } from 'lucide-react'
import { EnterpriseDrawerAction, EnterpriseDrawerFooter } from '@/components/ui/enterprise-drawer-footer'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { MealPattern } from '@/lib/api-client'
import { formatPatternDate, getPatternWeeklyTotal, isPatternConfigurable } from '@/lib/meal-pattern'
import type { MemberPatternRow } from './member-pattern-list'
import { PatternStatusBadge } from './pattern-status-badge'
import { SchedulePreview } from './schedule-preview'

export type PatternAction = 'pause' | 'resume' | 'cancel'

interface PatternDetailsDrawerProps {
  row: MemberPatternRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (row: MemberPatternRow) => void
  onAction: (pattern: MealPattern, action: PatternAction) => Promise<void>
}

const actionCopy = {
  pause: {
    title: 'Stop this pattern temporarily?',
    description: 'No new meals will be added while this pattern is paused. You can resume it later.',
    confirm: 'Pause pattern',
  },
  resume: {
    title: 'Start this pattern?',
    description: 'The saved routine will become active and automatic meal planning will resume.',
    confirm: 'Start pattern',
  },
  cancel: {
    title: 'End this pattern permanently?',
    description: 'This version cannot be started again. Its history will remain available.',
    confirm: 'End pattern',
  },
}

function DetailMetric({ icon: Icon, label, value }: { icon: typeof CalendarRange; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] px-3 py-3 shadow-sm">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]"><Icon className="size-4" /></span>
      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-xs font-semibold text-foreground">{value}</p>
      </div>
    </div>
  )
}

export function PatternDetailsDrawer({ row, open, onOpenChange, onEdit, onAction }: PatternDetailsDrawerProps) {
  const [pendingAction, setPendingAction] = useState<PatternAction | null>(null)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')
  const pattern = row?.pattern ?? null
  const history = [...(row?.history ?? [])].sort((a, b) => b.version - a.version)
  const memberName = row?.membership.user?.name ?? 'Mess member'

  const executeAction = async () => {
    if (!pattern || !pendingAction) return
    setSaving(true)
    setActionError('')
    try {
      await onAction(pattern, pendingAction)
      setPendingAction(null)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not update the meal pattern.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="meal-pattern-details-sheet w-full gap-0 overflow-hidden border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] p-0 shadow-2xl sm:max-w-[42rem]">
          {pattern && row ? (
            <>
              <SheetHeader className="shrink-0 border-b border-[var(--dashboard-line)] bg-[linear-gradient(135deg,var(--dashboard-surface),var(--brand-softer))] p-5 pr-14 sm:p-6 sm:pr-16">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]"><UserRound className="size-5" /></span>
                    <div className="min-w-0">
                      <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">Meal pattern</p>
                      <SheetTitle className="truncate text-xl font-semibold tracking-tight">{memberName}</SheetTitle>
                      <SheetDescription className="truncate font-semibold">{row.membership.user?.email ?? 'Meal pattern details'}</SheetDescription>
                    </div>
                  </div>
                  <PatternStatusBadge status={pattern.status} className="mt-1 shrink-0" />
                </div>
              </SheetHeader>

              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-[var(--dashboard-bg)] p-4 sm:p-6">
                {actionError && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300">{actionError}</div>}

                <section className="overflow-hidden rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] shadow-[var(--dashboard-shadow)]">
                  <div className="flex flex-col gap-4 border-b border-[var(--dashboard-line)] p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">Current routine</p>
                      <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">{pattern.pattern_type === 'DAILY' ? 'Same meals every day' : 'Weekly meal routine'}</h2>
                      <p className="mt-1 text-xs font-semibold text-muted-foreground">{pattern.pattern_type === 'DAILY' ? 'One schedule applied every day' : 'A different schedule for each day'} · Version {pattern.version}</p>
                    </div>
                    <div className="rounded-xl bg-[var(--brand-softer)] px-3 py-2 text-left sm:text-right">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--brand)]">Weekly total</p>
                      <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">{getPatternWeeklyTotal(pattern)} <span className="text-xs text-muted-foreground">meals</span></p>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5"><SchedulePreview pattern={pattern} /></div>

                  <div className="grid gap-2 border-t border-[var(--dashboard-line)] bg-[var(--dashboard-surface-subtle)]/60 p-3 sm:grid-cols-2 sm:p-4">
                    <DetailMetric icon={CalendarRange} label="Starts" value={formatPatternDate(pattern.start_date)} />
                    <DetailMetric icon={CalendarClock} label="Ends" value={pattern.end_date ? formatPatternDate(pattern.end_date) : 'Until stopped'} />
                  </div>
                </section>

                <section className="rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] p-4 shadow-[var(--dashboard-shadow)] sm:p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]"><History className="size-4" /></span>
                    <div><h3 className="text-sm font-semibold text-foreground">Version history</h3><p className="text-[11px] font-semibold text-muted-foreground">Previous changes remain available here.</p></div>
                  </div>
                  <div className="divide-y divide-[var(--dashboard-line)] overflow-hidden rounded-xl border border-[var(--dashboard-line)]">
                    {history.map((version) => (
                      <div key={version.id} className="flex items-center gap-3 bg-[var(--dashboard-surface)] px-3 py-3">
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--dashboard-surface-subtle)] text-[10px] font-semibold text-[var(--brand)]">v{version.version}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-foreground">{version.pattern_type === 'DAILY' ? 'Daily routine' : 'Weekly routine'}</p>
                          <p className="mt-0.5 truncate text-[11px] font-semibold text-muted-foreground">Started {formatPatternDate(version.start_date)} · by {version.creator?.name ?? 'member'}</p>
                        </div>
                        <PatternStatusBadge status={version.status} className="shrink-0" />
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="shrink-0 border-t border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] p-3 shadow-[0_-12px_30px_color-mix(in_srgb,var(--dashboard-ink)_6%,transparent)] sm:p-4">
                <EnterpriseDrawerFooter>
                  {isPatternConfigurable(pattern) && <EnterpriseDrawerAction priority="primary" tone="primary" onClick={() => onEdit(row)}><Edit3 className="size-4" /> Change pattern</EnterpriseDrawerAction>}
                  {pattern.status === 'ACTIVE' && <EnterpriseDrawerAction tone="secondary" onClick={() => setPendingAction('pause')}><Pause className="size-4" /> Pause</EnterpriseDrawerAction>}
                  {(pattern.status === 'PAUSED' || pattern.status === 'DRAFT') && <EnterpriseDrawerAction tone="success" onClick={() => setPendingAction('resume')}><Play className="size-4" /> {pattern.status === 'DRAFT' ? 'Activate' : 'Resume'}</EnterpriseDrawerAction>}
                  {!['ENDED', 'CANCELLED'].includes(pattern.status) && <EnterpriseDrawerAction tone="danger" onClick={() => setPendingAction('cancel')}><StopCircle className="size-4" /> End</EnterpriseDrawerAction>}
                </EnterpriseDrawerFooter>
              </div>
            </>
          ) : (
            <div className="grid min-h-full place-items-center bg-[var(--dashboard-surface)] p-8 text-center">
              <div><CalendarClock className="mx-auto size-10 text-muted-foreground" /><p className="mt-3 font-semibold text-foreground">No pattern selected</p></div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={Boolean(pendingAction)} onOpenChange={(next) => !next && !saving && setPendingAction(null)}>
        <AlertDialogContent className="rounded-2xl border-[var(--dashboard-line)] bg-[var(--dashboard-surface)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-semibold text-foreground">{pendingAction ? actionCopy[pendingAction].title : ''}</AlertDialogTitle>
            <AlertDialogDescription className="font-semibold leading-6">{pendingAction ? actionCopy[pendingAction].description : ''}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving} className="min-h-11 rounded-xl font-semibold">Keep current pattern</AlertDialogCancel>
            <AlertDialogAction disabled={saving} onClick={() => void executeAction()} className={`min-h-11 rounded-xl font-semibold ${pendingAction === 'cancel' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[var(--brand)] hover:bg-[var(--brand-hover)]'}`}>
              {saving ? 'Saving...' : pendingAction ? actionCopy[pendingAction].confirm : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
