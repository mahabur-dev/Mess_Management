'use client'

import { useEffect, useState } from 'react'
import { BellRing, ChevronDown, Clock3, Save, UtensilsCrossed } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { FieldCard, ToggleField } from '@/components/mobile/form-controls'
import { InlineNotice, MealCard } from '@/components/mobile/meals-design'
import { api } from '@/lib/api'
import { useAuth } from '@/app/providers'

type MealPreferenceState = {
  defaultStatus: 'TAKE' | 'NO'
  allowNoMeal: boolean
  mealReminder: boolean
  deadlineReminder: boolean
  reminderTiming: string
  deadlineTiming: string
  timeFormat: '12' | '24'
  language: 'English' | 'Bangla'
}

const STORAGE_KEY = 'messzen:meal-preferences'

const DEFAULT_SETTINGS: MealPreferenceState = {
  defaultStatus: 'TAKE',
  allowNoMeal: true,
  mealReminder: true,
  deadlineReminder: true,
  reminderTiming: 'Before deadline',
  deadlineTiming: '15 minutes before',
  timeFormat: '12',
  language: 'English',
}

export default function MealSettingsPage() {
  const { user } = useAuth()
  const messId = user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? ''
  const [settings, setSettings] = useState<MealPreferenceState>(DEFAULT_SETTINGS)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let alive = true
    const saved = window.localStorage.getItem(STORAGE_KEY)
    const localPrefs = saved ? (JSON.parse(saved) as Partial<MealPreferenceState>) : {}

    async function loadSettings() {
      if (!messId) {
        if (!alive) return
        setSettings({ ...DEFAULT_SETTINGS, ...localPrefs })
        return
      }

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
      } catch {
        if (!alive) return
        setSettings({ ...DEFAULT_SETTINGS, ...localPrefs })
      }
    }

    void loadSettings()

    return () => {
      alive = false
    }
  }, [messId])

  async function saveSettings() {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        reminderTiming: settings.reminderTiming,
        deadlineTiming: settings.deadlineTiming,
        timeFormat: settings.timeFormat,
        language: settings.language,
      }),
    )

    if (!messId) {
      setMessage('Meal preferences saved successfully.')
      return
    }

    try {
      await api.updateMealSettings(messId, {
        defaultStatus: settings.defaultStatus === 'TAKE' ? 'ON' : 'OFF',
        allowNoMeal: settings.allowNoMeal,
        windowNotificationEnabled: settings.mealReminder,
        deadlineNotificationEnabled: settings.deadlineReminder,
      })
      setMessage('Meal preferences saved successfully.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to save meal preferences.')
    }
  }

  return (
    <MobileShell>
      <TopScreen title="Meal Settings" subtitle="Preferences and reminders" backHref="/meals/manager" />
      <div className="screen space-y-4">
        <MealCard className="space-y-3">
          <div className="section-title mb-0">Meal Preferences</div>
          <FieldCard label="Default Meal Status">
            <button
              type="button"
              className="field flex h-14 items-center justify-between text-left text-body font-semibold"
              onClick={() => setSettings((prev) => ({ ...prev, defaultStatus: prev.defaultStatus === 'TAKE' ? 'NO' : 'TAKE' }))}
            >
              <span>{settings.defaultStatus === 'TAKE' ? 'I will take meal' : 'No Meal'}</span>
              <ChevronDown size={18} className="text-[#008d8c]" />
            </button>
          </FieldCard>
          <ToggleField label="Allow No Meal Option" checked={settings.allowNoMeal} onChange={(allowNoMeal) => setSettings((prev) => ({ ...prev, allowNoMeal }))} />
        </MealCard>

        <MealCard className="space-y-3">
          <div className="section-title mb-0">Notifications</div>
          <ToggleField label="Meal Reminder" hint={settings.reminderTiming} checked={settings.mealReminder} onChange={(mealReminder) => setSettings((prev) => ({ ...prev, mealReminder }))} />
          <ToggleField label="Deadline Reminder" hint={settings.deadlineTiming} checked={settings.deadlineReminder} onChange={(deadlineReminder) => setSettings((prev) => ({ ...prev, deadlineReminder }))} />
        </MealCard>

        <MealCard className="space-y-3">
          <div className="section-title mb-0">General</div>
          <button
            type="button"
            className="flex min-h-12 w-full items-center justify-between rounded-[16px] border border-[#cfeeed] bg-white px-4 text-body font-semibold text-[#123748]"
            onClick={() => setSettings((prev) => ({ ...prev, timeFormat: prev.timeFormat === '12' ? '24' : '12' }))}
          >
            <span className="inline-flex items-center gap-2 text-[#65838b]">
              <Clock3 size={16} /> Time Format
            </span>
            <span>{settings.timeFormat === '12' ? '12 Hour (AM/PM)' : '24 Hour'}</span>
          </button>

          <button
            type="button"
            className="flex min-h-12 w-full items-center justify-between rounded-[16px] border border-[#cfeeed] bg-white px-4 text-body font-semibold text-[#123748]"
            onClick={() => setSettings((prev) => ({ ...prev, language: prev.language === 'English' ? 'Bangla' : 'English' }))}
          >
            <span className="inline-flex items-center gap-2 text-[#65838b]">
              <UtensilsCrossed size={16} /> Language
            </span>
            <span>{settings.language}</span>
          </button>
        </MealCard>

        {message ? <InlineNotice tone="success">{message}</InlineNotice> : null}

        <button type="button" className="primary-btn flex w-full items-center justify-center gap-2" onClick={saveSettings}>
          <Save size={18} /> Save Preferences
        </button>

        <MealCard className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#edfafa] text-[#008d8c]">
            <BellRing size={18} />
          </div>
          <div>
            <div className="text-label font-bold text-[#123748]">Ready for notification API</div>
            <div className="mt-1 text-label text-[#65838b]">This page keeps the UI contract stable for future backend settings.</div>
          </div>
        </MealCard>
      </div>
    </MobileShell>
  )
}
