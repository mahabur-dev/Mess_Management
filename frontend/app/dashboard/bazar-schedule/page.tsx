'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import useSWR from 'swr'
import {
  AlertCircle,
  ArrowLeftRight,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Clock3,
  Loader2,
  LockKeyhole,
  Plus,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { DashboardHeader } from '@/components/dashboard-header'
import { LoadingSkeleton } from '@/components/dashboard/page-skeleton'
import { ScheduleCalendar } from '@/components/bazar-schedule/schedule-calendar'
import { ScheduleSettingsDrawer } from '@/components/bazar-schedule/schedule-settings-drawer'
import { RequestCenter } from '@/components/bazar-schedule/request-center'
import {
  dateStatus,
  formatBazarDate,
  FREQUENCY_LABELS,
  getInitials,
  monthLabel,
  slotStatus,
} from '@/components/bazar-schedule/bazar-schedule-utils'
import { useBazarSchedule } from '@/hooks/use-bazar-schedule'
import { useAuth } from '@/app/context/auth-context'
import { swrFetcher } from '@/lib/swr-fetcher'
import {
  apiClient,
  type BazarDutySlot,
  type BazarReleaseRequest,
  type BazarSchedule,
  type BazarScheduleDate,
  type BazarSwapRequest,
  type Mess,
} from '@/lib/api-client'
import { EnterpriseButton } from '@/components/ui/enterprise-button'
import { EnterpriseDetailsDrawer } from '@/components/ui/enterprise-details-drawer'
import { EnterpriseDrawerAction, EnterpriseDrawerFooter } from '@/components/ui/enterprise-drawer-footer'
import { EnterpriseSelect } from '@/components/ui/enterprise-select'
import { EnterpriseDatePicker } from '@/components/ui/enterprise-date-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

type DutyAction = 'release' | 'unassign' | null

function currentMonthValue() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date())
  const read = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
  return `${read('year')}-${read('month')}`
}

function parseMonth(value: string) {
  const [year, month] = value.split('-').map(Number)
  return { year, month }
}

