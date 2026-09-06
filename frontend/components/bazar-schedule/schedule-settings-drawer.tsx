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

interface ScheduleSettingsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  messId: string
  settings?: BazarScheduleSettings | null
  onSaved: (settings: BazarScheduleSettings) => void | Promise<void>
}

const frequencyOptions: Array<{
  value: BazarFrequency
  title: string
  description: string
  icon: typeof CalendarDays
}> = [
  { value: 'EVERY_DAY', title: 'Every day', description: 'Every calendar day is a bazar day.', icon: CalendarDays },
  { value: 'SPECIFIC_WEEKDAYS', title: 'Specific weekdays', description: 'Repeat selected weekdays every month.', icon: Repeat2 },
  { value: 'CUSTOM_DATES', title: 'Custom dates', description: 'Repeat selected day numbers every month.', icon: CalendarClock },
]

export function ScheduleSettingsDrawer({ open, onOpenChange, messId, settings, onSaved }: ScheduleSettingsDrawerProps) {
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
      setError('Select at least one weekday.')
      return
    }
    if (frequency === 'CUSTOM_DATES' && !customDays.length) {
      setError('Select at least one date.')
      return
    }
    const normalizedMembersPerDate = Number(membersPerDate)
    const normalizedDutyLimit = Number(dutyLimit)
    if (!Number.isInteger(normalizedMembersPerDate) || normalizedMembersPerDate < 1 || normalizedMembersPerDate > 50) {
      setError('People per bazar must be between 1 and 50.')
      return
    }
    if (!Number.isInteger(normalizedDutyLimit) || normalizedDutyLimit < 1 || normalizedDutyLimit > 100) {
      setError('Monthly duty limit must be between 1 and 100.')
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
      setError(cause instanceof Error ? cause.message : 'Could not save bazar settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <EnterpriseDetailsDrawer
      open={open}
      onOpenChange={onOpenChange}
      eyebrow="Manager control"
      title="Bazar schedule settings"
      description="Set the repeating rules for future monthly schedules"
      headerIcon={<Settings2 className="size-5" />}
      footer={
        <EnterpriseDrawerFooter>
          <EnterpriseDrawerAction tone="secondary" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</EnterpriseDrawerAction>
          <EnterpriseDrawerAction priority="primary" tone="primary" onClick={() => void save()} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            {saving ? 'Saving…' : 'Save settings'}
          </EnterpriseDrawerAction>
        </EnterpriseDrawerFooter>
      }
    >
      <div className="space-y-6">
        {error && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive dark:border-destructive/30 dark:bg-destructive/10 dark:text-destructive">{error}</div>}

        <section className="rounded-2xl bg-[var(--dashboard-surface)] p-4  sm:p-5">
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--brand)]">Frequency</p>
            <h3 className="mt-1 text-base font-semibold text-[var(--dashboard-ink)]">When does bazar happen?</h3>
          </div>
          <div className="grid gap-2">
            {frequencyOptions.map((option) => {
              const Icon = option.icon
              const active = frequency === option.value
              return (
                <button key={option.value} type="button" onClick={() => setFrequency(option.value)} className={cn('flex items-center gap-3 rounded-xl border p-3.5 text-left transition', active ? 'border-[var(--brand)] bg-[var(--brand-soft)] ' : 'border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] hover:border-[var(--brand-border)]')}>
                  <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', active ? 'bg-[var(--brand)] text-primary-foreground' : 'bg-[var(--dashboard-surface-subtle)] text-muted-foreground')}><Icon className="size-4.5" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-[var(--dashboard-ink)]">{option.title}</span><span className="mt-0.5 block text-xs font-medium leading-5 text-muted-foreground">{option.description}</span></span>
                  <span className={cn('grid size-5 place-items-center rounded-full border', active ? 'border-[var(--brand)] bg-[var(--brand)] text-primary-foreground' : 'border-[var(--dashboard-line-strong)]')}><Check className={cn('size-3', !active && 'opacity-0')} /></span>
                </button>
              )
            })}
          </div>

          {frequency === 'SPECIFIC_WEEKDAYS' && (
            <div className="mt-5 border-t border-[var(--dashboard-line)] pt-5">
              <Label className="mb-3 font-semibold">Repeat on</Label>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                {WEEKDAYS.map((day) => (
                  <button key={day.value} type="button" onClick={() => toggleValue(weekdays, day.value, setWeekdays)} className={cn('min-h-11 rounded-xl border text-xs font-bold transition', weekdays.includes(day.value) ? 'border-[var(--brand)] bg-[var(--brand)] text-primary-foreground ' : 'border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] text-muted-foreground hover:border-[var(--brand-border)]')}>{day.short}</button>
                ))}
              </div>
            </div>
          )}

          {frequency === 'CUSTOM_DATES' && (
            <div className="mt-5 border-t border-[var(--dashboard-line)] pt-5">
              <div className="mb-3 flex items-center justify-between gap-3"><Label className="font-semibold">Monthly dates</Label><span className="text-xs font-semibold text-muted-foreground">{customDays.length} selected</span></div>
              <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-8">
                {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
                  <button key={day} type="button" onClick={() => toggleValue(customDays, day, setCustomDays)} className={cn('aspect-square rounded-lg border text-xs font-bold transition', customDays.includes(day) ? 'border-[var(--brand)] bg-[var(--brand)] text-primary-foreground' : 'border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] text-muted-foreground hover:border-[var(--brand-border)]')}>{day}</button>
                ))}
              </div>
              <p className="mt-3 text-xs font-medium leading-5 text-muted-foreground">Dates that do not exist in a shorter month are skipped automatically.</p>
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-[var(--dashboard-surface)] p-4  sm:p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--brand)]">Duty policy</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <label className="space-y-2"><span className="text-xs font-semibold text-muted-foreground">People per bazar</span><Input type="number" min={1} max={50} value={membersPerDate} onChange={(event) => setMembersPerDate(event.target.value === '' ? '' : Number(event.target.value))} className="h-12 rounded-xl border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] font-semibold" /></label>
            <label className="space-y-2"><span className="text-xs font-semibold text-muted-foreground">Monthly duty limit</span><Input type="number" min={1} max={100} value={dutyLimit} onChange={(event) => setDutyLimit(event.target.value === '' ? '' : Number(event.target.value))} className="h-12 rounded-xl border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] font-semibold" /></label>
            <label className="space-y-2"><span className="text-xs font-semibold text-muted-foreground">Free release notice</span><div className="relative"><Input type="number" min={0} max={31} value={releaseNoticeDays} onChange={(event) => setReleaseNoticeDays(Math.max(0, Number(event.target.value)))} className="h-12 rounded-xl border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] pr-12 font-semibold" /><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">days</span></div></label>
          </div>
        </section>

        <section className="space-y-3">
          <SettingToggle icon={Users} title="Include manager in duty rotation" description="Manager counts as an eligible member in the recommended distribution." checked={includeManager} onCheckedChange={setIncludeManager} />
          <SettingToggle icon={ShieldCheck} title="Enforce fair selection" description="Members cannot take extra duties while someone has selected fewer." checked={strictFairness} onCheckedChange={setStrictFairness} />
        </section>

        {settings && <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-xs font-semibold leading-5 text-primary dark:border-primary/30 dark:bg-primary/10 dark:text-primary">Changes apply to the next schedule you generate. The active month remains unchanged and auditable.</div>}
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
