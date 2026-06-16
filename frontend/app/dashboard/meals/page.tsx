'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/app/context/auth-context'
import { apiClient, type AttendanceStatus, type MealName, type Mess } from '@/lib/api-client'
import { CalendarDays, Lock, UserPlus, Users, UtensilsCrossed, Coffee, Sun, Moon, Shield, ChefHat, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

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

export default function MealsPage() {
  const { user } = useAuth()
  const [messes, setMesses] = useState<Mess[]>([])
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [guests, setGuests] = useState<Record<MealName, number>>({ BREAKFAST: 0, LUNCH: 0, DINNER: 0 })
  const [message, setMessage] = useState('')
  const [members, setMembers] = useState<ActiveMember[]>([])
  const [todayMeals, setTodayMeals] = useState<MealEntry[]>([])
  const [sheetLoading, setSheetLoading] = useState(false)
  const [sheetError, setSheetError] = useState('')
  // Add state for user's personal meal data
  const [userMeals, setUserMeals] = useState<MealEntry[]>([])
  const [userMealsLoading, setUserMealsLoading] = useState(true)
  const [mealTimeClosed, setMealTimeClosed] = useState(false)
  const [closingMealTime, setClosingMealTime] = useState(false)
  
  const activeMess = messes[0] ?? user?.memberships?.[0]?.mess
  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'ORGANIZER'
  const canViewMemberMealSheet = user?.role === 'MANAGER' || user?.role === 'ORGANIZER'
  const mealControlsLocked = mealTimeClosed || userMealsLoading

  useEffect(() => {
    apiClient
      .getMesses()
      .then((response) => setMesses(Array.isArray(response.data) ? response.data : response.data ? [response.data] : []))
      .catch(() => setMesses(((user?.memberships?.map((item) => item.mess).filter(Boolean) ?? []) as Mess[])))
  }, [user?.role])

  // Add effect to fetch user's personal meals when date or activeMess changes
  useEffect(() => {
    let mounted = true

    async function loadUserMeals() {
      if (!activeMess?.id || !user?.id) {
        setUserMeals([])
        setMealTimeClosed(false)
        setUserMealsLoading(false)
        return
      }

      setUserMealsLoading(true)
      try {
        // Fetch meals for the specific date and current user's mess
        const response = await apiClient.getMealsByMess(activeMess.id, { 
          startDate: date, 
          endDate: date, 
          limit: 10 
        })
        
        if (!mounted) return
        
        const meals = Array.isArray(response.data) ? response.data as MealEntry[] : []
        setMealTimeClosed(meals.some((meal) => meal.is_locked || meal.status === 'LOCKED'))
        
        // Filter meals to only include those where current user has attendance
        const userSpecificMeals = meals.filter(meal => 
          meal.attendances?.some(attendance => attendance.member_id === user.id)
        )
        
        setUserMeals(userSpecificMeals)
        
        // Update guests state based on existing meal data
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
          apiClient.getAllMembers({ limit: 100 }),
          apiClient.getMealsByMess(activeMess.id, { startDate: date, endDate: date, limit: 10 }),
        ])

        if (!mounted) return

        const apiMembers = (Array.isArray(membersResponse.data) ? membersResponse.data : [])
          .filter((member) => member.is_active && member.mess_id === activeMess.id)
        const fallbackMembers = ((activeMess as Mess & { memberships?: ActiveMember[] }).memberships ?? [])
          .filter((member) => member.is_active)
        setMembers(apiMembers.length ? apiMembers : fallbackMembers)
        const meals = Array.isArray(mealsResponse.data) ? (mealsResponse.data as MealEntry[]) : []
        setTodayMeals(meals)
        setMealTimeClosed(meals.some((meal) => meal.is_locked || meal.status === 'LOCKED'))
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
  }, [activeMess, activeMess?.id, canViewMemberMealSheet, date])

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

  async function setMeal(mealName: MealName, status: AttendanceStatus) {
    if (!activeMess) return
    if (mealTimeClosed) {
      setMessage('Meal time is closed. Please contact your manager.')
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
      setMessage(`${mealName.toLowerCase()} turned ${status.toLowerCase()} successfully.`)
      
      // Refresh user's meals after update
      const response = await apiClient.getMealsByMess(activeMess.id, { 
        startDate: date, 
        endDate: date, 
        limit: 10 
      })
      const meals = Array.isArray(response.data) ? response.data as MealEntry[] : []
      setMealTimeClosed(meals.some((meal) => meal.is_locked || meal.status === 'LOCKED'))
      const userSpecificMeals = meals.filter(meal => 
        meal.attendances?.some(attendance => attendance.member_id === user?.id)
      )
      setUserMeals(userSpecificMeals)
      
      if (canViewMemberMealSheet) {
        const mealsResponse = await apiClient.getMealsByMess(activeMess.id, { startDate: date, endDate: date, limit: 10 })
        const managerMeals = Array.isArray(mealsResponse.data) ? (mealsResponse.data as MealEntry[]) : []
        setTodayMeals(managerMeals)
        setMealTimeClosed(managerMeals.some((meal) => meal.is_locked || meal.status === 'LOCKED'))
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Failed to update meal'}`)
    }
  }

  async function closeMealTime() {
    if (!activeMess || !isManager) return
    setClosingMealTime(true)
    setMessage('')

    try {
      await apiClient.closeMealTime(activeMess.id, date)
      setMealTimeClosed(true)
      setMessage(`Meal time closed for ${date}. Members cannot add or update their own meals now.`)

      const mealsResponse = await apiClient.getMealsByMess(activeMess.id, { startDate: date, endDate: date, limit: 10 })
      const meals = Array.isArray(mealsResponse.data) ? (mealsResponse.data as MealEntry[]) : []
      setTodayMeals(meals)

      const userSpecificMeals = meals.filter((meal) =>
        meal.attendances?.some((attendance) => attendance.member_id === user?.id),
      )
      setUserMeals(userSpecificMeals)
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Failed to close meal time'}`)
    } finally {
      setClosingMealTime(false)
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
          <div className="mb-5 rounded-xl border border-emerald-200/60 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 shadow-sm">
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
                <ChefHat size={13} className="text-[#ffb84d]" />
                Meal off deadline: {activeMess?.meal_off_deadline ?? 'Before 10 PM previous night'}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {isManager && (
              <Button
                disabled={!activeMess || mealTimeClosed || closingMealTime}
                onClick={closeMealTime}
                className="h-[45px] rounded-xl border border-amber-200/50 bg-gradient-to-r from-amber-50 to-amber-100/70 px-5 font-black text-amber-700 shadow-sm transition hover:from-amber-100 hover:to-amber-200 hover:shadow-md disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
              >
                <Lock size={16} className="mr-2" />
                {mealTimeClosed ? 'Meal Time Closed' : closingMealTime ? 'Closing...' : 'Close Meal Time'}
              </Button>
            )}

            <label className="flex h-[45px] items-center gap-2.5 rounded-xl border border-[#d8e6f8] bg-white px-4 shadow-sm transition hover:border-[#a9ccfb]">
              <CalendarDays size={17} className="text-[#2f80ed]" />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-transparent text-sm font-bold text-[#172554] outline-none" />
            </label>
          </div>
        </div>

        {mealTimeClosed && (
          <div className="mb-6 rounded-xl border border-amber-200/60 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700 shadow-sm">
            ⏰ Meal time is closed for {formatDate(date)}. Members cannot add or update their own meals for this date.
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

        {/* Manager Meal Sheet */}
        {canViewMemberMealSheet && (
          <div className="overflow-hidden rounded-xl border border-[#e6ebf4] bg-white shadow-[0_8px_30px_rgba(65,103,153,0.08)]">
            {/* Header */}
            <div className="border-b border-[#e6ebf4] bg-gradient-to-r from-[#f8faff] via-white to-[#fafcff] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#2f80ed]">Today Meal Sheet</p>
                  <h3 className="mt-1 text-lg font-black text-[#172554]">All Member Meals</h3>
                  <p className="mt-1 text-sm font-semibold text-[#6b7a99]">Breakfast, lunch and dinner count for {formatDate(date)}</p>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e7f1ff] text-[#2f80ed]">
                  <Users size={21} />
                </div>
              </div>
            </div>

            <div className="p-5">
              {/* Total counters */}
              <div className="mb-5 grid grid-cols-3 gap-3">
                {mealNames.map((mealName) => (
                  <div key={mealName} className="rounded-xl border border-[#e6ebf4] bg-[#fafcff] px-3 py-3 text-center shadow-sm">
                    <p className="flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[#6b7a99]">
                      <span className="text-[#2f80ed]">{MEAL_ICONS[mealName]}</span>
                      {mealLabels[mealName]}
                    </p>
                    <p className="mt-1.5 text-2xl font-black text-[#172554]">{mealTotals[mealName]}</p>
                  </div>
                ))}
              </div>

              {/* Meal Sheet Table - Desktop */}
              <div className="hidden sm:block overflow-hidden rounded-xl border border-[#e6ebf4]">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#e6ebf4] bg-[#f8faff]">
                      <th className="whitespace-nowrap px-4 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Member</th>
                      {mealNames.map((mealName) => (
                        <th key={mealName} className="whitespace-nowrap px-4 py-4 text-center text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">
                          <span className="inline-flex items-center gap-1">
                            <span className="text-[#2f80ed]">{MEAL_ICONS[mealName]}</span>
                            {mealLabels[mealName]}
                          </span>
                        </th>
                      ))}
                      <th className="whitespace-nowrap px-4 py-4 text-center text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e6ebf4]">
                    {sheetLoading ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-sm font-bold text-[#6b7a99]">
                          Loading member meals...
                        </td>
                      </tr>
                    ) : sheetError ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-sm font-bold text-red-500">
                          {sheetError}
                        </td>
                      </tr>
                    ) : memberMealRows.length ? (
                      memberMealRows.map((row) => {
                        const total = mealNames.reduce((sum, n) => sum + row.meals[n], 0)
                        const bgColor = avatarColor(row.name)
                        
                        return (
                          <tr key={row.id} className="transition hover:bg-[#f8faff]">
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-3">
                                <div
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-black"
                                  style={{ backgroundColor: `${bgColor}18`, borderColor: `${bgColor}55`, color: bgColor }}
                                >
                                  {getInitials(row.name)}
                                </div>
                                <span className="truncate text-sm font-bold text-[#172554]">{row.name}</span>
                              </div>
                            </td>
                            {mealNames.map((mealName) => (
                              <td key={mealName} className="px-4 py-3.5 text-center">
                                <span
                                  className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-black ${
                                    row.meals[mealName] > 0
                                      ? 'bg-[#e7f1ff] text-[#2f80ed]'
                                      : 'bg-[#f1f3f5] text-[#adb5bd]'
                                  }`}
                                >
                                  {row.meals[mealName]}
                                </span>
                              </td>
                            ))}
                            <td className="px-4 py-3.5 text-center">
                              <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-gradient-to-r from-[#2f80ed]/10 to-[#58d68d]/10 px-2 text-sm font-black text-[#172554]">
                                {total}
                              </span>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-sm font-bold text-[#6b7a99]">
                          No member meal found for this date.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {/* Summary footer row */}
                  {memberMealRows.length > 0 && (
                    <tfoot>
                      <tr className="border-t-2 border-[#d8e6f8] bg-[#f8faff]">
                        <td className="px-4 py-3.5">
                          <span className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[#6b7a99]">
                            <Users size={14} />
                            {memberMealRows.length} Members
                          </span>
                        </td>
                        {mealNames.map((mealName) => (
                          <td key={mealName} className="px-4 py-3.5 text-center">
                            <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-[#2f80ed] px-2 text-sm font-black text-white shadow-sm">
                              {mealTotals[mealName]}
                            </span>
                          </td>
                        ))}
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-gradient-to-r from-[#2f80ed] to-[#58d68d] px-2 text-sm font-black text-white shadow-sm">
                            {mealNames.reduce((s, n) => s + mealTotals[n], 0)}
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Meal Sheet - Mobile Cards */}
              <div className="space-y-3 sm:hidden">
                {sheetLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-[#2f80ed]" />
                  </div>
                ) : sheetError ? (
                  <div className="rounded-xl border border-red-200/60 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                    {sheetError}
                  </div>
                ) : memberMealRows.length ? (
                  memberMealRows.map((row) => {
                    const total = mealNames.reduce((sum, n) => sum + row.meals[n], 0)
                    const bgColor = avatarColor(row.name)
                    
                    return (
                      <div key={row.id} className="rounded-xl border border-[#e6ebf4] bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-xs font-black"
                            style={{ backgroundColor: `${bgColor}18`, borderColor: `${bgColor}55`, color: bgColor }}
                          >
                            {getInitials(row.name)}
                          </div>
                          <span className="text-sm font-bold text-[#172554]">{row.name}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {mealNames.map((mealName) => (
                            <div key={mealName} className="text-center rounded-lg bg-[#f8faff] p-2">
                              <p className="text-[9px] font-black uppercase text-[#6b7a99]">{mealLabels[mealName].slice(0, 4)}</p>
                              <p className={`mt-1 text-sm font-black ${
                                row.meals[mealName] > 0 ? 'text-[#2f80ed]' : 'text-[#adb5bd]'
                              }`}>{row.meals[mealName]}</p>
                            </div>
                          ))}
                          <div className="text-center rounded-lg bg-gradient-to-br from-[#2f80ed]/5 to-[#58d68d]/5 p-2">
                            <p className="text-[9px] font-black uppercase text-[#6b7a99]">Total</p>
                            <p className="mt-1 text-sm font-black text-[#172554]">{total}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="rounded-xl border border-[#e6ebf4] bg-white px-4 py-8 text-center text-sm font-bold text-[#6b7a99]">
                    No member meal found for this date.
                  </div>
                )}
                {/* Mobile Summary */}
                {memberMealRows.length > 0 && (
                  <div className="rounded-xl border border-[#e6ebf4] bg-gradient-to-r from-[#f8faff] to-white px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-[#6b7a99]">
                        <Users size={13} />
                        {memberMealRows.length} Members
                      </span>
                      <div className="flex items-center gap-3 text-xs font-bold">
                        {mealNames.map((mealName) => (
                          <span key={mealName} className="text-[#2f80ed]">{mealLabels[mealName]}: {mealTotals[mealName]}</span>
                        ))}
                        <span className="text-[#172554]">Total: {mealNames.reduce((s, n) => s + mealTotals[n], 0)}</span>
                      </div>
                    </div>
                  </div>
                )}
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
                <p className="text-xs font-semibold text-[#6b7a99]">Managers can edit member meals and lock meal sheets from backend meal APIs.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}