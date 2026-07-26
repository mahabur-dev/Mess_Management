'use client'

import { useEffect, useMemo, useState } from 'react'
import { Lock, Unlock } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import {
  InlineNotice,
  LockStateIcon,
  MealCard,
  MealDateCard,
  MEAL_LABELS,
  MEAL_ORDER,
  MealIconBadge,
  MealStatusPill,
  MealStateIllustration,
  findMeal,
  mealIsLocked,
  normalizeMeals,
  todayIsoDate,
  type MealName,
  type MealRecord,
} from '@/components/mobile/meals-design'
import { api } from '@/lib/api'
import { useAuth } from '@/app/providers'

export default function LockMealsPage() {
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? '', [user])
  const [date, setDate] = useState(todayIsoDate())
  const [mealName, setMealName] = useState<MealName>('LUNCH')
  const [meals, setMeals] = useState<MealRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function loadMeals() {
    if (!messId) return
    setLoading(true)
    setMessage('')
    try {
      const res = await api.getMealsByMess(messId, { startDate: date, endDate: date, limit: 20 })
      setMeals(normalizeMeals(res.data))
    } catch (error) {
      setMeals([])
      setMessage(error instanceof Error ? error.message : 'Failed to load meals.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadMeals()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, messId])

  const selectedMeal = findMeal(meals, mealName)
  const locked = mealIsLocked(selectedMeal)

  async function toggleLock() {
    if (!selectedMeal) return
    setSaving(true)
    setMessage('')

    try {
      await api.updateMeal(selectedMeal.id, { mealStatus: locked ? 'CONFIRMED' : 'LOCKED', date })
      await loadMeals()
      setMessage(`${MEAL_LABELS[mealName]} meal ${locked ? 'unlocked' : 'locked'} successfully.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update lock status.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen title="Lock / Unlock Meals" subtitle="Control member updates" backHref="/meals/manager" />
      <div className="screen space-y-4">
        <MealDateCard date={date} onChange={setDate} />

        <MealCard className="text-center">
          <MealStateIllustration state={locked ? 'locked' : 'open'} mealName={mealName} />
          <div className={`mt-3 text-title font-bold ${locked ? 'text-[#ee1f2f]' : 'text-[#123748]'}`}>
            {MEAL_LABELS[mealName]} meal is {locked ? 'locked' : 'unlocked'}
          </div>
          <div className="mt-2 text-label text-[#65838b]">
            {locked ? 'Members cannot change this meal now.' : 'Members can update this meal while the window allows.'}
          </div>
        </MealCard>

        <MealCard className="space-y-3">
          <div className="section-title mb-0">Select Meal Time</div>
          {MEAL_ORDER.map((item) => {
            const meal = findMeal(meals, item)
            const itemLocked = mealIsLocked(meal)
            const active = item === mealName
            return (
              <button
                key={item}
                type="button"
                onClick={() => setMealName(item)}
                className={`flex min-h-14 w-full items-center gap-3 rounded-[16px] border px-3 py-2 text-left ${
                  active ? 'border-[#008d8c] bg-[#edfafa]' : 'border-[#d8eeee] bg-white'
                }`}
              >
                <MealIconBadge mealName={item} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="text-label font-bold text-[#123748]">{MEAL_LABELS[item]}</div>
                  <div className="mt-0.5 text-caption font-semibold text-[#65838b]">{meal ? 'Meal record available' : 'No meal record yet'}</div>
                </div>
                <MealStatusPill tone={itemLocked ? 'closed' : 'neutral'}>{itemLocked ? 'Locked' : 'Unlocked'}</MealStatusPill>
              </button>
            )
          })}
        </MealCard>

        {message ? <InlineNotice tone={message.includes('successfully') ? 'success' : 'danger'}>{message}</InlineNotice> : null}
        {loading ? <InlineNotice>Loading lock states...</InlineNotice> : null}

        <InlineNotice tone={selectedMeal ? 'info' : 'warning'}>
          {selectedMeal ? 'Locked meals cannot be changed by members.' : 'This meal has no record yet. Add at least one member meal before locking it.'}
        </InlineNotice>

        <button
          type="button"
          className={`flex h-14 w-full items-center justify-center gap-2 rounded-[16px] text-label font-bold text-white shadow-[0_14px_28px_rgba(0,119,122,0.16)] disabled:cursor-not-allowed disabled:opacity-60 ${
            locked ? 'bg-[#008d8c]' : 'bg-[#ee1f2f]'
          }`}
          onClick={toggleLock}
          disabled={!selectedMeal || saving}
        >
          {locked ? <Unlock size={18} /> : <Lock size={18} />}
          {saving ? 'Updating...' : locked ? `Unlock ${MEAL_LABELS[mealName]} Meal` : `Lock ${MEAL_LABELS[mealName]} Meal`}
        </button>

        <MealCard className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#edfafa] text-[#008d8c]">
            <LockStateIcon locked={locked} />
          </div>
          <div>
            <div className="text-body font-bold text-[#123748]">Current selection</div>
            <div className="mt-1 text-label text-[#65838b]">{MEAL_LABELS[mealName]} is {locked ? 'locked' : 'unlocked'}.</div>
          </div>
        </MealCard>
      </div>
    </MobileShell>
  )
}
