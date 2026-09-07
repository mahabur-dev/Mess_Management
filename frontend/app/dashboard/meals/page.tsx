'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/app/context/auth-context'
import { apiClient, ApiError, type AttendanceStatus, type MealName, type Mess } from '@/lib/api-client'
import { CalendarDays, Clock, Users, UtensilsCrossed, Coffee, Sun, Moon, Shield, Save, Pencil, Loader2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAutoDismissMessage } from '@/hooks/use-auto-dismiss-message'
import { MealQuantityControl } from '@/components/meal-pattern/meal-quantity-control'
import { clearAiCommandDraft, readAiCommandDraft, type AiCommandDraft } from '@/lib/ai-quick-add'
import { useRouter, useSearchParams } from 'next/navigation'
import { MonthlyMealDrawer } from '@/components/meals/monthly-meal-drawer'
import { EnterpriseDatePicker } from '@/components/ui/enterprise-date-picker'
import { localizedErrorMessage, mealNameLabel, useLocale, useTranslations } from '@/lib/i18n'

const mealNames: MealName[] = ['BREAKFAST', 'LUNCH', 'DINNER']
const MEAL_BASE_VALUE: Record<MealName, number> = {
  BREAKFAST: 0.5,
  LUNCH: 1,
  DINNER: 1,
}

function getMealBaseValue(mealName: MealName): number {
  return MEAL_BASE_VALUE[mealName] ?? 1
}

const MEAL_ICONS: Record<MealName, React.ReactNode> = {
  BREAKFAST: <Coffee size={22} />,
  LUNCH: <Sun size={22} />,
  DINNER: <Moon size={22} />,
}

type MealAttendance = { member_id: string; guests?: number | null; status: AttendanceStatus; member?: { id: string; name: string; email?: string } }
type MealEntry = { id: string; name: MealName; scheduled_date: string; status?: string; is_locked?: boolean; attendances?: MealAttendance[] }
type ActiveMember = { user_id: string; mess_id?: string; is_active: boolean; user?: { name?: string | null } }
type MemberMealRow = { id: string; name: string; meals: Record<MealName, number> }
type DeadlineInfo = { startTime: string; endTime: string; isWindowOpen: boolean; windowStartTime: string; windowEndTime: string }

function getMealCount(attendance: MealAttendance | undefined, mealName: MealName) {
  if (!attendance || attendance.status !== 'ON') return 0
  return getMealBaseValue(mealName) + Number(attendance.guests ?? 0)
}

const AVATAR_COLORS = ['var(--primary)']
const avatarColor = (name: string) => { let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h); return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length] }
const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
const formatTimeReadable = (time: string) => { const [h, m] = time.split(':').map(Number); const p = h >= 12 ? 'PM' : 'AM'; const hr = h % 12 || 12; return `${hr}:${m.toString().padStart(2, '0')} ${p}` }
const isPastDate = (value: string) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(value)
  target.setHours(0, 0, 0, 0)
  return target.getTime() < today.getTime()
}
function getErrorMessage(error: unknown, fallback: string) { return error instanceof Error ? error.message : fallback }

function aiMealItems(draft: AiCommandDraft) {
  if (!draft.payload) return []
  return (Array.isArray(draft.payload.items) ? draft.payload.items : [draft.payload]) as Record<string, unknown>[]
}

function aiMealCount(item: Record<string, unknown>, mealName: MealName) {
  const direct = Number(item.mealCount)
  if (Number.isFinite(direct)) return Math.max(0, direct)
  if (item.status === 'OFF') return 0
  const guests = Number(item.guests ?? 0)
  return getMealBaseValue(mealName) + (Number.isFinite(guests) ? Math.max(0, guests) : 0)
}

