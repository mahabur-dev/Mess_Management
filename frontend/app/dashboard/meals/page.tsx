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

type MealAttendance = {
  member_id: string
  guests?: number | null
  status: AttendanceStatus
  member?: {
    id: string
    name: string
    email?: string
  }
}

type MealEntry = {
  id: string
  name: MealName
  scheduled_date: string
  status?: string
  is_locked?: boolean
  attendances?: MealAttendance[]
}

type ActiveMember = {
  user_id: string
  mess_id: string
  is_active: boolean
  user?: {
    name?: string | null
  }
}

type MemberMealRow = {
  id: string
  name: string
  meals: Record<MealName, number>
}

type DeadlineInfo = {
  startTime: string
  endTime: string
  isWindowOpen: boolean
  windowStartTime: string
  windowEndTime: string
}

function getMealCount(attendance?: MealAttendance) {
  if (!attendance || attendance.status !== 'ON') return 0
  return 1 + Number(attendance.guests ?? 0)
}

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#10b981', '#3b82f6', '#f43f5e']

const avatarColor = (name: string) => {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const formatDate = (iso: string) => {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Format a time string like "22:00" to a readable format like "10:00 PM"
 */
const formatTimeReadable = (time: string) => {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export default function MealsPage() {
  const { user } = useAuth()
  const [messes, setMesses] = useState<Mess[]>([])
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [guests, setGuests] = useState<Record<MealName, number>>({ BREAKFAST: 0, LUNCH: 0, DINNER: 0 })
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [members, setMembers] = useState<ActiveMember[]>([])

  useAutoDismissMessage(message, messageType, setMessage, setMessageType)
  const [todayMeals, setTodayMeals] = useState<MealEntry[]>([])
  const [sheetLoading, setSheetLoading] = useState(false)
  const [sheetError, setSheetError] = useState('')
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [managerMealDrafts, setManagerMealDrafts] = useState<Record<string, Record<MealName, number>>>({})
  const [userMeals, setUserMeals] = useState<MealEntry[]>([])
  const [userMealsLoading, setUserMealsLoading] = useState(true)
  const [deadlineInfo, setDeadlineInfo] = useState<DeadlineInfo | null>(null)
  const [deadlineLoading, setDeadlineLoading] = useState(false)
  const [settingDeadline, setSettingDeadline] = useState(false)
  const [showDeadlineSettings, setShowDeadlineSettings] = useState(false)
  const [deadlineStartTime, setDeadlineStartTime] = useState('22:00')
  const [deadlineEndTime, setDeadlineEndTime] = useState('11:00')
  
  const activeMess = messes[0] ?? user?.memberships?.[0]?.mess
  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'ORGANIZER'
  const canViewMemberMealSheet = Boolean(user?.id)
  const isWindowOpen = deadlineInfo?.isWindowOpen ?? false
  const mealControlsLocked = !isWindowOpen || userMealsLoading

  function getManagerMealDraftValue(memberId: string, mealName: MealName, fallback: number) {
    return managerMealDrafts[memberId]?.[mealName] ?? fallback
  }

  function startEditingMemberMeal(row: MemberMealRow) {
    setEditingMemberId(row.id)
    setManagerMealDrafts((current) => ({
      ...current,
      [row.id]: { ...row.meals },
    }))
  }

  function cancelEditingMemberMeal(memberId: string) {
    setEditingMemberId(null)
    setManagerMealDrafts((current) => {
      const next = { ...current }
      delete next[memberId]
      return next
    })
  }

  useEffect(() => {
    apiClient
      .getMesses()
      .then((response) => setMesses(Array.isArray(response.data) ? response.data : response.data ? [response.data] : []))
      .catch(() => setMesses(((user?.memberships?.map((item) => item.mess).filter(Boolean) ?? []) as Mess[])))
  }, [user?.role])

  // Fetch deadline info when mess or date changes
  useEffect(() => {
    let mounted = true

    async function loadDeadlineInfo() {
      if (!activeMess?.id) {
        setDeadlineInfo(null)
        return
      }

      setDeadlineLoading(true)
      try {
        const response = await apiClient.getMealDeadlineInfo(activeMess.id, date)
        if (!mounted) return

        const info = response.data
        setDeadlineInfo(info)
        setDeadlineStartTime(info.startTime)
        setDeadlineEndTime(info.endTime)
      } catch (error) {
        if (!mounted) return
        console.error('Failed to load deadline info:', error)
        // Default values if API not available
        setDeadlineInfo({
          startTime: '22:00',
          endTime: '11:00',
          isWindowOpen: true,
          windowStartTime: '22:00',
          windowEndTime: '11:00',
        })
      } finally {
        if (mounted) setDeadlineLoading(false)
      }
    }

    loadDeadlineInfo()
    return () => { mounted = false }
  }, [activeMess?.id, date])

  useEffect(() => {
    let mounted = true

    async function loadUserMeals() {
      if (!activeMess?.id || !user?.id) {
        setUserMeals([])
        setUserMealsLoading(false)
        return
      }

      setUserMealsLoading(true)
      try {
        const response = await apiClient.getMealsByMess(activeMess.id, { 
          startDate: date, 
          endDate: date, 
          limit: 10 
        })
        
        if (!mounted) return
        
        const meals = Array.isArray(response.data) ? response.data as MealEntry[] : []
        
        const userSpecificMeals = meals.filter(meal => 
          meal.attendances?.some(attendance => attendance.member_id === user.id)
        )
        
        setUserMeals(userSpecificMeals)
        
        const updatedGuests = { BREAKFAST: 0, LUNCH: 0, DINNER: 0 }
        userSpecificMeals.forEach(meal => {
          const attendance = meal.attendances?.find(a => a.member_id === user.id)
          if (attendance && attendance.guests) {
            updatedGuests[meal.name] = attendance.guests
          }
        })
        setGuests(updatedGuests)
        
      } catch (error) {
        if (!mounted) return
        console.error('Failed to load user meals:', error)
      } finally {
        if (mounted) setUserMealsLoading(false)
      }
    }

    loadUserMeals()
    return () => {
      mounted = false
    }
  }, [activeMess?.id, date, user?.id])

  useEffect(() => {
    let mounted = true

    async function loadManagerMealSheet() {
      if (!canViewMemberMealSheet || !activeMess?.id) {
        setMembers([])
        setTodayMeals([])
        return
      }

      setSheetLoading(true)
      setSheetError('')
      try {
        const [membersResponse, mealsResponse] = await Promise.all([
          isManager ? apiClient.getAllMembers({ limit: 100 }).catch(() => null) : Promise.resolve(null),
          apiClient.getMealsByMess(activeMess.id, { startDate: date, endDate: date, limit: 10 }),
        ])

        if (!mounted) return

        const apiMembers = (Array.isArray(membersResponse?.data) ? membersResponse.data : [])
          .filter((member) => member.is_active && member.mess_id === activeMess.id)
        const fallbackMembers = ((activeMess as Mess & { memberships?: ActiveMember[] }).memberships ?? [])
          .filter((member) => member.is_active)
        setMembers(apiMembers.length ? apiMembers : fallbackMembers)
        const meals = Array.isArray(mealsResponse.data) ? (mealsResponse.data as MealEntry[]) : []
        setTodayMeals(meals)
      } catch (error) {
        if (!mounted) return
        setSheetError(error instanceof Error ? error.message : 'Failed to load member meals')
      } finally {
        if (mounted) setSheetLoading(false)
      }
    }

    loadManagerMealSheet()
    return () => {
      mounted = false
    }
  }, [activeMess, activeMess?.id, canViewMemberMealSheet, date, isManager])

  // Helper function to get current user's meal status for a specific meal
  const getUserMealStatus = (mealName: MealName): AttendanceStatus => {
    const meal = userMeals.find(m => m.name === mealName)
    const attendance = meal?.attendances?.find(a => a.member_id === user?.id)
    return attendance?.status || 'OFF'
  }

  const memberMealRows = useMemo<MemberMealRow[]>(() => {
    const rows = new Map<string, MemberMealRow>()

    members.forEach((member) => {
      rows.set(member.user_id, {
        id: member.user_id,
        name: member.user?.name ?? 'Unknown member',
        meals: { BREAKFAST: 0, LUNCH: 0, DINNER: 0 },
      })
    })

    todayMeals.forEach((meal) => {
      meal.attendances?.forEach((attendance) => {
        const memberId = attendance.member_id
        const existing = rows.get(memberId) ?? {
          id: memberId,
          name: attendance.member?.name ?? 'Unknown member',
          meals: { BREAKFAST: 0, LUNCH: 0, DINNER: 0 },
        }
        existing.meals[meal.name] = getMealCount(attendance)
        rows.set(memberId, existing)
      })
    })

    return Array.from(rows.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [members, todayMeals])

  const mealTotals = useMemo(
    () => mealNames.reduce((totals, mealName) => ({
      ...totals,
      [mealName]: memberMealRows.reduce((sum, row) => sum + row.meals[mealName], 0),
    }), { BREAKFAST: 0, LUNCH: 0, DINNER: 0 } as Record<MealName, number>),
    [memberMealRows],
  )

  async function refreshMealsForDate() {
    if (!activeMess?.id) return

    const response = await apiClient.getMealsByMess(activeMess.id, {
      startDate: date,
      endDate: date,
      limit: 10,
    })
    const meals = Array.isArray(response.data) ? response.data as MealEntry[] : []

    setUserMeals(meals.filter((meal) =>
      meal.attendances?.some((attendance) => attendance.member_id === user?.id),
    ))

    if (canViewMemberMealSheet) {
      setTodayMeals(meals)
    }
  }

  async function setMeal(mealName: MealName, status: AttendanceStatus) {
    if (!activeMess) return
    if (!isWindowOpen && !isManager) {
      setMessageType('error')
      setMessage('Meal window is closed. The deadline has passed. Only managers can modify meals now.')
      return
    }
    setMessage('')
    try {
      await apiClient.createMeal({
        messId: activeMess.id,
        mealName,
        status,
        guests: guests[mealName] ?? 0,
        date,
      })
      setMessageType('success')
      setMessage(`${mealName.toLowerCase()} turned ${status.toLowerCase()} successfully.`)
      await refreshMealsForDate()
    } catch (error) {
      setMessageType('error')
      setMessage(getErrorMessage(error, 'Failed to update meal'))
    }
  }

  async function saveMemberMealRow(row: MemberMealRow) {
    if (!activeMess || !isManager) return

    const drafts = managerMealDrafts[row.id] ?? row.meals
    setEditingMemberId(row.id)
    setMessage('')

    try {
      const changedMeals = mealNames.filter(
        (mealName) => Math.max(0, Number(drafts[mealName] ?? 0)) !== row.meals[mealName],
      )

      if (!changedMeals.length) {
        cancelEditingMemberMeal(row.id)
        return
      }

      for (const mealName of changedMeals) {
        const totalCount = Math.max(0, Number(drafts[mealName] ?? 0))

        await apiClient.createMeal({
          messId: activeMess.id,
          memberId: row.id,
          mealName,
          status: totalCount > 0 ? 'ON' : 'OFF',
          guests: totalCount > 0 ? totalCount - 1 : 0,
          date,
        })
      }

      setMessageType('success')
      setMessage(`${row.name} meals updated successfully.`)
      cancelEditingMemberMeal(row.id)
      await refreshMealsForDate()
    } catch (error) {
      setMessageType('error')
      setMessage(getErrorMessage(error, 'Failed to update member meal'))
    } finally {
      setEditingMemberId(null)
    }
  }

  async function saveDeadlineSettings() {
    if (!activeMess || !isManager) return
    setSettingDeadline(true)
    setMessage('')

    try {
      const response = await apiClient.setMealDeadline(activeMess.id, deadlineStartTime, deadlineEndTime, date)
      setMessageType('success')
      setMessage(`Meal deadline updated: ${formatTimeReadable(deadlineStartTime)} - ${formatTimeReadable(deadlineEndTime)} (next day)`)

      // Refresh deadline info
      const infoResponse = await apiClient.getMealDeadlineInfo(activeMess.id, date)
      setDeadlineInfo(infoResponse.data)
      setShowDeadlineSettings(false)
    } catch (error) {
      setMessageType('error')
      setMessage(getErrorMessage(error, 'Failed to update deadline'))
    } finally {
      setSettingDeadline(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fafcff]">
      <DashboardHeader
        title={isManager ? 'Meal Sheet' : 'My Meals'}
        description="Breakfast, lunch and dinner ON/OFF with guest meal support"
      />
      <div className="p-4 sm:p-6 lg:p-8">
        {message && (
          <div
            className={`mb-5 rounded-xl px-4 py-3 text-sm font-bold shadow-sm ${
              messageType === 'error'
                ? 'border border-red-200/70 bg-red-50 text-red-700'
                : 'border border-emerald-200/60 bg-emerald-50 text-emerald-700'
            }`}
          >
            {message}
          </div>
        )}

        {/* Header Section */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#2f80ed]/15 to-[#58d68d]/15 shadow-sm">
              <UtensilsCrossed size={24} className="text-[#2f80ed]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#172554]">{activeMess?.name ?? 'No mess selected'}</h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-[#6b7a99]">
                <Clock size={13} className="text-[#ffb84d]" />
                {deadlineLoading ? (
                  'Loading deadline info...'
                ) : deadlineInfo ? (
                  <>Meal window: {formatTimeReadable(deadlineInfo.startTime)} - {formatTimeReadable(deadlineInfo.endTime)} (next day)</>
                ) : (
                  'Meal deadline system active'
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {isManager && (
              <>
                <Button
                  onClick={() => setShowDeadlineSettings(!showDeadlineSettings)}
                  className="h-[45px] rounded-xl border border-blue-200/50 bg-gradient-to-r from-blue-50 to-blue-100/70 px-5 font-black text-blue-700 shadow-sm transition hover:from-blue-100 hover:to-blue-200 hover:shadow-md"
                >
                  <Clock size={16} className="mr-2" />
                  {showDeadlineSettings ? 'Hide Settings' : 'Set Meal Deadline'}
                </Button>
              </>
            )}

            <label className="flex h-[45px] items-center gap-2.5 rounded-xl border border-[#d8e6f8] bg-white px-4 shadow-sm transition hover:border-[#a9ccfb]">
              <CalendarDays size={17} className="text-[#2f80ed]" />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-transparent text-sm font-bold text-[#172554] outline-none" />
            </label>
          </div>
        </div>

        {/* Deadline Settings Panel (Manager only) */}
        {isManager && showDeadlineSettings && (
          <div className="mb-6 rounded-xl border border-blue-200/60 bg-blue-50 px-5 py-4 shadow-sm">
            <h3 className="mb-3 text-sm font-black text-[#172554]">Set Meal Deadline Window</h3>
            <p className="mb-4 text-xs font-semibold text-[#6b7a99]">
              Members can only add/update their meals during this window. After the deadline, only managers can modify meals.
              Default: 10:00 PM → 11:00 AM (next day)
            </p>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[180px]">
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-[#6b7a99]">
                  Window Opens (start time)
                </label>
                <input
                  type="time"
                  value={deadlineStartTime}
                  onChange={(e) => setDeadlineStartTime(e.target.value)}
                  className="h-[42px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-bold text-[#172554] outline-none transition focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                />
              </div>
              <div className="flex-1 min-w-[180px]">
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-[#6b7a99]">
                  Window Closes (end time - next day)
                </label>
                <input
                  type="time"
                  value={deadlineEndTime}
                  onChange={(e) => setDeadlineEndTime(e.target.value)}
                  className="h-[42px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-bold text-[#172554] outline-none transition focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                />
              </div>
              <Button
                onClick={saveDeadlineSettings}
                disabled={settingDeadline}
                className="h-[42px] rounded-xl bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-6 font-black text-white shadow-sm hover:shadow-md disabled:opacity-60"
              >
                {settingDeadline ? 'Saving...' : 'Save Deadline'}
              </Button>
            </div>
          </div>
        )}

        {/* Window Status Banner */}
        {!deadlineLoading && deadlineInfo && (
          <div className={`mb-6 rounded-xl border px-4 py-3 text-sm font-bold shadow-sm ${
            isWindowOpen
              ? 'border-emerald-200/60 bg-emerald-50 text-emerald-700'
              : 'border-amber-200/60 bg-amber-50 text-amber-700'
          }`}>
            {isWindowOpen ? (
              <>✅ Meal window is OPEN ({formatTimeReadable(deadlineInfo.startTime)} - {formatTimeReadable(deadlineInfo.endTime)}). You can add/update your meals.</>
            ) : (
              <>⏰ Meal window is CLOSED (deadline: {formatTimeReadable(deadlineInfo.endTime)}). Only managers can modify meals now. Next window opens at {formatTimeReadable(deadlineInfo.startTime)}.</>
            )}
          </div>
        )}

        {/* Meal Selection Cards */}
        <div className="mb-8 grid gap-5 md:grid-cols-3">
          {mealNames.map((mealName) => {
            const colors = MEAL_COLORS[mealName]
            const currentStatus = getUserMealStatus(mealName)
            const isOn = currentStatus === 'ON'
            const isLoading = userMealsLoading
            
            return (
              <div
                key={mealName}
                className="group relative overflow-hidden rounded-xl border border-[#e6ebf4] bg-white shadow-sm transition-all hover:border-[#a9ccfb] hover:shadow-md"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#2f80ed] via-[#58d68d] to-[#ffb84d]" />
                
                <div className="p-5">
                  <div className="mb-4 flex items-start justify-between">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl"
                      style={{ backgroundColor: colors.iconBg }}
                    >
                      <span className="text-[#172554]">{MEAL_ICONS[mealName]}</span>
                    </div>
                    
                    {/* Show current status badge */}
                    {!isLoading && isOn && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        ON {guests[mealName] > 0 && `+${guests[mealName]}`}
                      </span>
                    )}
                    {!isLoading && !isOn && currentStatus === 'OFF' && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-500">
                        OFF
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-black text-[#172554]">{mealLabels[mealName]}</h3>
                  <p className="mt-1 text-xs font-semibold text-[#6b7a99]">Set your meal status for {formatDate(date)}</p>

                  <div className="mt-4">
                    <label className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#6b7a99]">
                      <UserPlus size={14} />
                      Guest Meal
                    </label>
                    <input
                      type="number"
                      min={0}
                      disabled={mealControlsLocked}
                      className="h-[42px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-bold text-[#172554] outline-none transition focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                      value={guests[mealName]}
                      onChange={(event) => setGuests((current) => ({ ...current, [mealName]: Number(event.target.value) }))}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                      disabled={!activeMess || userMealsLoading || mealControlsLocked}
                      onClick={() => setMeal(mealName, 'ON')}
                      className={`inline-flex h-[46px] items-center justify-center gap-2 rounded-xl border text-sm font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
                        isOn
                          ? 'border-emerald-500/40 bg-emerald-50 text-emerald-700 shadow-sm'
                          : 'border-[#d8e6f8] bg-white text-[#6b7a99] hover:border-emerald-400/60 hover:bg-emerald-50/50 hover:text-emerald-600'
                      }`}
                    >
                      {isOn ? <CheckCircle2 size={16} /> : <CheckCircle2 size={16} />}
                      ON
                    </button>
                    <button
                      disabled={!activeMess || userMealsLoading || mealControlsLocked}
                      onClick={() => setMeal(mealName, 'OFF')}
                      className={`inline-flex h-[46px] items-center justify-center gap-2 rounded-xl border text-sm font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
                        !isOn && currentStatus === 'OFF'
                          ? 'border-red-400/40 bg-red-50 text-red-600 shadow-sm'
                          : 'border-[#d8e6f8] bg-white text-[#6b7a99] hover:border-red-400/60 hover:bg-red-50/50 hover:text-red-500'
                      }`}
                    >
                      <XCircle size={16} />
                      OFF
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Member Meal Sheet */}
        {canViewMemberMealSheet && (
          <div className="overflow-hidden rounded-xl border border-[#e6ebf4] bg-white shadow-[0_8px_30px_rgba(65,103,153,0.08)]">
            {/* Header */}
            <div className="border-b border-[#e6ebf4] bg-gradient-to-r from-[#f8faff] via-white to-[#fafcff] p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#2f80ed]">Today Meal Sheet</p>
                  <h3 className="mt-1 text-base font-black text-[#172554] sm:text-lg">All Member Meals</h3>
                  <p className="mt-1 text-xs font-semibold text-[#6b7a99] sm:text-sm">Breakfast, lunch and dinner count for {formatDate(date)}</p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e7f1ff] text-[#2f80ed] sm:h-11 sm:w-11">
                  <Users size={21} />
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5">
              {/* Total counters */}
              <div className="mb-4 grid grid-cols-3 gap-2 sm:mb-5 sm:gap-3">
                {mealNames.map((mealName) => (
                  <div key={mealName} className="rounded-xl border border-[#e6ebf4] bg-[#fafcff] px-2 py-3 text-center shadow-sm sm:px-3">
                    <p className="flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-wide text-[#6b7a99] sm:gap-1.5 sm:text-[10px]">
                      <span className="text-[#2f80ed]">{MEAL_ICONS[mealName]}</span>
                      <span className="hidden sm:inline">{mealLabels[mealName]}</span>
                      <span className="sm:hidden">{mealLabels[mealName].slice(0, 1)}</span>
                    </p>
                    <p className="mt-1.5 text-xl font-black text-[#172554] sm:text-2xl">{mealTotals[mealName]}</p>
                  </div>
                ))}
              </div>

              {/* Meal Sheet Table */}
              <div className="overflow-x-auto rounded-xl border border-[#e6ebf4] shadow-[inset_12px_0_18px_-18px_rgba(23,37,84,0.45),inset_-12px_0_18px_-18px_rgba(23,37,84,0.45)]">
                <table className={`w-full border-separate border-spacing-0 ${isManager ? 'min-w-[560px]' : 'min-w-[480px]'}`}>
                  <thead>
                    <tr className="border-b border-[#e6ebf4] bg-[#f8faff]">
                      <th className="sticky left-0 z-20 w-[138px] whitespace-nowrap border-b border-[#e6ebf4] bg-[#f8faff] px-3 py-3 text-left text-[10px] font-black uppercase tracking-[0.08em] text-[#6b7a99] sm:static sm:w-auto sm:px-4 sm:py-4 sm:text-[11px]">Member</th>
                      {mealNames.map((mealName) => (
                        <th key={mealName} className="whitespace-nowrap border-b border-[#e6ebf4] px-3 py-3 text-center text-[10px] font-black uppercase tracking-[0.08em] text-[#6b7a99] sm:px-4 sm:py-4 sm:text-[11px]">
                          <span className="inline-flex items-center gap-1 sm:gap-1.5">
                            <span className="text-[#2f80ed]">{MEAL_ICONS[mealName]}</span>
                            <span className="hidden sm:inline">{mealLabels[mealName]}</span>
                            <span className="sm:hidden">{mealLabels[mealName].slice(0, 1)}</span>
                          </span>
                        </th>
                      ))}
                      <th className="whitespace-nowrap border-b border-[#e6ebf4] px-3 py-3 text-center text-[10px] font-black uppercase tracking-[0.08em] text-[#6b7a99] sm:px-4 sm:py-4 sm:text-[11px]">Total</th>
                      {isManager && (
                        <th className="whitespace-nowrap border-b border-[#e6ebf4] px-3 py-3 text-right text-[10px] font-black uppercase tracking-[0.08em] text-[#6b7a99] sm:px-4 sm:py-4 sm:text-[11px]">Action</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e6ebf4]">
                    {sheetLoading ? (
                      <tr>
                        <td colSpan={isManager ? 6 : 5} className="px-4 py-8 text-center text-sm font-bold text-[#6b7a99]">
                          Loading member meals...
                        </td>
                      </tr>
                    ) : sheetError ? (
                      <tr>
                        <td colSpan={isManager ? 6 : 5} className="px-4 py-8 text-center text-sm font-bold text-red-500">
                          {sheetError}
                        </td>
                      </tr>
                    ) : memberMealRows.length ? (
                      memberMealRows.map((row) => {
                        const isEditingRow = isManager && editingMemberId === row.id
                        const total = mealNames.reduce((sum, n) => sum + row.meals[n], 0)
                        const draftTotal = mealNames.reduce(
                          (sum, mealName) => sum + getManagerMealDraftValue(row.id, mealName, row.meals[mealName]),
                          0,
                        )
                        const bgColor = avatarColor(row.name)
                        
                        return (
                          <tr key={row.id} className="transition hover:bg-[#f8faff]">
                            <td className="sticky left-0 z-10 border-b border-[#e6ebf4] bg-white px-3 py-3 sm:static sm:border-b-0 sm:px-4 sm:py-3.5">
                              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                                <div
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-[11px] font-black sm:text-xs"
                                  style={{ backgroundColor: `${bgColor}18`, borderColor: `${bgColor}55`, color: bgColor }}
                                >
                                  {getInitials(row.name)}
                                </div>
                                <span className="min-w-0 max-w-[96px] truncate text-xs font-bold text-[#172554] sm:max-w-none sm:text-sm">{row.name}</span>
                              </div>
                            </td>
                            {mealNames.map((mealName) => (
                              <td key={mealName} className="border-b border-[#e6ebf4] px-3 py-3 text-center sm:border-b-0 sm:px-4 sm:py-3.5">
                                {isEditingRow ? (
                                  <input
                                    type="number"
                                    min={0}
                                    max={20}
                                    value={getManagerMealDraftValue(row.id, mealName, row.meals[mealName])}
                                    onChange={(event) =>
                                      setManagerMealDrafts((current) => ({
                                        ...current,
                                        [row.id]: {
                                          ...(current[row.id] ?? row.meals),
                                          [mealName]: Number(event.target.value),
                                        },
                                      }))
                                    }
                                    className="h-9 w-14 rounded-lg border border-[#d8e6f8] bg-white px-2 text-center text-sm font-black text-[#172554] outline-none focus:border-[#2f80ed]/60 focus:ring-2 focus:ring-[#2f80ed]/10 sm:w-20"
                                  />
                                ) : (
                                  <span
                                    className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-black ${
                                      row.meals[mealName] > 0
                                        ? 'bg-[#e7f1ff] text-[#2f80ed]'
                                        : 'bg-[#f1f3f5] text-[#adb5bd]'
                                    }`}
                                  >
                                    {row.meals[mealName]}
                                  </span>
                                )}
                              </td>
                            ))}
                            <td className="border-b border-[#e6ebf4] px-3 py-3 text-center sm:border-b-0 sm:px-4 sm:py-3.5">
                              <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-gradient-to-r from-[#2f80ed]/10 to-[#58d68d]/10 px-2 text-sm font-black text-[#172554]">
                                {isEditingRow ? draftTotal : total}
                              </span>
                            </td>
                            {isManager && (
                              <td className="border-b border-[#e6ebf4] px-3 py-3 text-right sm:border-b-0 sm:px-4 sm:py-3.5">
                                {isEditingRow ? (
                                  <div className="flex justify-end gap-1.5 sm:gap-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() => saveMemberMealRow(row)}
                                      className="h-8 rounded-lg bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-2.5 text-[11px] font-black text-white sm:px-3"
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => cancelEditingMemberMeal(row.id)}
                                      className="h-8 rounded-lg border-[#d8e6f8] px-2.5 text-[11px] font-black text-[#6b7a99] sm:px-3"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    type="button"
                                    variant="outline"
                                  size="sm"
                                  onClick={() => startEditingMemberMeal(row)}
                                  className="h-8 rounded-lg border-[#2f80ed]/30 bg-[#e7f1ff] px-3 text-[11px] font-black text-[#2f80ed]"
                                >
                                  Edit
                                </Button>
                                )}
                              </td>
                            )}
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={isManager ? 6 : 5} className="px-4 py-8 text-center text-sm font-bold text-[#6b7a99]">
                          No member meal found for this date.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {/* Summary footer row */}
                  {memberMealRows.length > 0 && (
                    <tfoot>
                      <tr className="border-t-2 border-[#d8e6f8] bg-[#f8faff]">
                        <td className="sticky left-0 z-10 bg-[#f8faff] px-3 py-3 sm:static sm:px-4 sm:py-3.5">
                          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[#6b7a99] sm:gap-2 sm:text-xs">
                            <Users size={14} />
                            <span>{memberMealRows.length}</span>
                            <span className="hidden sm:inline">Members</span>
                          </span>
                        </td>
                        {mealNames.map((mealName) => (
                          <td key={mealName} className="px-3 py-3 text-center sm:px-4 sm:py-3.5">
                            <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-[#2f80ed] px-2 text-sm font-black text-white shadow-sm">
                              {mealTotals[mealName]}
                            </span>
                          </td>
                        ))}
                        <td className="px-3 py-3 text-center sm:px-4 sm:py-3.5">
                          <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-gradient-to-r from-[#2f80ed] to-[#58d68d] px-2 text-sm font-black text-white shadow-sm">
                            {mealNames.reduce((s, n) => s + mealTotals[n], 0)}
                          </span>
                        </td>
                        {isManager && <td className="px-3 py-3 sm:px-4 sm:py-3.5" />}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Manager Controls */}
        {isManager && (
          <div className="mt-6 rounded-xl border border-[#e6ebf4] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 shadow-sm">
                <Shield size={20} className="text-[#f59e0b]" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#172554]">Manager Controls</h3>
                <p className="text-xs font-semibold text-[#6b7a99]">
                  Managers can always edit member meals regardless of deadline.
                  Use the "Set Meal Deadline" button above to configure the meal window.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
