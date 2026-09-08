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
import { bazarFrequencyLabel, localizedErrorMessage, statusLabel, useLocale, useLocaleFormatters, useTranslations } from '@/lib/i18n'

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
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const t = useTranslations('bazarSchedule')
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
      notify(localizedErrorMessage(cause, locale, t('actionFailed')), 'error')
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
    await runAction(slot.id, () => apiClient.claimBazarDuty(slot.id), t('claimedSuccess')).catch(() => undefined)
  }

  const handleGenerate = async () => {
    if (!activeMess) return
    const current = parseMonth(currentMonthValue())
    try {
      await runAction('generate', () => apiClient.generateBazarSchedule({ messId: activeMess.id, year: current.year, month: current.month }), t('generatedSuccess'))
      setGenerateConfirmOpen(false)
      setGenerateAcknowledged(false)
    } catch {
      // The shared action handler keeps the dialog open and displays the API error.
    }
  }

  const handleAssign = async () => {
    if (!assignSlot || !assignMemberId) return
    await runAction(assignSlot.id, () => apiClient.assignBazarDuty(assignSlot.id, { memberId: assignMemberId, reason: assignReason.trim() || undefined }), t('assignedSuccess')).then(() => {
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
    await runAction(slot.id, action, dutyAction === 'release' ? t('releaseProcessed') : t('unassignedSuccess')).then(() => {
      setDutyAction(null)
      setActionReason('')
      setSelectedDuty(null)
    }).catch(() => undefined)
  }

  const handleSwap = async () => {
    if (!swapSource || !swapTargetId) return
    await runAction(swapSource.id, () => apiClient.createBazarSwap({ requesterSlotId: swapSource.id, targetSlotId: swapTargetId, reason: swapReason.trim() || undefined }), t('swapSent')).then(() => {
      setSwapSource(null)
      setSwapTargetId('')
      setSwapReason('')
      setActiveTab('requests')
    }).catch(() => undefined)
  }

  const reviewSwap = async (request: BazarSwapRequest, approve: boolean) => {
    await runAction(request.id, () => apiClient.reviewBazarSwap(request.id, approve), approve ? t('swapAccepted') : t('swapDeclined')).catch(() => undefined)
  }
  const cancelSwap = async (request: BazarSwapRequest) => {
    await runAction(request.id, () => apiClient.cancelBazarSwap(request.id), t('swapCancelled')).catch(() => undefined)
  }
  const reviewRelease = async (request: BazarReleaseRequest, approve: boolean) => {
    await runAction(request.id, () => apiClient.reviewBazarRelease(request.id, approve), approve ? t('releaseApproved') : t('releaseRejected')).catch(() => undefined)
  }

  const handleCapacity = async () => {
    if (!managedDate || !dateReason.trim()) return
    await runAction(managedDate.id, () => apiClient.setBazarDateCapacity(managedDate.id, { requiredMembers: dateCapacity, reason: dateReason.trim() }), t('capacityUpdated')).then(() => setManagedDate(null)).catch(() => undefined)
  }

  const handleDateStatus = async () => {
    if (!managedDate || !dateReason.trim()) return
    const nextStatus = dateStatus(managedDate) === 'OPEN' ? 'CLOSED' : 'OPEN'
    await runAction(managedDate.id, () => apiClient.setBazarDateStatus(managedDate.id, { status: nextStatus, reason: dateReason.trim() }), t('dateStatusUpdated', { status: statusLabel(nextStatus, locale) })).then(() => setManagedDate(null)).catch(() => undefined)
  }

  const handleAddDate = async () => {
    if (!schedule || !newDate || !newDateReason.trim()) return
    await runAction('add-date', () => apiClient.addBazarScheduleDate(schedule.id, { date: newDate, requiredMembers: newDateCapacity, reason: newDateReason.trim() }), t('dateAdded')).then(() => {
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
      <DashboardHeader title={t('title')} description={canManage ? t('managerDescription') : t('memberDescription')} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} showQuickAddButton={false} />

      <div className="p-4 sm:p-6 lg:p-8">
        {message && (
          <div role="status" className={cn('mb-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ', messageType === 'error' ? 'border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/30 dark:bg-destructive/10 dark:text-destructive' : 'border-primary/30 bg-primary/10 text-primary dark:border-primary/30 dark:bg-primary/10 dark:text-primary')}>
            {messageType === 'error' ? <AlertCircle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0" />}{message}
          </div>
        )}

        {pageError ? (
          <ErrorState error={pageError} onRetry={() => void refresh()} />
        ) : !activeMess ? (
          <EmptyState icon={Users} title={t('joinMessFirst')} description={t('joinMessDescription')} />
        ) : !settings ? (
          <EmptyState icon={CalendarCheck2} title={canManage ? t('setupScheduling') : t('notConfigured')} description={canManage ? t('setupDescription') : t('notConfiguredDescription')} action={canManage ? <EnterpriseButton onClick={() => setSettingsOpen(true)}><Settings2 className="size-4" /> {t('configureSchedule')}</EnterpriseButton> : undefined} />
        ) : (
          <>
            <section className="dashboard-card mb-5 flex flex-col gap-4 p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]"><CalendarDays className="size-5" /></span>
                <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--brand)]">{t('activeWorkspace')}</p><h2 className="truncate text-lg font-semibold text-[var(--dashboard-ink)]">{activeMess.name}</h2><p className="truncate text-xs font-semibold text-muted-foreground">{t('workspaceSummary', { frequency: bazarFrequencyLabel(settings.frequency, locale), people: format.number(settings.default_members_per_date), limit: format.number(settings.duty_limit) })}</p></div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {messes.length > 1 && <EnterpriseSelect value={activeMess.id} onValueChange={(value) => { setActiveMessId(value); setSelectedDuty(null) }} options={messes.map((mess) => ({ value: mess.id, label: mess.name }))} className="h-11 min-h-11 w-full sm:w-52" />}
                {canManage && <EnterpriseButton tone="secondary" onClick={() => setSettingsOpen(true)}><Settings2 className="size-4" /> {t('settings')}</EnterpriseButton>}
                {canManage && schedule && schedule.status === 'ACTIVE' && selectedMonth === currentMonthValue() && <EnterpriseButton tone="secondary" onClick={() => { setNewDateCapacity(schedule.default_members_per_date); setAddDateOpen(true) }}><Plus className="size-4" /> {t('addDate')}</EnterpriseButton>}
                <EnterpriseButton tone="secondary" onClick={() => void refresh()} disabled={busyId === 'refresh'}><RefreshCw className="size-4" /> {t('refresh')}</EnterpriseButton>
              </div>
            </section>

            {!schedule ? (
              <EmptyState icon={CalendarDays} title={t('noScheduleFor', { month: monthLabel(year, month, locale) })} description={canManage && selectedMonth === currentMonthValue() ? t('generateDescription') : canManage ? t('currentMonthOnly') : t('notPublished')} action={canManage && selectedMonth === currentMonthValue() ? <EnterpriseButton onClick={() => { setGenerateAcknowledged(false); setGenerateConfirmOpen(true) }} disabled={busyId === 'generate'}><Sparkles className="size-4" /> {t('generateSchedule')}</EnterpriseButton> : undefined} />
            ) : (
              <>
                <div className="dashboard-stat-grid mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
                  <StatCard icon={CalendarCheck2} label={t('bazarDates')} value={schedule.overview.totalBazarDates} detail={t('dutySlots', { count: format.number(schedule.overview.totalDutySlots) })} />
                  <StatCard icon={UserCheck} label={t('assigned')} value={schedule.overview.assigned} detail={t('stillAvailable', { count: format.number(schedule.overview.available) })} />
                  <StatCard icon={CircleGauge} label={t('recommended')} value={schedule.overview.recommendedDutyCount} detail={t('limitPerMember', { count: format.number(schedule.duty_limit) })} />
                  <StatCard icon={ArrowLeftRight} label={t('pendingRequests')} value={pendingRequestCount} detail={t('yourDutiesCount', { count: format.number(myDuties.length) })} />
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-5">
                  <div className="overflow-x-auto pb-1">
                    <TabsList className="dashboard-brand-tabs h-11 min-w-max rounded-lg border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] p-1">
                      <TabsTrigger value="schedule" className="group h-9 rounded-md px-4 font-semibold transition-colors"><CalendarDays className="size-4" /> {t('schedule')}</TabsTrigger>
                      <TabsTrigger value="mine" className="group h-9 rounded-md px-4 font-semibold transition-colors"><UserCheck className="size-4" /> {t('myDuties')} <CountBadge value={myDuties.length} active={activeTab === 'mine'} /></TabsTrigger>
                      <TabsTrigger value="requests" className="group h-9 rounded-md px-4 font-semibold transition-colors"><ArrowLeftRight className="size-4" /> {t('requests')} <CountBadge value={pendingRequestCount} active={activeTab === 'requests'} /></TabsTrigger>
                      <TabsTrigger value="fairness" className="group h-9 rounded-md px-4 font-semibold transition-colors"><ShieldCheck className="size-4" /> {t('distribution')}</TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="schedule" className="mt-0">
                    <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-xl font-semibold text-[var(--dashboard-ink)]">{monthLabel(schedule.year, schedule.month, locale)}</h2><p className="mt-1 text-sm font-semibold text-muted-foreground">{t('versionStatus', { version: format.number(schedule.version), status: statusLabel(schedule.status, locale) })}</p></div><div className="hidden items-center gap-3 text-xs font-semibold text-muted-foreground sm:flex"><Legend color="bg-[var(--brand)]" label={t('yours')} /><Legend color="bg-primary" label={t('available')} /><Legend color="bg-muted dark:bg-muted" label={t('closed')} /></div></div>
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
      </div>

      {activeMess && <ScheduleSettingsDrawer open={settingsOpen} onOpenChange={setSettingsOpen} messId={activeMess.id} settings={settings} onSaved={async () => { await refreshSettings(); notify(t('settingsSaved')) }} />}

      <GenerateScheduleDialog open={generateConfirmOpen} onOpenChange={(open) => { if (busyId !== 'generate') { setGenerateConfirmOpen(open); if (!open) setGenerateAcknowledged(false) } }} month={monthLabel(year, month, locale)} isLate={currentDhakaDay() > 1} acknowledged={generateAcknowledged} onAcknowledgedChange={setGenerateAcknowledged} busy={busyId === 'generate'} onConfirm={() => void handleGenerate()} />

      <DutyDetailsDrawer value={selectedDuty} userId={user?.id} canManage={canManage} onOpenChange={(open) => !open && setSelectedDuty(null)} onRelease={() => { setDutyAction('release'); setActionReason('') }} onSwap={(slot) => { setSwapSource(slot); setSwapTargetId(''); setSwapReason(''); setSelectedDuty(null) }} onAssign={(slot) => { setAssignSlot(slot); setAssignMemberId(slot.assigned_member_id ?? ''); setAssignReason(''); setSelectedDuty(null) }} onUnassign={() => { setDutyAction('unassign'); setActionReason('') }} />

      <AssignDialog open={Boolean(assignSlot)} onOpenChange={(open) => !open && setAssignSlot(null)} members={schedule?.overview.distribution.map((row) => row.member) ?? []} memberId={assignMemberId} onMemberChange={setAssignMemberId} reason={assignReason} onReasonChange={setAssignReason} busy={Boolean(assignSlot && busyId === assignSlot.id)} onSubmit={() => void handleAssign()} />

      <ReasonDialog open={Boolean(dutyAction)} onOpenChange={(open) => { if (!open) setDutyAction(null) }} title={dutyAction === 'release' ? t('releaseDutyQuestion') : t('unassignMemberQuestion')} description={dutyAction === 'release' ? t('releaseNoticeDescription', { days: format.number(schedule?.release_notice_days ?? 0) }) : t('unassignDescription')} reason={actionReason} onReasonChange={setActionReason} actionLabel={dutyAction === 'release' ? t('requestRelease') : t('unassignDuty')} busy={Boolean(selectedDuty && busyId === selectedDuty.slot.id)} onSubmit={() => void handleDutyAction()} />

      <SwapDialog open={Boolean(swapSource)} onOpenChange={(open) => !open && setSwapSource(null)} targets={swapTargets} targetId={swapTargetId} onTargetChange={setSwapTargetId} reason={swapReason} onReasonChange={setSwapReason} busy={Boolean(swapSource && busyId === swapSource.id)} onSubmit={() => void handleSwap()} />

      <ManageDateDrawer date={managedDate} open={Boolean(managedDate)} onOpenChange={(open) => !open && setManagedDate(null)} capacity={dateCapacity} onCapacityChange={setDateCapacity} reason={dateReason} onReasonChange={setDateReason} busy={Boolean(managedDate && busyId === managedDate.id)} onSaveCapacity={() => void handleCapacity()} onToggleStatus={() => void handleDateStatus()} />

      <AddDateDialog open={addDateOpen} onOpenChange={setAddDateOpen} month={selectedMonth} date={newDate} onDateChange={setNewDate} capacity={newDateCapacity} onCapacityChange={setNewDateCapacity} reason={newDateReason} onReasonChange={setNewDateReason} busy={busyId === 'add-date'} onSubmit={() => void handleAddDate()} />
    </div>
  )
}

function StatCard({ icon: Icon, label, value, detail }: { icon: typeof CalendarDays; label: string; value: number; detail: string }) {
  const format = useLocaleFormatters()
  return <article className="dashboard-stat-card dashboard-card p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--dashboard-ink)] sm:text-3xl">{format.number(value)}</p><p className="mt-1 text-xs font-semibold text-muted-foreground">{detail}</p></div><span className="dashboard-stat-icon grid size-11 shrink-0 place-items-center rounded-xl"><Icon className="size-5" /></span></div></article>
}

function CountBadge({ value, active = false }: { value: number; active?: boolean }) {
  if (!value) return null
  return <LocalizedCountBadge value={value} active={active} />
}

function LocalizedCountBadge({ value, active }: { value: number; active: boolean }) {
  const format = useLocaleFormatters()
  return <span className={cn('ml-1 grid min-w-5 place-items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground transition-colors duration-200', active && 'bg-primary-foreground/15 text-primary-foreground')}>{format.number(value)}</span>
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="flex items-center gap-1.5"><span className={cn('size-2 rounded-full', color)} />{label}</span>
}

function EmptyState({ icon: Icon, title, description, action }: { icon: typeof Users; title: string; description: string; action?: ReactNode }) {
  return <section className="dashboard-card flex min-h-[28rem] flex-col items-center justify-center p-8 text-center"><span className="grid size-16 place-items-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)] "><Icon className="size-7" /></span><h2 className="mt-5 text-xl font-semibold text-[var(--dashboard-ink)]">{title}</h2><p className="mt-2 max-w-lg text-sm font-medium leading-6 text-muted-foreground">{description}</p>{action && <div className="mt-6">{action}</div>}</section>
}

function ErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const { locale } = useLocale()
  const t = useTranslations('bazarSchedule')
  return <section className="dashboard-card flex min-h-80 flex-col items-center justify-center p-8 text-center"><span className="grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive dark:bg-destructive/10 dark:text-destructive"><AlertCircle className="size-6" /></span><h2 className="mt-4 text-lg font-semibold text-[var(--dashboard-ink)]">{t('loadError')}</h2><p className="mt-2 max-w-md text-sm font-medium text-muted-foreground">{localizedErrorMessage(error, locale, t('connectionError'))}</p><EnterpriseButton className="mt-5" onClick={onRetry}><RefreshCw className="size-4" /> {t('tryAgain')}</EnterpriseButton></section>
}

function DutyCollection({ duties, available, onDuty, onClaim, busyId }: { duties: Array<{ slot: BazarDutySlot; date: BazarScheduleDate }>; available: Array<{ slot: BazarDutySlot; date: BazarScheduleDate }>; onDuty: (slot: BazarDutySlot, date: BazarScheduleDate) => void; onClaim: (slot: BazarDutySlot) => void; busyId?: string | null }) {
  const t = useTranslations('bazarSchedule')
  return <div className="grid gap-5 xl:grid-cols-2"><DutyList title={t('myBazarDuties')} description={t('assignedDatesDescription')} items={duties} empty={t('noSelectedDuty')} action={(item) => <button type="button" onClick={() => onDuty(item.slot, item.date)} className="grid size-9 place-items-center rounded-lg border border-[var(--dashboard-line)] text-muted-foreground transition hover:border-[var(--brand-border)] hover:text-[var(--brand)]"><ChevronRight className="size-4" /></button>} /><DutyList title={t('availableDates')} description={t('chooseDatesDescription')} items={available} empty={t('allAssigned')} action={(item) => <EnterpriseButton size="sm" onClick={() => onClaim(item.slot)} disabled={busyId === item.slot.id}>{busyId === item.slot.id ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} {t('takeDuty')}</EnterpriseButton>} /></div>
}

function DutyList({ title, description, items, empty, action }: { title: string; description: string; items: Array<{ slot: BazarDutySlot; date: BazarScheduleDate }>; empty: string; action: (item: { slot: BazarDutySlot; date: BazarScheduleDate }) => ReactNode }) {
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const t = useTranslations('bazarSchedule')
  return <section className="dashboard-card overflow-hidden"><div className="border-b border-[var(--dashboard-line)] p-5"><h2 className="text-lg font-semibold text-[var(--dashboard-ink)]">{title}</h2><p className="mt-1 text-sm font-semibold text-muted-foreground">{description}</p></div><div className="divide-y divide-[var(--dashboard-line)]">{items.map((item) => <div key={item.slot.id} className="flex items-center gap-3 p-4 transition hover:bg-[var(--dashboard-hover)]/55"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--brand-soft)] text-sm font-bold text-[var(--brand-dark)]">{format.number(new Date(item.date.duty_date).getUTCDate())}</span><div className="min-w-0 flex-1"><p className="font-semibold text-[var(--dashboard-ink)]">{formatBazarDate(item.date.duty_date, locale, { weekday: 'long', month: 'short', day: 'numeric' })}</p><p className="mt-0.5 text-xs font-semibold text-muted-foreground">{t('slotStatus', { slot: format.number(item.slot.slot_number), status: statusLabel(slotStatus(item.slot), locale) })}</p></div>{action(item)}</div>)}{!items.length && <div className="p-10 text-center"><Clock3 className="mx-auto size-8 text-muted-foreground/60" /><p className="mt-3 text-sm font-semibold text-muted-foreground">{empty}</p></div>}</div></section>
}

function DistributionPanel({ schedule }: { schedule: BazarSchedule }) {
  const format = useLocaleFormatters()
  const t = useTranslations('bazarSchedule')
  const max = Math.max(schedule.duty_limit, ...schedule.overview.distribution.map((row) => row.dutyCount), 1)
  return <section className="dashboard-card overflow-hidden"><div className="flex flex-col gap-3 border-b border-[var(--dashboard-line)] p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold text-[var(--dashboard-ink)]">{t('fairDistribution')}</h2><p className="mt-1 text-sm font-semibold text-muted-foreground">{t('fairDistributionDescription')}</p></div><span className="rounded-full bg-[var(--brand-soft)] px-3 py-1.5 text-xs font-bold text-[var(--brand-dark)]">{t('recommendedEach', { count: format.number(schedule.overview.recommendedDutyCount) })}</span></div><div className="divide-y divide-[var(--dashboard-line)]">{schedule.overview.distribution.map((row) => <div key={row.member.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(12rem,1fr)_minmax(12rem,2fr)_auto] sm:items-center sm:px-5"><div className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--dashboard-surface-subtle)] text-xs font-bold text-[var(--brand-dark)]">{getInitials(row.member.name)}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-[var(--dashboard-ink)]">{row.member.name}</p><p className="truncate text-xs font-medium text-muted-foreground">{row.member.email}</p></div></div><Progress value={(row.dutyCount / max) * 100} className="h-2 bg-[var(--dashboard-surface-subtle)]" /><div className="flex items-baseline gap-1 sm:justify-end"><span className="text-lg font-semibold text-[var(--dashboard-ink)]">{format.number(row.dutyCount)}</span><span className="text-xs font-semibold text-muted-foreground">/ {format.number(schedule.duty_limit)}</span></div></div>)}{!schedule.overview.distribution.length && <div className="p-10 text-center text-sm font-semibold text-muted-foreground">{t('noEligibleMembers')}</div>}</div></section>
}

function DutyDetailsDrawer({ value, userId, canManage, onOpenChange, onRelease, onSwap, onAssign, onUnassign }: { value: { slot: BazarDutySlot; date: BazarScheduleDate } | null; userId?: string; canManage: boolean; onOpenChange: (open: boolean) => void; onRelease: () => void; onSwap: (slot: BazarDutySlot) => void; onAssign: (slot: BazarDutySlot) => void; onUnassign: () => void }) {
  const mine = value?.slot.assigned_member_id === userId
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const t = useTranslations('bazarSchedule')
  return <EnterpriseDetailsDrawer open={Boolean(value)} onOpenChange={onOpenChange} eyebrow={t('dutyDetails')} title={value ? formatBazarDate(value.date.duty_date, locale, { weekday: 'long', month: 'long', day: 'numeric' }) : t('bazarDuty')} description={value ? t('slotOf', { slot: format.number(value.slot.slot_number), total: format.number(value.date.required_members) }) : undefined} headerIcon={<CalendarCheck2 className="size-5" />} status={value ? <span className="rounded-full bg-[var(--brand-soft)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--brand-dark)]">{statusLabel(slotStatus(value.slot), locale)}</span> : undefined} footer={value && (mine || canManage) ? <EnterpriseDrawerFooter>{mine && <><EnterpriseDrawerAction tone="secondary" onClick={() => onSwap(value.slot)}><ArrowLeftRight className="size-4" /> {t('requestSwap')}</EnterpriseDrawerAction><EnterpriseDrawerAction tone="warning" onClick={onRelease}><Clock3 className="size-4" /> {t('releaseDuty')}</EnterpriseDrawerAction></>}{canManage && <><EnterpriseDrawerAction tone="secondary" onClick={() => onAssign(value.slot)}><UserPlus className="size-4" /> {value.slot.assigned_member_id ? t('reassign') : t('assign')}</EnterpriseDrawerAction>{value.slot.assigned_member_id && <EnterpriseDrawerAction tone="danger" onClick={onUnassign}><X className="size-4" /> {t('unassign')}</EnterpriseDrawerAction>}</>}</EnterpriseDrawerFooter> : undefined}>{value && <div className="space-y-4"><section className="rounded-2xl bg-[var(--dashboard-surface)] p-5 "><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--brand)]">{t('assignedMember')}</p>{value.slot.assigned_member ? <div className="mt-4 flex items-center gap-3"><span className="grid size-12 place-items-center rounded-xl bg-[var(--brand)] text-sm font-bold text-primary-foreground">{getInitials(value.slot.assigned_member.name)}</span><div><h3 className="font-semibold text-[var(--dashboard-ink)]">{mine ? t('you') : value.slot.assigned_member.name}</h3><p className="text-sm font-medium text-muted-foreground">{value.slot.assigned_member.email}</p></div></div> : <p className="mt-3 text-sm font-semibold text-muted-foreground">{t('slotAvailable')}</p>}</section><div className="grid grid-cols-2 gap-3"><InfoTile label={t('requiredPeople')} value={format.number(value.date.required_members)} /><InfoTile label={t('dateStatus')} value={statusLabel(dateStatus(value.date), locale)} /></div>{value.slot.last_reason && <section className="rounded-2xl bg-[var(--dashboard-surface)] p-5 "><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('latestNote')}</p><p className="mt-2 text-sm font-medium leading-6 text-[var(--dashboard-ink)]">{value.slot.last_reason}</p></section>}</div>}</EnterpriseDetailsDrawer>
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-[var(--dashboard-surface)] p-4 "><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1.5 text-sm font-semibold capitalize text-[var(--dashboard-ink)]">{value.toLowerCase()}</p></div>
}

function AssignDialog({ open, onOpenChange, members, memberId, onMemberChange, reason, onReasonChange, busy, onSubmit }: { open: boolean; onOpenChange: (open: boolean) => void; members: Array<{ id: string; name: string }>; memberId: string; onMemberChange: (value: string) => void; reason: string; onReasonChange: (value: string) => void; busy: boolean; onSubmit: () => void }) {
  const t = useTranslations('bazarSchedule')
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] sm:max-w-lg"><DialogHeader><DialogTitle className="text-[var(--dashboard-ink)]">{t('assignBazarDuty')}</DialogTitle><DialogDescription>{t('assignDescription')}</DialogDescription></DialogHeader><div className="space-y-4 py-2"><div className="space-y-2"><Label>{t('member')}</Label><EnterpriseSelect value={memberId} onValueChange={onMemberChange} options={members.map((member) => ({ value: member.id, label: member.name }))} placeholder={t('chooseMember')} /></div><div className="space-y-2"><Label htmlFor="assign-note">{t('managerNote')}</Label><Textarea id="assign-note" value={reason} onChange={(event) => onReasonChange(event.target.value)} placeholder={t('assignmentReasonPlaceholder')} className="min-h-24 rounded-xl border-[var(--dashboard-line)]" /></div></div><DialogFooter><EnterpriseButton tone="secondary" onClick={() => onOpenChange(false)}>{t('cancel')}</EnterpriseButton><EnterpriseButton onClick={onSubmit} disabled={!memberId || busy}>{busy ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />} {t('assignDuty')}</EnterpriseButton></DialogFooter></DialogContent></Dialog>
}

function ReasonDialog({ open, onOpenChange, title, description, reason, onReasonChange, actionLabel, busy, onSubmit }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description: string; reason: string; onReasonChange: (value: string) => void; actionLabel: string; busy: boolean; onSubmit: () => void }) {
  const t = useTranslations('bazarSchedule')
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] sm:max-w-lg"><DialogHeader><DialogTitle className="text-[var(--dashboard-ink)]">{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader><div className="space-y-2 py-2"><Label htmlFor="duty-action-reason">{t('reason')}</Label><Textarea id="duty-action-reason" value={reason} onChange={(event) => onReasonChange(event.target.value)} placeholder={t('clearReasonPlaceholder')} className="min-h-28 rounded-xl border-[var(--dashboard-line)]" /></div><DialogFooter><EnterpriseButton tone="secondary" onClick={() => onOpenChange(false)}>{t('cancel')}</EnterpriseButton><EnterpriseButton tone="warning" onClick={onSubmit} disabled={!reason.trim() || busy}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Clock3 className="size-4" />}{actionLabel}</EnterpriseButton></DialogFooter></DialogContent></Dialog>
}

function SwapDialog({ open, onOpenChange, targets, targetId, onTargetChange, reason, onReasonChange, busy, onSubmit }: { open: boolean; onOpenChange: (open: boolean) => void; targets: Array<{ slot: BazarDutySlot; date: BazarScheduleDate }>; targetId: string; onTargetChange: (value: string) => void; reason: string; onReasonChange: (value: string) => void; busy: boolean; onSubmit: () => void }) {
  const { locale } = useLocale()
  const t = useTranslations('bazarSchedule')
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[88vh] overflow-y-auto border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] sm:max-w-xl"><DialogHeader><DialogTitle className="text-[var(--dashboard-ink)]">{t('requestDutySwap')}</DialogTitle><DialogDescription>{t('swapDescription')}</DialogDescription></DialogHeader><div className="space-y-4 py-2"><div className="space-y-2"><Label>{t('swapWith')}</Label><div className="grid gap-2">{targets.map(({ slot, date }) => <button key={slot.id} type="button" onClick={() => onTargetChange(slot.id)} className={cn('flex items-center gap-3 rounded-xl border p-3 text-left transition', targetId === slot.id ? 'border-[var(--brand)] bg-[var(--brand-soft)] ' : 'border-[var(--dashboard-line)] hover:border-[var(--brand-border)]')}><span className="grid size-10 place-items-center rounded-xl bg-[var(--dashboard-surface-subtle)] text-xs font-bold text-[var(--brand-dark)]">{getInitials(slot.assigned_member?.name ?? 'M')}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-[var(--dashboard-ink)]">{slot.assigned_member?.name}</span><span className="block text-xs font-medium text-muted-foreground">{formatBazarDate(date.duty_date, locale, { weekday: 'short', month: 'short', day: 'numeric' })}</span></span>{targetId === slot.id && <CheckCircle2 className="size-5 text-[var(--brand)]" />}</button>)}{!targets.length && <div className="rounded-xl bg-[var(--dashboard-surface-subtle)] p-5 text-center text-sm font-semibold text-muted-foreground">{t('noSwapTargets')}</div>}</div></div><div className="space-y-2"><Label htmlFor="swap-note">{t('noteOptional')}</Label><Textarea id="swap-note" value={reason} onChange={(event) => onReasonChange(event.target.value)} placeholder={t('swapReasonPlaceholder')} className="min-h-24 rounded-xl border-[var(--dashboard-line)]" /></div></div><DialogFooter><EnterpriseButton tone="secondary" onClick={() => onOpenChange(false)}>{t('cancel')}</EnterpriseButton><EnterpriseButton onClick={onSubmit} disabled={!targetId || busy}>{busy ? <Loader2 className="size-4 animate-spin" /> : <ArrowLeftRight className="size-4" />} {t('sendRequest')}</EnterpriseButton></DialogFooter></DialogContent></Dialog>
}

