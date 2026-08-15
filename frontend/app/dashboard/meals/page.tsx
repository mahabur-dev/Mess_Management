'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/app/context/auth-context'
import { apiClient, type AttendanceStatus, type MealName, type Mess } from '@/lib/api-client'
import { CalendarDays, Clock, UserPlus, Users, UtensilsCrossed, Coffee, Sun, Moon, Shield, CheckCircle2, XCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAutoDismissMessage } from '@/hooks/use-auto-dismiss-message'

const mealNames: MealName[] = ['BREAKFAST', 'LUNCH', 'DINNER']
const mealLabels: Record<MealName, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
}

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

const MEAL_COLORS: Record<MealName, { bg: string; iconBg: string; border: string }> = {
  BREAKFAST: { bg: '#fff7ed', iconBg: '#f9731618', border: '#fed7aa' },
  LUNCH: { bg: '#f0fdf4', iconBg: '#22c55e18', border: '#bbf7d0' },
  DINNER: { bg: '#f0f9ff', iconBg: '#3b82f618', border: '#bae6fd' },
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

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#10b981', '#3b82f6', '#f43f5e']
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

export default function MealsPage() {
  const { user } = useAuth()
  const [messes, setMesses] = useState<Mess[]>([])
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [guests, setGuests] = useState<Record<MealName, string>>({ BREAKFAST: '', LUNCH: '', DINNER: '' })
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [members, setMembers] = useState<ActiveMember[]>([])
  useAutoDismissMessage(message, messageType, setMessage, setMessageType)
  const [todayMeals, setTodayMeals] = useState<MealEntry[]>([])
  const [sheetLoading, setSheetLoading] = useState(false)
  const [sheetError, setSheetError] = useState('')
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [managerMealDrafts, setManagerMealDrafts] = useState<Record<string, Record<MealName, string>>>({})
  const [userMeals, setUserMeals] = useState<MealEntry[]>([])
  const [userMealsLoading, setUserMealsLoading] = useState(true)
  const [deadlineInfo, setDeadlineInfo] = useState<DeadlineInfo | null>(null)
  const [deadlineLoading, setDeadlineLoading] = useState(false)
  const [settingDeadline, setSettingDeadline] = useState(false)
  const [showDeadlineSettings, setShowDeadlineSettings] = useState(false)
  const [deadlineStartTime, setDeadlineStartTime] = useState('09:00')
  const [deadlineEndTime, setDeadlineEndTime] = useState('17:00')

  const activeMess = messes[0] ?? user?.memberships?.[0]?.mess
  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER'
  const canViewMemberMealSheet = Boolean(user?.id)
  const isPastSelectedDate = isPastDate(date)
  const mealControlsLocked = userMealsLoading || (!isManager && deadlineInfo ? !deadlineInfo.isWindowOpen : false)

  function getManagerDraftStr(memberId: string, mealName: MealName, fallback: number) {
    const v = managerMealDrafts[memberId]?.[mealName]
    return v !== undefined ? v : String(fallback)
  }

  function startEditingMemberMeal(row: MemberMealRow) {
    setEditingMemberId(row.id)
    setManagerMealDrafts(c => ({ ...c, [row.id]: { BREAKFAST: String(row.meals.BREAKFAST), LUNCH: String(row.meals.LUNCH), DINNER: String(row.meals.DINNER) } }))
  }

  function cancelEditingMemberMeal(id: string) {
    setEditingMemberId(null)
    setManagerMealDrafts(c => { const n = { ...c }; delete n[id]; return n })
  }

  useEffect(() => {
    apiClient.getMesses().then(r => setMesses(Array.isArray(r.data) ? r.data : r.data ? [r.data] : [])).catch(() => setMesses(((user?.memberships?.map(i => i.mess).filter(Boolean) ?? []) as Mess[])))
  }, [user?.role])

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
        const ug = { BREAKFAST: '', LUNCH: '', DINNER: '' } as Record<MealName, string>
        myMeals.forEach(meal => { const a = meal.attendances?.find(a => a.member_id === user.id); if (a && a.guests) ug[meal.name] = String(a.guests) })
        setGuests(ug)
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
      } catch (e) { if (!m) return; setSheetError(e instanceof Error ? e.message : 'Failed to load') }
      finally { if (m) setSheetLoading(false) }
    }
    loadManagerMealSheet()
    return () => { m = false }
  }, [activeMess, activeMess?.id, canViewMemberMealSheet, date, isManager])

  const getUserMealStatus = (mealName: MealName): AttendanceStatus => {
    const meal = userMeals.find(m => m.name === mealName)
    return meal?.attendances?.find(a => a.member_id === user?.id)?.status || 'OFF'
  }

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

  async function refreshMealsForDate() {
    if (!activeMess?.id) return
    const r = await apiClient.getMealsByMess(activeMess.id, { startDate: date, endDate: date, limit: 10 })
    const meals = Array.isArray(r.data) ? r.data as MealEntry[] : []
    setUserMeals(meals.filter(m => m.attendances?.some(a => a.member_id === user?.id)))
    if (canViewMemberMealSheet) setTodayMeals(meals)
  }

  function parseNum(v: string) { const n = Number(v); return isNaN(n) ? 0 : n }

  async function setMeal(mealName: MealName, status: AttendanceStatus) {
    if (!activeMess) return
    if (isPastSelectedDate && !isManager) { setMessageType('error'); setMessage('Past date meals can only be updated by managers.'); return }
    if (!isPastSelectedDate && deadlineInfo && !deadlineInfo.isWindowOpen && !isManager) { setMessageType('error'); setMessage("Today's meal window is closed. Only managers can modify meals now."); return }
    setMessage('')
    try {
      await apiClient.createMeal({ messId: activeMess.id, mealName, status, guests: parseNum(guests[mealName]), date })
      setMessageType('success'); setMessage(`${mealLabels[mealName]} turned ${status.toLowerCase()} successfully.`)
      await refreshMealsForDate()
    } catch (e) { setMessageType('error'); setMessage(getErrorMessage(e, 'Failed')) }
  }

  async function saveMemberMealRow(row: MemberMealRow) {
    if (!activeMess || !isManager) return
    const drafts = managerMealDrafts[row.id] ?? { BREAKFAST: '0', LUNCH: '0', DINNER: '0' }
    setMessage('')
    try {
      const changed = mealNames.filter(n => parseNum(drafts[n] ?? '0') !== row.meals[n])
      if (!changed.length) { cancelEditingMemberMeal(row.id); return }
      for (const n of changed) {
        const total = parseNum(drafts[n] ?? '0')
        await apiClient.createMeal({ messId: activeMess.id, memberId: row.id, mealName: n, status: total > 0 ? 'ON' : 'OFF', guests: total > 0 ? Math.max(0, +(total - getMealBaseValue(n)).toFixed(2)) : 0, date })
      }
      setMessageType('success'); setMessage(`${row.name} meals updated.`)
      cancelEditingMemberMeal(row.id)
      await refreshMealsForDate()
    } catch (e) { setMessageType('error'); setMessage(getErrorMessage(e, 'Failed')) }
    finally { setEditingMemberId(null) }
  }

  async function saveDeadlineSettings() {
    if (!activeMess || !isManager) return
    setSettingDeadline(true); setMessage('')
    try {
      await apiClient.setMealDeadline(activeMess.id, deadlineStartTime, deadlineEndTime)
      setMessageType('success'); setMessage(`Deadline: ${formatTimeReadable(deadlineStartTime)} - ${formatTimeReadable(deadlineEndTime)}`)
      const info = await apiClient.getMealDeadlineInfo(activeMess.id, date)
      setDeadlineInfo(info.data); setShowDeadlineSettings(false)
    } catch (e) { setMessageType('error'); setMessage(getErrorMessage(e, 'Failed')) }
    finally { setSettingDeadline(false) }
  }

  return (
    <div className="min-h-screen bg-[#fafcff]">
      <DashboardHeader title={isManager ? 'Meal Sheet' : 'My Meals'} description="Breakfast, lunch and dinner ON/OFF with guest meal support" />
      <div className="p-4 sm:p-6 lg:p-8">
        {message && <div className={`mb-5 rounded-xl px-4 py-3 text-sm font-bold shadow-sm ${messageType === 'error' ? 'border border-red-200/70 bg-red-50 text-red-700' : 'border border-emerald-200/60 bg-emerald-50 text-emerald-700'}`}>{message}</div>}

        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#2f80ed]/15 to-[#58d68d]/15 shadow-sm"><UtensilsCrossed size={24} className="text-[#2f80ed]" /></div>
            <div><h2 className="text-lg font-black text-[#172554]">{activeMess?.name ?? 'No mess selected'}</h2><p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-[#6b7a99]"><Clock size={13} className="text-[#ffb84d]" />{deadlineLoading ? 'Loading...' : deadlineInfo ? <>Meal window: {formatTimeReadable(deadlineInfo.startTime)} - {formatTimeReadable(deadlineInfo.endTime)} (next day)</> : 'Meal deadline system active'}</p></div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {isManager && <Button onClick={() => setShowDeadlineSettings(!showDeadlineSettings)} className="h-[45px] rounded-xl border border-blue-200/50 bg-gradient-to-r from-blue-50 to-blue-100/70 px-5 font-black text-blue-700 shadow-sm"><Clock size={16} className="mr-2" />{showDeadlineSettings ? 'Hide Settings' : 'Set Meal Deadline'}</Button>}
            <label className="flex h-[45px] items-center gap-2.5 rounded-xl border border-[#d8e6f8] bg-white px-4 shadow-sm"><CalendarDays size={17} className="text-[#2f80ed]" /><input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-transparent text-sm font-bold text-[#172554] outline-none" /></label>
          </div>
        </div>

        {isManager && showDeadlineSettings && (
          <div className="mb-6 rounded-xl border border-blue-200/60 bg-blue-50 px-5 py-4 shadow-sm">
            <h3 className="mb-3 text-sm font-black text-[#172554]">Set Meal Deadline Window</h3>
            <p className="mb-4 text-xs font-semibold text-[#6b7a99]">Members can only add/update their meals during this window. Default: 10:00 PM → 11:00 AM (next day)</p>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[180px]"><label className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-[#6b7a99]">Opens</label><input type="time" value={deadlineStartTime} onChange={e => setDeadlineStartTime(e.target.value)} className="h-[42px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-bold text-[#172554] outline-none" /></div>
              <div className="flex-1 min-w-[180px]"><label className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-[#6b7a99]">Closes (next day)</label><input type="time" value={deadlineEndTime} onChange={e => setDeadlineEndTime(e.target.value)} className="h-[42px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-bold text-[#172554] outline-none" /></div>
              <Button onClick={saveDeadlineSettings} disabled={settingDeadline} className="h-[42px] rounded-xl bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-6 font-black text-white">{settingDeadline ? 'Saving...' : 'Save'}</Button>
            </div>
          </div>
        )}

        {!deadlineLoading && deadlineInfo && isPastSelectedDate && (
          <div className="mb-6 rounded-xl border border-amber-200/60 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700 shadow-sm">
            Past date selected. Only managers can modify meals for previous dates.
          </div>
        )}

        {!deadlineLoading && deadlineInfo && !isPastSelectedDate && !deadlineInfo.isWindowOpen && !isManager && (
          <div className="mb-6 rounded-xl border border-amber-200/60 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700 shadow-sm">
            Today&apos;s meal window is closed. Only managers can modify meals now.
          </div>
        )}

        <div className="mb-8 grid gap-5 md:grid-cols-3">
          {mealNames.map(mealName => {
            const colors = MEAL_COLORS[mealName]
            const currentStatus = getUserMealStatus(mealName)
            const isOn = currentStatus === 'ON'
            const isLoading = userMealsLoading
            return (
              <div key={mealName} className="group relative overflow-hidden rounded-xl border border-[#e6ebf4] bg-white shadow-sm transition-all hover:border-[#a9ccfb] hover:shadow-md">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#2f80ed] via-[#58d68d] to-[#ffb84d]" />
                <div className="p-5">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: colors.iconBg }}><span className="text-[#172554]">{MEAL_ICONS[mealName]}</span></div>
                    {!isLoading && isOn && <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />ON {parseNum(guests[mealName]) > 0 && `+${guests[mealName]}`}</span>}
                    {!isLoading && !isOn && currentStatus === 'OFF' && <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-500">OFF</span>}
                  </div>
                  <h3 className="text-lg font-black text-[#172554]">{mealLabels[mealName]}</h3>
                  <p className="mt-1 text-xs font-semibold text-[#6b7a99]">Set your meal status for {formatDate(date)}</p>
                  <div className="mt-4">
                    <label className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#6b7a99]"><UserPlus size={14} /> Guest Meal</label>
                    <input type="number" min={0} placeholder="0" disabled={mealControlsLocked}
                      className="h-[42px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-bold text-[#172554] outline-none transition focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                      value={guests[mealName]} onChange={e => setGuests(c => ({ ...c, [mealName]: e.target.value }))} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button disabled={!activeMess || userMealsLoading || mealControlsLocked} onClick={() => setMeal(mealName, 'ON')}
                      className={`inline-flex h-[46px] items-center justify-center gap-2 rounded-xl border text-sm font-bold transition active:scale-[0.98] disabled:opacity-60 ${isOn ? 'border-emerald-500/40 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-[#d8e6f8] bg-white text-[#6b7a99] hover:border-emerald-400/60 hover:bg-emerald-50/50 hover:text-emerald-600'}`}>
                      <CheckCircle2 size={16} /> ON
                    </button>
                    <button disabled={!activeMess || userMealsLoading || mealControlsLocked} onClick={() => setMeal(mealName, 'OFF')}
                      className={`inline-flex h-[46px] items-center justify-center gap-2 rounded-xl border text-sm font-bold transition active:scale-[0.98] disabled:opacity-60 ${!isOn && currentStatus === 'OFF' ? 'border-red-400/40 bg-red-50 text-red-600 shadow-sm' : 'border-[#d8e6f8] bg-white text-[#6b7a99] hover:border-red-400/60 hover:bg-red-50/50 hover:text-red-500'}`}>
                      <XCircle size={16} /> OFF
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {canViewMemberMealSheet && (
          <div className="overflow-hidden rounded-xl border border-[#e6ebf4] bg-white shadow-[0_8px_30px_rgba(65,103,153,0.08)]">
            <div className="border-b border-[#e6ebf4] bg-gradient-to-r from-[#f8faff] via-white to-[#fafcff] p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#2f80ed]">Today Meal Sheet</p><h3 className="mt-1 text-base font-black text-[#172554] sm:text-lg">All Member Meals</h3><p className="mt-1 text-xs font-semibold text-[#6b7a99] sm:text-sm">For {formatDate(date)}</p></div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e7f1ff] text-[#2f80ed] sm:h-11 sm:w-11"><Users size={21} /></div>
              </div>
            </div>
            <div className="p-4 sm:p-5">
              <div className="mb-4 grid grid-cols-3 gap-2 sm:mb-5 sm:gap-3">
                {mealNames.map(n => <div key={n} className="rounded-xl border border-[#e6ebf4] bg-[#fafcff] px-2 py-3 text-center shadow-sm sm:px-3"><p className="flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-wide text-[#6b7a99] sm:gap-1.5 sm:text-[10px]"><span className="text-[#2f80ed]">{MEAL_ICONS[n]}</span><span className="hidden sm:inline">{mealLabels[n]}</span><span className="sm:hidden">{mealLabels[n].slice(0,1)}</span></p><p className="mt-1.5 text-xl font-black text-[#172554] sm:text-2xl">{mealTotals[n]}</p></div>)}
              </div>

              {/* Mobile Cards */}
              <div className="sm:hidden space-y-3">
                {sheetLoading ? <div className="py-8 text-center text-sm font-bold text-[#6b7a99]">Loading...</div>
                : sheetError ? <div className="py-8 text-center text-sm font-bold text-red-500">{sheetError}</div>
                : memberMealRows.length ? memberMealRows.map(row => {
                    const isEditingRow = isManager && editingMemberId === row.id
                    const total = mealNames.reduce((s, n) => s + row.meals[n], 0)
                    const draftTotal = mealNames.reduce((s, n) => s + parseNum(getManagerDraftStr(row.id, n, row.meals[n])), 0)
                    const bgColor = avatarColor(row.name)
                    return (
                      <div key={row.id} className="rounded-xl border border-[#e6ebf4] bg-white p-4 shadow-sm transition hover:border-[#a9ccfb]">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-black" style={{ backgroundColor: `${bgColor}18`, borderColor: `${bgColor}55`, color: bgColor }}>{getInitials(row.name)}</div>
                          <span className="text-sm font-bold text-[#172554]">{row.name}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {mealNames.map(n => (
                            <div key={n} className="rounded-lg bg-[#f8faff] p-2.5 text-center">
                              <p className="text-[10px] font-black uppercase tracking-wide text-[#6b7a99]">{mealLabels[n].slice(0, 4)}</p>
                              {isEditingRow ? (
                                <input type="number" min={0} value={getManagerDraftStr(row.id, n, row.meals[n])}
                                  onChange={e => setManagerMealDrafts(c => ({ ...c, [row.id]: { ...(c[row.id] ?? { BREAKFAST: '0', LUNCH: '0', DINNER: '0' }), [n]: e.target.value } }))}
                                  className="mt-1 h-8 w-full rounded-lg border border-[#d8e6f8] bg-white px-1 text-center text-sm font-black text-[#172554] outline-none focus:border-[#2f80ed]/60 focus:ring-2 focus:ring-[#2f80ed]/10" />
                              ) : (
                                <span className={`mt-1 inline-flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-sm font-black ${row.meals[n] > 0 ? 'bg-[#e7f1ff] text-[#2f80ed]' : 'bg-[#f1f3f5] text-[#adb5bd]'}`}>{row.meals[n]}</span>
                              )}
                            </div>
                          ))}
                          <div className="rounded-lg bg-gradient-to-br from-[#2f80ed]/10 to-[#58d68d]/10 p-2.5 text-center">
                            <p className="text-[10px] font-black uppercase tracking-wide text-[#6b7a99]">Total</p>
                            <span className="mt-1 inline-flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-sm font-black text-[#172554]">{isEditingRow ? draftTotal : total}</span>
                          </div>
                        </div>
                        {isManager && <div className="mt-3 flex justify-end gap-2">
                          {isEditingRow ? <>
                            <button onClick={() => saveMemberMealRow(row)} className="h-8 rounded-lg bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-3 text-[11px] font-black text-white">Save</button>
                            <button onClick={() => cancelEditingMemberMeal(row.id)} className="h-8 rounded-lg border border-[#d8e6f8] px-3 text-[11px] font-black text-[#6b7a99]">Cancel</button>
                          </> : <button onClick={() => startEditingMemberMeal(row)} className="h-8 rounded-lg border border-[#2f80ed]/30 bg-[#e7f1ff] px-3 text-[11px] font-black text-[#2f80ed]">Edit</button>}
                        </div>}
                      </div>
                    )
                  }) : <div className="py-8 text-center text-sm font-bold text-[#6b7a99]">No member meals found.</div>}
              </div>

              {/* Desktop/Tablet Table */}
              <div className="hidden sm:block overflow-x-auto monthly-bills-table-scroll pb-2 rounded-xl border border-[#e6ebf4] shadow-[inset_12px_0_18px_-18px_rgba(23,37,84,0.45),inset_-12px_0_18px_-18px_rgba(23,37,84,0.45)]">
                <table className={`w-full border-separate border-spacing-0 ${isManager ? 'min-w-[560px]' : 'min-w-[480px]'}`}>
                  <thead>
                    <tr className="border-b border-[#e6ebf4] bg-[#f8faff]">
                      <th className="sticky left-0 z-20 w-[138px] whitespace-nowrap border-b border-[#e6ebf4] bg-[#f8faff] px-3 py-3 text-left text-[10px] font-black uppercase tracking-[0.08em] text-[#6b7a99] sm:static sm:w-auto sm:px-4 sm:py-4 sm:text-[11px]">Member</th>
                      {mealNames.map(n => <th key={n} className="whitespace-nowrap border-b border-[#e6ebf4] px-3 py-3 text-center text-[10px] font-black uppercase tracking-[0.08em] text-[#6b7a99] sm:px-4 sm:py-4 sm:text-[11px]"><span className="inline-flex items-center gap-1 sm:gap-1.5"><span className="text-[#2f80ed]">{MEAL_ICONS[n]}</span><span className="hidden sm:inline">{mealLabels[n]}</span><span className="sm:hidden">{mealLabels[n].slice(0,1)}</span></span></th>)}
                      <th className="whitespace-nowrap border-b border-[#e6ebf4] px-3 py-3 text-center text-[10px] font-black uppercase tracking-[0.08em] text-[#6b7a99] sm:px-4 sm:py-4 sm:text-[11px]">Total</th>
                      {isManager && <th className="whitespace-nowrap border-b border-[#e6ebf4] px-3 py-3 text-right text-[10px] font-black uppercase tracking-[0.08em] text-[#6b7a99] sm:px-4 sm:py-4 sm:text-[11px]">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e6ebf4]">
                    {sheetLoading ? <tr><td colSpan={isManager ? 6 : 5} className="px-4 py-8 text-center text-sm font-bold text-[#6b7a99]">Loading...</td></tr>
                    : sheetError ? <tr><td colSpan={isManager ? 6 : 5} className="px-4 py-8 text-center text-sm font-bold text-red-500">{sheetError}</td></tr>
                    : memberMealRows.length ? memberMealRows.map(row => {
                        const isEditingRow = isManager && editingMemberId === row.id
                        const total = mealNames.reduce((s, n) => s + row.meals[n], 0)
                        const draftTotal = mealNames.reduce((s, n) => s + parseNum(getManagerDraftStr(row.id, n, row.meals[n])), 0)
                        const bgColor = avatarColor(row.name)
                        return (
                          <tr key={row.id} className="transition hover:bg-[#f8faff]">
                            <td className="sticky left-0 z-10 border-b border-[#e6ebf4] bg-white px-3 py-3 sm:static sm:border-b-0 sm:px-4 sm:py-3.5">
                              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-[11px] font-black sm:text-xs" style={{ backgroundColor: `${bgColor}18`, borderColor: `${bgColor}55`, color: bgColor }}>{getInitials(row.name)}</div>
                                <span className="min-w-0 max-w-[96px] truncate text-xs font-bold text-[#172554] sm:max-w-none sm:text-sm">{row.name}</span>
                              </div>
                            </td>
                            {mealNames.map(n => (
                              <td key={n} className="border-b border-[#e6ebf4] px-3 py-3 text-center sm:border-b-0 sm:px-4 sm:py-3.5">
                                {isEditingRow ? (
                                  <input type="number" min={0} value={getManagerDraftStr(row.id, n, row.meals[n])}
                                    onChange={e => setManagerMealDrafts(c => ({ ...c, [row.id]: { ...(c[row.id] ?? { BREAKFAST: '0', LUNCH: '0', DINNER: '0' }), [n]: e.target.value } }))}
                                    className="h-9 w-14 rounded-lg border border-[#d8e6f8] bg-white px-2 text-center text-sm font-black text-[#172554] outline-none focus:border-[#2f80ed]/60 focus:ring-2 focus:ring-[#2f80ed]/10 sm:w-20" />
                                ) : (
                                  <span className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-black ${row.meals[n] > 0 ? 'bg-[#e7f1ff] text-[#2f80ed]' : 'bg-[#f1f3f5] text-[#adb5bd]'}`}>{row.meals[n]}</span>
                                )}
                              </td>
                            ))}
                            <td className="border-b border-[#e6ebf4] px-3 py-3 text-center sm:border-b-0 sm:px-4 sm:py-3.5">
                              <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-gradient-to-r from-[#2f80ed]/10 to-[#58d68d]/10 px-2 text-sm font-black text-[#172554]">{isEditingRow ? draftTotal : total}</span>
                            </td>
                            {isManager && (
                              <td className="border-b border-[#e6ebf4] px-3 py-3 text-right sm:border-b-0 sm:px-4 sm:py-3.5">
                                {isEditingRow ? (
                                  <div className="flex justify-end gap-1.5 sm:gap-2">
                                    <Button type="button" size="sm" onClick={() => saveMemberMealRow(row)} className="h-8 rounded-lg bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-2.5 text-[11px] font-black text-white sm:px-3">Save</Button>
                                    <Button type="button" variant="outline" size="sm" onClick={() => cancelEditingMemberMeal(row.id)} className="h-8 rounded-lg border-[#d8e6f8] px-2.5 text-[11px] font-black text-[#6b7a99] sm:px-3">Cancel</Button>
                                  </div>
                                ) : (
                                  <Button type="button" variant="outline" size="sm" onClick={() => startEditingMemberMeal(row)} className="h-8 rounded-lg border-[#2f80ed]/30 bg-[#e7f1ff] px-3 text-[11px] font-black text-[#2f80ed]">Edit</Button>
                                )}
                              </td>
                            )}
                          </tr>
                        )
                      }) : <tr><td colSpan={isManager ? 6 : 5} className="px-4 py-8 text-center text-sm font-bold text-[#6b7a99]">No member meals found.</td></tr>}
                  </tbody>
                  {memberMealRows.length > 0 && (
                    <tfoot>
                      <tr className="border-t-2 border-[#d8e6f8] bg-[#f8faff]">
                        <td className="sticky left-0 z-10 bg-[#f8faff] px-3 py-3 sm:static sm:px-4 sm:py-3.5"><span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[#6b7a99] sm:gap-2 sm:text-xs"><Users size={14} /><span>{memberMealRows.length}</span><span className="hidden sm:inline"> Members</span></span></td>
                        {mealNames.map(n => <td key={n} className="px-3 py-3 text-center sm:px-4 sm:py-3.5"><span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-[#2f80ed] px-2 text-sm font-black text-white shadow-sm">{mealTotals[n]}</span></td>)}
                        <td className="px-3 py-3 text-center sm:px-4 sm:py-3.5"><span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-gradient-to-r from-[#2f80ed] to-[#58d68d] px-2 text-sm font-black text-white shadow-sm">{mealNames.reduce((s, n) => s + mealTotals[n], 0)}</span></td>
                        {isManager && <td className="px-3 py-3 sm:px-4 sm:py-3.5" />}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        )}

        {isManager && (
          <div className="mt-6 rounded-xl border border-[#e6ebf4] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 shadow-sm"><Shield size={20} className="text-[#f59e0b]" /></div>
              <div><h3 className="text-sm font-black text-[#172554]">Manager Controls</h3><p className="text-xs font-semibold text-[#6b7a99]">Managers can always edit member meals regardless of deadline. Use "Set Meal Deadline" above to configure the meal window.</p></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