export default function MealsPage() {
  const { user } = useAuth()
  const { locale } = useLocale()
  const t = useTranslations('meals')
  const router = useRouter()
  const searchParams = useSearchParams()
  const aiCommandId = searchParams.get('aiCommand')
  const [messes, setMesses] = useState<Mess[]>([])
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [mealDrafts, setMealDrafts] = useState<Record<MealName, number>>({ BREAKFAST: 0, LUNCH: 0, DINNER: 0 })
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [members, setMembers] = useState<ActiveMember[]>([])
  useAutoDismissMessage(message, messageType, setMessage, setMessageType)
  const [todayMeals, setTodayMeals] = useState<MealEntry[]>([])
  const [sheetLoading, setSheetLoading] = useState(false)
  const [sheetError, setSheetError] = useState('')
  const [isEditingMealSheet, setIsEditingMealSheet] = useState(false)
  const [managerMealDrafts, setManagerMealDrafts] = useState<Record<string, Record<MealName, string>>>({})
  const [savingMealSheet, setSavingMealSheet] = useState(false)
  const [userMeals, setUserMeals] = useState<MealEntry[]>([])
  const [userMealsLoading, setUserMealsLoading] = useState(true)
  const [savingMeals, setSavingMeals] = useState(false)
  const [deadlineInfo, setDeadlineInfo] = useState<DeadlineInfo | null>(null)
  const [deadlineLoading, setDeadlineLoading] = useState(false)
  const [settingDeadline, setSettingDeadline] = useState(false)
  const [showDeadlineSettings, setShowDeadlineSettings] = useState(false)
  const [deadlineStartTime, setDeadlineStartTime] = useState('09:00')
  const [deadlineEndTime, setDeadlineEndTime] = useState('17:00')
  const [aiDraft, setAiDraft] = useState<AiCommandDraft | null>(null)
  const [aiTargetMemberId, setAiTargetMemberId] = useState<string | null>(null)
  const aiPrefillKeyRef = useRef<string | null>(null)

  const activeMess = messes[0] ?? user?.memberships?.[0]?.mess
  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER'
  const canViewMemberMealSheet = Boolean(user?.id)
  const isPastSelectedDate = isPastDate(date)
  const mealControlsLocked = userMealsLoading || (!isManager && deadlineInfo ? !deadlineInfo.isWindowOpen : false)

  function getManagerDraftStr(memberId: string, mealName: MealName, fallback: number) {
    const v = managerMealDrafts[memberId]?.[mealName]
    return v !== undefined ? v : String(fallback)
  }

  useEffect(() => {
    apiClient.getMesses().then(r => setMesses(Array.isArray(r.data) ? r.data : r.data ? [r.data] : [])).catch(() => setMesses(((user?.memberships?.map(i => i.mess).filter(Boolean) ?? []) as Mess[])))
  }, [user?.role])

  useEffect(() => {
    if (!aiCommandId || !activeMess || !user || aiDraft) return
    const draft = readAiCommandDraft(aiCommandId)
    if (!draft || draft.intent !== 'MEAL_CREATE' || !draft.payload) return
    const items = aiMealItems(draft)
    if (!items.length) return
    const targetMemberId = String(items[0].memberId ?? user.id)
    const targetDate = String(items[0].date ?? new Date().toISOString().slice(0, 10)).slice(0, 10)
    aiPrefillKeyRef.current = null
    if (targetMemberId === user.id) setUserMealsLoading(true)
    else setSheetLoading(true)
    setDate(targetDate)
    setAiTargetMemberId(targetMemberId)
    setAiDraft(draft)
  }, [activeMess, aiCommandId, aiDraft, user])

  useEffect(() => {
    let m = true
    async function loadDeadlineInfo() {
      if (!activeMess?.id) { setDeadlineInfo(null); return }
      setDeadlineLoading(true)
      try {
        const r = await apiClient.getMealDeadlineInfo(activeMess.id, date)
        if (!m) return
        setDeadlineInfo(r.data)
        setDeadlineStartTime(r.data.startTime)
        setDeadlineEndTime(r.data.endTime)
      } catch { if (!m) return; setDeadlineInfo({ startTime: '09:00', endTime: '17:00', isWindowOpen: true, windowStartTime: '09:00', windowEndTime: '17:00' }) }
      finally { if (m) setDeadlineLoading(false) }
    }
    loadDeadlineInfo()
    return () => { m = false }
  }, [activeMess?.id, date])

  useEffect(() => {
    let m = true
    async function loadUserMeals() {
      if (!activeMess?.id || !user?.id) { setUserMeals([]); setUserMealsLoading(false); return }
      setUserMealsLoading(true)
      try {
        const r = await apiClient.getMealsByMess(activeMess.id, { startDate: date, endDate: date, limit: 10 })
        if (!m) return
        const meals = Array.isArray(r.data) ? r.data as MealEntry[] : []
        const myMeals = meals.filter(meal => meal.attendances?.some(a => a.member_id === user.id))
        setUserMeals(myMeals)
        const drafts = { BREAKFAST: 0, LUNCH: 0, DINNER: 0 } as Record<MealName, number>
        myMeals.forEach(meal => {
          const attendance = meal.attendances?.find(a => a.member_id === user.id)
          if (attendance) drafts[meal.name] = getMealCount(attendance, meal.name)
        })
        setMealDrafts(drafts)
      } catch (e) { if (!m) return; console.error('Failed to load user meals:', e) }
      finally { if (m) setUserMealsLoading(false) }
    }
    loadUserMeals()
    return () => { m = false }
  }, [activeMess?.id, date, user?.id])

  useEffect(() => {
    let m = true
    async function loadManagerMealSheet() {
      if (!canViewMemberMealSheet || !activeMess?.id) { setMembers([]); setTodayMeals([]); return }
      setSheetLoading(true); setSheetError('')
      try {
        const [memR, mealR] = await Promise.all([
          isManager ? apiClient.getMealMembers(activeMess.id).catch(() => null) : Promise.resolve(null),
          apiClient.getMealsByMess(activeMess.id, { startDate: date, endDate: date, limit: 10 }),
        ])
        if (!m) return
        const apiMembers = (Array.isArray(memR?.data) ? memR.data : []).filter((mb: ActiveMember) => mb.is_active)
        const fb = ((activeMess as Mess & { memberships?: ActiveMember[] }).memberships ?? []).filter(mb => mb.is_active)
        setMembers(apiMembers.length ? apiMembers : fb)
        setTodayMeals(Array.isArray(mealR.data) ? mealR.data as MealEntry[] : [])
      } catch (e) { if (!m) return; setSheetError(localizedErrorMessage(e, locale, t('page.loading'))) }
      finally { if (m) setSheetLoading(false) }
    }
    loadManagerMealSheet()
    return () => { m = false }
  }, [activeMess, activeMess?.id, canViewMemberMealSheet, date, isManager])

  const memberMealRows = useMemo<MemberMealRow[]>(() => {
    const rows = new Map<string, MemberMealRow>()
    members.forEach(m => rows.set(m.user_id, { id: m.user_id, name: m.user?.name ?? 'Unknown', meals: { BREAKFAST: 0, LUNCH: 0, DINNER: 0 } }))
    todayMeals.forEach(meal => meal.attendances?.forEach(a => {
      const e = rows.get(a.member_id) ?? { id: a.member_id, name: a.member?.name ?? 'Unknown', meals: { BREAKFAST: 0, LUNCH: 0, DINNER: 0 } }
      e.meals[meal.name] = getMealCount(a, meal.name)
      rows.set(a.member_id, e)
    }))
    return Array.from(rows.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [members, todayMeals])

  const mealTotals = useMemo(() => mealNames.reduce((t, n) => ({ ...t, [n]: memberMealRows.reduce((s, r) => s + r.meals[n], 0) }), { BREAKFAST: 0, LUNCH: 0, DINNER: 0 } as Record<MealName, number>), [memberMealRows])
  const mealDraftTotal = useMemo(() => mealNames.reduce((total, mealName) => total + mealDrafts[mealName], 0), [mealDrafts])
  const isManagerAiReview = Boolean(aiDraft && aiTargetMemberId && aiTargetMemberId !== user?.id)
  const managerDirtyUpdates = useMemo(() => {
    if (!isEditingMealSheet) return []
    return memberMealRows.flatMap(row => {
      if (isManagerAiReview && row.id !== aiTargetMemberId) return []
      return mealNames.flatMap(mealName => {
        const draft = managerMealDrafts[row.id]?.[mealName]
        if (draft === undefined || draft.trim() === '') return []
        const mealCount = Number(draft)
        if (!Number.isFinite(mealCount) || Math.abs(mealCount - row.meals[mealName]) < 0.001) return []
        return [{ memberId: row.id, mealName, mealCount, expectedMealCount: row.meals[mealName] }]
      })
    })
  }, [aiTargetMemberId, isEditingMealSheet, isManagerAiReview, managerMealDrafts, memberMealRows])
  const managerHasInvalidDraft = useMemo(() => {
    if (!isEditingMealSheet) return false
    return memberMealRows.some(row => {
      if (isManagerAiReview && row.id !== aiTargetMemberId) return false
      return mealNames.some(mealName => {
        const raw = managerMealDrafts[row.id]?.[mealName]
        if (raw === undefined || raw.trim() === '') return true
        const value = Number(raw)
        return !Number.isFinite(value) || value < 0 || value > 21 || (value > 0 && value < getMealBaseValue(mealName))
      })
    })
  }, [aiTargetMemberId, isEditingMealSheet, isManagerAiReview, managerMealDrafts, memberMealRows])
  const managerDirtyMemberCount = useMemo(() => new Set(managerDirtyUpdates.map(update => update.memberId)).size, [managerDirtyUpdates])
  const displayedMealTotals = useMemo(() => {
    if (!isEditingMealSheet) return mealTotals
    return mealNames.reduce((totals, mealName) => ({
      ...totals,
      [mealName]: memberMealRows.reduce((sum, row) => sum + parseNum(managerMealDrafts[row.id]?.[mealName] ?? String(row.meals[mealName])), 0),
    }), { BREAKFAST: 0, LUNCH: 0, DINNER: 0 } as Record<MealName, number>)
  }, [isEditingMealSheet, managerMealDrafts, mealTotals, memberMealRows])

  function startEditingMealSheet() {
    setManagerMealDrafts(Object.fromEntries(memberMealRows.map(row => [row.id, {
      BREAKFAST: String(row.meals.BREAKFAST),
      LUNCH: String(row.meals.LUNCH),
      DINNER: String(row.meals.DINNER),
    }])))
    setMessage('')
    setIsEditingMealSheet(true)
  }

  function updateManagerMealDraft(row: MemberMealRow, mealName: MealName, value: string) {
    setManagerMealDrafts(current => ({
      ...current,
      [row.id]: {
        ...(current[row.id] ?? {
          BREAKFAST: String(row.meals.BREAKFAST),
          LUNCH: String(row.meals.LUNCH),
          DINNER: String(row.meals.DINNER),
        }),
        [mealName]: value,
      },
    }))
  }

  function isManagerMealCellDirty(row: MemberMealRow, mealName: MealName) {
    const raw = managerMealDrafts[row.id]?.[mealName]
    return raw !== undefined && raw.trim() !== '' && Number.isFinite(Number(raw)) && Math.abs(Number(raw) - row.meals[mealName]) >= 0.001
  }

  function isManagerMealCellInvalid(row: MemberMealRow, mealName: MealName) {
    if (!isEditingMealSheet || (isManagerAiReview && row.id !== aiTargetMemberId)) return false
    const raw = managerMealDrafts[row.id]?.[mealName]
    if (raw === undefined || raw.trim() === '') return true
    const value = Number(raw)
    return !Number.isFinite(value) || value < 0 || value > 21 || (value > 0 && value < getMealBaseValue(mealName))
  }

  function cancelEditingMealSheet(skipConfirmation = false) {
    if (!skipConfirmation && managerDirtyUpdates.length && !window.confirm('Discard all unsaved meal changes?')) return
    setIsEditingMealSheet(false)
    setManagerMealDrafts({})
  }

  useEffect(() => {
    if (!isEditingMealSheet || !managerDirtyUpdates.length) return
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', warnBeforeLeaving)
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving)
  }, [isEditingMealSheet, managerDirtyUpdates.length])

  useEffect(() => {
    if (!aiDraft || !aiTargetMemberId || !user) return
    const items = aiMealItems(aiDraft)
    const targetDate = String(items[0]?.date ?? date).slice(0, 10)
    if (targetDate !== date) return
    const prefillKey = `${aiDraft.id}:${aiTargetMemberId}:${date}`
    if (aiPrefillKeyRef.current === prefillKey) return

    if (aiTargetMemberId === user.id) {
      if (userMealsLoading) return
      setMealDrafts(current => {
        const next = { ...current }
        items.forEach(item => {
          const name = String(item.mealName ?? '').toUpperCase() as MealName
          if (mealNames.includes(name)) next[name] = aiMealCount(item, name)
        })
        return next
      })
    } else {
      if (sheetLoading) return
      const row = memberMealRows.find(item => item.id === aiTargetMemberId)
      if (!row) {
        setMessageType('error')
        setMessage(t('page.memberUnavailable'))
        return
      }
      const next = {
        BREAKFAST: String(row.meals.BREAKFAST),
        LUNCH: String(row.meals.LUNCH),
        DINNER: String(row.meals.DINNER),
      }
      items.forEach(item => {
        const name = String(item.mealName ?? '').toUpperCase() as MealName
        if (mealNames.includes(name)) next[name] = String(aiMealCount(item, name))
      })
      setManagerMealDrafts(Object.fromEntries(memberMealRows.map(member => [member.id, member.id === row.id ? next : {
        BREAKFAST: String(member.meals.BREAKFAST),
        LUNCH: String(member.meals.LUNCH),
        DINNER: String(member.meals.DINNER),
      }])))
      setIsEditingMealSheet(true)
    }
    aiPrefillKeyRef.current = prefillKey
  }, [aiDraft, aiTargetMemberId, date, memberMealRows, sheetLoading, user, userMealsLoading])

  async function refreshMealsForDate() {
    if (!activeMess?.id) return
    const r = await apiClient.getMealsByMess(activeMess.id, { startDate: date, endDate: date, limit: 10 })
    const meals = Array.isArray(r.data) ? r.data as MealEntry[] : []
    const myMeals = meals.filter(m => m.attendances?.some(a => a.member_id === user?.id))
    setUserMeals(myMeals)
    const drafts = { BREAKFAST: 0, LUNCH: 0, DINNER: 0 } as Record<MealName, number>
    myMeals.forEach(meal => {
      const attendance = meal.attendances?.find(a => a.member_id === user?.id)
      if (attendance) drafts[meal.name] = getMealCount(attendance, meal.name)
    })
    setMealDrafts(drafts)
    if (canViewMemberMealSheet) setTodayMeals(meals)
  }

  function parseNum(v: string) { const n = Number(v); return isNaN(n) ? 0 : n }

  function finishAiDraft() {
    if (!aiDraft) return
    clearAiCommandDraft(aiDraft.id)
    setAiDraft(null)
    setAiTargetMemberId(null)
    aiPrefillKeyRef.current = null
    router.replace('/dashboard/meals')
  }

  function buildAiMealPayload(memberId: string, values: Record<MealName, number>) {
    if (!aiDraft) return {}
    const originalItems = aiMealItems(aiDraft)
    const items = originalItems.map(item => {
      const mealName = String(item.mealName ?? '').toUpperCase() as MealName
      const mealCount = mealNames.includes(mealName) ? Math.max(0, values[mealName]) : 0
      return {
        ...item,
        messId: activeMess?.id,
        memberId,
        date,
        mealName,
        mealCount,
        status: mealCount > 0 ? 'ON' : 'OFF',
      }
    })
    return Array.isArray(aiDraft.payload?.items) ? { items } : items[0]
  }

  function cancelAiMealReview() {
    if (!aiDraft) return
    void apiClient.cancelAiCommand(aiDraft.id).catch(() => null)
    cancelEditingMealSheet(true)
    finishAiDraft()
  }

  async function saveMyMeals() {
    if (!activeMess) return
    if (isPastSelectedDate && !isManager) { setMessageType('error'); setMessage(t('page.pastDate')); return }
    if (!isPastSelectedDate && deadlineInfo && !deadlineInfo.isWindowOpen && !isManager) { setMessageType('error'); setMessage(t('page.windowClosed')); return }
    setSavingMeals(true)
    setMessage('')
    try {
      const completedWithAi = Boolean(aiDraft && aiTargetMemberId === user?.id)
      if (completedWithAi) {
        await apiClient.confirmAiCommand(aiDraft!.id, buildAiMealPayload(user!.id, mealDrafts))
      } else await Promise.all(mealNames.map(mealName => {
        const total = Math.max(0, Number(mealDrafts[mealName].toFixed(2)))
        const base = getMealBaseValue(mealName)
        return apiClient.createMeal({
          messId: activeMess.id,
          mealName,
          status: total > 0 ? 'ON' : 'OFF',
          guests: total > 0 ? Math.max(0, +(total - base).toFixed(2)) : 0,
          date,
        })
      }))
      if (completedWithAi) finishAiDraft()
      setMessageType('success'); setMessage(completedWithAi ? t('page.aiConfirmed', { name: user?.name ?? t('page.member') }) : t('page.saveSuccess'))
      await refreshMealsForDate()
    } catch (e) { setMessageType('error'); setMessage(localizedErrorMessage(e, locale, 'Failed')) }
    finally { setSavingMeals(false) }
  }

  async function saveManagerMealSheet() {
    if (!activeMess || !isManager) return
    if (managerHasInvalidDraft) {
      setMessageType('error')
      setMessage(t('page.invalidQuantity'))
      return
    }
    if (!managerDirtyUpdates.length && !isManagerAiReview) return
    setSavingMealSheet(true)
    setMessage('')
    try {
      if (isManagerAiReview && aiDraft && aiTargetMemberId) {
        const target = memberMealRows.find(row => row.id === aiTargetMemberId)
        if (!target) throw new Error('The selected member is no longer available.')
        const values = Object.fromEntries(mealNames.map(name => [name, parseNum(getManagerDraftStr(target.id, name, target.meals[name]))])) as Record<MealName, number>
        await apiClient.confirmAiCommand(aiDraft.id, buildAiMealPayload(target.id, values))
        finishAiDraft()
        setMessageType('success')
        setMessage(t('page.aiConfirmed', { name: target.name }))
      } else {
        const result = await apiClient.bulkUpdateMealAttendances(activeMess.id, { date, updates: managerDirtyUpdates })
        setMessageType('success')
        setMessage(t('page.entriesSaved', { count: result.data.updatedCount, entryLabel: result.data.updatedCount === 1 ? t('page.cell') : t('page.cells'), memberCount: result.data.affectedMemberCount, memberLabel: result.data.affectedMemberCount === 1 ? t('page.member') : t('page.memberPlural') }))
      }
      cancelEditingMealSheet(true)
      await refreshMealsForDate()
    } catch (e) {
      setMessageType('error')
      setMessage(e instanceof ApiError && e.statusCode === 409
        ? 'This meal sheet changed after you opened it. Your edits are still here—cancel and reopen edit mode to load the latest values.'
        : getErrorMessage(e, 'Failed to save the meal sheet.'))
    } finally { setSavingMealSheet(false) }
  }

  async function saveDeadlineSettings() {
    if (!activeMess || !isManager) return
    setSettingDeadline(true); setMessage('')
    try {
      await apiClient.setMealDeadline(activeMess.id, deadlineStartTime, deadlineEndTime)
      setMessageType('success'); setMessage(t('page.deadlineSaved', { start: formatTimeReadable(deadlineStartTime), end: formatTimeReadable(deadlineEndTime) }))
      const info = await apiClient.getMealDeadlineInfo(activeMess.id, date)
      setDeadlineInfo(info.data); setShowDeadlineSettings(false)
    } catch (e) { setMessageType('error'); setMessage(localizedErrorMessage(e, locale, 'Failed')) }
    finally { setSettingDeadline(false) }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader title={isManager ? t('page.sheetTitle') : t('page.myTitle')} description={t('page.description')} />
      <div className="p-4 sm:p-6 lg:p-8">
        {message && <div className={`mb-5 rounded-xl px-4 py-3 text-sm font-semibold  ${messageType === 'error' ? 'border border-destructive/30 bg-destructive/10 text-destructive' : 'border border-primary/30 bg-primary/10 text-primary'}`}>{message}</div>}

        {aiDraft && <div className="mb-5 flex flex-col gap-3 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-soft)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-[var(--dashboard-ink)]">{t('page.aiReview')}</p><p className="mt-1 text-xs font-semibold text-[var(--dashboard-muted)]">{t('page.aiDescription')}</p></div><button type="button" onClick={cancelAiMealReview} className="h-9 rounded-lg border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] px-3 text-xs font-semibold text-[var(--dashboard-muted)]">{t('page.cancelAi')}</button></div>}

        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="dashboard-section-icon size-12 rounded-lg"><UtensilsCrossed size={24} /></div>
            <div><h2 className="text-lg font-semibold text-foreground">{activeMess?.name ?? t('page.noMess')}</h2><p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><Clock size={13} className="text-primary" />{deadlineLoading ? t('page.loading') : deadlineInfo ? t('page.mealWindow', { start: formatTimeReadable(deadlineInfo.startTime), end: formatTimeReadable(deadlineInfo.endTime) }) : t('page.deadlineActive')}</p></div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {isManager && <Button onClick={() => setShowDeadlineSettings(!showDeadlineSettings)} className="h-[45px] rounded-xl border border-primary bg-primary px-5 font-semibold text-white hover:bg-[var(--brand-hover)] hover:text-white"><Clock size={16} className="mr-2" />{showDeadlineSettings ? 'Hide Settings' : 'Set Meal Deadline'}</Button>}
            <div title={isEditingMealSheet ? 'Save or cancel the current meal-sheet edits before changing the date.' : undefined}>
              <EnterpriseDatePicker value={date} onValueChange={setDate} disabled={isEditingMealSheet} surface="white" className="h-[48px] min-w-[194px] px-4 font-bold" ariaLabel="Select meal sheet date" />
            </div>
          </div>
        </div>

        {isManager && showDeadlineSettings && (
          <div className="mb-6 rounded-xl border border-primary/30 bg-primary/10 px-5 py-4 ">
            <h3 className="mb-3 text-sm font-semibold text-foreground">{t('page.deadlineTitle')}</h3>
            <p className="mb-4 text-xs font-semibold text-muted-foreground">{t('page.deadlineDescription')}</p>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[180px]"><label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Opens</label><input type="time" value={deadlineStartTime} onChange={e => setDeadlineStartTime(e.target.value)} className="h-[42px] w-full rounded-xl border border-border bg-background px-4 text-sm font-bold text-foreground outline-none" /></div>
              <div className="flex-1 min-w-[180px]"><label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Closes (next day)</label><input type="time" value={deadlineEndTime} onChange={e => setDeadlineEndTime(e.target.value)} className="h-[42px] w-full rounded-xl border border-border bg-background px-4 text-sm font-bold text-foreground outline-none" /></div>
              <Button onClick={saveDeadlineSettings} disabled={settingDeadline} className="h-[42px] rounded-xl  bg-primary  px-6 font-semibold text-primary-foreground">{settingDeadline ? 'Saving...' : 'Save'}</Button>
            </div>
          </div>
        )}

        {!deadlineLoading && deadlineInfo && isPastSelectedDate && (
          <div className="mb-6 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-bold text-primary ">
            Past date selected. Only managers can modify meals for previous dates.
          </div>
        )}

        {!deadlineLoading && deadlineInfo && !isPastSelectedDate && !deadlineInfo.isWindowOpen && !isManager && (
          <div className="mb-6 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-bold text-primary ">
            Today&apos;s meal window is closed. Only managers can modify meals now.
          </div>
        )}

        <section className="dashboard-card mb-4 overflow-hidden ring-1 ring-[var(--dashboard-line)]/70">
          <header className="flex items-start gap-3 border-b border-border bg-muted/50 p-4 sm:p-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)] ">
              <CalendarDays className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">Manual meal entry</p>
              <h2 className="font-semibold tracking-tight text-foreground">{t('page.mealsFor', { date: new Date(date).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) })}</h2>
              <p className="mt-0.5 text-xs font-semibold leading-5 text-muted-foreground">Turn each meal on, then adjust its quantity for this date.</p>
            </div>
            <span className="shrink-0 rounded-lg bg-[var(--dashboard-surface)] px-2.5 py-1.5 text-xs font-semibold tabular-nums text-[var(--brand-dark)]  dark:text-[var(--brand-bright)]">
              {userMealsLoading ? 'Loading' : `${mealDraftTotal} meals`}
            </span>
          </header>
          <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
            {mealNames.map((mealName) => (
              <MealQuantityControl
                key={mealName}
                meal={mealName}
                value={mealDrafts[mealName]}
                onChange={(value) => setMealDrafts((current) => ({ ...current, [mealName]: value }))}
                disabled={!activeMess || userMealsLoading || mealControlsLocked}
              />
            ))}
          </div>
        </section>

        <div className="mb-8 flex justify-end">
          <Button type="button" onClick={saveMyMeals} disabled={!activeMess || userMealsLoading || mealControlsLocked || savingMeals} className="h-11 w-full gap-2 rounded-xl bg-[var(--brand)] px-6 font-semibold text-primary-foreground  transition hover:bg-[var(--brand-hover)] sm:w-auto">
            <Save size={16} /> {savingMeals ? 'Saving meals...' : 'Save meal sheet'}
          </Button>
        </div>

        {canViewMemberMealSheet && (
          <div className="overflow-hidden rounded-xl border border-border bg-background ">
            <div className="border-b border-border  bg-muted via-white  p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">{t('page.todaySheet')}</p><h3 className="mt-1 text-base font-semibold text-foreground sm:text-lg">{t('page.allMemberMeals')}</h3><p className="mt-1 text-xs font-semibold text-muted-foreground sm:text-sm">{t('page.forDate', { date: new Date(date).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) })}</p></div>
                <MonthlyMealDrawer messId={activeMess?.id} members={members} selectedDate={date} />
              </div>
            </div>
            <div className="p-4 sm:p-5">
              <div className="mb-4 grid grid-cols-3 gap-2 sm:mb-5 sm:gap-3">
                {mealNames.map(n => <div key={n} className="rounded-xl border border-border bg-muted px-2 py-3 text-center  sm:px-3"><p className="flex items-center justify-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground sm:gap-1.5 sm:text-[10px]"><span className="text-primary">{MEAL_ICONS[n]}</span><span className="hidden sm:inline">{mealNameLabel(n, locale)}</span><span className="sm:hidden">{mealNameLabel(n, locale).slice(0,1)}</span></p><p className="mt-1.5 text-xl font-semibold tabular-nums text-foreground sm:text-2xl">{displayedMealTotals[n]}</p></div>)}
              </div>

              {isManager && (
                <div className={`mb-4 flex flex-col gap-3 rounded-xl border px-3 py-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between sm:px-4 ${isEditingMealSheet ? 'border-border bg-muted' : 'border-border bg-muted'}`}>
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${isEditingMealSheet ? 'bg-primary text-primary-foreground' : 'bg-muted text-primary'}`}><Pencil size={15} /></span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">{isEditingMealSheet ? (isManagerAiReview ? t('page.reviewAi') : t('page.editMode')) : t('page.manageAll')}</p>
                      <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">{isEditingMealSheet ? `${managerDirtyUpdates.length} changed ${managerDirtyUpdates.length === 1 ? 'cell' : 'cells'} across ${managerDirtyMemberCount} ${managerDirtyMemberCount === 1 ? 'member' : 'members'}` : 'Edit every member, then save all changes in one request.'}</p>
                    </div>
                  </div>
                  {!isEditingMealSheet && <Button type="button" size="sm" disabled={sheetLoading || !memberMealRows.length} onClick={startEditingMealSheet} className="h-9 w-full gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground  hover:bg-primary sm:w-auto"><Pencil size={14} /> Edit Meal Sheet</Button>}
                </div>
              )}

              {/* Mobile Cards */}
              <div className="sm:hidden space-y-3">
                {sheetLoading ? <div className="py-8 text-center text-sm font-semibold text-muted-foreground">{t('page.loading')}</div>
                : sheetError ? <div className="py-8 text-center text-sm font-bold text-destructive">{sheetError}</div>
                : memberMealRows.length ? memberMealRows.map(row => {
                    const isEditingRow = isManager && isEditingMealSheet && (!isManagerAiReview || aiTargetMemberId === row.id)
                    const total = mealNames.reduce((s, n) => s + row.meals[n], 0)
                    const draftTotal = mealNames.reduce((s, n) => s + parseNum(getManagerDraftStr(row.id, n, row.meals[n])), 0)
                    const bgColor = avatarColor(row.name)
                    return (
                      <div key={row.id} className={`rounded-xl border bg-background p-4  transition ${isEditingRow ? 'border-border' : 'border-border hover:border-primary'}`}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold" style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)', color: bgColor }}>{getInitials(row.name)}</div>
                          <span className="text-sm font-bold text-foreground">{row.name}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {mealNames.map(n => (
                            <div key={n} className={`rounded-lg p-2.5 text-center ${isManagerMealCellInvalid(row, n) ? 'bg-destructive/10 ring-1 ring-destructive/20' : isManagerMealCellDirty(row, n) ? 'bg-muted ring-1 ring-primary/20' : 'bg-muted'}`}>
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{mealNameLabel(n, locale).slice(0, 4)}{isManagerMealCellDirty(row, n) && <span className="ml-1 text-primary">•</span>}</p>
                              {isEditingRow ? (
                                <input aria-label={t('page.quantity', { member: row.name, meal: mealNameLabel(n, locale) })} aria-invalid={isManagerMealCellInvalid(row, n)} type="number" min={0} max={21} step={getMealBaseValue(n)} inputMode="decimal" value={getManagerDraftStr(row.id, n, row.meals[n])}
                                  onChange={e => updateManagerMealDraft(row, n, e.target.value)}
                                  className={`mt-1 h-9 w-full rounded-lg border bg-background px-1 text-center text-sm font-semibold tabular-nums text-foreground outline-none focus:ring-2 ${isManagerMealCellInvalid(row, n) ? 'border-destructive/30 focus:border-destructive/30 focus:ring-destructive/20' : isManagerMealCellDirty(row, n) ? 'border-border focus:ring-primary/20' : 'border-border focus:border-primary focus:ring-primary/20'}`} />
                              ) : (
                                <span className={`mt-1 inline-flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-sm font-semibold ${row.meals[n] > 0 ? 'bg-muted text-primary' : 'bg-muted text-muted-foreground'}`}>{row.meals[n]}</span>
                              )}
                            </div>
                          ))}
                          <div className="rounded-lg r bg-primary/10  p-2.5 text-center">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Total</p>
                            <span className="mt-1 inline-flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-sm font-semibold text-foreground">{isEditingRow ? draftTotal : total}</span>
                          </div>
                        </div>
                      </div>
                    )
                      }) : <div className="py-8 text-center text-sm font-semibold text-muted-foreground">{t('page.noMeals')}</div>}
              </div>

              {/* Desktop/Tablet Table */}
              <div className="hidden sm:block overflow-x-auto monthly-bills-table-scroll border-t border-border">
                <table className="w-full min-w-[560px] border-separate border-spacing-0">
                  <thead>
                    <tr className="border-b border-border bg-muted">
                      <th className="sticky left-0 z-20 w-[138px] whitespace-nowrap border-b border-border bg-muted px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:static sm:w-auto sm:px-4 sm:py-4 sm:text-[11px]">Member</th>
                      {mealNames.map(n => <th key={n} className="whitespace-nowrap border-b border-border px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:px-4 sm:py-4 sm:text-[11px]"><span className="inline-flex items-center gap-1 sm:gap-1.5"><span className="text-primary">{MEAL_ICONS[n]}</span><span className="hidden sm:inline">{mealNameLabel(n, locale)}</span><span className="sm:hidden">{mealNameLabel(n, locale).slice(0,1)}</span></span></th>)}
                      <th className="whitespace-nowrap border-b border-border px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:px-4 sm:py-4 sm:text-[11px]">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sheetLoading ? <tr><td colSpan={5} className="px-4 py-8 text-center text-sm font-semibold text-muted-foreground">{t('page.loading')}</td></tr>
                    : sheetError ? <tr><td colSpan={5} className="px-4 py-8 text-center text-sm font-bold text-destructive">{sheetError}</td></tr>
                    : memberMealRows.length ? memberMealRows.map(row => {
                        const isEditingRow = isManager && isEditingMealSheet && (!isManagerAiReview || aiTargetMemberId === row.id)
                        const total = mealNames.reduce((s, n) => s + row.meals[n], 0)
                        const draftTotal = mealNames.reduce((s, n) => s + parseNum(getManagerDraftStr(row.id, n, row.meals[n])), 0)
                        const bgColor = avatarColor(row.name)
                        return (
                          <tr key={row.id} className="transition hover:bg-muted">
                            <td className="sticky left-0 z-10 border-b border-border bg-background px-3 py-3 sm:static sm:border-b-0 sm:px-4 sm:py-3.5">
                              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-[11px] font-semibold sm:text-xs" style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)', color: bgColor }}>{getInitials(row.name)}</div>
                                <span className="min-w-0 max-w-[96px] truncate text-xs font-bold text-foreground sm:max-w-none sm:text-sm">{row.name}</span>
                              </div>
                            </td>
                            {mealNames.map(n => (
                              <td key={n} className="border-b border-border px-3 py-3 text-center sm:border-b-0 sm:px-4 sm:py-3.5">
                                {isEditingRow ? (
                                  <input aria-label={t('page.quantity', { member: row.name, meal: mealNameLabel(n, locale) })} aria-invalid={isManagerMealCellInvalid(row, n)} type="number" min={0} max={21} step={getMealBaseValue(n)} inputMode="decimal" value={getManagerDraftStr(row.id, n, row.meals[n])}
                                    onChange={e => updateManagerMealDraft(row, n, e.target.value)}
                                    className={`h-9 w-16 rounded-lg border bg-background px-2 text-center text-sm font-semibold tabular-nums text-foreground outline-none focus:ring-2 lg:w-20 ${isManagerMealCellInvalid(row, n) ? 'border-destructive/30 bg-destructive/10 focus:border-destructive/30 focus:ring-destructive/20' : isManagerMealCellDirty(row, n) ? 'border-border bg-muted ring-2 ring-primary/20' : 'border-border focus:border-primary focus:ring-primary/20'}`} />
                                ) : (
                                  <span className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-semibold ${row.meals[n] > 0 ? 'bg-muted text-primary' : 'bg-muted text-muted-foreground'}`}>{row.meals[n]}</span>
                                )}
                              </td>
                            ))}
                            <td className="border-b border-border px-3 py-3 text-center sm:border-b-0 sm:px-4 sm:py-3.5">
                              <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg  bg-primary/10  px-2 text-sm font-semibold text-foreground">{isEditingRow ? draftTotal : total}</span>
                            </td>
                          </tr>
                        )
                      }) : <tr><td colSpan={5} className="px-4 py-8 text-center text-sm font-semibold text-muted-foreground">{t('page.noMeals')}</td></tr>}
                  </tbody>
                  {memberMealRows.length > 0 && (
                    <tfoot>
                      <tr className="border-t-2 border-border bg-muted">
                        <td className="sticky left-0 z-10 bg-muted px-3 py-3 sm:static sm:px-4 sm:py-3.5"><span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:gap-2 sm:text-xs"><Users size={14} /><span>{memberMealRows.length}</span><span className="hidden sm:inline"> Members</span></span></td>
                        {mealNames.map(n => <td key={n} className="px-3 py-3 text-center sm:px-4 sm:py-3.5"><span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-primary px-2 text-sm font-semibold text-primary-foreground ">{displayedMealTotals[n]}</span></td>)}
                        <td className="px-3 py-3 text-center sm:px-4 sm:py-3.5"><span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg  bg-primary  px-2 text-sm font-semibold text-primary-foreground ">{mealNames.reduce((s, n) => s + displayedMealTotals[n], 0)}</span></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {isManager && isEditingMealSheet && (
                <div className="sticky bottom-3 z-30 mt-4 flex flex-col gap-3 rounded-xl border border-border bg-background p-3  backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-4" aria-live="polite">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground">{managerHasInvalidDraft ? 'Some quantities need attention' : managerDirtyUpdates.length ? `${managerDirtyUpdates.length} unsaved ${managerDirtyUpdates.length === 1 ? 'change' : 'changes'}` : isManagerAiReview ? 'AI entry is ready to confirm' : 'No changes yet'}</p>
                    <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">{managerHasInvalidDraft ? 'Use 0 to turn a meal off, or enter a value up to 21.' : 'All changed cells will be saved together.'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
                    <Button type="button" variant="outline" disabled={savingMealSheet} onClick={() => isManagerAiReview ? cancelAiMealReview() : cancelEditingMealSheet()} className="h-10 gap-2 rounded-lg border-border px-4 text-xs font-semibold text-muted-foreground"><X size={14} /> Cancel</Button>
                    <Button type="button" disabled={savingMealSheet || managerHasInvalidDraft || (!managerDirtyUpdates.length && !isManagerAiReview)} onClick={saveManagerMealSheet} className="h-10 gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground  hover:bg-primary disabled:opacity-50">{savingMealSheet ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}{savingMealSheet ? 'Saving...' : isManagerAiReview ? 'Confirm Entry' : 'Save All Changes'}</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {isManager && (
          <div className="mt-6 rounded-xl border border-border bg-background p-5 ">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10"><Shield size={20} className="text-primary" /></div>
              <div><h3 className="text-sm font-semibold text-foreground">Manager Controls</h3><p className="text-xs font-semibold text-muted-foreground">Managers can always edit member meals regardless of deadline. Use &quot;Set Meal Deadline&quot; above to configure the meal window.</p></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
