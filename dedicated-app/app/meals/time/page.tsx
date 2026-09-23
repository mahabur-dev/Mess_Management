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
  todayIsoDate,
  type MealDeadlineInfo,
} from '@/components/mobile/meals-design'
import { api } from '@/lib/api'
import { useAuth } from '@/app/providers'
import { useLocalizedNotice, useTranslations } from '@/lib/i18n'

export default function SetMealTimePage() {
  const { user } = useAuth()
  const mealsCopy = useTranslations('meals')
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? '', [user])
  const [date, setDate] = useState(todayIsoDate())
  const [startTime, setStartTime] = useState('22:00')
  const [endTime, setEndTime] = useState('11:00')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { notice, clearNotice, showError, showMessage } = useLocalizedNotice('meals')

  useEffect(() => {
    if (!messId) {
      setLoading(false)
      showMessage('noMessSelected', 'warning')
      return
    }
    let alive = true
    setLoading(true)
    clearNotice()

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
        showError(error, 'loadTimeFailed')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [clearNotice, date, messId, showError, showMessage])

  async function saveSettings() {
    if (!messId) return showMessage('noMessSelected', 'warning')
    if (!startTime || !endTime) return showMessage('timeRequired', 'danger')
    setSaving(true)
    clearNotice()

    try {
      await api.setMealDeadline(messId, { startTime, endTime, date })
      showMessage('timeUpdated', 'success')
    } catch (error) {
      showError(error, 'timeUpdateFailed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen title={mealsCopy('setMealTime')} subtitle={mealsCopy('setMealTimeDescription')} backHref="/meals/manager" />
      <div className="screen space-y-4">
        <MealDateCard date={date} onChange={setDate} />

        <MealCard className="space-y-4">
          <div className="section-title mb-0">{mealsCopy('updateWindow')}</div>
          <div className="grid min-w-0 grid-cols-2 gap-3">
            <label className="min-w-0 block">
              <div className="mb-2 text-label font-semibold text-[#123748]">{mealsCopy('from')}</div>
              <input className="field meal-time-input min-h-14 w-full min-w-0" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
            </label>
            <label className="min-w-0 block">
              <div className="mb-2 text-label font-semibold text-[#123748]">{mealsCopy('to')}</div>
              <input className="field meal-time-input min-h-14 w-full min-w-0" type="time" step="3600" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
            </label>
          </div>

          {loading ? <LoadingIndicator variant="card" label={mealsCopy('loadingDeadline')} /> : null}
          {notice ? <InlineNotice tone={notice.tone}>{notice.message}</InlineNotice> : null}
        </MealCard>

        <button type="button" className="primary-btn flex w-full items-center justify-center gap-2 disabled:opacity-60" onClick={saveSettings} disabled={saving}>
          {saving ? <Clock3 size={18} /> : <Save size={18} />}
          {saving ? mealsCopy('saving') : mealsCopy('saveSettings')}
        </button>
      </div>
    </MobileShell>
  )
}
