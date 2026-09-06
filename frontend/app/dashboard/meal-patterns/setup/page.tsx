'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import { ArrowLeft, ArrowRight, Check, ShieldCheck, UserRound } from 'lucide-react'
import { DashboardHeader } from '@/components/dashboard-header'
import { Button } from '@/components/ui/button'
import { PatternSetupWizard } from '@/components/meal-pattern/pattern-setup-wizard'
import { useAuth } from '@/app/context/auth-context'
import { apiClient, type CreateMealPatternInput, type MealPattern, type Mess } from '@/lib/api-client'
import { swrFetcher } from '@/lib/swr-fetcher'

function LoadingState() {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="h-16 animate-pulse rounded-2xl bg-[var(--dashboard-surface-subtle)]" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-64 animate-pulse rounded-2xl bg-[var(--dashboard-surface-subtle)]" />
        <div className="h-64 animate-pulse rounded-2xl bg-[var(--dashboard-surface-subtle)]" />
      </div>
    </div>
  )
}

export default function MealPatternSetupPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedMessId = searchParams.get('messId') ?? ''
  const requestedMembershipId = searchParams.get('membershipId') ?? ''
  const patternId = searchParams.get('patternId') ?? ''
  const [targetMembershipId, setTargetMembershipId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedPattern, setSavedPattern] = useState<MealPattern | null>(null)

  const { data: messesData, error: messesError, isLoading: messesLoading } = useSWR(
    user ? 'meal-pattern-setup-messes' : null,
    () => swrFetcher(() => apiClient.getMesses()),
    { revalidateOnFocus: false },
  )
  const messes = useMemo(() => Array.isArray(messesData) ? messesData : messesData ? [messesData as Mess] : [], [messesData])
  const activeMess = messes.find((mess) => mess.id === requestedMessId) ?? messes[0]
  const memberships = useMemo(() => (activeMess?.memberships ?? []).filter((membership) => membership.is_active), [activeMess?.memberships])
  const ownMembership = memberships.find((membership) => membership.user_id === user?.id)
  const isManager = Boolean(user?.role === 'ADMIN' || activeMess?.created_by === user?.id || ownMembership?.role === 'MANAGER')
  const allowedMemberships = isManager ? memberships : ownMembership ? [ownMembership] : []

  useEffect(() => {
    if (!allowedMemberships.length) return
    const requested = allowedMemberships.find((membership) => membership.id === requestedMembershipId)
    const currentIsAllowed = allowedMemberships.some((membership) => membership.id === targetMembershipId)
    if (!targetMembershipId || !currentIsAllowed) setTargetMembershipId(requested?.id ?? ownMembership?.id ?? allowedMemberships[0].id)
  }, [allowedMemberships, ownMembership?.id, requestedMembershipId, targetMembershipId])

  const targetMembership = allowedMemberships.find((membership) => membership.id === targetMembershipId)
  const { data: patternResponse, error: patternError, isLoading: patternLoading } = useSWR(
    patternId && targetMembershipId ? ['meal-pattern-edit', patternId] : null,
    () => apiClient.getMealPattern(patternId),
    { revalidateOnFocus: false },
  )
  const fetchedPattern = patternResponse?.data
  const initialPattern = fetchedPattern?.membership_id === targetMembershipId ? fetchedPattern : null

  const submitPattern = async (payload: CreateMealPatternInput, activate: boolean) => {
    setSaving(true)
    setError('')
    try {
      let saved: MealPattern
      if (initialPattern?.status === 'ACTIVE') {
        const response = await apiClient.createMealPattern({ ...payload, activate: true })
        saved = response.data
      } else if (initialPattern) {
        const { membershipId: _membershipId, activate: _activate, ...updatePayload } = payload
        const response = await apiClient.updateMealPattern(initialPattern.id, updatePayload)
        saved = response.data
        if (activate && initialPattern.status === 'DRAFT') {
          const activated = await apiClient.resumeMealPattern(saved.id)
          saved = activated.data
        }
      } else {
        const response = await apiClient.createMealPattern({ ...payload, activate })
        saved = response.data
      }
      setSavedPattern(saved)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the meal pattern.')
    } finally {
      setSaving(false)
    }
  }

  const loading = messesLoading || Boolean(patternId && patternLoading)
  const pageError = messesError || patternError

  return (
    <div className="min-h-screen bg-transparent">
      <DashboardHeader title={initialPattern ? 'Change Meal Pattern' : 'Set Meal Pattern'} description="A simple guided setup for automatic meals" showQuickAddButton={false} />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto mb-5 max-w-6xl">
          <Button type="button" variant="ghost" onClick={() => router.push('/dashboard/meal-patterns')} className="min-h-11 rounded-xl px-2 font-semibold text-muted-foreground"><ArrowLeft className="size-4" /> Back to meal patterns</Button>
        </div>

        {loading ? <LoadingState /> : pageError ? (
          <section className="dashboard-card mx-auto max-w-2xl py-14 text-center"><ShieldCheck className="mx-auto size-10 text-destructive" /><h1 className="mt-4 text-xl font-semibold text-foreground">Could not open pattern setup</h1><p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-muted-foreground">{pageError instanceof Error ? pageError.message : 'Please return and try again.'}</p><Button onClick={() => router.push('/dashboard/meal-patterns')} className="mt-5 min-h-11 rounded-xl bg-[var(--brand)] font-semibold text-primary-foreground">Return to patterns</Button></section>
        ) : !activeMess || !targetMembership ? (
          <section className="dashboard-card mx-auto max-w-2xl py-14 text-center"><UserRound className="mx-auto size-10 text-muted-foreground" /><h1 className="mt-4 text-xl font-semibold text-foreground">No active member available</h1><p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-muted-foreground">An active mess membership is required before a meal pattern can be set.</p><Button onClick={() => router.push('/dashboard/meal-patterns')} className="mt-5 min-h-11 rounded-xl bg-[var(--brand)] font-semibold text-primary-foreground">Return to patterns</Button></section>
        ) : savedPattern ? (
          <section className="dashboard-card relative mx-auto max-w-2xl overflow-hidden p-6 text-center sm:p-10">
            <span className="relative mx-auto grid size-20 place-items-center rounded-3xl bg-[var(--brand-soft)] text-[var(--brand)] "><Check className="size-10" strokeWidth={2.7} /></span>
            <p className="relative mt-6 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">Setup complete</p>
            <h1 className="relative mt-2 text-2xl font-semibold text-foreground sm:text-3xl">{savedPattern.status === 'ACTIVE' ? 'Meal pattern is active' : 'Meal pattern saved'}</h1>
            <p className="relative mx-auto mt-3 max-w-lg text-sm font-semibold leading-6 text-muted-foreground">{targetMembership.user?.name ?? 'This member'} now has a {savedPattern.pattern_type === 'DAILY' ? 'daily' : 'weekly'} meal routine. It can be changed whenever the routine changes.</p>
            <div className="relative mt-7 flex flex-col justify-center gap-2 sm:flex-row">
              <Button variant="outline" onClick={() => setSavedPattern(null)} className="min-h-12 rounded-xl px-5 font-semibold">Edit again</Button>
              <Button onClick={() => router.push('/dashboard/meal-patterns')} className="min-h-12 rounded-xl bg-[var(--brand)] px-6 font-semibold text-primary-foreground  hover:bg-[var(--brand-hover)]">View schedules <ArrowRight className="size-4" /></Button>
            </div>
          </section>
        ) : (
          <>
            {error && <div role="alert" className="mx-auto mb-5 max-w-6xl rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive dark:border-destructive/30 dark:bg-destructive/10 dark:text-destructive">{error}</div>}
            <PatternSetupWizard key={`${targetMembership.id}:${initialPattern?.id ?? 'new'}`} membershipId={targetMembership.id} memberName={targetMembership.user?.name ?? 'Mess member'} initialPattern={initialPattern} saving={saving} onSubmit={submitPattern} />
          </>
        )}
      </main>
    </div>
  )
}
