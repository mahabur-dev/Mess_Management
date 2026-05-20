'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/app/context/auth-context'
import { apiClient, type AttendanceStatus, type MealName, type Mess } from '@/lib/api-client'
import { CalendarDays, Lock, UserPlus, UtensilsCrossed } from 'lucide-react'
import { useEffect, useState } from 'react'

const mealNames: MealName[] = ['BREAKFAST', 'LUNCH', 'DINNER']

export default function MealsPage() {
  const { user } = useAuth()
  const [messes, setMesses] = useState<Mess[]>([])
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [guests, setGuests] = useState<Record<MealName, number>>({ BREAKFAST: 0, LUNCH: 0, DINNER: 0 })
  const [message, setMessage] = useState('')
  const activeMess = messes[0] ?? user?.memberships?.[0]?.mess
  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'ORGANIZER'

  useEffect(() => {
    apiClient
      .getMesses()
      .then((response) => setMesses(Array.isArray(response.data) ? response.data : response.data ? [response.data] : []))
      .catch(() => setMesses(((user?.memberships?.map((item) => item.mess).filter(Boolean) ?? []) as Mess[])))
  }, [user?.role])

  async function setMeal(mealName: MealName, status: AttendanceStatus) {
    if (!activeMess) return
    setMessage('')
    await apiClient.createMeal({
      messId: activeMess.id,
      mealName,
      status,
      guests: guests[mealName] ?? 0,
      date,
    })
    setMessage(`${mealName.toLowerCase()} turned ${status.toLowerCase()} successfully.`)
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
          <label className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2">
            <CalendarDays size={17} className="text-[#6f3df4]" />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-transparent text-sm font-bold outline-none" />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {mealNames.map((mealName) => (
            <Card key={mealName} className="app-card p-5">
              <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-[#efe9ff] text-[#6f3df4]">
                <UtensilsCrossed size={22} />
              </span>
              <h3 className="text-xl font-black">{mealName}</h3>
              <p className="mt-1 text-sm font-semibold text-muted-foreground">Select your meal status for {date}</p>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-bold">Guest meal</label>
                <div className="flex items-center gap-2">
                  <UserPlus size={17} className="text-muted-foreground" />
                  <input
                    type="number"
                    min={0}
                    className="soft-input w-full"
                    value={guests[mealName]}
                    onChange={(event) => setGuests((current) => ({ ...current, [mealName]: Number(event.target.value) }))}
                  />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <Button disabled={!activeMess} onClick={() => setMeal(mealName, 'ON')} className="bg-[#22b66f] font-bold hover:bg-[#1fa463]">ON</Button>
                <Button disabled={!activeMess} onClick={() => setMeal(mealName, 'OFF')} variant="outline" className="font-bold text-destructive">OFF</Button>
              </div>
            </Card>
          ))}
        </div>

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