function currentDhakaDay() {
  return Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Dhaka',
      day: 'numeric',
    }).format(new Date()),
  )
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export default function BazarSchedulePage() {
  const { user } = useAuth()
  const [activeMessId, setActiveMessId] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(currentMonthValue)
  const [activeTab, setActiveTab] = useState('schedule')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [generateConfirmOpen, setGenerateConfirmOpen] = useState(false)
  const [generateAcknowledged, setGenerateAcknowledged] = useState(false)
  const [selectedDuty, setSelectedDuty] = useState<{ slot: BazarDutySlot; date: BazarScheduleDate } | null>(null)
  const [assignSlot, setAssignSlot] = useState<BazarDutySlot | null>(null)
  const [assignMemberId, setAssignMemberId] = useState('')
  const [assignReason, setAssignReason] = useState('')
  const [dutyAction, setDutyAction] = useState<DutyAction>(null)
  const [actionReason, setActionReason] = useState('')
  const [swapSource, setSwapSource] = useState<BazarDutySlot | null>(null)
  const [swapTargetId, setSwapTargetId] = useState('')
  const [swapReason, setSwapReason] = useState('')
  const [managedDate, setManagedDate] = useState<BazarScheduleDate | null>(null)
  const [dateCapacity, setDateCapacity] = useState(1)
  const [dateReason, setDateReason] = useState('')
  const [addDateOpen, setAddDateOpen] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [newDateCapacity, setNewDateCapacity] = useState(1)
  const [newDateReason, setNewDateReason] = useState('')

  const { data: messesData, error: messesError, isLoading: messesLoading } = useSWR(
    user ? 'bazar-schedule-messes' : null,
    () => swrFetcher(() => apiClient.getMesses()),
    { revalidateOnFocus: true, dedupingInterval: 15_000 },
  )
  const messes = useMemo(
    () => (Array.isArray(messesData) ? messesData : messesData ? [messesData as Mess] : []),
    [messesData],
  )

  useEffect(() => {
    if (!activeMessId && messes[0]?.id) setActiveMessId(messes[0].id)
    if (activeMessId && messes.length && !messes.some((mess) => mess.id === activeMessId)) {
      setActiveMessId(messes[0].id)
    }
  }, [activeMessId, messes])

  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(() => setMessage(''), messageType === 'error' ? 7000 : 4000)
    return () => window.clearTimeout(timer)
  }, [message, messageType])

  const activeMess = messes.find((mess) => mess.id === activeMessId) ?? messes[0]
  const canManage = Boolean(
    user?.role === 'ADMIN' || activeMess?.created_by === user?.id,
  )
  const { year, month } = parseMonth(selectedMonth)
  const {
    settings,
    schedule,
    swaps,
    releases,
    isLoading,
    error,
    refresh,
    refreshSettings,
  } = useBazarSchedule(activeMess?.id, year, month)

  useEffect(() => {
    if (!managedDate) return
    setDateCapacity(managedDate.required_members)
    setDateReason('')
  }, [managedDate])

  const myDuties = useMemo(
    () =>
      schedule?.dates.flatMap((date) =>
        date.slots
          .filter((slot) => slot.assigned_member_id === user?.id)
          .map((slot) => ({ slot, date })),
      ) ?? [],
    [schedule, user?.id],
  )
  const availableDuties = useMemo(
    () =>
      schedule?.dates.flatMap((date) =>
        date.slots
          .filter((slot) => slotStatus(slot) === 'AVAILABLE')
          .map((slot) => ({ slot, date })),
      ) ?? [],
    [schedule],
  )
  const pendingRequestCount = swaps.filter((request) => request.status === 'PENDING').length + releases.filter((request) => request.status === 'PENDING').length
  const swapTargets = useMemo(
    () =>
      schedule?.dates.flatMap((date) =>
        date.slots
          .filter(
            (slot) =>
              slot.status === 'ASSIGNED' &&
              slot.assigned_member_id &&
              slot.assigned_member_id !== user?.id &&
              slot.id !== swapSource?.id &&
              date.id !== swapSource?.bazar_date_id &&
              !date.isPast,
          )
          .map((slot) => ({ slot, date })),
      ) ?? [],
    [schedule, swapSource, user?.id],
  )

  const notify = (text: string, type: 'success' | 'error' = 'success') => {
    setMessageType(type)
    setMessage(text)
  }

  const runAction = async (id: string, action: () => Promise<unknown>, success: string) => {
    setBusyId(id)
    try {
      await action()
      await refresh()
      notify(success)
    } catch (cause) {
      notify(errorMessage(cause, 'The action could not be completed.'), 'error')
      throw cause
    } finally {
      setBusyId(null)
    }
  }

  const handleClaim = async (slot: BazarDutySlot) => {
    if (canManage) {
      setAssignSlot(slot)
      setAssignMemberId('')
      setAssignReason('')
      return
    }
    await runAction(slot.id, () => apiClient.claimBazarDuty(slot.id), 'Bazar duty added to your schedule.').catch(() => undefined)
  }

  const handleGenerate = async () => {
    if (!activeMess) return
    const current = parseMonth(currentMonthValue())
    try {
      await runAction('generate', () => apiClient.generateBazarSchedule({ messId: activeMess.id, year: current.year, month: current.month }), 'Monthly bazar schedule generated.')
      setGenerateConfirmOpen(false)
      setGenerateAcknowledged(false)
    } catch {
      // The shared action handler keeps the dialog open and displays the API error.
    }
  }

  const handleAssign = async () => {
    if (!assignSlot || !assignMemberId) return
    await runAction(assignSlot.id, () => apiClient.assignBazarDuty(assignSlot.id, { memberId: assignMemberId, reason: assignReason.trim() || undefined }), 'Bazar duty assigned.').then(() => {
      setAssignSlot(null)
      setSelectedDuty(null)
    }).catch(() => undefined)
  }

  const handleDutyAction = async () => {
    if (!selectedDuty || !dutyAction || !actionReason.trim()) return
    const { slot } = selectedDuty
    const action = dutyAction === 'release'
      ? () => apiClient.releaseBazarDuty(slot.id, actionReason.trim())
      : () => apiClient.unassignBazarDuty(slot.id, actionReason.trim())
    await runAction(slot.id, action, dutyAction === 'release' ? 'Release request processed.' : 'Bazar duty unassigned.').then(() => {
      setDutyAction(null)
      setActionReason('')
      setSelectedDuty(null)
    }).catch(() => undefined)
  }

  const handleSwap = async () => {
    if (!swapSource || !swapTargetId) return
    await runAction(swapSource.id, () => apiClient.createBazarSwap({ requesterSlotId: swapSource.id, targetSlotId: swapTargetId, reason: swapReason.trim() || undefined }), 'Swap request sent.').then(() => {
      setSwapSource(null)
      setSwapTargetId('')
      setSwapReason('')
      setActiveTab('requests')
    }).catch(() => undefined)
  }

  const reviewSwap = async (request: BazarSwapRequest, approve: boolean) => {
    await runAction(request.id, () => apiClient.reviewBazarSwap(request.id, approve), `Swap request ${approve ? 'accepted' : 'declined'}.`).catch(() => undefined)
  }
  const cancelSwap = async (request: BazarSwapRequest) => {
    await runAction(request.id, () => apiClient.cancelBazarSwap(request.id), 'Swap request cancelled.').catch(() => undefined)
  }
  const reviewRelease = async (request: BazarReleaseRequest, approve: boolean) => {
    await runAction(request.id, () => apiClient.reviewBazarRelease(request.id, approve), `Release request ${approve ? 'approved' : 'rejected'}.`).catch(() => undefined)
  }

  const handleCapacity = async () => {
    if (!managedDate || !dateReason.trim()) return
    await runAction(managedDate.id, () => apiClient.setBazarDateCapacity(managedDate.id, { requiredMembers: dateCapacity, reason: dateReason.trim() }), 'Required member count updated.').then(() => setManagedDate(null)).catch(() => undefined)
  }

  const handleDateStatus = async () => {
    if (!managedDate || !dateReason.trim()) return
    const nextStatus = dateStatus(managedDate) === 'OPEN' ? 'CLOSED' : 'OPEN'
    await runAction(managedDate.id, () => apiClient.setBazarDateStatus(managedDate.id, { status: nextStatus, reason: dateReason.trim() }), `Bazar date ${nextStatus.toLowerCase()}.`).then(() => setManagedDate(null)).catch(() => undefined)
  }

  const handleAddDate = async () => {
    if (!schedule || !newDate || !newDateReason.trim()) return
    await runAction('add-date', () => apiClient.addBazarScheduleDate(schedule.id, { date: newDate, requiredMembers: newDateCapacity, reason: newDateReason.trim() }), 'Bazar date added.').then(() => {
      setAddDateOpen(false)
      setNewDate('')
      setNewDateReason('')
    }).catch(() => undefined)
  }

  const loading = messesLoading || (Boolean(activeMess) && isLoading)
  const pageError = messesError ?? error

  if (loading) return <LoadingSkeleton />

  return (
    <div className="min-h-screen bg-transparent">
      <DashboardHeader title="Bazar Schedule" description={canManage ? 'Plan, assign and balance monthly bazar duties' : 'Choose and manage your bazar responsibilities'} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} showQuickAddButton={false} />

      <main className="p-4 sm:p-6 lg:p-8">
        {message && (
          <div role="status" className={cn('mb-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ', messageType === 'error' ? 'border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/30 dark:bg-destructive/10 dark:text-destructive' : 'border-primary/30 bg-primary/10 text-primary dark:border-primary/30 dark:bg-primary/10 dark:text-primary')}>
            {messageType === 'error' ? <AlertCircle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0" />}{message}
          </div>
        )}

        {pageError ? (
          <ErrorState error={pageError} onRetry={() => void refresh()} />
        ) : !activeMess ? (
          <EmptyState icon={Users} title="Join a mess first" description="Bazar duties become available after your mess membership is active." />
        ) : !settings ? (
          <EmptyState icon={CalendarCheck2} title={canManage ? 'Set up bazar scheduling' : 'Bazar schedule is not configured'} description={canManage ? 'Choose the repeating bazar days, people required and monthly duty limit. Your first schedule will be ready in a few moments.' : 'Your manager has not configured bazar scheduling yet.'} action={canManage ? <EnterpriseButton onClick={() => setSettingsOpen(true)}><Settings2 className="size-4" /> Configure schedule</EnterpriseButton> : undefined} />
        ) : (
          <>
            <section className="dashboard-card mb-5 flex flex-col gap-4 p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]"><CalendarDays className="size-5" /></span>
                <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--brand)]">Active workspace</p><h2 className="truncate text-lg font-semibold text-[var(--dashboard-ink)]">{activeMess.name}</h2><p className="truncate text-xs font-semibold text-muted-foreground">{FREQUENCY_LABELS[settings.frequency]} · {settings.default_members_per_date} people per bazar · {settings.duty_limit} duty limit</p></div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {messes.length > 1 && <EnterpriseSelect value={activeMess.id} onValueChange={(value) => { setActiveMessId(value); setSelectedDuty(null) }} options={messes.map((mess) => ({ value: mess.id, label: mess.name }))} className="h-11 min-h-11 w-full sm:w-52" />}
                {canManage && <EnterpriseButton tone="secondary" onClick={() => setSettingsOpen(true)}><Settings2 className="size-4" /> Settings</EnterpriseButton>}
                {canManage && schedule && schedule.status === 'ACTIVE' && selectedMonth === currentMonthValue() && <EnterpriseButton tone="secondary" onClick={() => { setNewDateCapacity(schedule.default_members_per_date); setAddDateOpen(true) }}><Plus className="size-4" /> Add date</EnterpriseButton>}
                <EnterpriseButton tone="secondary" onClick={() => void refresh()} disabled={busyId === 'refresh'}><RefreshCw className="size-4" /> Refresh</EnterpriseButton>
              </div>
            </section>

            {!schedule ? (
              <EmptyState icon={CalendarDays} title={`No schedule for ${monthLabel(year, month)}`} description={canManage && selectedMonth === currentMonthValue() ? 'Your settings are ready. Generate the month to open duty selection for members.' : canManage ? 'Only the current Dhaka calendar month can be generated.' : 'The manager has not published this month’s bazar schedule yet.'} action={canManage && selectedMonth === currentMonthValue() ? <EnterpriseButton onClick={() => { setGenerateAcknowledged(false); setGenerateConfirmOpen(true) }} disabled={busyId === 'generate'}><Sparkles className="size-4" /> Generate schedule</EnterpriseButton> : undefined} />
            ) : (
              <>
                <div className="dashboard-stat-grid mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
                  <StatCard icon={CalendarCheck2} label="Bazar dates" value={schedule.overview.totalBazarDates} detail={`${schedule.overview.totalDutySlots} duty slots`} />
                  <StatCard icon={UserCheck} label="Assigned" value={schedule.overview.assigned} detail={`${schedule.overview.available} still available`} />
                  <StatCard icon={CircleGauge} label="Recommended" value={schedule.overview.recommendedDutyCount} detail={`Limit ${schedule.duty_limit} per member`} />
                  <StatCard icon={ArrowLeftRight} label="Pending requests" value={pendingRequestCount} detail={`${myDuties.length} of your duties`} />
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-5">
                  <div className="overflow-x-auto pb-1">
                    <TabsList className="dashboard-brand-tabs h-11 min-w-max rounded-lg border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] p-1">
                      <TabsTrigger value="schedule" className="group h-9 rounded-md px-4 font-semibold transition-colors"><CalendarDays className="size-4" /> Schedule</TabsTrigger>
                      <TabsTrigger value="mine" className="group h-9 rounded-md px-4 font-semibold transition-colors"><UserCheck className="size-4" /> My duties <CountBadge value={myDuties.length} active={activeTab === 'mine'} /></TabsTrigger>
                      <TabsTrigger value="requests" className="group h-9 rounded-md px-4 font-semibold transition-colors"><ArrowLeftRight className="size-4" /> Requests <CountBadge value={pendingRequestCount} active={activeTab === 'requests'} /></TabsTrigger>
                      <TabsTrigger value="fairness" className="group h-9 rounded-md px-4 font-semibold transition-colors"><ShieldCheck className="size-4" /> Distribution</TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="schedule" className="mt-0">
                    <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-xl font-semibold text-[var(--dashboard-ink)]">{monthLabel(schedule.year, schedule.month)}</h2><p className="mt-1 text-sm font-semibold text-muted-foreground">Version {schedule.version} · {schedule.status.toLowerCase()}</p></div><div className="hidden items-center gap-3 text-xs font-semibold text-muted-foreground sm:flex"><Legend color="bg-[var(--brand)]" label="Yours" /><Legend color="bg-primary" label="Available" /><Legend color="bg-muted dark:bg-muted" label="Closed" /></div></div>
                    <ScheduleCalendar schedule={schedule} userId={user?.id} canManage={canManage} busyId={busyId} onClaim={(slot) => void handleClaim(slot)} onDuty={(slot, date) => setSelectedDuty({ slot, date })} onManageDate={setManagedDate} />
                  </TabsContent>

                  <TabsContent value="mine" className="mt-0">
                    <DutyCollection duties={myDuties} available={availableDuties} onDuty={(slot, date) => setSelectedDuty({ slot, date })} onClaim={(slot) => void handleClaim(slot)} busyId={busyId} />
                  </TabsContent>

                  <TabsContent value="requests" className="mt-0">
                    <RequestCenter swaps={swaps} releases={releases} userId={user?.id} canManage={canManage} busyId={busyId} onSwapReview={(request, approve) => void reviewSwap(request, approve)} onSwapCancel={(request) => void cancelSwap(request)} onReleaseReview={(request, approve) => void reviewRelease(request, approve)} />
                  </TabsContent>

                  <TabsContent value="fairness" className="mt-0">
                    <DistributionPanel schedule={schedule} />
                  </TabsContent>
                </Tabs>
              </>
            )}
          </>
        )}
      </main>

      {activeMess && <ScheduleSettingsDrawer open={settingsOpen} onOpenChange={setSettingsOpen} messId={activeMess.id} settings={settings} onSaved={async () => { await refreshSettings(); notify('Bazar schedule settings saved.') }} />}

      <GenerateScheduleDialog open={generateConfirmOpen} onOpenChange={(open) => { if (busyId !== 'generate') { setGenerateConfirmOpen(open); if (!open) setGenerateAcknowledged(false) } }} month={monthLabel(year, month)} isLate={currentDhakaDay() > 1} acknowledged={generateAcknowledged} onAcknowledgedChange={setGenerateAcknowledged} busy={busyId === 'generate'} onConfirm={() => void handleGenerate()} />

      <DutyDetailsDrawer value={selectedDuty} userId={user?.id} canManage={canManage} onOpenChange={(open) => !open && setSelectedDuty(null)} onRelease={() => { setDutyAction('release'); setActionReason('') }} onSwap={(slot) => { setSwapSource(slot); setSwapTargetId(''); setSwapReason(''); setSelectedDuty(null) }} onAssign={(slot) => { setAssignSlot(slot); setAssignMemberId(slot.assigned_member_id ?? ''); setAssignReason(''); setSelectedDuty(null) }} onUnassign={() => { setDutyAction('unassign'); setActionReason('') }} />

      <AssignDialog open={Boolean(assignSlot)} onOpenChange={(open) => !open && setAssignSlot(null)} members={schedule?.overview.distribution.map((row) => row.member) ?? []} memberId={assignMemberId} onMemberChange={setAssignMemberId} reason={assignReason} onReasonChange={setAssignReason} busy={Boolean(assignSlot && busyId === assignSlot.id)} onSubmit={() => void handleAssign()} />

      <ReasonDialog open={Boolean(dutyAction)} onOpenChange={(open) => { if (!open) setDutyAction(null) }} title={dutyAction === 'release' ? 'Release this duty?' : 'Unassign this member?'} description={dutyAction === 'release' ? `With ${schedule?.release_notice_days ?? 0}+ days notice, release is automatic. Later requests need manager approval.` : 'The slot becomes available immediately and the member is notified.'} reason={actionReason} onReasonChange={setActionReason} actionLabel={dutyAction === 'release' ? 'Request release' : 'Unassign duty'} busy={Boolean(selectedDuty && busyId === selectedDuty.slot.id)} onSubmit={() => void handleDutyAction()} />

      <SwapDialog open={Boolean(swapSource)} onOpenChange={(open) => !open && setSwapSource(null)} targets={swapTargets} targetId={swapTargetId} onTargetChange={setSwapTargetId} reason={swapReason} onReasonChange={setSwapReason} busy={Boolean(swapSource && busyId === swapSource.id)} onSubmit={() => void handleSwap()} />

      <ManageDateDrawer date={managedDate} open={Boolean(managedDate)} onOpenChange={(open) => !open && setManagedDate(null)} capacity={dateCapacity} onCapacityChange={setDateCapacity} reason={dateReason} onReasonChange={setDateReason} busy={Boolean(managedDate && busyId === managedDate.id)} onSaveCapacity={() => void handleCapacity()} onToggleStatus={() => void handleDateStatus()} />

      <AddDateDialog open={addDateOpen} onOpenChange={setAddDateOpen} month={selectedMonth} date={newDate} onDateChange={setNewDate} capacity={newDateCapacity} onCapacityChange={setNewDateCapacity} reason={newDateReason} onReasonChange={setNewDateReason} busy={busyId === 'add-date'} onSubmit={() => void handleAddDate()} />
    </div>
  )
}

