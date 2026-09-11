'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, Check, LoaderCircle, ShieldCheck } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { Button } from '@/components/ui/button'
import { api, type BazarFrequency, type BazarScheduleSettings } from '@/lib/api'
import { getActiveMessId } from '@/lib/app-permissions'
import { useLocale } from '@/lib/i18n'
import { appHref } from '@/lib/routes'
import { useAuth } from '@/app/providers'

const weekdayOptions = [
  { value: 6, en: 'Sat', bn: 'শনি' },
  { value: 0, en: 'Sun', bn: 'রবি' },
  { value: 1, en: 'Mon', bn: 'সোম' },
  { value: 2, en: 'Tue', bn: 'মঙ্গল' },
  { value: 3, en: 'Wed', bn: 'বুধ' },
  { value: 4, en: 'Thu', bn: 'বৃহস্পতি' },
  { value: 5, en: 'Fri', bn: 'শুক্র' },
] as const

function getSettingsCopy(locale: 'en' | 'bn') {
  if (locale === 'bn') {
    return {
      settingsTitle: 'বাজার সময়সূচির সেটিংস', settingsDescription: 'পরবর্তী মাসগুলোর জন্য পুনরাবৃত্ত নিয়ম নির্ধারণ করুন।',
      actionFailed: 'কাজটি সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।', loading: 'বাজার সময়সূচি লোড হচ্ছে...',
      frequency: 'ফ্রিকোয়েন্সি', frequencyQuestion: 'কখন বাজার হবে?',
      everyDay: 'প্রতিদিন', everyDayHint: 'প্রতিদিন বাজারের তারিখ তৈরি হবে।',
      specificWeekdays: 'নির্দিষ্ট বার', weekdayHint: 'প্রতি মাসে নির্বাচিত বারগুলো পুনরাবৃত্তি হবে।',
      customDates: 'নির্দিষ্ট তারিখ', customDateHint: 'প্রতি মাসে নির্বাচিত তারিখগুলো পুনরাবৃত্তি হবে।',
      repeatOn: 'পুনরাবৃত্তি হবে', monthlyDates: 'মাসের তারিখ', selected: 'নির্বাচিত',
      shorterMonth: 'ছোট মাসে না থাকা তারিখ স্বয়ংক্রিয়ভাবে বাদ যাবে।',
      dutyPolicy: 'দায়িত্ব নীতি', peoplePerBazar: 'প্রতি বাজারে সদস্য', dutyLimit: 'মাসিক দায়িত্ব সীমা', releaseNotice: 'ছাড়ার পূর্ব-নোটিশ', days: 'দিন',
      includeManager: 'ম্যানেজারকে দায়িত্ব তালিকায় রাখুন', includeManagerHint: 'ম্যানেজারও দায়িত্ব বরাদ্দের জন্য যোগ্য থাকবেন।',
      strictFairness: 'ন্যায্য বণ্টন বাধ্যতামূলক করুন', strictFairnessHint: 'সবার দায়িত্ব যতটা সম্ভব ভারসাম্যপূর্ণ রাখে।',
      settingsNotice: 'পরিবর্তন পরের তৈরি হওয়া সময়সূচিতে প্রযোজ্য হবে। বর্তমান মাস অপরিবর্তিত ও audit-ready থাকবে।',
      cancel: 'বাতিল', saveSettings: 'সেটিংস সংরক্ষণ করুন', saving: 'সংরক্ষণ হচ্ছে...',
    }
  }

  return {
    settingsTitle: 'Bazar schedule settings', settingsDescription: 'Set the repeating rules for future monthly schedules.',
    actionFailed: 'The action could not be completed. Please try again.', loading: 'Loading bazar schedule...',
    frequency: 'Frequency', frequencyQuestion: 'When does bazar happen?',
    everyDay: 'Every day', everyDayHint: 'Create a bazar date every day.',
    specificWeekdays: 'Specific weekdays', weekdayHint: 'Repeat selected weekdays every month.',
    customDates: 'Custom dates', customDateHint: 'Repeat selected day numbers every month.',
    repeatOn: 'Repeat on', monthlyDates: 'Monthly dates', selected: 'selected',
    shorterMonth: 'Dates that do not exist in a shorter month are skipped automatically.',
    dutyPolicy: 'Duty policy', peoplePerBazar: 'People per bazar', dutyLimit: 'Monthly duty limit', releaseNotice: 'Free release notice', days: 'days',
    includeManager: 'Include manager in duty rotation', includeManagerHint: 'The manager is eligible for duty assignment.',
    strictFairness: 'Enforce fair selection', strictFairnessHint: 'Keeps member duty counts as balanced as possible.',
    settingsNotice: 'Changes apply to the next schedule you generate. The active month remains unchanged and auditable.',
    cancel: 'Cancel', saveSettings: 'Save settings', saving: 'Saving...',
  }
}

