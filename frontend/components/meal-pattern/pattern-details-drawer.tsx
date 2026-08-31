'use client'

import { useState } from 'react'
import { CalendarClock, Edit3, History, Pause, Play, StopCircle, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
        <SheetContent className="w-full gap-0 overflow-y-auto border-[var(--dashboard-line)] bg-[var(--dashboard-bg)] p-0 sm:max-w-xl">
          {pattern && row ? (
            <>
              <SheetHeader className="border-b border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] p-5 pr-14 sm:p-6 sm:pr-14">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]"><UserRound className="size-5" /></span>
                  <div className="min-w-0">
                    <SheetTitle className="truncate text-xl font-black">{memberName}</SheetTitle>
                    <SheetDescription className="truncate font-semibold">{row.membership.user?.email ?? 'Meal pattern details'}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-5 p-4 pb-28 sm:p-6 sm:pb-28">
                {actionError && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300">{actionError}</div>}
                <section className="dashboard-card p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--brand)]">Current schedule</p>
                      <h3 className="mt-1 text-lg font-black text-foreground">{pattern.pattern_type === 'DAILY' ? 'Same every day' : 'Weekly routine'}</h3>
                      <p className="mt-1 text-xs font-semibold text-muted-foreground">{getPatternWeeklyTotal(pattern)} meals per week · Version {pattern.version}</p>
                    </div>
                    <PatternStatusBadge status={pattern.status} />
                  </div>
                  <div className="mt-5"><SchedulePreview pattern={pattern} /></div>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-[var(--dashboard-surface-subtle)] p-3">
                      <p className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">Starts</p>
                      <p className="mt-1 text-xs font-black text-foreground sm:text-sm">{formatPatternDate(pattern.start_date)}</p>
                    </div>
                    <div className="rounded-xl bg-[var(--dashboard-surface-subtle)] p-3">
                      <p className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">Ends</p>
                      <p className="mt-1 text-xs font-black text-foreground sm:text-sm">{pattern.end_date ? formatPatternDate(pattern.end_date) : 'Until stopped'}</p>
                    </div>
                  </div>
                </section>

                <section className="dashboard-card p-4 sm:p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <History className="size-4 text-[var(--brand)]" />
                    <h3 className="font-black text-foreground">Pattern history</h3>
                  </div>
                  <div className="space-y-2">
                    {history.map((version) => (
                      <div key={version.id} className="flex items-center gap-3 rounded-xl bg-[var(--dashboard-surface-subtle)] p-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--dashboard-surface)] text-xs font-black text-[var(--brand)]">v{version.version}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-black text-foreground">{version.pattern_type === 'DAILY' ? 'Same every day' : 'Weekly routine'}</p>
                          <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">{formatPatternDate(version.start_date)} · by {version.creator?.name ?? 'member'}</p>
                        </div>
                        <PatternStatusBadge status={version.status} className="shrink-0" />
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="fixed inset-x-0 bottom-0 z-10 border-t border-[var(--dashboard-line)] bg-[var(--dashboard-surface)]/95 p-4 backdrop-blur sm:absolute">
                <div className="flex flex-wrap gap-2">
                  {isPatternConfigurable(pattern) && <Button onClick={() => onEdit(row)} className="min-h-11 flex-1 rounded-xl bg-[var(--brand)] font-black text-white hover:bg-[var(--brand-hover)]"><Edit3 className="size-4" /> Change</Button>}
                  {pattern.status === 'ACTIVE' && <Button variant="outline" onClick={() => setPendingAction('pause')} className="min-h-11 rounded-xl font-black"><Pause className="size-4" /> Pause</Button>}
                  {(pattern.status === 'PAUSED' || pattern.status === 'DRAFT') && <Button variant="outline" onClick={() => setPendingAction('resume')} className="min-h-11 rounded-xl font-black text-emerald-700"><Play className="size-4" /> {pattern.status === 'DRAFT' ? 'Activate' : 'Resume'}</Button>}
                  {!['ENDED', 'CANCELLED'].includes(pattern.status) && <Button variant="ghost" onClick={() => setPendingAction('cancel')} className="min-h-11 rounded-xl font-black text-rose-600 hover:bg-rose-50 hover:text-rose-700"><StopCircle className="size-4" /> End</Button>}
                </div>
              </div>
            </>
          ) : (
            <div className="grid min-h-full place-items-center p-8 text-center">
              <div><CalendarClock className="mx-auto size-10 text-muted-foreground" /><p className="mt-3 font-black">No pattern selected</p></div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={Boolean(pendingAction)} onOpenChange={(next) => !next && !saving && setPendingAction(null)}>
        <AlertDialogContent className="rounded-2xl border-[var(--dashboard-line)] bg-[var(--dashboard-surface)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black text-foreground">{pendingAction ? actionCopy[pendingAction].title : ''}</AlertDialogTitle>
            <AlertDialogDescription className="font-semibold leading-6">{pendingAction ? actionCopy[pendingAction].description : ''}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving} className="min-h-11 rounded-xl font-black">Keep current pattern</AlertDialogCancel>
            <AlertDialogAction disabled={saving} onClick={() => void executeAction()} className={`min-h-11 rounded-xl font-black ${pendingAction === 'cancel' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[var(--brand)] hover:bg-[var(--brand-hover)]'}`}>
              {saving ? 'Saving...' : pendingAction ? actionCopy[pendingAction].confirm : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