function StatCard({ icon: Icon, label, value, detail }: { icon: typeof CalendarDays; label: string; value: number; detail: string }) {
  return <article className="dashboard-stat-card dashboard-card p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--dashboard-ink)] sm:text-3xl">{value}</p><p className="mt-1 text-xs font-semibold text-muted-foreground">{detail}</p></div><span className="dashboard-stat-icon grid size-11 shrink-0 place-items-center rounded-xl"><Icon className="size-5" /></span></div></article>
}

function CountBadge({ value, active = false }: { value: number; active?: boolean }) {
  if (!value) return null
  return <span className={cn('ml-1 grid min-w-5 place-items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground transition-colors duration-200', active && 'bg-primary-foreground/15 text-primary-foreground')}>{value}</span>
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="flex items-center gap-1.5"><span className={cn('size-2 rounded-full', color)} />{label}</span>
}

function EmptyState({ icon: Icon, title, description, action }: { icon: typeof Users; title: string; description: string; action?: ReactNode }) {
  return <section className="dashboard-card flex min-h-[28rem] flex-col items-center justify-center p-8 text-center"><span className="grid size-16 place-items-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)] "><Icon className="size-7" /></span><h2 className="mt-5 text-xl font-semibold text-[var(--dashboard-ink)]">{title}</h2><p className="mt-2 max-w-lg text-sm font-medium leading-6 text-muted-foreground">{description}</p>{action && <div className="mt-6">{action}</div>}</section>
}

function ErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return <section className="dashboard-card flex min-h-80 flex-col items-center justify-center p-8 text-center"><span className="grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive dark:bg-destructive/10 dark:text-destructive"><AlertCircle className="size-6" /></span><h2 className="mt-4 text-lg font-semibold text-[var(--dashboard-ink)]">Could not load bazar schedule</h2><p className="mt-2 max-w-md text-sm font-medium text-muted-foreground">{errorMessage(error, 'Please check your connection and try again.')}</p><EnterpriseButton className="mt-5" onClick={onRetry}><RefreshCw className="size-4" /> Try again</EnterpriseButton></section>
}

function DutyCollection({ duties, available, onDuty, onClaim, busyId }: { duties: Array<{ slot: BazarDutySlot; date: BazarScheduleDate }>; available: Array<{ slot: BazarDutySlot; date: BazarScheduleDate }>; onDuty: (slot: BazarDutySlot, date: BazarScheduleDate) => void; onClaim: (slot: BazarDutySlot) => void; busyId?: string | null }) {
  return <div className="grid gap-5 xl:grid-cols-2"><DutyList title="My bazar duties" description="Your assigned dates for this month" items={duties} empty="You have not selected a duty yet." action={(item) => <button type="button" onClick={() => onDuty(item.slot, item.date)} className="grid size-9 place-items-center rounded-lg border border-[var(--dashboard-line)] text-muted-foreground transition hover:border-[var(--brand-border)] hover:text-[var(--brand)]"><ChevronRight className="size-4" /></button>} /><DutyList title="Available dates" description="Choose dates that work for you" items={available} empty="All bazar duty slots are assigned." action={(item) => <EnterpriseButton size="sm" onClick={() => onClaim(item.slot)} disabled={busyId === item.slot.id}>{busyId === item.slot.id ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Take duty</EnterpriseButton>} /></div>
}

function DutyList({ title, description, items, empty, action }: { title: string; description: string; items: Array<{ slot: BazarDutySlot; date: BazarScheduleDate }>; empty: string; action: (item: { slot: BazarDutySlot; date: BazarScheduleDate }) => ReactNode }) {
  return <section className="dashboard-card overflow-hidden"><div className="border-b border-[var(--dashboard-line)] p-5"><h2 className="text-lg font-semibold text-[var(--dashboard-ink)]">{title}</h2><p className="mt-1 text-sm font-semibold text-muted-foreground">{description}</p></div><div className="divide-y divide-[var(--dashboard-line)]">{items.map((item) => <div key={item.slot.id} className="flex items-center gap-3 p-4 transition hover:bg-[var(--dashboard-hover)]/55"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--brand-soft)] text-sm font-bold text-[var(--brand-dark)]">{new Date(item.date.duty_date).getUTCDate()}</span><div className="min-w-0 flex-1"><p className="font-semibold text-[var(--dashboard-ink)]">{formatBazarDate(item.date.duty_date, { weekday: 'long', month: 'short', day: 'numeric' })}</p><p className="mt-0.5 text-xs font-semibold text-muted-foreground">Slot {item.slot.slot_number} · {slotStatus(item.slot).toLowerCase()}</p></div>{action(item)}</div>)}{!items.length && <div className="p-10 text-center"><Clock3 className="mx-auto size-8 text-muted-foreground/60" /><p className="mt-3 text-sm font-semibold text-muted-foreground">{empty}</p></div>}</div></section>
}

function DistributionPanel({ schedule }: { schedule: BazarSchedule }) {
  const max = Math.max(schedule.duty_limit, ...schedule.overview.distribution.map((row) => row.dutyCount), 1)
  return <section className="dashboard-card overflow-hidden"><div className="flex flex-col gap-3 border-b border-[var(--dashboard-line)] p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold text-[var(--dashboard-ink)]">Fair distribution</h2><p className="mt-1 text-sm font-semibold text-muted-foreground">Transparent duty count across every eligible member</p></div><span className="rounded-full bg-[var(--brand-soft)] px-3 py-1.5 text-xs font-bold text-[var(--brand-dark)]">Recommended {schedule.overview.recommendedDutyCount} each</span></div><div className="divide-y divide-[var(--dashboard-line)]">{schedule.overview.distribution.map((row) => <div key={row.member.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(12rem,1fr)_minmax(12rem,2fr)_auto] sm:items-center sm:px-5"><div className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--dashboard-surface-subtle)] text-xs font-bold text-[var(--brand-dark)]">{getInitials(row.member.name)}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-[var(--dashboard-ink)]">{row.member.name}</p><p className="truncate text-xs font-medium text-muted-foreground">{row.member.email}</p></div></div><Progress value={(row.dutyCount / max) * 100} className="h-2 bg-[var(--dashboard-surface-subtle)]" /><div className="flex items-baseline gap-1 sm:justify-end"><span className="text-lg font-semibold text-[var(--dashboard-ink)]">{row.dutyCount}</span><span className="text-xs font-semibold text-muted-foreground">/ {schedule.duty_limit}</span></div></div>)}{!schedule.overview.distribution.length && <div className="p-10 text-center text-sm font-semibold text-muted-foreground">No eligible members found.</div>}</div></section>
}

function DutyDetailsDrawer({ value, userId, canManage, onOpenChange, onRelease, onSwap, onAssign, onUnassign }: { value: { slot: BazarDutySlot; date: BazarScheduleDate } | null; userId?: string; canManage: boolean; onOpenChange: (open: boolean) => void; onRelease: () => void; onSwap: (slot: BazarDutySlot) => void; onAssign: (slot: BazarDutySlot) => void; onUnassign: () => void }) {
  const mine = value?.slot.assigned_member_id === userId
  return <EnterpriseDetailsDrawer open={Boolean(value)} onOpenChange={onOpenChange} eyebrow="Duty details" title={value ? formatBazarDate(value.date.duty_date, { weekday: 'long', month: 'long', day: 'numeric' }) : 'Bazar duty'} description={value ? `Slot ${value.slot.slot_number} of ${value.date.required_members}` : undefined} headerIcon={<CalendarCheck2 className="size-5" />} status={value ? <span className="rounded-full bg-[var(--brand-soft)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--brand-dark)]">{slotStatus(value.slot)}</span> : undefined} footer={value && (mine || canManage) ? <EnterpriseDrawerFooter>{mine && <><EnterpriseDrawerAction tone="secondary" onClick={() => onSwap(value.slot)}><ArrowLeftRight className="size-4" /> Request swap</EnterpriseDrawerAction><EnterpriseDrawerAction tone="warning" onClick={onRelease}><Clock3 className="size-4" /> Release duty</EnterpriseDrawerAction></>}{canManage && <><EnterpriseDrawerAction tone="secondary" onClick={() => onAssign(value.slot)}><UserPlus className="size-4" /> {value.slot.assigned_member_id ? 'Reassign' : 'Assign'}</EnterpriseDrawerAction>{value.slot.assigned_member_id && <EnterpriseDrawerAction tone="danger" onClick={onUnassign}><X className="size-4" /> Unassign</EnterpriseDrawerAction>}</>}</EnterpriseDrawerFooter> : undefined}>{value && <div className="space-y-4"><section className="rounded-2xl bg-[var(--dashboard-surface)] p-5 "><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--brand)]">Assigned member</p>{value.slot.assigned_member ? <div className="mt-4 flex items-center gap-3"><span className="grid size-12 place-items-center rounded-xl bg-[var(--brand)] text-sm font-bold text-primary-foreground">{getInitials(value.slot.assigned_member.name)}</span><div><h3 className="font-semibold text-[var(--dashboard-ink)]">{mine ? 'You' : value.slot.assigned_member.name}</h3><p className="text-sm font-medium text-muted-foreground">{value.slot.assigned_member.email}</p></div></div> : <p className="mt-3 text-sm font-semibold text-muted-foreground">This slot is available.</p>}</section><div className="grid grid-cols-2 gap-3"><InfoTile label="Required people" value={String(value.date.required_members)} /><InfoTile label="Date status" value={dateStatus(value.date)} /></div>{value.slot.last_reason && <section className="rounded-2xl bg-[var(--dashboard-surface)] p-5 "><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Latest note</p><p className="mt-2 text-sm font-medium leading-6 text-[var(--dashboard-ink)]">{value.slot.last_reason}</p></section>}</div>}</EnterpriseDetailsDrawer>
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-[var(--dashboard-surface)] p-4 "><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1.5 text-sm font-semibold capitalize text-[var(--dashboard-ink)]">{value.toLowerCase()}</p></div>
}

function AssignDialog({ open, onOpenChange, members, memberId, onMemberChange, reason, onReasonChange, busy, onSubmit }: { open: boolean; onOpenChange: (open: boolean) => void; members: Array<{ id: string; name: string }>; memberId: string; onMemberChange: (value: string) => void; reason: string; onReasonChange: (value: string) => void; busy: boolean; onSubmit: () => void }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] sm:max-w-lg"><DialogHeader><DialogTitle className="text-[var(--dashboard-ink)]">Assign bazar duty</DialogTitle><DialogDescription>Select an eligible member. Manager assignment may bypass the common duty limit with an audit warning.</DialogDescription></DialogHeader><div className="space-y-4 py-2"><div className="space-y-2"><Label>Member</Label><EnterpriseSelect value={memberId} onValueChange={onMemberChange} options={members.map((member) => ({ value: member.id, label: member.name }))} placeholder="Choose a member" /></div><div className="space-y-2"><Label htmlFor="assign-note">Manager note (optional)</Label><Textarea id="assign-note" value={reason} onChange={(event) => onReasonChange(event.target.value)} placeholder="Why is this assignment being changed?" className="min-h-24 rounded-xl border-[var(--dashboard-line)]" /></div></div><DialogFooter><EnterpriseButton tone="secondary" onClick={() => onOpenChange(false)}>Cancel</EnterpriseButton><EnterpriseButton onClick={onSubmit} disabled={!memberId || busy}>{busy ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />} Assign duty</EnterpriseButton></DialogFooter></DialogContent></Dialog>
}

function ReasonDialog({ open, onOpenChange, title, description, reason, onReasonChange, actionLabel, busy, onSubmit }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description: string; reason: string; onReasonChange: (value: string) => void; actionLabel: string; busy: boolean; onSubmit: () => void }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] sm:max-w-lg"><DialogHeader><DialogTitle className="text-[var(--dashboard-ink)]">{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader><div className="space-y-2 py-2"><Label htmlFor="duty-action-reason">Reason</Label><Textarea id="duty-action-reason" value={reason} onChange={(event) => onReasonChange(event.target.value)} placeholder="Give a clear reason for this change" className="min-h-28 rounded-xl border-[var(--dashboard-line)]" /></div><DialogFooter><EnterpriseButton tone="secondary" onClick={() => onOpenChange(false)}>Cancel</EnterpriseButton><EnterpriseButton tone="warning" onClick={onSubmit} disabled={!reason.trim() || busy}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Clock3 className="size-4" />}{actionLabel}</EnterpriseButton></DialogFooter></DialogContent></Dialog>
}