function createDefaultSettings(): BazarScheduleSettings {
  return {
    id: '',
    mess_id: '',
    frequency: 'EVERY_DAY',
    weekdays: [],
    custom_days: [],
    default_members_per_date: 1,
    duty_limit: 4,
    include_manager: false,
    release_notice_days: 5,
    strict_fairness: false,
  }
}

function toggleNumber(values: number[], value: number) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value].sort((first, second) => first - second)
}

export default function BazarScheduleSettingsPage() {
  const { user } = useAuth()
  const { locale } = useLocale()
  const router = useRouter()
  const copy = getSettingsCopy(locale)
  const messId = getActiveMessId(user)
  const [draft, setDraft] = useState<BazarScheduleSettings>(createDefaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    if (!messId) {
      setLoading(false)
      return () => { active = false }
    }

    void api.getBazarScheduleSettings(messId)
      .then((response) => {
        if (active) setDraft(response.data)
      })
      .catch(() => {
        if (active) setError(copy.actionFailed)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [copy.actionFailed, messId])

  const requiresSelection = useMemo(
    () => (draft.frequency === 'SPECIFIC_WEEKDAYS' && !draft.weekdays.length)
      || (draft.frequency === 'CUSTOM_DATES' && !draft.custom_days.length),
    [draft.custom_days.length, draft.frequency, draft.weekdays.length],
  )

  const update = (patch: Partial<BazarScheduleSettings>) => {
    setDraft((current) => ({ ...current, ...patch }))
  }

  const save = async () => {
    if (!messId || requiresSelection) return

    setSaving(true)
    setError('')
    try {
      await api.saveBazarScheduleSettings(messId, {
        frequency: draft.frequency,
        weekdays: draft.weekdays,
        customDays: draft.custom_days,
        defaultMembersPerDate: draft.default_members_per_date,
        dutyLimit: draft.duty_limit,
        includeManager: draft.include_manager,
        releaseNoticeDays: draft.release_notice_days,
        strictFairness: draft.strict_fairness,
      })
      router.replace(appHref('/bazar-schedule'))
    } catch {
      setError(copy.actionFailed)
    } finally {
      setSaving(false)
    }
  }

  const frequencyOptions: Array<{ value: BazarFrequency; title: string; hint: string }> = [
    { value: 'EVERY_DAY', title: copy.everyDay, hint: copy.everyDayHint },
    { value: 'SPECIFIC_WEEKDAYS', title: copy.specificWeekdays, hint: copy.weekdayHint },
    { value: 'CUSTOM_DATES', title: copy.customDates, hint: copy.customDateHint },
  ]

  return (
    <MobileShell>
      <TopScreen title={copy.settingsTitle} subtitle={copy.settingsDescription} backHref="/bazar-schedule" />
      <div className="screen bazar-settings-page">
        {loading ? (
          <div className="bazar-loading" role="status"><LoaderCircle className="animate-spin" size={21} /> {copy.loading}</div>
        ) : (
          <form
            className="bazar-settings-form"
            onSubmit={(event) => {
              event.preventDefault()
              void save()
            }}
          >
            <section className="bazar-settings-section" aria-labelledby="bazar-frequency-heading">
              <p className="bazar-field-label">{copy.frequency}</p>
              <h2 id="bazar-frequency-heading" className="bazar-question">{copy.frequencyQuestion}</h2>
              <div className="bazar-frequency-list">
                {frequencyOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    data-active={draft.frequency === option.value}
                    onClick={() => update({ frequency: option.value })}
                  >
                    <span><CalendarDays size={17} /></span>
                    <div><strong>{option.title}</strong><small>{option.hint}</small></div>
                    {draft.frequency === option.value ? <Check size={17} /> : <i />}
                  </button>
                ))}
              </div>

              {draft.frequency === 'SPECIFIC_WEEKDAYS' ? (
                <div className="bazar-settings-subsection">
                  <p className="bazar-field-label">{copy.repeatOn}</p>
                  <div className="bazar-choice-grid">
                    {weekdayOptions.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        data-active={draft.weekdays.includes(day.value)}
                        onClick={() => update({ weekdays: toggleNumber(draft.weekdays, day.value) })}
                      >
                        {locale === 'bn' ? day.bn : day.en}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {draft.frequency === 'CUSTOM_DATES' ? (
                <div className="bazar-settings-subsection">
                  <div className="flex items-center justify-between gap-3">
                    <p className="bazar-field-label">{copy.monthlyDates}</p>
                    <span className="text-caption font-semibold text-[#53717a]">{draft.custom_days.length} {copy.selected}</span>
                  </div>
                  <div className="bazar-date-grid">
                    {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
                      <button
                        key={day}
                        type="button"
                        data-active={draft.custom_days.includes(day)}
                        onClick={() => update({ custom_days: toggleNumber(draft.custom_days, day) })}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                  <p className="bazar-hint">{copy.shorterMonth}</p>
                </div>
              ) : null}
            </section>

            <section className="bazar-settings-section" aria-labelledby="bazar-duty-policy-heading">
              <p id="bazar-duty-policy-heading" className="bazar-field-label">{copy.dutyPolicy}</p>
              <div className="bazar-input-stack">
                <NumberField label={copy.peoplePerBazar} value={draft.default_members_per_date} min={1} max={50} onChange={(value) => update({ default_members_per_date: value })} />
                <NumberField label={copy.dutyLimit} value={draft.duty_limit} min={1} max={100} onChange={(value) => update({ duty_limit: value })} />
                <NumberField label={copy.releaseNotice} suffix={copy.days} value={draft.release_notice_days} min={0} max={31} onChange={(value) => update({ release_notice_days: value })} />
              </div>
              <ToggleRow label={copy.includeManager} hint={copy.includeManagerHint} checked={draft.include_manager} onChange={(checked) => update({ include_manager: checked })} />
              <ToggleRow label={copy.strictFairness} hint={copy.strictFairnessHint} checked={draft.strict_fairness} onChange={(checked) => update({ strict_fairness: checked })} />
            </section>

            <aside className="bazar-sheet-note"><ShieldCheck size={15} />{copy.settingsNotice}</aside>
            {error ? <p className="bazar-settings-error" role="alert">{error}</p> : null}

            <footer className="bazar-settings-actions">
              <Button type="button" variant="secondary" onClick={() => router.replace(appHref('/bazar-schedule'))}>{copy.cancel}</Button>
              <Button type="submit" disabled={requiresSelection || !messId} busy={saving} busyLabel={copy.saving}>{copy.saveSettings}</Button>
            </footer>
          </form>
        )}
      </div>
    </MobileShell>
  )
}

function NumberField({ label, value, min, max, suffix, onChange }: { label: string; value: number; min: number; max: number; suffix?: string; onChange: (value: number) => void }) {
  return (
    <label className="bazar-number-field">
      <span>{label}</span>
      <input type="number" min={min} max={max} value={value} onChange={(event) => onChange(Math.max(min, Math.min(max, Number(event.target.value) || min)))} />
      {suffix ? <em>{suffix}</em> : null}
    </label>
  )
}

function ToggleRow({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="bazar-toggle-row">
      <span><strong>{label}</strong><small>{hint}</small></span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <i aria-hidden="true" />
    </label>
  )
}
