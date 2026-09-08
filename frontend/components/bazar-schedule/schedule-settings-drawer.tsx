'use client'

import { useEffect, useState } from 'react'
import { CalendarClock, CalendarDays, Check, Loader2, Repeat2, Settings2, ShieldCheck, Users } from 'lucide-react'
import { apiClient, type BazarFrequency, type BazarScheduleSettings } from '@/lib/api-client'
import { EnterpriseDetailsDrawer } from '@/components/ui/enterprise-details-drawer'
import { EnterpriseDrawerAction, EnterpriseDrawerFooter } from '@/components/ui/enterprise-drawer-footer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { WEEKDAYS } from './bazar-schedule-utils'
import { bazarFrequencyLabel, localizedErrorMessage, useLocale, useLocaleFormatters, useTranslations, weekdayLabel } from '@/lib/i18n'

interface ScheduleSettingsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  messId: string
  settings?: BazarScheduleSettings | null
  onSaved: (settings: BazarScheduleSettings) => void | Promise<void>
}

const frequencyOptions: Array<{
  value: BazarFrequency
  icon: typeof CalendarDays
}> = [
  { value: 'EVERY_DAY', icon: CalendarDays },
  { value: 'SPECIFIC_WEEKDAYS', icon: Repeat2 },
  { value: 'CUSTOM_DATES', icon: CalendarClock },
]

