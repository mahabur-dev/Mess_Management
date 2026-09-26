'use client'

import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { ToggleField } from '@/components/mobile/form-controls'
import { InlineNotice, MealCard } from '@/components/mobile/meals-design'
import { api } from '@/lib/api'
import { useAuth } from '@/app/providers'
import { useLocaleFormatters, useLocalizedNotice, useTranslations } from '@/lib/i18n'

type MealNotificationState = {
  mealReminder: boolean
  deadlineReminder: boolean
  deadlineReminderMinutes: number
}

const DEFAULT_SETTINGS: MealNotificationState = {
  mealReminder: true,
  deadlineReminder: true,
  deadlineReminderMinutes: 60,
}

export default function MealSettingsPage() {
  const { user } = useAuth()
  const meals = useTranslations('meals')
  const format = useLocaleFormatters()
  const messId = user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? ''
  const [settings, setSettings] = useState<MealNotificationState>(DEFAULT_SETTINGS)
  const [saving, setSaving] = useState(false)
  const { notice, clearNotice, showError, showMessage } = useLocalizedNotice('meals')

  useEffect(() => {
    let alive = true

    async function loadSettings() {
      if (!messId) {
        if (!alive) return
        setSettings(DEFAULT_SETTINGS)
        showMessage('noMessSelected', 'warning')
        return
      }

      clearNotice()

      try {
        const response = await api.getMealSettings(messId)
        if (!alive) return

        const data = (response.data ?? {}) as {
          windowNotificationEnabled?: boolean
          deadlineNotificationEnabled?: boolean
          deadlineReminderMinutes?: number
        }

        setSettings({
          mealReminder: data.windowNotificationEnabled ?? DEFAULT_SETTINGS.mealReminder,
          deadlineReminder: data.deadlineNotificationEnabled ?? DEFAULT_SETTINGS.deadlineReminder,
          deadlineReminderMinutes: data.deadlineReminderMinutes ?? DEFAULT_SETTINGS.deadlineReminderMinutes,
        })
      } catch (error) {
        if (!alive) return
        setSettings(DEFAULT_SETTINGS)
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
      if (!messId) {
        showMessage('noMessSelected', 'warning')
        return
      }

      await api.updateMealSettings(messId, {
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
      <TopScreen title={meals('settings')} subtitle={meals('notificationSettingsDescription')} backHref="/meals/manager" />
      <div className="screen space-y-4">
        <MealCard className="space-y-3">
          <div className="section-title mb-0">{meals('notifications')}</div>
          <ToggleField label={meals('mealReminder')} hint={meals('mealReminderHint')} checked={settings.mealReminder} onChange={(mealReminder) => setSettings((prev) => ({ ...prev, mealReminder }))} />
          <ToggleField
            label={meals('deadlineReminder')}
            hint={meals('deadlineReminderHint', { minutes: format.number(settings.deadlineReminderMinutes) })}
            checked={settings.deadlineReminder}
            onChange={(deadlineReminder) => setSettings((prev) => ({ ...prev, deadlineReminder }))}
          />
        </MealCard>

        {notice ? <InlineNotice tone={notice.tone}>{notice.message}</InlineNotice> : null}

        <button type="button" className="primary-btn flex w-full items-center justify-center gap-2 disabled:opacity-60" onClick={saveSettings} disabled={saving}>
          <Save size={18} /> {saving ? meals('saving') : meals('saveSettings')}
        </button>
      </div>
    </MobileShell>
  )
}
