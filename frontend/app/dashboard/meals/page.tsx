'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/app/context/auth-context'
import { apiClient, type AttendanceStatus, type MealName, type Mess } from '@/lib/api-client'
import { CalendarDays, Lock, UserPlus, Users, UtensilsCrossed } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

const mealNames: MealName[] = ['BREAKFAST', 'LUNCH', 'DINNER']
const mealLabels: Record<MealName, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
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
    <div className="min-h-screen">
      <DashboardHeader
        title={isManager ? 'Meal Sheet' : 'My Meals'}
        description="Breakfast, lunch and dinner ON/OFF with guest meal support"
      />
      <div className="p-4 sm:p-6 lg:p-8">
        {message && <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">{message}</div>}

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black">{activeMess?.name ?? 'No mess selected'}</h2>
            <p className="text-sm font-semibold text-muted-foreground">Meal off deadline: {activeMess?.meal_off_deadline ?? 'Before 10 PM previous night'}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {isManager && (
              <Button
                disabled={!activeMess || mealTimeClosed || closingMealTime}
                onClick={closeMealTime}
                className="h-11 rounded-lg bg-[#f59e0b] px-4 font-black text-white hover:bg-[#d97706] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                <Lock size={16} className="mr-2" />
                {mealTimeClosed ? 'Meal Time Closed' : closingMealTime ? 'Closing...' : 'Close Meal Time'}
              </Button>
            )}

            <label className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2">
              <CalendarDays size={17} className="text-[#6f3df4]" />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-transparent text-sm font-bold outline-none" />
            </label>
          </div>
        </div>

        {mealTimeClosed && (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
            Meal time is closed for {date}. Members cannot add or update their own meals for this date.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          {mealNames.map((mealName) => (
            <Card key={mealName} className="app-card p-5">
              <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-[#efe9ff] text-[#6f3df4]">
                <UtensilsCrossed size={22} />
              </span>
              <h3 className="text-xl font-black">{mealName}</h3>
              <p className="mt-1 text-sm font-semibold text-muted-foreground">Select your meal status for {date}</p>

              {/* Show current status if available */}
              {userMealsLoading ? (
                <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
              ) : getUserMealStatus(mealName) !== 'OFF' && (
                <div className="mt-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
                  Current: {getUserMealStatus(mealName)} 
                  {guests[mealName] > 0 && ` + ${guests[mealName]} guest${guests[mealName] > 1 ? 's' : ''}`}
                </div>
              )}

              <div className="mt-5">
                <label className="mb-2 block text-sm font-bold">Guest meal</label>
                <div className="flex items-center gap-2">
                  <UserPlus size={17} className="text-muted-foreground" />
                  <input
                    type="number"
                    min={0}
                    disabled={mealControlsLocked}
                    className="soft-input w-full"
                    value={guests[mealName]}
                    onChange={(event) => setGuests((current) => ({ ...current, [mealName]: Number(event.target.value) }))}
                  />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <Button 
                  disabled={!activeMess || userMealsLoading || mealControlsLocked} 
                  onClick={() => setMeal(mealName, 'ON')} 
                  className="bg-[#22b66f] font-bold hover:bg-[#1fa463]"
                  variant={getUserMealStatus(mealName) === 'ON' ? "default" : "outline"}
                >
                  ON
                </Button>
                <Button 
                  disabled={!activeMess || userMealsLoading || mealControlsLocked} 
                  onClick={() => setMeal(mealName, 'OFF')} 
                  variant={getUserMealStatus(mealName) === 'OFF' ? "outline" : "outline"} 
                  className="font-bold text-destructive"
                >
                  OFF
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {canViewMemberMealSheet && (
          <Card className="app-card mt-6 overflow-hidden p-0">
            <div className="border-b border-border bg-gradient-to-r from-[#f7f4ff] via-white to-[#f3f8ff] p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#6f3df4]">Today Meal Sheet</p>
                  <h3 className="mt-1 text-lg font-black text-[#0a1433]">All Member Meals</h3>
                  <p className="mt-1 text-sm font-semibold text-muted-foreground">Breakfast, lunch and dinner count for {date}</p>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#efe9ff] text-[#6f3df4]">
                  <Users size={21} />
                </span>
              </div>
            </div>

            <div className="p-3 sm:p-5">
              <div className="mb-3 grid grid-cols-3 gap-2">
                {mealNames.map((mealName) => (
                  <div key={mealName} className="rounded-lg border border-border bg-[#fbfcff] px-2 py-3 text-center">
                    <p className="text-[10px] font-black uppercase text-muted-foreground sm:text-xs">{mealLabels[mealName]}</p>
                    <p className="mt-1 text-xl font-black text-[#0a1433]">{mealTotals[mealName]}</p>
                  </div>
                ))}
              </div>

              <div className="overflow-hidden rounded-lg border border-border">
                <div className="grid grid-cols-[1.3fr_repeat(3,.7fr)] bg-[#15115d] px-3 py-3 text-[10px] font-black uppercase tracking-wide text-white sm:text-xs">
                  <span>Name</span>
                  {mealNames.map((mealName) => (
                    <span key={mealName} className="text-center">{mealLabels[mealName]}</span>
                  ))}
                </div>

                {sheetLoading ? (
                  <div className="px-4 py-8 text-center text-sm font-bold text-muted-foreground">Loading member meals...</div>
                ) : sheetError ? (
                  <div className="px-4 py-8 text-center text-sm font-bold text-destructive">{sheetError}</div>
                ) : memberMealRows.length ? (
                  <div className="divide-y divide-border">
                    {memberMealRows.map((row) => (
                      <div key={row.id} className="grid grid-cols-[1.3fr_repeat(3,.7fr)] items-center px-3 py-3 text-sm">
                        <span className="min-w-0 truncate pr-2 font-black text-[#0a1433]">{row.name}</span>
                        {mealNames.map((mealName) => (
                          <span key={mealName} className="mx-auto flex h-8 min-w-8 items-center justify-center rounded-lg bg-[#efe9ff] px-2 text-sm font-black text-[#6f3df4]">
                            {row.meals[mealName]}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-sm font-bold text-muted-foreground">No member meal found for this date.</div>
                )}
              </div>
            </div>
          </Card>
        )}

        {isManager && (
          <Card className="app-card mt-6 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#fff3df] text-[#f59e0b]"><Lock size={20} /></span>
              <div>
                <h3 className="font-black">Manager Controls</h3>
                <p className="text-sm font-semibold text-muted-foreground">Managers can edit member meals and lock meal sheets from backend meal APIs.</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}



// 'use client'

// import { DashboardHeader } from '@/components/dashboard-header'
// import { Button } from '@/components/ui/button'
// import { Card } from '@/components/ui/card'
// import { useAuth } from '@/app/context/auth-context'
// import { apiClient, type AttendanceStatus, type MealName, type Mess } from '@/lib/api-client'
// import { CalendarDays, Lock, UserPlus, Users, UtensilsCrossed } from 'lucide-react'
// import { useEffect, useMemo, useState } from 'react'

// const mealNames: MealName[] = ['BREAKFAST', 'LUNCH', 'DINNER']
// const mealLabels: Record<MealName, string> = {
//   BREAKFAST: 'Breakfast',
//   LUNCH: 'Lunch',
//   DINNER: 'Dinner',
// }

// type MealAttendance = {
//   member_id: string
//   guests?: number | null
//   status: AttendanceStatus
//   member?: {
//     id: string
//     name: string
//     email?: string
//   }
// }

// type MealEntry = {
//   id: string
//   name: MealName
//   scheduled_date: string
//   attendances?: MealAttendance[]
// }

// type ActiveMember = {
//   user_id: string
//   mess_id: string
//   is_active: boolean
//   user?: {
//     name?: string | null
//   }
// }

// type MemberMealRow = {
//   id: string
//   name: string
//   meals: Record<MealName, number>
// }

// function getMealCount(attendance?: MealAttendance) {
//   if (!attendance || attendance.status !== 'ON') return 0
//   return 1 + Number(attendance.guests ?? 0)
// }

// export default function MealsPage() {
//   const { user } = useAuth()
//   const [messes, setMesses] = useState<Mess[]>([])
//   const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
//   const [guests, setGuests] = useState<Record<MealName, number>>({ BREAKFAST: 0, LUNCH: 0, DINNER: 0 })
//   const [message, setMessage] = useState('')
//   const [members, setMembers] = useState<ActiveMember[]>([])
//   const [todayMeals, setTodayMeals] = useState<MealEntry[]>([])
//   const [sheetLoading, setSheetLoading] = useState(false)
//   const [sheetError, setSheetError] = useState('')
//   const activeMess = messes[0] ?? user?.memberships?.[0]?.mess
//   const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'ORGANIZER'
//   const canViewMemberMealSheet = user?.role === 'MANAGER' || user?.role === 'ORGANIZER'

//   useEffect(() => {
//     apiClient
//       .getMesses()
//       .then((response) => setMesses(Array.isArray(response.data) ? response.data : response.data ? [response.data] : []))
//       .catch(() => setMesses(((user?.memberships?.map((item) => item.mess).filter(Boolean) ?? []) as Mess[])))
//   }, [user?.role])

//   useEffect(() => {
//     let mounted = true

//     async function loadManagerMealSheet() {
//       if (!canViewMemberMealSheet || !activeMess?.id) {
//         setMembers([])
//         setTodayMeals([])
//         return
//       }

//       setSheetLoading(true)
//       setSheetError('')
//       try {
//         const [membersResponse, mealsResponse] = await Promise.all([
//           apiClient.getAllMembers({ limit: 100 }),
//           apiClient.getMealsByMess(activeMess.id, { startDate: date, endDate: date, limit: 10 }),
//         ])

//         if (!mounted) return

//         const apiMembers = (Array.isArray(membersResponse.data) ? membersResponse.data : [])
//           .filter((member) => member.is_active && member.mess_id === activeMess.id)
//         const fallbackMembers = ((activeMess as Mess & { memberships?: ActiveMember[] }).memberships ?? [])
//           .filter((member) => member.is_active)
//         setMembers(apiMembers.length ? apiMembers : fallbackMembers)
//         setTodayMeals(Array.isArray(mealsResponse.data) ? (mealsResponse.data as MealEntry[]) : [])
//       } catch (error) {
//         if (!mounted) return
//         setSheetError(error instanceof Error ? error.message : 'Failed to load member meals')
//       } finally {
//         if (mounted) setSheetLoading(false)
//       }
//     }

//     loadManagerMealSheet()
//     return () => {
//       mounted = false
//     }
//   }, [activeMess, activeMess?.id, canViewMemberMealSheet, date])

//   const memberMealRows = useMemo<MemberMealRow[]>(() => {
//     const rows = new Map<string, MemberMealRow>()

//     members.forEach((member) => {
//       rows.set(member.user_id, {
//         id: member.user_id,
//         name: member.user?.name ?? 'Unknown member',
//         meals: { BREAKFAST: 0, LUNCH: 0, DINNER: 0 },
//       })
//     })

//     todayMeals.forEach((meal) => {
//       meal.attendances?.forEach((attendance) => {
//         const memberId = attendance.member_id
//         const existing = rows.get(memberId) ?? {
//           id: memberId,
//           name: attendance.member?.name ?? 'Unknown member',
//           meals: { BREAKFAST: 0, LUNCH: 0, DINNER: 0 },
//         }
//         existing.meals[meal.name] = getMealCount(attendance)
//         rows.set(memberId, existing)
//       })
//     })

//     return Array.from(rows.values()).sort((a, b) => a.name.localeCompare(b.name))
//   }, [members, todayMeals])

//   const mealTotals = useMemo(
//     () => mealNames.reduce((totals, mealName) => ({
//       ...totals,
//       [mealName]: memberMealRows.reduce((sum, row) => sum + row.meals[mealName], 0),
//     }), { BREAKFAST: 0, LUNCH: 0, DINNER: 0 } as Record<MealName, number>),
//     [memberMealRows],
//   )

//   async function setMeal(mealName: MealName, status: AttendanceStatus) {
//     if (!activeMess) return
//     setMessage('')
//     await apiClient.createMeal({
//       messId: activeMess.id,
//       mealName,
//       status,
//       guests: guests[mealName] ?? 0,
//       date,
//     })
//     setMessage(`${mealName.toLowerCase()} turned ${status.toLowerCase()} successfully.`)
//     if (canViewMemberMealSheet) {
//       const mealsResponse = await apiClient.getMealsByMess(activeMess.id, { startDate: date, endDate: date, limit: 10 })
//       setTodayMeals(Array.isArray(mealsResponse.data) ? (mealsResponse.data as MealEntry[]) : [])
//     }
//   }

//   return (
//     <div className="min-h-screen">
//       <DashboardHeader
//         title={isManager ? 'Meal Sheet' : 'My Meals'}
//         description="Breakfast, lunch and dinner ON/OFF with guest meal support"
//       />
//       <div className="p-4 sm:p-6 lg:p-8">
//         {message && <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">{message}</div>}

//         <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//           <div>
//             <h2 className="text-lg font-black">{activeMess?.name ?? 'No mess selected'}</h2>
//             <p className="text-sm font-semibold text-muted-foreground">Meal off deadline: {activeMess?.meal_off_deadline ?? 'Before 10 PM previous night'}</p>
//           </div>
//           <label className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2">
//             <CalendarDays size={17} className="text-[#6f3df4]" />
//             <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-transparent text-sm font-bold outline-none" />
//           </label>
//         </div>

//         <div className="grid gap-4 md:grid-cols-3">
//           {mealNames.map((mealName) => (
//             <Card key={mealName} className="app-card p-5">
//               <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-[#efe9ff] text-[#6f3df4]">
//                 <UtensilsCrossed size={22} />
//               </span>
//               <h3 className="text-xl font-black">{mealName}</h3>
//               <p className="mt-1 text-sm font-semibold text-muted-foreground">Select your meal status for {date}</p>

//               <div className="mt-5">
//                 <label className="mb-2 block text-sm font-bold">Guest meal</label>
//                 <div className="flex items-center gap-2">
//                   <UserPlus size={17} className="text-muted-foreground" />
//                   <input
//                     type="number"
//                     min={0}
//                     className="soft-input w-full"
//                     value={guests[mealName]}
//                     onChange={(event) => setGuests((current) => ({ ...current, [mealName]: Number(event.target.value) }))}
//                   />
//                 </div>
//               </div>

//               <div className="mt-5 grid grid-cols-2 gap-3">
//                 <Button disabled={!activeMess} onClick={() => setMeal(mealName, 'ON')} className="bg-[#22b66f] font-bold hover:bg-[#1fa463]">ON</Button>
//                 <Button disabled={!activeMess} onClick={() => setMeal(mealName, 'OFF')} variant="outline" className="font-bold text-destructive">OFF</Button>
//               </div>
//             </Card>
//           ))}
//         </div>

//         {canViewMemberMealSheet && (
//           <Card className="app-card mt-6 overflow-hidden p-0">
//             <div className="border-b border-border bg-gradient-to-r from-[#f7f4ff] via-white to-[#f3f8ff] p-4 sm:p-5">
//               <div className="flex items-start justify-between gap-3">
//                 <div>
//                   <p className="text-xs font-black uppercase tracking-[0.14em] text-[#6f3df4]">Today Meal Sheet</p>
//                   <h3 className="mt-1 text-lg font-black text-[#0a1433]">All Member Meals</h3>
//                   <p className="mt-1 text-sm font-semibold text-muted-foreground">Breakfast, lunch and dinner count for {date}</p>
//                 </div>
//                 <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#efe9ff] text-[#6f3df4]">
//                   <Users size={21} />
//                 </span>
//               </div>
//             </div>

//             <div className="p-3 sm:p-5">
//               <div className="mb-3 grid grid-cols-3 gap-2">
//                 {mealNames.map((mealName) => (
//                   <div key={mealName} className="rounded-lg border border-border bg-[#fbfcff] px-2 py-3 text-center">
//                     <p className="text-[10px] font-black uppercase text-muted-foreground sm:text-xs">{mealLabels[mealName]}</p>
//                     <p className="mt-1 text-xl font-black text-[#0a1433]">{mealTotals[mealName]}</p>
//                   </div>
//                 ))}
//               </div>

//               <div className="overflow-hidden rounded-lg border border-border">
//                 <div className="grid grid-cols-[1.3fr_repeat(3,.7fr)] bg-[#15115d] px-3 py-3 text-[10px] font-black uppercase tracking-wide text-white sm:text-xs">
//                   <span>Name</span>
//                   {mealNames.map((mealName) => (
//                     <span key={mealName} className="text-center">{mealLabels[mealName]}</span>
//                   ))}
//                 </div>

//                 {sheetLoading ? (
//                   <div className="px-4 py-8 text-center text-sm font-bold text-muted-foreground">Loading member meals...</div>
//                 ) : sheetError ? (
//                   <div className="px-4 py-8 text-center text-sm font-bold text-destructive">{sheetError}</div>
//                 ) : memberMealRows.length ? (
//                   <div className="divide-y divide-border">
//                     {memberMealRows.map((row) => (
//                       <div key={row.id} className="grid grid-cols-[1.3fr_repeat(3,.7fr)] items-center px-3 py-3 text-sm">
//                         <span className="min-w-0 truncate pr-2 font-black text-[#0a1433]">{row.name}</span>
//                         {mealNames.map((mealName) => (
//                           <span key={mealName} className="mx-auto flex h-8 min-w-8 items-center justify-center rounded-lg bg-[#efe9ff] px-2 text-sm font-black text-[#6f3df4]">
//                             {row.meals[mealName]}
//                           </span>
//                         ))}
//                       </div>
//                     ))}
//                   </div>
//                 ) : (
//                   <div className="px-4 py-8 text-center text-sm font-bold text-muted-foreground">No member meal found for this date.</div>
//                 )}
//               </div>
//             </div>
//           </Card>
//         )}

//         {isManager && (
//           <Card className="app-card mt-6 p-5">
//             <div className="flex items-center gap-3">
//               <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#fff3df] text-[#f59e0b]"><Lock size={20} /></span>
//               <div>
//                 <h3 className="font-black">Manager Controls</h3>
//                 <p className="text-sm font-semibold text-muted-foreground">Managers can edit member meals and lock meal sheets from backend meal APIs.</p>
//               </div>
//             </div>
//           </Card>
//         )}
//       </div>
//     </div>
//   )
// }