function ManageDateDrawer({ date, open, onOpenChange, capacity, onCapacityChange, reason, onReasonChange, busy, onSaveCapacity, onToggleStatus }: { date: BazarScheduleDate | null; open: boolean; onOpenChange: (open: boolean) => void; capacity: number; onCapacityChange: (value: number) => void; reason: string; onReasonChange: (value: string) => void; busy: boolean; onSaveCapacity: () => void; onToggleStatus: () => void }) {
  const assigned = date?.slots.filter((slot) => slot.status === 'ASSIGNED').length ?? 0
  const isOpen = date ? dateStatus(date) === 'OPEN' : false
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const t = useTranslations('bazarSchedule')
  return <EnterpriseDetailsDrawer open={open} onOpenChange={onOpenChange} eyebrow={t('managerControl')} title={date ? formatBazarDate(date.duty_date, locale, { weekday: 'long', month: 'long', day: 'numeric' }) : t('manageDate')} description={date ? t('assignedRequired', { assigned: format.number(assigned), required: format.number(date.required_members) }) : undefined} headerIcon={<Settings2 className="size-5" />} status={date ? <span className={cn('rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider', isOpen ? 'bg-primary/10 text-primary dark:bg-primary/10 dark:text-primary' : 'bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground')}>{statusLabel(dateStatus(date), locale)}</span> : undefined} footer={<EnterpriseDrawerFooter><EnterpriseDrawerAction tone={isOpen ? 'danger' : 'success'} onClick={onToggleStatus} disabled={busy || (isOpen && assigned > 0) || !reason.trim()}>{isOpen ? <LockKeyhole className="size-4" /> : <CheckCircle2 className="size-4" />}{isOpen ? t('closeDate') : t('reopenDate')}</EnterpriseDrawerAction><EnterpriseDrawerAction priority="primary" tone="primary" onClick={onSaveCapacity} disabled={busy || !reason.trim() || capacity < assigned}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Users className="size-4" />} {t('saveCapacity')}</EnterpriseDrawerAction></EnterpriseDrawerFooter>}>{date && <div className="space-y-5"><section className="rounded-2xl bg-[var(--dashboard-surface)] p-5 "><Label htmlFor="date-capacity">{t('peopleRequiredDate')}</Label><Input id="date-capacity" type="number" min={Math.max(1, assigned)} max={50} value={capacity} onChange={(event) => onCapacityChange(Math.max(1, Number(event.target.value)))} className="mt-3 h-12 rounded-xl border-[var(--dashboard-line)] font-semibold" /><p className="mt-2 text-xs font-medium text-muted-foreground">{t('capacityHint', { assigned: format.number(assigned) })}</p></section><section className="rounded-2xl bg-[var(--dashboard-surface)] p-5 "><Label htmlFor="date-reason">{t('reasonForChange')}</Label><Textarea id="date-reason" value={reason} onChange={(event) => onReasonChange(event.target.value)} placeholder={t('auditPlaceholder')} className="mt-3 min-h-28 rounded-xl border-[var(--dashboard-line)]" /></section>{isOpen && assigned > 0 && <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-xs font-semibold leading-5 text-primary dark:border-primary/30 dark:bg-primary/10 dark:text-primary">{t('releaseBeforeClose')}</div>}</div>}</EnterpriseDetailsDrawer>
}

function GenerateScheduleDialog({ open, onOpenChange, month, isLate, acknowledged, onAcknowledgedChange, busy, onConfirm }: { open: boolean; onOpenChange: (open: boolean) => void; month: string; isLate: boolean; acknowledged: boolean; onAcknowledgedChange: (checked: boolean) => void; busy: boolean; onConfirm: () => void }) {
  const t = useTranslations('bazarSchedule')
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] sm:max-w-lg">
        <DialogHeader>
          <div className="mb-2 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/10 dark:text-primary">
            <AlertCircle className="size-5" />
          </div>
          <DialogTitle className="text-[var(--dashboard-ink)]">
            {isLate ? t('confirmLateGeneration') : t('confirmGeneration')}
          </DialogTitle>
          <DialogDescription>
            {t('reviewBeforePublishing', { month })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {isLate && (
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm font-medium leading-6 text-primary dark:border-primary/30 dark:bg-primary/10 dark:text-primary">
              {t('lateGenerationWarning')}
            </div>
          )}
          <div className="rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-surface-subtle)] p-4 text-sm font-medium leading-6 text-[var(--dashboard-ink)]">
            {t('generationFinalWarning')}
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--dashboard-line)] p-4 transition hover:border-[var(--brand-border)]">
            <Checkbox checked={acknowledged} onCheckedChange={(checked) => onAcknowledgedChange(checked === true)} className="mt-0.5" />
            <span className="text-sm font-semibold leading-5 text-[var(--dashboard-ink)]">
              {t('generationAcknowledgement')}
            </span>
          </label>
        </div>

        <DialogFooter>
          <EnterpriseButton tone="secondary" onClick={() => onOpenChange(false)} disabled={busy}>{t('cancel')}</EnterpriseButton>
          <EnterpriseButton tone="warning" onClick={onConfirm} disabled={!acknowledged || busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <CalendarCheck2 className="size-4" />}
            {busy ? t('generating') : isLate ? t('generateLateSchedule') : t('generateSchedule')}
          </EnterpriseButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AddDateDialog({ open, onOpenChange, month, date, onDateChange, capacity, onCapacityChange, reason, onReasonChange, busy, onSubmit }: { open: boolean; onOpenChange: (open: boolean) => void; month: string; date: string; onDateChange: (value: string) => void; capacity: number; onCapacityChange: (value: number) => void; reason: string; onReasonChange: (value: string) => void; busy: boolean; onSubmit: () => void }) {
  const t = useTranslations('bazarSchedule')
  const lastDay = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate()
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] sm:max-w-lg"><DialogHeader><DialogTitle className="text-[var(--dashboard-ink)]">{t('addBazarDate')}</DialogTitle><DialogDescription>{t('addDateDescription')}</DialogDescription></DialogHeader><div className="grid gap-4 py-2 sm:grid-cols-2"><div className="space-y-2"><Label>{t('date')}</Label><EnterpriseDatePicker value={date} onValueChange={onDateChange} min={`${month}-01`} max={`${month}-${String(lastDay).padStart(2, '0')}`} className="h-12 w-full" align="start" ariaLabel={t('selectNewDate')} /></div><div className="space-y-2"><Label htmlFor="new-bazar-capacity">{t('peopleRequired')}</Label><Input id="new-bazar-capacity" type="number" min={1} max={50} value={capacity} onChange={(event) => onCapacityChange(Math.max(1, Number(event.target.value)))} className="h-12 rounded-xl border-[var(--dashboard-line)]" /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="new-bazar-reason">{t('reason')}</Label><Textarea id="new-bazar-reason" value={reason} onChange={(event) => onReasonChange(event.target.value)} placeholder={t('addDateReasonPlaceholder')} className="min-h-24 rounded-xl border-[var(--dashboard-line)]" /></div></div><DialogFooter><EnterpriseButton tone="secondary" onClick={() => onOpenChange(false)}>{t('cancel')}</EnterpriseButton><EnterpriseButton onClick={onSubmit} disabled={!date || !reason.trim() || busy}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} {t('addDate')}</EnterpriseButton></DialogFooter></DialogContent></Dialog>
}
