'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Lock, Unlock } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { LoadingIndicator } from '@/components/loading-indicator'
import { TopScreen } from '@/components/top-screen'
import {
  InlineNotice,
  LockStateIcon,
  MealCard,
  MealDateCard,
  MEAL_ORDER,
  MealIconBadge,
  MealStatusPill,
  MealStateIllustration,
  findMeal,
  mealIsLocked,
  mealLabel,
  normalizeMeals,
  todayIsoDate,
  type MealName,
  type MealRecord,
} from '@/components/mobile/meals-design'
import { api } from '@/lib/api'
import { useAuth } from '@/app/providers'
import { useLocale, useLocalizedNotice, useTranslations } from '@/lib/i18n'

export default function LockMealsPage() {
  const { user } = useAuth()
  const { locale } = useLocale()
  const mealCopy = useTranslations('meals')
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? '', [user])
  const [date, setDate] = useState(todayIsoDate())
  const [mealName, setMealName] = useState<MealName>('LUNCH')
  const [meals, setMeals] = useState<MealRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { notice, clearNotice, showError, showMessage } = useLocalizedNotice('meals')

  const loadMeals = useCallback(async (resetNotice = true) => {
    if (!messId) {
      setMeals([])
      setLoading(false)
      showMessage('noMessSelected', 'warning')
      return false
    }
    setLoading(true)
    if (resetNotice) clearNotice()
    try {
      const res = await api.getMealsByMess(messId, { startDate: date, endDate: date, limit: 20 })
      setMeals(normalizeMeals(res.data))
      return true
    } catch (error) {
      setMeals([])
      showError(error, 'loadLockFailed')
      return false
    } finally {
      setLoading(false)
    }
  }, [clearNotice, date, messId, showError, showMessage])

  useEffect(() => {
    void loadMeals()
  }, [loadMeals])

  const selectedMeal = findMeal(meals, mealName)
  const locked = mealIsLocked(selectedMeal)

  async function toggleLock() {
    if (!selectedMeal) return
    setSaving(true)
    clearNotice()

    try {
      await api.updateMeal(selectedMeal.id, { mealStatus: locked ? 'CONFIRMED' : 'LOCKED', date })
      const refreshed = await loadMeals(false)
      if (!refreshed) return
      showMessage('lockUpdated', 'success', {
        meal: mealLabel(mealName, locale),
        state: locked ? mealCopy('unlocked') : mealCopy('locked'),
      })
    } catch (error) {
      showError(error, 'lockUpdateFailed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen title={mealCopy('lockUnlockMeals')} subtitle={mealCopy('controlMemberUpdates')} backHref="/meals/manager" />
      <div className="screen space-y-4">
        <MealDateCard date={date} onChange={setDate} />

        <MealCard className="text-center">
          <MealStateIllustration state={locked ? 'locked' : 'open'} mealName={mealName} />
          <div className={`mt-3 text-title font-bold ${locked ? 'text-[#ee1f2f]' : 'text-[#123748]'}`}>
            {mealCopy('mealState', { meal: mealLabel(mealName, locale), state: locked ? mealCopy('locked') : mealCopy('unlocked') })}
          </div>
          <div className="mt-2 text-label text-[#65838b]">
            {locked ? mealCopy('membersCannotChange') : mealCopy('membersCanChange')}
          </div>
        </MealCard>

        <MealCard className="space-y-3">
          <div className="section-title mb-0">{mealCopy('selectMealTime')}</div>
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
                  <div className="text-label font-bold text-[#123748]">{mealLabel(item, locale)}</div>
                  <div className="mt-0.5 text-caption font-semibold text-[#65838b]">{meal ? mealCopy('recordAvailable') : mealCopy('noRecordYet')}</div>
                </div>
                <MealStatusPill tone={itemLocked ? 'closed' : 'neutral'}>{itemLocked ? mealCopy('locked') : mealCopy('unlocked')}</MealStatusPill>
              </button>
            )
          })}
        </MealCard>

        {notice ? <InlineNotice tone={notice.tone}>{notice.message}</InlineNotice> : null}
        {loading ? <LoadingIndicator variant="card" label={mealCopy('loadingLockStatus')} /> : null}

        <InlineNotice tone={selectedMeal ? 'info' : 'warning'}>
          {selectedMeal ? mealCopy('lockedCannotChange') : mealCopy('addBeforeLocking')}
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
          {saving ? mealCopy('updating') : locked ? mealCopy('unlockMeal', { meal: mealLabel(mealName, locale) }) : mealCopy('lockMeal', { meal: mealLabel(mealName, locale) })}
        </button>

        <MealCard className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#edfafa] text-[#008d8c]">
            <LockStateIcon locked={locked} />
          </div>
          <div>
            <div className="text-body font-bold text-[#123748]">{mealCopy('currentSelection')}</div>
            <div className="mt-1 text-label text-[#65838b]">{mealCopy('mealState', { meal: mealLabel(mealName, locale), state: locked ? mealCopy('locked') : mealCopy('unlocked') })}</div>
          </div>
        </MealCard>
      </div>
    </MobileShell>
  )
}
