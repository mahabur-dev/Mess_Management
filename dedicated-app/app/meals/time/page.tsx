'use client'

import { useEffect, useMemo, useState } from 'react'
import { Clock3, Save } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { LoadingIndicator } from '@/components/loading-indicator'
import { TopScreen } from '@/components/top-screen'
import {
  InlineNotice,
  MealCard,
  MealDateCard,
  MEAL_LABELS,
  MEAL_ORDER,
  MealIconBadge,
  MealStatusPill,
  SaveConfirmNote,
  formatTime,
  todayIsoDate,
  type MealDeadlineInfo,
  type MealName,
} from '@/components/mobile/meals-design'
import { api } from '@/lib/api'
import { useAuth } from '@/app/providers'

function MealTimePreview({
  mealName,
  active,
  startTime,
  endTime,
}: {
  mealName: MealName
  active: boolean
  startTime: string
  endTime: string
}) {
  return (
    <div className="rounded-[18px] border border-[#d8eeee] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <MealIconBadge mealName={mealName} />
          <div>
            <div className="text-label font-bold text-[#123748]">{MEAL_LABELS[mealName]}</div>
            <div className="mt-1 text-caption font-semibold text-[#65838b]">Member update window</div>
          </div>
        </div>
        <MealStatusPill tone={active ? 'open' : 'neutral'}>{active ? 'On' : 'Off'}</MealStatusPill>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto] gap-y-2 text-label font-semibold">
        <span className="text-[#65838b]">From</span>
        <span className="text-[#123748]">{formatTime(startTime)}</span>
        <span className="text-[#65838b]">To</span>
        <span className="text-[#123748]">{formatTime(endTime)}</span>
      </div>
    </div>
  )
}

export default function SetMealTimePage() {
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? '', [user])
  const [date, setDate] = useState(todayIsoDate())
  const [startTime, setStartTime] = useState('22:00')
  const [endTime, setEndTime] = useState('11:00')
  const [activeMeal, setActiveMeal] = useState<MealName>('LUNCH')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!messId) return
    let alive = true
    setLoading(true)
    setMessage('')

    api
      .getMealDeadline(messId, date)
      .then((res) => {
        if (!alive) return
        const data = (res.data ?? {}) as MealDeadlineInfo
        setStartTime(data.startTime ?? '22:00')
        setEndTime(data.endTime ?? '11:00')
      })
      .catch((error) => {
        if (!alive) return
        setMessage(error instanceof Error ? error.message : 'Failed to load meal time.')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [date, messId])

  async function saveSettings() {
    if (!messId) return
    setSaving(true)
    setMessage('')

    try {
      await api.setMealDeadline(messId, { startTime, endTime, date })
      setMessage('Meal time updated successfully.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update meal time.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen title="Set Meal Time" subtitle="Manage member meal update window" backHref="/meals/manager" />
      <div className="screen space-y-4">
        <MealDateCard date={date} onChange={setDate} />

        <MealCard className="space-y-4">
          <div className="section-title mb-0">Update Window</div>
          <div className="grid min-w-0 grid-cols-2 gap-3">
            <label className="min-w-0 block">
              <div className="mb-2 text-label font-semibold text-[#123748]">From</div>
              <input className="field meal-time-input min-h-14 w-full min-w-0" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
            </label>
            <label className="min-w-0 block">
              <div className="mb-2 text-label font-semibold text-[#123748]">To</div>
              <input className="field meal-time-input min-h-14 w-full min-w-0" type="time" step="3600" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
            </label>
          </div>

          {loading ? <LoadingIndicator variant="card" label="Loading meal deadline" /> : null}
          {message ? <InlineNotice tone={message.includes('successfully') ? 'success' : 'danger'}>{message}</InlineNotice> : null}
        </MealCard>

        <div className="space-y-3">
          {MEAL_ORDER.map((mealName) => (
            <button key={mealName} type="button" className="w-full text-left" onClick={() => setActiveMeal(mealName)}>
              <MealTimePreview mealName={mealName} active={activeMeal === mealName} startTime={startTime} endTime={endTime} />
            </button>
          ))}
        </div>

        <SaveConfirmNote>Members can add/update their meals only within this configured time window.</SaveConfirmNote>

        <button type="button" className="primary-btn flex w-full items-center justify-center gap-2 disabled:opacity-60" onClick={saveSettings} disabled={saving}>
          {saving ? <Clock3 size={18} /> : <Save size={18} />}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </MobileShell>
  )
}