function SwapDialog({ open, onOpenChange, targets, targetId, onTargetChange, reason, onReasonChange, busy, onSubmit }: { open: boolean; onOpenChange: (open: boolean) => void; targets: Array<{ slot: BazarDutySlot; date: BazarScheduleDate }>; targetId: string; onTargetChange: (value: string) => void; reason: string; onReasonChange: (value: string) => void; busy: boolean; onSubmit: () => void }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[88vh] overflow-y-auto border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] sm:max-w-xl"><DialogHeader><DialogTitle className="text-[var(--dashboard-ink)]">Request a duty swap</DialogTitle><DialogDescription>Choose another member’s assigned date. They must accept before anything changes.</DialogDescription></DialogHeader><div className="space-y-4 py-2"><div className="space-y-2"><Label>Swap with</Label><div className="grid gap-2">{targets.map(({ slot, date }) => <button key={slot.id} type="button" onClick={() => onTargetChange(slot.id)} className={cn('flex items-center gap-3 rounded-xl border p-3 text-left transition', targetId === slot.id ? 'border-[var(--brand)] bg-[var(--brand-soft)] ' : 'border-[var(--dashboard-line)] hover:border-[var(--brand-border)]')}><span className="grid size-10 place-items-center rounded-xl bg-[var(--dashboard-surface-subtle)] text-xs font-bold text-[var(--brand-dark)]">{getInitials(slot.assigned_member?.name ?? 'M')}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-[var(--dashboard-ink)]">{slot.assigned_member?.name}</span><span className="block text-xs font-medium text-muted-foreground">{formatBazarDate(date.duty_date, { weekday: 'short', month: 'short', day: 'numeric' })}</span></span>{targetId === slot.id && <CheckCircle2 className="size-5 text-[var(--brand)]" />}</button>)}{!targets.length && <div className="rounded-xl bg-[var(--dashboard-surface-subtle)] p-5 text-center text-sm font-semibold text-muted-foreground">No eligible assigned duties are available to swap.</div>}</div></div><div className="space-y-2"><Label htmlFor="swap-note">Note (optional)</Label><Textarea id="swap-note" value={reason} onChange={(event) => onReasonChange(event.target.value)} placeholder="Explain why you need this swap" className="min-h-24 rounded-xl border-[var(--dashboard-line)]" /></div></div><DialogFooter><EnterpriseButton tone="secondary" onClick={() => onOpenChange(false)}>Cancel</EnterpriseButton><EnterpriseButton onClick={onSubmit} disabled={!targetId || busy}>{busy ? <Loader2 className="size-4 animate-spin" /> : <ArrowLeftRight className="size-4" />} Send request</EnterpriseButton></DialogFooter></DialogContent></Dialog>
}

