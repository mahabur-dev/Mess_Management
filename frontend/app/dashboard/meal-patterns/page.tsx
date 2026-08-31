'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Building2, CalendarClock, CircleCheck, CircleDashed, CirclePause, Search, SlidersHorizontal, UsersRound } from 'lucide-react'
import { DashboardHeader } from '@/components/dashboard-header'
import { PatternOverviewCard } from '@/components/meal-pattern/pattern-overview-card'
import { MemberPatternList, type MemberPatternRow } from '@/components/meal-pattern/member-pattern-list'
import { PatternDetailsDrawer, type PatternAction } from '@/components/meal-pattern/pattern-details-drawer'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/app/context/auth-context'
import { apiClient, type MealPattern, type MealPatternStatus, type Mess } from '@/lib/api-client'
import { useMealPatternDashboard } from '@/hooks/use-meal-pattern-dashboard'
import { getPatternCurrentVersion, isPatternConfigurable } from '@/lib/meal-pattern'
import { swrFetcher } from '@/lib/swr-fetcher'

type StatusFilter = 'ALL' | MealPatternStatus | 'NOT_SET'

const statusOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: 'ALL', label: 'All members' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'NOT_SET', label: 'Not configured' },
  { value: 'ENDED', label: 'Finished' },
]

function StatCard({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof CircleCheck; tone: string }) {
  return (
    <div className="dashboard-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold text-foreground">{value}</p></div>
        <span className={`grid size-11 place-items-center rounded-xl ${tone}`}><Icon className="size-5" /></span>
      </div>
    </div>
  )
}

function PageSkeleton() {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="dashboard-card min-h-28 animate-pulse bg-[var(--dashboard-surface-subtle)]" />)}</div>
}