export function ScheduleSettingsDrawer({ open, onOpenChange, messId, settings, onSaved }: ScheduleSettingsDrawerProps) {
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const t = useTranslations('bazarSchedule')
  const [frequency, setFrequency] = useState<BazarFrequency>('SPECIFIC_WEEKDAYS')
  const [weekdays, setWeekdays] = useState<number[]>([6, 2, 5])
  const [customDays, setCustomDays] = useState<number[]>([1, 4, 7])
  const [membersPerDate, setMembersPerDate] = useState<number | ''>(1)
  const [dutyLimit, setDutyLimit] = useState<number | ''>(1)
  const [releaseNoticeDays, setReleaseNoticeDays] = useState(5)
  const [includeManager, setIncludeManager] = useState(false)
  const [strictFairness, setStrictFairness] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setFrequency(settings?.frequency ?? 'SPECIFIC_WEEKDAYS')
    setWeekdays(settings?.weekdays?.length ? settings.weekdays : [6, 2, 5])
    setCustomDays(settings?.custom_days?.length ? settings.custom_days : [1, 4, 7])
    setMembersPerDate(settings?.default_members_per_date ?? 1)
    setDutyLimit(settings?.duty_limit ?? 1)
    setReleaseNoticeDays(settings?.release_notice_days ?? 5)
    setIncludeManager(settings?.include_manager ?? false)
    setStrictFairness(settings?.strict_fairness ?? false)
    setError('')
  }, [open, settings])

  const toggleValue = (values: number[], value: number, setter: (values: number[]) => void) => {
    setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value].sort((a, b) => a - b))
  }

  const save = async () => {
    if (frequency === 'SPECIFIC_WEEKDAYS' && !weekdays.length) {
      setError(t('selectWeekdayError'))
      return
    }
    if (frequency === 'CUSTOM_DATES' && !customDays.length) {
      setError(t('selectDateError'))
      return
    }
    const normalizedMembersPerDate = Number(membersPerDate)
    const normalizedDutyLimit = Number(dutyLimit)
    if (!Number.isInteger(normalizedMembersPerDate) || normalizedMembersPerDate < 1 || normalizedMembersPerDate > 50) {
      setError(t('peopleRangeError'))
      return
    }
    if (!Number.isInteger(normalizedDutyLimit) || normalizedDutyLimit < 1 || normalizedDutyLimit > 100) {
      setError(t('dutyRangeError'))
      return
    }
    setSaving(true)
    setError('')
    try {
      const response = await apiClient.saveBazarScheduleSettings(messId, {
        frequency,
        weekdays,
        customDays,
        defaultMembersPerDate: normalizedMembersPerDate,
        dutyLimit: normalizedDutyLimit,
        includeManager,
        releaseNoticeDays,
        strictFairness,
      })
      await onSaved(response.data)
      onOpenChange(false)
    } catch (cause) {
      setError(localizedErrorMessage(cause, locale, t('settingsSaveError')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <EnterpriseDetailsDrawer
      open={open}
      onOpenChange={onOpenChange}
      eyebrow={t('managerControl')}
      title={t('settingsTitle')}
      description={t('settingsDescription')}
      headerIcon={<Settings2 className="size-5" />}
      footer={
        <EnterpriseDrawerFooter>
          <EnterpriseDrawerAction tone="secondary" onClick={() => onOpenChange(false)} disabled={saving}>{t('cancel')}</EnterpriseDrawerAction>
          <EnterpriseDrawerAction priority="primary" tone="primary" onClick={() => void save()} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            {saving ? t('saving') : t('saveSettings')}
          </EnterpriseDrawerAction>
        </EnterpriseDrawerFooter>
      }
    >
      <div className="space-y-6">
        {error && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive dark:border-destructive/30 dark:bg-destructive/10 dark:text-destructive">{error}</div>}

        <section className="rounded-2xl bg-[var(--dashboard-surface)] p-4  sm:p-5">
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--brand)]">{t('frequency')}</p>
            <h3 className="mt-1 text-base font-semibold text-[var(--dashboard-ink)]">{t('whenBazar')}</h3>
          </div>
          <div className="grid gap-2">
            {frequencyOptions.map((option) => {
              const Icon = option.icon
              const active = frequency === option.value
              return (
                <button key={option.value} type="button" onClick={() => setFrequency(option.value)} className={cn('flex items-center gap-3 rounded-xl border p-3.5 text-left transition', active ? 'border-[var(--brand)] bg-[var(--brand-soft)] ' : 'border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] hover:border-[var(--brand-border)]')}>
                  <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', active ? 'bg-[var(--brand)] text-primary-foreground' : 'bg-[var(--dashboard-surface-subtle)] text-muted-foreground')}><Icon className="size-4.5" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-[var(--dashboard-ink)]">{bazarFrequencyLabel(option.value, locale)}</span><span className="mt-0.5 block text-xs font-medium leading-5 text-muted-foreground">{option.value === 'EVERY_DAY' ? t('frequencyEVERY_DAY') : option.value === 'SPECIFIC_WEEKDAYS' ? t('frequencySPECIFIC_WEEKDAYS') : t('frequencyCUSTOM_DATES')}</span></span>
                  <span className={cn('grid size-5 place-items-center rounded-full border', active ? 'border-[var(--brand)] bg-[var(--brand)] text-primary-foreground' : 'border-[var(--dashboard-line-strong)]')}><Check className={cn('size-3', !active && 'opacity-0')} /></span>
                </button>
              )
            })}
          </div>

          {frequency === 'SPECIFIC_WEEKDAYS' && (
            <div className="mt-5 border-t border-[var(--dashboard-line)] pt-5">
              <Label className="mb-3 font-semibold">{t('repeatOn')}</Label>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                {WEEKDAYS.map((day) => (
                  <button key={day.value} type="button" onClick={() => toggleValue(weekdays, day.value, setWeekdays)} className={cn('min-h-11 rounded-xl border text-xs font-bold transition', weekdays.includes(day.value) ? 'border-[var(--brand)] bg-[var(--brand)] text-primary-foreground ' : 'border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] text-muted-foreground hover:border-[var(--brand-border)]')}>{weekdayLabel(day.label, locale).slice(0, 3)}</button>
                ))}
              </div>
            </div>
          )}

          {frequency === 'CUSTOM_DATES' && (
            <div className="mt-5 border-t border-[var(--dashboard-line)] pt-5">
              <div className="mb-3 flex items-center justify-between gap-3"><Label className="font-semibold">{t('monthlyDates')}</Label><span className="text-xs font-semibold text-muted-foreground">{t('selectedCount', { count: format.number(customDays.length) })}</span></div>
              <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-8">
                {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
                  <button key={day} type="button" onClick={() => toggleValue(customDays, day, setCustomDays)} className={cn('aspect-square rounded-lg border text-xs font-bold transition', customDays.includes(day) ? 'border-[var(--brand)] bg-[var(--brand)] text-primary-foreground' : 'border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] text-muted-foreground hover:border-[var(--brand-border)]')}>{format.number(day)}</button>
                ))}
              </div>
              <p className="mt-3 text-xs font-medium leading-5 text-muted-foreground">{t('shortMonthHint')}</p>
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-[var(--dashboard-surface)] p-4  sm:p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--brand)]">{t('dutyPolicy')}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <label className="space-y-2"><span className="text-xs font-semibold text-muted-foreground">{t('peoplePerBazar')}</span><Input type="number" min={1} max={50} value={membersPerDate} onChange={(event) => setMembersPerDate(event.target.value === '' ? '' : Number(event.target.value))} className="h-12 rounded-xl border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] font-semibold" /></label>
            <label className="space-y-2"><span className="text-xs font-semibold text-muted-foreground">{t('monthlyDutyLimit')}</span><Input type="number" min={1} max={100} value={dutyLimit} onChange={(event) => setDutyLimit(event.target.value === '' ? '' : Number(event.target.value))} className="h-12 rounded-xl border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] font-semibold" /></label>
            <label className="space-y-2"><span className="text-xs font-semibold text-muted-foreground">{t('freeReleaseNotice')}</span><div className="relative"><Input type="number" min={0} max={31} value={releaseNoticeDays} onChange={(event) => setReleaseNoticeDays(Math.max(0, Number(event.target.value)))} className="h-12 rounded-xl border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] pr-12 font-semibold" /><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">{t('days')}</span></div></label>
          </div>
        </section>

        <section className="space-y-3">
          <SettingToggle icon={Users} title={t('includeManager')} description={t('includeManagerDescription')} checked={includeManager} onCheckedChange={setIncludeManager} />
          <SettingToggle icon={ShieldCheck} title={t('fairSelection')} description={t('fairSelectionDescription')} checked={strictFairness} onCheckedChange={setStrictFairness} />
        </section>

        {settings && <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-xs font-semibold leading-5 text-primary dark:border-primary/30 dark:bg-primary/10 dark:text-primary">{t('changesHint')}</div>}
      </div>
    </EnterpriseDetailsDrawer>
  )
}

function SettingToggle({ icon: Icon, title, description, checked, onCheckedChange }: { icon: typeof Users; title: string; description: string; checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[var(--dashboard-surface)] p-4 ">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]"><Icon className="size-4.5" /></span>
      <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[var(--dashboard-ink)]">{title}</p><p className="mt-0.5 text-xs font-medium leading-5 text-muted-foreground">{description}</p></div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={title} />
    </div>
  )
}
