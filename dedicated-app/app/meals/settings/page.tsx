'use client'

import { useEffect, useState } from 'react'
import { BellRing, ChevronDown, Clock3, Save } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { FieldCard, ToggleField } from '@/components/mobile/form-controls'
import { InlineNotice, MealCard } from '@/components/mobile/meals-design'
import { api } from '@/lib/api'
import { useAuth } from '@/app/providers'
import { useLocalizedNotice, useTranslations } from '@/lib/i18n'

type MealPreferenceState = {
  defaultStatus: 'TAKE' | 'NO'
  allowNoMeal: boolean
  mealReminder: boolean
  deadlineReminder: boolean
  timeFormat: '12' | '24'
}

const STORAGE_KEY = 'messzen:meal-preferences'

const DEFAULT_SETTINGS: MealPreferenceState = {
  defaultStatus: 'TAKE',
  allowNoMeal: true,
  mealReminder: true,
  deadlineReminder: true,
  timeFormat: '12',
}

function readLocalPreferences(): Partial<MealPreferenceState> {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (!saved) return {}
    const parsed = JSON.parse(saved) as Record<string, unknown>
    return parsed.timeFormat === '12' || parsed.timeFormat === '24'
      ? { timeFormat: parsed.timeFormat }
      : {}
  } catch {
    return {}
  }
}

export default function MealSettingsPage() {
  const { user } = useAuth()
  const meals = useTranslations('meals')
  const messId = user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? ''
  const [settings, setSettings] = useState<MealPreferenceState>(DEFAULT_SETTINGS)
  const [saving, setSaving] = useState(false)
  const { notice, clearNotice, showError, showMessage } = useLocalizedNotice('meals')

  useEffect(() => {
    let alive = true
    const localPrefs = readLocalPreferences()

    async function loadSettings() {
      if (!messId) {
        if (!alive) return
        setSettings({ ...DEFAULT_SETTINGS, ...localPrefs })
        showMessage('noMessSelected', 'warning')
        return
      }

      clearNotice()

      try {
        const response = await api.getMealSettings(messId)
        if (!alive) return

        const data = (response.data ?? {}) as {
          defaultStatus?: 'ON' | 'OFF'
          allowNoMeal?: boolean
          windowNotificationEnabled?: boolean
          deadlineNotificationEnabled?: boolean
        }

        setSettings({
          ...DEFAULT_SETTINGS,
          ...localPrefs,
          defaultStatus: data.defaultStatus === 'OFF' ? 'NO' : 'TAKE',
          allowNoMeal: data.allowNoMeal ?? DEFAULT_SETTINGS.allowNoMeal,
          mealReminder: data.windowNotificationEnabled ?? DEFAULT_SETTINGS.mealReminder,
          deadlineReminder: data.deadlineNotificationEnabled ?? DEFAULT_SETTINGS.deadlineReminder,
        })
      } catch (error) {
        if (!alive) return
        setSettings({ ...DEFAULT_SETTINGS, ...localPrefs })
        showError(error, 'loadSettingsFailed')
      }
    }

    void loadSettings()

    return () => {
      alive = false
    }
  }, [clearNotice, messId, showError, showMessage])

  async function saveSettings() {
    setSaving(true)
    clearNotice()

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          timeFormat: settings.timeFormat,
        }),
      )

      if (!messId) {
        showMessage('noMessSelected', 'warning')
        return
      }

      await api.updateMealSettings(messId, {
        defaultStatus: settings.defaultStatus === 'TAKE' ? 'ON' : 'OFF',
        allowNoMeal: settings.allowNoMeal,
        windowNotificationEnabled: settings.mealReminder,
        deadlineNotificationEnabled: settings.deadlineReminder,
      })
      showMessage('preferencesSaved', 'success')
    } catch (error) {
      showError(error, 'preferencesSaveFailed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen title={meals('settings')} subtitle={meals('preferencesReminders')} backHref="/meals/manager" />
      <div className="screen space-y-4">
        <MealCard className="space-y-3">
          <div className="section-title mb-0">{meals('mealPreferences')}</div>
          <FieldCard label={meals('defaultMealStatus')}>
            <button
              type="button"
              className="field flex h-14 items-center justify-between text-left text-body font-semibold"
              onClick={() => setSettings((prev) => ({ ...prev, defaultStatus: prev.defaultStatus === 'TAKE' ? 'NO' : 'TAKE' }))}
            >
              <span>{settings.defaultStatus === 'TAKE' ? meals('takeMeal') : meals('noMeal')}</span>
              <ChevronDown size={18} className="text-[#008d8c]" />
            </button>
          </FieldCard>
          <ToggleField label={meals('allowNoMeal')} checked={settings.allowNoMeal} onChange={(allowNoMeal) => setSettings((prev) => ({ ...prev, allowNoMeal }))} />
        </MealCard>

        <MealCard className="space-y-3">
          <div className="section-title mb-0">{meals('notifications')}</div>
          <ToggleField label={meals('mealReminder')} hint={meals('beforeDeadline')} checked={settings.mealReminder} onChange={(mealReminder) => setSettings((prev) => ({ ...prev, mealReminder }))} />
          <ToggleField label={meals('deadlineReminder')} hint={meals('minutesBefore')} checked={settings.deadlineReminder} onChange={(deadlineReminder) => setSettings((prev) => ({ ...prev, deadlineReminder }))} />
        </MealCard>

        <MealCard className="space-y-3">
          <div className="section-title mb-0">{meals('general')}</div>
          <button
            type="button"
            className="flex min-h-12 w-full items-center justify-between rounded-[16px] border border-[#cfeeed] bg-white px-4 text-body font-semibold text-[#123748]"
            onClick={() => setSettings((prev) => ({ ...prev, timeFormat: prev.timeFormat === '12' ? '24' : '12' }))}
          >
            <span className="inline-flex items-center gap-2 text-[#65838b]">
              <Clock3 size={16} /> {meals('timeFormat')}
            </span>
            <span>{settings.timeFormat === '12' ? meals('twelveHour') : meals('twentyFourHour')}</span>
          </button>
        </MealCard>

        {notice ? <InlineNotice tone={notice.tone}>{notice.message}</InlineNotice> : null}

        <button type="button" className="primary-btn flex w-full items-center justify-center gap-2 disabled:opacity-60" onClick={saveSettings} disabled={saving}>
          <Save size={18} /> {saving ? meals('saving') : meals('savePreferences')}
        </button>

        <MealCard className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#edfafa] text-[#008d8c]">
            <BellRing size={18} />
          </div>
          <div>
            <div className="text-label font-semibold text-[#123748]">{meals('notificationReady')}</div>
            <div className="mt-1 text-label text-[#65838b]">{meals('notificationReadyDescription')}</div>
          </div>
        </MealCard>
      </div>
    </MobileShell>
  )
}