export default function MealPatternsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeMessId, setActiveMessId] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [selectedMembershipId, setSelectedMembershipId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  const { data: messesData, error: messesError, isLoading: messesLoading } = useSWR(
    user ? 'meal-pattern-messes' : null,
    () => swrFetcher(() => apiClient.getMesses()),
    { revalidateOnFocus: true, dedupingInterval: 15_000 },
  )
  const messes = useMemo(() => Array.isArray(messesData) ? messesData : messesData ? [messesData as Mess] : [], [messesData])

  useEffect(() => {
    if (!activeMessId && messes[0]?.id) setActiveMessId(messes[0].id)
    if (activeMessId && messes.length && !messes.some((mess) => mess.id === activeMessId)) setActiveMessId(messes[0].id)
  }, [activeMessId, messes])

  const activeMess = messes.find((mess) => mess.id === activeMessId) ?? messes[0]
  const activeMemberships = useMemo(
    () => (activeMess?.memberships ?? []).filter((membership) => membership.is_active),
    [activeMess?.memberships],
  )
  const ownMembership = activeMemberships.find((membership) => membership.user_id === user?.id)
  const isManager = Boolean(
    user?.role === 'ADMIN' ||
    activeMess?.created_by === user?.id ||
    ownMembership?.role === 'MANAGER',
  )
  const visibleMemberships = isManager ? activeMemberships : ownMembership ? [ownMembership] : []
  const membershipIds = useMemo(() => visibleMemberships.map((membership) => membership.id), [visibleMemberships])
  const { data: patternsByMembership = {}, error: patternsError, isLoading: patternsLoading, mutate: refreshPatterns } = useMealPatternDashboard(activeMess?.id, membershipIds, isManager)

  const rows = useMemo<MemberPatternRow[]>(() => visibleMemberships.map((membership) => {
    const history = patternsByMembership[membership.id] ?? []
    return { membership, history, pattern: getPatternCurrentVersion(history) }
  }), [patternsByMembership, visibleMemberships])

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    return rows.filter((row) => {
      const matchesSearch = !query || `${row.membership.user?.name ?? ''} ${row.membership.user?.email ?? ''}`.toLowerCase().includes(query)
      const matchesStatus = statusFilter === 'ALL'
        || (statusFilter === 'NOT_SET' ? !row.pattern : row.pattern?.status === statusFilter)
      return matchesSearch && matchesStatus
    })
  }, [rows, search, statusFilter])

  const selectedRow = rows.find((row) => row.membership.id === selectedMembershipId) ?? null
  const ownRow = rows.find((row) => row.membership.id === ownMembership?.id) ?? null
  const stats = {
    active: rows.filter((row) => row.pattern?.status === 'ACTIVE').length,
    paused: rows.filter((row) => row.pattern?.status === 'PAUSED').length,
    draft: rows.filter((row) => row.pattern?.status === 'DRAFT').length,
    notSet: rows.filter((row) => !row.pattern).length,
  }

  const setupRow = (row: MemberPatternRow) => {
    const params = new URLSearchParams({ messId: activeMess?.id ?? row.membership.mess_id, membershipId: row.membership.id })
    if (row.pattern && isPatternConfigurable(row.pattern)) params.set('patternId', row.pattern.id)
    router.push(`/dashboard/meal-patterns/setup?${params.toString()}`)
  }

  const setupOwn = () => {
    if (!ownMembership || !activeMess) return
    const params = new URLSearchParams({ messId: activeMess.id, membershipId: ownMembership.id })
    if (ownRow?.pattern && isPatternConfigurable(ownRow.pattern)) params.set('patternId', ownRow.pattern.id)
    router.push(`/dashboard/meal-patterns/setup?${params.toString()}`)
  }

  const handlePatternAction = async (pattern: MealPattern, action: PatternAction) => {
    setMessage('')
    try {
      if (action === 'pause') await apiClient.pauseMealPattern(pattern.id)
      if (action === 'resume') await apiClient.resumeMealPattern(pattern.id)
      if (action === 'cancel') await apiClient.cancelMealPattern(pattern.id)
      await refreshPatterns()
      setMessageType('success')
      setMessage(action === 'pause' ? 'Meal pattern paused.' : action === 'resume' ? 'Meal pattern is active.' : 'Meal pattern ended.')
    } catch (error) {
      setMessageType('error')
      setMessage(error instanceof Error ? error.message : 'Could not update the meal pattern.')
      throw error
    }
  }

  const loading = messesLoading || (Boolean(activeMess) && patternsLoading)
  const pageError = messesError || patternsError

  return (
    <div className="min-h-screen bg-transparent">
      <DashboardHeader title="Meal Patterns" description={isManager ? 'Set up automatic meal routines for every member' : 'Your simple, automatic meal planning'} showQuickAddButton={false} />

      <main className="p-4 sm:p-6 lg:p-8">
        {message && <div role="status" className={`mb-5 rounded-xl border px-4 py-3 text-sm font-bold ${messageType === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300'}`}>{message}</div>}

        {loading ? <PageSkeleton /> : pageError ? (
          <section className="dashboard-card py-14 text-center"><CalendarClock className="mx-auto size-10 text-rose-500" /><h2 className="mt-4 text-lg font-semibold text-foreground">Could not load meal patterns</h2><p className="mt-1 text-sm font-semibold text-muted-foreground">{pageError instanceof Error ? pageError.message : 'Please try again.'}</p><button type="button" onClick={() => void refreshPatterns()} className="mt-5 min-h-11 rounded-xl bg-[var(--brand)] px-5 text-sm font-semibold text-white">Try again</button></section>
        ) : !activeMess ? (
          <section className="dashboard-card py-14 text-center"><UsersRound className="mx-auto size-10 text-muted-foreground" /><h2 className="mt-4 text-lg font-semibold text-foreground">Join a mess first</h2><p className="mt-1 text-sm font-semibold text-muted-foreground">Meal patterns become available after your mess membership is active.</p></section>
        ) : !visibleMemberships.length ? (
          <section className="dashboard-card py-14 text-center"><UsersRound className="mx-auto size-10 text-muted-foreground" /><h2 className="mt-4 text-lg font-semibold text-foreground">No active membership found</h2><p className="mt-1 text-sm font-semibold text-muted-foreground">Ask the mess manager to confirm the membership.</p></section>
        ) : isManager ? (
          <>
            <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
              <StatCard label="Active" value={stats.active} icon={CircleCheck} tone="bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300" />
              <StatCard label="Paused" value={stats.paused} icon={CirclePause} tone="bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300" />
              <StatCard label="Draft" value={stats.draft} icon={CircleDashed} tone="bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300" />
              <StatCard label="Not set" value={stats.notSet} icon={UsersRound} tone="bg-slate-100 text-slate-600 dark:bg-slate-400/15 dark:text-slate-300" />
            </div>

            <section className="dashboard-card mb-5 flex flex-col gap-4 p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between">
              <div><h2 className="text-xl font-semibold text-foreground">Member schedules</h2><p className="mt-1 text-sm font-semibold text-muted-foreground">{activeMess.name} · {rows.length} active members</p></div>
              <div className="grid w-full gap-2 sm:grid-cols-2 xl:w-auto xl:grid-cols-[minmax(16rem,20rem)_auto_auto]">
                <label className="relative sm:col-span-2 xl:col-span-1"><span className="sr-only">Search members</span><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search member" className="h-11 w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] pl-10 pr-3 text-sm font-semibold text-foreground outline-none transition focus:border-[var(--brand)] focus:ring-3 focus:ring-[var(--brand-ring)]" /></label>
                {messes.length > 1 && (
                  <Select value={activeMess.id} onValueChange={(value) => { setActiveMessId(value); setSelectedMembershipId(null) }}>
                    <SelectTrigger aria-label="Choose mess" className="h-11 w-full min-w-44 rounded-xl border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] px-3 font-semibold shadow-none"><Building2 className="size-4 text-[var(--brand)]" /><SelectValue /></SelectTrigger>
                    <SelectContent align="end" collisionPadding={16} className="rounded-xl border-[var(--dashboard-line)] bg-[var(--dashboard-surface-raised)] p-1 shadow-[var(--dashboard-shadow-lg)]">{messes.map((mess) => <SelectItem key={mess.id} value={mess.id} className="min-h-10 rounded-lg font-bold">{mess.name}</SelectItem>)}</SelectContent>
                  </Select>
                )}
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                  <SelectTrigger aria-label="Filter by pattern status" className="h-11 w-full min-w-44 rounded-xl border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] px-3 font-semibold shadow-none"><SlidersHorizontal className="size-4 text-[var(--brand)]" /><SelectValue /></SelectTrigger>
                  <SelectContent align="end" collisionPadding={16} className="rounded-xl border-[var(--dashboard-line)] bg-[var(--dashboard-surface-raised)] p-1 shadow-[var(--dashboard-shadow-lg)]">{statusOptions.map((option) => <SelectItem key={option.value} value={option.value} className="min-h-10 rounded-lg font-bold">{option.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </section>

            <MemberPatternList rows={filteredRows} onView={(row) => setSelectedMembershipId(row.membership.id)} onSetup={setupRow} />
          </>
        ) : (
          <PatternOverviewCard pattern={ownRow?.pattern ?? null} onSetup={setupOwn} onView={ownRow?.pattern ? () => setSelectedMembershipId(ownRow.membership.id) : undefined} />
        )}
      </main>

      <PatternDetailsDrawer row={selectedRow} open={Boolean(selectedRow)} onOpenChange={(open) => !open && setSelectedMembershipId(null)} onEdit={setupRow} onAction={handlePatternAction} />
    </div>
  )
}