function ManageDateDrawer({ date, open, onOpenChange, capacity, onCapacityChange, reason, onReasonChange, busy, onSaveCapacity, onToggleStatus }: { date: BazarScheduleDate | null; open: boolean; onOpenChange: (open: boolean) => void; capacity: number; onCapacityChange: (value: number) => void; reason: string; onReasonChange: (value: string) => void; busy: boolean; onSaveCapacity: () => void; onToggleStatus: () => void }) {
  const assigned = date?.slots.filter((slot) => slot.status === 'ASSIGNED').length ?? 0
  const isOpen = date ? dateStatus(date) === 'OPEN' : false
  return <EnterpriseDetailsDrawer open={open} onOpenChange={onOpenChange} eyebrow="Manager control" title={date ? formatBazarDate(date.duty_date, { weekday: 'long', month: 'long', day: 'numeric' }) : 'Manage date'} description={date ? `${assigned} assigned · ${date.required_members} required` : undefined} headerIcon={<Settings2 className="size-5" />} status={date ? <span className={cn('rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider', isOpen ? 'bg-primary/10 text-primary dark:bg-primary/10 dark:text-primary' : 'bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground')}>{dateStatus(date)}</span> : undefined} footer={<EnterpriseDrawerFooter><EnterpriseDrawerAction tone={isOpen ? 'danger' : 'success'} onClick={onToggleStatus} disabled={busy || (isOpen && assigned > 0) || !reason.trim()}>{isOpen ? <LockKeyhole className="size-4" /> : <CheckCircle2 className="size-4" />}{isOpen ? 'Close date' : 'Reopen date'}</EnterpriseDrawerAction><EnterpriseDrawerAction priority="primary" tone="primary" onClick={onSaveCapacity} disabled={busy || !reason.trim() || capacity < assigned}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Users className="size-4" />} Save capacity</EnterpriseDrawerAction></EnterpriseDrawerFooter>}>{date && <div className="space-y-5"><section className="rounded-2xl bg-[var(--dashboard-surface)] p-5 "><Label htmlFor="date-capacity">People required on this date</Label><Input id="date-capacity" type="number" min={Math.max(1, assigned)} max={50} value={capacity} onChange={(event) => onCapacityChange(Math.max(1, Number(event.target.value)))} className="mt-3 h-12 rounded-xl border-[var(--dashboard-line)] font-semibold" /><p className="mt-2 text-xs font-medium text-muted-foreground">This overrides the default only for this date. Capacity cannot be below {assigned} assigned member(s).</p></section><section className="rounded-2xl bg-[var(--dashboard-surface)] p-5 "><Label htmlFor="date-reason">Reason for change</Label><Textarea id="date-reason" value={reason} onChange={(event) => onReasonChange(event.target.value)} placeholder="Required for audit history" className="mt-3 min-h-28 rounded-xl border-[var(--dashboard-line)]" /></section>{isOpen && assigned > 0 && <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-xs font-semibold leading-5 text-primary dark:border-primary/30 dark:bg-primary/10 dark:text-primary">Release or reassign every member before closing this date.</div>}</div>}</EnterpriseDetailsDrawer>
}

function GenerateScheduleDialog({ open, onOpenChange, month, isLate, acknowledged, onAcknowledgedChange, busy, onConfirm }: { open: boolean; onOpenChange: (open: boolean) => void; month: string; isLate: boolean; acknowledged: boolean; onAcknowledgedChange: (checked: boolean) => void; busy: boolean; onConfirm: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] sm:max-w-lg">
        <DialogHeader>
          <div className="mb-2 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/10 dark:text-primary">
            <AlertCircle className="size-5" />
          </div>
          <DialogTitle className="text-[var(--dashboard-ink)]">
            {isLate ? 'Confirm late schedule generation' : 'Confirm schedule generation'}
          </DialogTitle>
          <DialogDescription>
            Review the schedule settings carefully before publishing {month}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {isLate && (
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm font-medium leading-6 text-primary dark:border-primary/30 dark:bg-primary/10 dark:text-primary">
              This month has already started. Past bazar dates will be locked and cannot be claimed; only the remaining open dates will be available to members.
            </div>
          )}
          <div className="rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-surface-subtle)] p-4 text-sm font-medium leading-6 text-[var(--dashboard-ink)]">
            Once generated, this month’s schedule cannot be generated again or replaced. Changes to the repeating settings will apply to a future schedule.
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--dashboard-line)] p-4 transition hover:border-[var(--brand-border)]">
            <Checkbox checked={acknowledged} onCheckedChange={(checked) => onAcknowledgedChange(checked === true)} className="mt-0.5" />
            <span className="text-sm font-semibold leading-5 text-[var(--dashboard-ink)]">
              I have checked the frequency, people per bazar, duty limit and release policy.
            </span>
          </label>
        </div>

        <DialogFooter>
          <EnterpriseButton tone="secondary" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</EnterpriseButton>
          <EnterpriseButton tone="warning" onClick={onConfirm} disabled={!acknowledged || busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <CalendarCheck2 className="size-4" />}
            {busy ? 'Generating…' : isLate ? 'Generate late schedule' : 'Generate schedule'}
          </EnterpriseButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AddDateDialog({ open, onOpenChange, month, date, onDateChange, capacity, onCapacityChange, reason, onReasonChange, busy, onSubmit }: { open: boolean; onOpenChange: (open: boolean) => void; month: string; date: string; onDateChange: (value: string) => void; capacity: number; onCapacityChange: (value: number) => void; reason: string; onReasonChange: (value: string) => void; busy: boolean; onSubmit: () => void }) {
  const lastDay = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate()
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] sm:max-w-lg"><DialogHeader><DialogTitle className="text-[var(--dashboard-ink)]">Add bazar date</DialogTitle><DialogDescription>Add an exception to the active monthly schedule without changing the repeating settings.</DialogDescription></DialogHeader><div className="grid gap-4 py-2 sm:grid-cols-2"><div className="space-y-2"><Label>Date</Label><EnterpriseDatePicker value={date} onValueChange={onDateChange} min={`${month}-01`} max={`${month}-${String(lastDay).padStart(2, '0')}`} className="h-12 w-full" align="start" ariaLabel="Select new bazar date" /></div><div className="space-y-2"><Label htmlFor="new-bazar-capacity">People required</Label><Input id="new-bazar-capacity" type="number" min={1} max={50} value={capacity} onChange={(event) => onCapacityChange(Math.max(1, Number(event.target.value)))} className="h-12 rounded-xl border-[var(--dashboard-line)]" /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="new-bazar-reason">Reason</Label><Textarea id="new-bazar-reason" value={reason} onChange={(event) => onReasonChange(event.target.value)} placeholder="Why is this date being added?" className="min-h-24 rounded-xl border-[var(--dashboard-line)]" /></div></div><DialogFooter><EnterpriseButton tone="secondary" onClick={() => onOpenChange(false)}>Cancel</EnterpriseButton><EnterpriseButton onClick={onSubmit} disabled={!date || !reason.trim() || busy}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Add date</EnterpriseButton></DialogFooter></DialogContent></Dialog>
}
