'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Building2, CalendarClock, CircleCheck, CircleDashed, CirclePause, Search, SlidersHorizontal, UsersRound, type LucideIcon } from 'lucide-react'
import { DashboardHeader } from '@/components/dashboard-header'
import { PatternOverviewCard } from '@/components/meal-pattern/pattern-overview-card'
import { MemberPatternList, type MemberPatternRow } from '@/components/meal-pattern/member-pattern-list'
import { PatternDetailsDrawer, type PatternAction } from '@/components/meal-pattern/pattern-details-drawer'
import { EnterpriseSelect } from '@/components/ui/enterprise-select'
import { useAuth } from '@/app/context/auth-context'
import { apiClient, type MealPattern, type MealPatternStatus, type Mess } from '@/lib/api-client'
import { useMealPatternDashboard } from '@/hooks/use-meal-pattern-dashboard'
import { localizedErrorMessage, statusLabel, useLocale, useLocaleFormatters, useTranslations } from '@/lib/i18n'
import { getPatternCurrentVersion, isPatternConfigurable } from '@/lib/meal-pattern'
import { swrFetcher } from '@/lib/swr-fetcher'

type StatusFilter = 'ALL' | MealPatternStatus | 'NOT_SET'

function StatCard({ label, value, icon: Icon, tone }: { label: string; value: number; icon: LucideIcon; tone: string }) {
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
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const t = useTranslations('mealPatterns')
  const router = useRouter()
  const [activeMessId, setActiveMessId] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [selectedMembershipId, setSelectedMembershipId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const statusOptions: Array<{ value: StatusFilter; label: string }> = [
    { value: 'ALL', label: t('page.allMembers') },
    { value: 'ACTIVE', label: statusLabel('ACTIVE', locale) },
    { value: 'PAUSED', label: statusLabel('PAUSED', locale) },
    { value: 'DRAFT', label: statusLabel('DRAFT', locale) },
    { value: 'NOT_SET', label: t('page.notConfigured') },
    { value: 'ENDED', label: t('page.finished') },
  ]

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
      setMessage(action === 'pause' ? t('page.pausedMessage') : action === 'resume' ? t('page.activeMessage') : t('page.endedMessage'))
    } catch (error) {
      setMessageType('error')
      setMessage(localizedErrorMessage(error, locale, t('page.updateError')))
      throw error
    }
  }

  const loading = messesLoading || (Boolean(activeMess) && patternsLoading)
  const pageError = messesError || patternsError

  return (
    <div className="min-h-screen bg-transparent">
      <DashboardHeader title={t('page.title')} description={isManager ? t('page.managerDescription') : t('page.memberDescription')} showQuickAddButton={false} />

      <div className="p-4 sm:p-6 lg:p-8">
        {message && <div role="status" className={`mb-5 rounded-xl border px-4 py-3 text-sm font-semibold ${messageType === 'error' ? 'border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/30 dark:bg-destructive/10 dark:text-destructive' : 'border-primary/30 bg-primary/10 text-primary dark:border-primary/30 dark:bg-primary/10 dark:text-primary'}`}>{message}</div>}

        {loading ? <PageSkeleton /> : pageError ? (
          <section className="dashboard-card py-14 text-center"><CalendarClock className="mx-auto size-10 text-destructive" /><h2 className="mt-4 text-lg font-semibold text-foreground">{t('page.loadError')}</h2><p className="mt-1 text-sm font-semibold text-muted-foreground">{localizedErrorMessage(pageError, locale, t('page.loadError'))}</p><button type="button" onClick={() => void refreshPatterns()} className="mt-5 min-h-11 rounded-xl bg-[var(--brand)] px-5 text-sm font-semibold text-primary-foreground">{t('page.tryAgain')}</button></section>
        ) : !activeMess ? (
          <section className="dashboard-card py-14 text-center"><UsersRound className="mx-auto size-10 text-muted-foreground" /><h2 className="mt-4 text-lg font-semibold text-foreground">{t('page.joinTitle')}</h2><p className="mt-1 text-sm font-semibold text-muted-foreground">{t('page.joinDescription')}</p></section>
        ) : !visibleMemberships.length ? (
          <section className="dashboard-card py-14 text-center"><UsersRound className="mx-auto size-10 text-muted-foreground" /><h2 className="mt-4 text-lg font-semibold text-foreground">{t('page.membershipTitle')}</h2><p className="mt-1 text-sm font-semibold text-muted-foreground">{t('page.membershipDescription')}</p></section>
        ) : isManager ? (
          <>
            <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
              <StatCard label={t('page.active')} value={stats.active} icon={CircleCheck} tone="bg-primary/10 text-primary dark:bg-primary/10 dark:text-primary" />
              <StatCard label={t('page.paused')} value={stats.paused} icon={CirclePause} tone="bg-primary/10 text-primary dark:bg-primary/10 dark:text-primary" />
              <StatCard label={t('page.draft')} value={stats.draft} icon={CircleDashed} tone="bg-primary/10 text-primary dark:bg-primary/10 dark:text-primary" />
              <StatCard label={t('page.notSet')} value={stats.notSet} icon={UsersRound} tone="bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground" />
            </div>

            <section className="dashboard-card mb-5 flex flex-col gap-4 p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between">
              <div><h2 className="text-xl font-semibold text-foreground">{t('page.memberSchedules')}</h2><p className="mt-1 text-sm font-semibold text-muted-foreground">{t('page.activeMembers', { name: activeMess.name, count: format.number(rows.length) })}</p></div>
              <div className="grid w-full gap-2 sm:grid-cols-2 xl:w-auto xl:grid-cols-[minmax(16rem,20rem)_auto_auto]">
                <label className="relative sm:col-span-2 xl:col-span-1"><span className="sr-only">{t('page.searchMembers')}</span><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('page.searchPlaceholder')} className="h-11 w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] pl-10 pr-3 text-sm font-semibold text-foreground outline-none transition focus:border-[var(--brand)] focus:ring-3 focus:ring-[var(--brand-ring)]" /></label>
                {messes.length > 1 && (
                  <EnterpriseSelect
                    value={activeMess.id}
                    onValueChange={(value) => { setActiveMessId(value); setSelectedMembershipId(null) }}
                    options={messes.map((mess) => ({ value: mess.id, label: mess.name }))}
                    ariaLabel={t('page.chooseMess')}
                    align="end"
                    icon={<Building2 className="size-4" />}
                    className="w-full min-w-44"
                  />
                )}
                <EnterpriseSelect
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as StatusFilter)}
                  options={statusOptions}
                  ariaLabel={t('page.filterStatus')}
                  align="end"
                  icon={<SlidersHorizontal className="size-4" />}
                  className="w-full min-w-44"
                />
              </div>
            </section>

            <MemberPatternList rows={filteredRows} onView={(row) => setSelectedMembershipId(row.membership.id)} onSetup={setupRow} />
          </>
        ) : (
          <PatternOverviewCard pattern={ownRow?.pattern ?? null} onSetup={setupOwn} onView={ownRow?.pattern ? () => setSelectedMembershipId(ownRow.membership.id) : undefined} />
        )}
      </div>

      <PatternDetailsDrawer row={selectedRow} open={Boolean(selectedRow)} onOpenChange={(open) => !open && setSelectedMembershipId(null)} onEdit={setupRow} onAction={handlePatternAction} />
    </div>
  )
}
