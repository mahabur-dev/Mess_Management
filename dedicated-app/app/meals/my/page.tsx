'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, CalendarRange, Check, CircleOff, LockKeyhole, Minus, Plus, UtensilsCrossed } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { LoadingIndicator } from '@/components/loading-indicator'
import { TopScreen } from '@/components/top-screen'
import { MonthPicker } from '@/components/mobile/date-picker'
import {
  InlineNotice,
  MEAL_META,
  MEAL_ORDER,
  attendanceMealCount,
  currentMonthValue,
  findAttendanceForMember,
  formatDisplayDate,
  formatLocalIsoDate,
  formatShortWeekday,
  mealIsLocked,
  mealLabel,
  monthBounds,
  normalizeMeals,
  todayIsoDate,
  type MealName,
  type MealDeadlineInfo,
  type MealRecord,
} from '@/components/mobile/meals-design'
import { PersonalFormModal } from '@/features/personal/components/personal-form-modal'
import { api } from '@/lib/api'
import { canManageMess } from '@/lib/app-permissions'
import { useAuth } from '@/app/providers'
import { useLocale, useLocaleFormatters, useLocalizedNotice, useTranslations } from '@/lib/i18n'

type MealChoice = 'ON' | 'OFF'
type BulkRange = '1' | '3' | '7' | 'MONTH' | 'CUSTOM'
type SelectedMeals = Record<MealName, boolean>
type DailyMealPlan = Record<MealName, { status: MealChoice; guests: number }>

const MAX_GUESTS = 20

function defaultSelectedMeals(): SelectedMeals {
  return MEAL_ORDER.reduce((selected, mealName) => {
    selected[mealName] = true
    return selected
  }, {} as SelectedMeals)
}

function emptyDailyMealPlan(): DailyMealPlan {
  return MEAL_ORDER.reduce((plan, mealName) => {
    plan[mealName] = { status: 'OFF', guests: 0 }
    return plan
  }, {} as DailyMealPlan)
}

function datesInMonth(month: string) {
  const { startDate, endDate } = monthBounds(month)
  const dates: string[] = []
  const cursor = new Date(`${startDate}T12:00:00`)
  while (formatLocalIsoDate(cursor) <= endDate) {
    dates.push(formatLocalIsoDate(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}

function mealKey(date: string, mealName: MealName) {
  return `${date}:${mealName}`
}

function clampGuests(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(MAX_GUESTS, Math.max(0, Math.round(value * 2) / 2))
}

function ChoiceGroup<T extends string>({
  value,
  options,
  disabled,
  onChange,
}: {
  value: T
  options: Array<{ value: T; label: string }>
  disabled?: boolean
  onChange: (value: T) => void
}) {
  return (
    <div className={`grid ${options.length === 3 ? 'grid-cols-3' : 'grid-cols-2'} gap-1 rounded-[8px] bg-[#edf3f4] p-1`} role="group">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          data-active={value === option.value}
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className="h-9 rounded-[6px] px-2 text-caption font-semibold text-[#65838b] transition data-[active=true]:bg-white data-[active=true]:text-[#00777a] data-[active=true]:shadow-sm disabled:opacity-60"
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function GuestStepper({
  value,
  disabled,
  label,
  decreaseLabel,
  increaseLabel,
  onChange,
}: {
  value: number
  disabled?: boolean
  label: string
  decreaseLabel: string
  increaseLabel: string
  onChange: (value: number) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[8px] border border-[#dce8e9] px-3 py-2.5">
      <span className="text-label font-semibold text-[#123748]">{label}</span>
      <div className="flex h-9 items-center overflow-hidden rounded-[7px] border border-[#9edddc] bg-[#f8fbfb]">
        <button type="button" aria-label={decreaseLabel} disabled={disabled || value <= 0} onClick={() => onChange(clampGuests(value - 0.5))} className="grid h-full w-9 place-items-center text-[#00777a] disabled:opacity-40">
          <Minus size={16} />
        </button>
        <input type="number" inputMode="decimal" min="0" max={MAX_GUESTS} step="0.5" value={value} disabled={disabled} onChange={(event) => onChange(clampGuests(Number(event.target.value)))} className="h-full w-12 border-x border-[#bfe7e6] bg-white text-center text-label font-semibold tabular-nums text-[#123748] outline-none" aria-label={label} />
        <button type="button" aria-label={increaseLabel} disabled={disabled || value >= MAX_GUESTS} onClick={() => onChange(clampGuests(value + 0.5))} className="grid h-full w-9 place-items-center bg-[#008d8c] text-white disabled:opacity-40">
          <Plus size={16} />
        </button>
      </div>
    </div>
  )
}

export default function MyMealPage() {
  const { user } = useAuth()
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const mealsCopy = useTranslations('meals')
  const common = useTranslations('common')
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? '', [user])
  const isManager = canManageMess(user)
  const [month, setMonth] = useState(currentMonthValue())
  const [meals, setMeals] = useState<MealRecord[]>([])
  const [todayWindowOpen, setTodayWindowOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editor, setEditor] = useState<{ date: string } | null>(null)
  const [editorPlan, setEditorPlan] = useState<DailyMealPlan>(emptyDailyMealPlan)
  const [editorBusy, setEditorBusy] = useState(false)
  const [editorError, setEditorError] = useState('')
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkRange, setBulkRange] = useState<BulkRange>('1')
  const [bulkStartDate, setBulkStartDate] = useState('')
  const [bulkCustomDays, setBulkCustomDays] = useState(15)
  const [bulkSkippedDates, setBulkSkippedDates] = useState<string[]>([])
  const [bulkSelectedMeals, setBulkSelectedMeals] = useState<SelectedMeals>(defaultSelectedMeals)
  const [bulkHasGuests, setBulkHasGuests] = useState(false)
  const [bulkGuests, setBulkGuests] = useState(1)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [bulkError, setBulkError] = useState('')
  const editorRequestRef = useRef<{ fingerprint: string; key: string } | null>(null)
  const bulkRequestRef = useRef<{ fingerprint: string; key: string } | null>(null)
  const { notice, clearNotice, showError, showMessage } = useLocalizedNotice('meals')
  const monthDates = useMemo(() => datesInMonth(month), [month])
  const today = todayIsoDate()

  const records = useMemo(() => {
    const indexed = new Map<string, MealRecord>()
    for (const meal of meals) {
      const date = meal.scheduled_date?.slice(0, 10)
      if (date) indexed.set(mealKey(date, meal.name), meal)
    }
    return indexed
  }, [meals])

  const loadMeals = useCallback(async () => {
    if (!messId) {
      setMeals([])
      setTodayWindowOpen(false)
      return
    }
    const { startDate, endDate } = monthBounds(month)
    setLoading(true)
    try {
      const [mealResponse, deadlineResponse] = await Promise.all([
        api.getMealsByMess(messId, { startDate, endDate, limit: 100 }),
        !isManager && month === today.slice(0, 7)
          ? api.getMealDeadline(messId, today)
          : Promise.resolve({ data: null }),
      ])
      setMeals(normalizeMeals(mealResponse.data))
      setTodayWindowOpen(isManager || Boolean((deadlineResponse.data as MealDeadlineInfo | null)?.isWindowOpen))
    } catch (error) {
      setMeals([])
      setTodayWindowOpen(false)
      showError(error, 'loadMyMealFailed')
    } finally {
      setLoading(false)
    }
  }, [isManager, messId, month, showError, today])

  useEffect(() => {
    clearNotice()
    if (!messId) {
      showMessage('noMessSelected', 'warning')
      return
    }
    void loadMeals()
  }, [clearNotice, loadMeals, messId, showMessage])

  function isCellLocked(date: string, mealName: MealName) {
    if (isManager) return false
    return date < today || (date === today && !todayWindowOpen) || mealIsLocked(records.get(mealKey(date, mealName)))
  }

  function openEditor(date: string) {
    if (!MEAL_ORDER.some((mealName) => !isCellLocked(date, mealName))) return
    const plan = MEAL_ORDER.reduce((current, mealName) => {
      const attendance = findAttendanceForMember(records.get(mealKey(date, mealName)), user?.id)
      current[mealName] = {
        status: attendance?.status === 'ON' ? 'ON' : 'OFF',
        guests: attendance?.status === 'ON' ? clampGuests(Number(attendance.guests ?? 0)) : 0,
      }
      return current
    }, {} as DailyMealPlan)
    setEditorPlan(plan)
    setEditorError('')
    editorRequestRef.current = null
    setEditor({ date })
  }

  async function updateMeal() {
    if (!messId || !editor) return
    const updates = MEAL_ORDER.flatMap((mealName) => {
      if (isCellLocked(editor.date, mealName)) return []
      const selection = editorPlan[mealName]
      const guests = selection.status === 'ON' ? selection.guests : 0
      return [{ date: editor.date, mealName, status: selection.status, guests, mealCount: selection.status === 'ON' ? MEAL_META[mealName].baseValue + guests : 0 }]
    })
    if (!updates.length) return
    const fingerprint = JSON.stringify(updates)
    if (editorRequestRef.current?.fingerprint !== fingerprint) {
      editorRequestRef.current = { fingerprint, key: crypto.randomUUID() }
    }
    setEditorBusy(true)
    setEditorError('')
    try {
      await api.bulkUpdateOwnMeals(messId, updates, editorRequestRef.current.key)
      await loadMeals()
      editorRequestRef.current = null
      setEditor(null)
      showMessage('mealUpdated', 'success')
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : mealsCopy('mealSaveFailed'))
    } finally {
      setEditorBusy(false)
    }
  }

  function candidateBulkDates() {
    if (!bulkStartDate) return []
    const endDate = monthBounds(month).endDate
    const requestedDays = bulkRange === 'MONTH'
      ? 31
      : bulkRange === 'CUSTOM'
        ? Math.min(31, Math.max(1, Math.floor(bulkCustomDays)))
        : Number(bulkRange)
    const dates: string[] = []
    const cursor = new Date(`${bulkStartDate}T12:00:00`)
    while (dates.length < requestedDays) {
      const date = formatLocalIsoDate(cursor)
      if (date > endDate) break
      dates.push(date)
      cursor.setDate(cursor.getDate() + 1)
    }
    return dates
  }

  function selectedBulkDates() {
    return candidateBulkDates().filter((date) => !bulkSkippedDates.includes(date))
  }

  const firstEditableDate = monthDates.find((date) => date >= today && MEAL_ORDER.some((mealName) => !isCellLocked(date, mealName))) ?? ''
  const selectedBulkMealLabels = MEAL_ORDER
    .filter((mealName) => bulkSelectedMeals[mealName])
    .map((mealName) => mealLabel(mealName, locale))
    .join(', ')
  const hasSelectedBulkMeals = MEAL_ORDER.some((mealName) => bulkSelectedMeals[mealName])
  const bulkCandidateDateList = candidateBulkDates()
  const bulkSelectedDateList = selectedBulkDates()

  async function applyBulkPlan() {
    if (!messId) return
    const dates = selectedBulkDates()
    if (!dates.length) {
      setBulkError(mealsCopy(bulkSkippedDates.length ? 'noDatesAfterSkip' : 'noEditableDates'))
      return
    }
    const updates = dates.flatMap((date) => MEAL_ORDER.flatMap((mealName) => {
      if (isCellLocked(date, mealName)) return []
      const status: MealChoice = bulkSelectedMeals[mealName] ? 'ON' : 'OFF'
      const guests = status === 'ON' && bulkHasGuests ? bulkGuests : 0
      return [{ date, mealName, status, guests, mealCount: status === 'ON' ? MEAL_META[mealName].baseValue + guests : 0 }]
    }))
    if (!updates.length) {
      setBulkError(mealsCopy('noEditableDates'))
      return
    }
    const fingerprint = JSON.stringify(updates)
    if (bulkRequestRef.current?.fingerprint !== fingerprint) {
      bulkRequestRef.current = { fingerprint, key: crypto.randomUUID() }
    }
    setBulkBusy(true)
    setBulkError('')
    try {
      await api.bulkUpdateOwnMeals(messId, updates, bulkRequestRef.current.key)
      await loadMeals()
      bulkRequestRef.current = null
      setBulkOpen(false)
      showMessage('mealPlanUpdated', 'success')
    } catch (error) {
      setBulkError(error instanceof Error ? error.message : mealsCopy('mealSaveFailed'))
    } finally {
      setBulkBusy(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen title={mealsCopy('myMeal')} subtitle={mealsCopy('mealPlannerDescription')} backHref="/meals" />
      <div className="screen space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <MonthPicker
            label={mealsCopy('selectMonth')}
            value={month}
            onChange={setMonth}
            disabled={loading}
            renderTrigger={({ selectedLabel, buttonProps }) => (
              <button {...buttonProps} className="inline-flex h-12 min-w-0 items-center justify-center gap-2 rounded-[8px] bg-[#008d8c] px-3 text-label font-semibold text-white shadow-sm disabled:opacity-60">
                <CalendarDays size={18} className="shrink-0" />
                <span className="truncate">{selectedLabel}</span>
              </button>
            )}
          />
          <button type="button" onClick={() => { setBulkRange('1'); setBulkStartDate(firstEditableDate); setBulkCustomDays(15); setBulkSkippedDates([]); setBulkSelectedMeals(defaultSelectedMeals()); setBulkHasGuests(false); setBulkGuests(1); setBulkError(''); setBulkOpen(true) }} disabled={!messId || loading} className="inline-flex h-12 min-w-0 items-center justify-center gap-2 rounded-[8px] bg-[#008d8c] px-3 text-label font-semibold text-white shadow-sm disabled:opacity-60">
            <CalendarRange size={18} className="shrink-0" /> <span className="truncate">{mealsCopy('bulkEdit')}</span>
          </button>
        </div>
        {notice ? <InlineNotice tone={notice.tone}>{notice.message}</InlineNotice> : null}
        {loading ? <LoadingIndicator variant="card" label={mealsCopy('loadingMonthlyMeals')} /> : null}
        {!loading ? (
          <section className="overflow-hidden rounded-[8px] border border-[#dce8e9] bg-white" aria-label={mealsCopy('mealPlanner')}>
            <div className="grid grid-cols-[minmax(88px,1.35fr)_repeat(3,minmax(58px,1fr))] border-b border-[#cfe0e2] bg-[#f3f8f8]">
              <div className="px-3 py-2.5 text-caption font-bold uppercase text-[#65838b]">{mealsCopy('date')}</div>
              {MEAL_ORDER.map((mealName) => <div key={mealName} className="border-l border-[#dce8e9] px-1 py-2.5 text-center text-caption font-bold text-[#123748]">{mealName === 'BREAKFAST' ? 'B' : mealName === 'LUNCH' ? 'L' : 'D'}</div>)}
            </div>
            {monthDates.map((date) => (
              <div key={date} className="grid min-h-14 grid-cols-[minmax(88px,1.35fr)_repeat(3,minmax(58px,1fr))] border-b border-[#e5edef] last:border-b-0">
                <div className="flex min-w-0 items-center gap-2 px-3 py-2"><span className="text-body font-bold tabular-nums text-[#123748]">{format.number(Number(date.slice(8, 10)), { useGrouping: false })}</span><span className="truncate text-caption font-medium text-[#789096]">{formatShortWeekday(date, locale)}</span></div>
                {MEAL_ORDER.map((mealName) => {
                  const record = records.get(mealKey(date, mealName))
                  const attendance = findAttendanceForMember(record, user?.id)
                  const locked = isCellLocked(date, mealName)
                  const dayEditable = MEAL_ORDER.some((name) => !isCellLocked(date, name))
                  const isOn = attendance?.status === 'ON'
                  const guests = isOn ? clampGuests(Number(attendance?.guests ?? 0)) : 0
                  const total = isOn ? attendanceMealCount(mealName, attendance) : 0
                  return (
                    <button key={mealName} type="button" onClick={() => openEditor(date)} disabled={!dayEditable} aria-label={`${formatDisplayDate(date, locale)} ${mealLabel(mealName, locale)}: ${isOn ? total : mealsCopy('off')}`} className="relative flex min-w-0 flex-col items-center justify-center border-l border-[#e5edef] px-1 py-1.5 text-center disabled:cursor-not-allowed">
                      {locked ? <LockKeyhole size={12} className="absolute right-1 top-1 text-[#a2b2b7]" aria-hidden="true" /> : null}
                      <span className={`text-label font-bold tabular-nums ${isOn ? 'text-[#00777a]' : 'text-[#9aaab2]'}`}>{isOn ? total : mealsCopy('off')}</span>
                      {guests > 0 ? <span className="mt-0.5 text-[10px] font-bold text-[#d26338]">+{guests}</span> : null}
                    </button>
                  )
                })}
              </div>
            ))}
          </section>
        ) : null}
      </div>

      <PersonalFormModal id="edit-own-meal" open={Boolean(editor)} busy={editorBusy} icon={UtensilsCrossed} eyebrow={editor ? format.date(`${editor.date}T00:00:00+06:00`, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''} title={mealsCopy('dailyMealUpdate')} description={mealsCopy('dailyMealUpdateDescription')} closeLabel={common('close')} onClose={() => setEditor(null)}>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto px-5 py-5">
          <button
            type="button"
            disabled={editorBusy || !editor}
            onClick={() => {
              if (!editor) return
              setEditorPlan((current) => MEAL_ORDER.reduce((plan, mealName) => {
                plan[mealName] = isCellLocked(editor.date, mealName) ? current[mealName] : { status: 'OFF', guests: 0 }
                return plan
              }, {} as DailyMealPlan))
              setEditorError('')
            }}
            className="app-modal-secondary inline-flex h-11 w-full items-center justify-center gap-2 px-3 text-label"
          >
            <CircleOff size={17} /> {mealsCopy('turnAllMealsOff')}
          </button>

          {editor ? MEAL_ORDER.map((mealName) => {
            const selection = editorPlan[mealName]
            const locked = isCellLocked(editor.date, mealName)
            return (
              <section key={mealName} className="space-y-2.5 border-b border-[#e5edef] pb-4 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-label font-bold text-[#123748]">{mealLabel(mealName, locale)}</h3>
                  {locked ? <span className="inline-flex items-center gap-1 text-caption font-semibold text-[#8a9ca1]"><LockKeyhole size={13} /> {mealsCopy('locked')}</span> : null}
                </div>
                <ChoiceGroup
                  value={selection.status}
                  options={[{ value: 'ON', label: mealsCopy('on') }, { value: 'OFF', label: mealsCopy('off') }]}
                  disabled={editorBusy || locked}
                  onChange={(status) => {
                    setEditorPlan((current) => ({ ...current, [mealName]: { status, guests: status === 'ON' ? current[mealName].guests : 0 } }))
                    setEditorError('')
                  }}
                />
                {selection.status === 'ON' ? <GuestStepper value={selection.guests} disabled={editorBusy || locked} label={mealsCopy('guestMeals')} decreaseLabel={mealsCopy('decreaseGuests')} increaseLabel={mealsCopy('increaseGuests')} onChange={(guests) => setEditorPlan((current) => ({ ...current, [mealName]: { ...current[mealName], guests } }))} /> : null}
              </section>
            )
          }) : null}
          {editorError ? <div className="ui-notice ui-notice--danger" role="alert">{editorError}</div> : null}
        </div>
        <footer className="border-t border-[#e9eff1] bg-[#fbfcfc] px-5 py-4"><button type="button" onClick={() => void updateMeal()} disabled={editorBusy} className="app-modal-primary inline-flex w-full items-center justify-center gap-2 px-3 text-label"><Check size={17} /> {editorBusy ? mealsCopy('updating') : mealsCopy('updateDayMeals')}</button></footer>
      </PersonalFormModal>

      <PersonalFormModal id="bulk-edit-meals" open={bulkOpen} busy={bulkBusy} icon={CalendarRange} eyebrow={mealsCopy('mealPlanner')} title={mealsCopy('bulkEdit')} description={mealsCopy('bulkEditDescription')} closeLabel={common('close')} onClose={() => setBulkOpen(false)}>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto px-5 py-5">
          {bulkStartDate ? (
            <section className="rounded-[8px] border border-[#cfe8e7] bg-[#edfafa] px-3 py-3">
              <p className="text-caption font-bold uppercase text-[#65838b]">{mealsCopy('planStartsOn')}</p>
              <p className="mt-1 text-body font-bold text-[#123748]">{format.date(`${bulkStartDate}T00:00:00+06:00`, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </section>
          ) : <InlineNotice tone="warning">{mealsCopy('noEditableDates')}</InlineNotice>}

          <fieldset className="space-y-2">
            <legend className="text-label font-bold text-[#123748]">{mealsCopy('buildDailyPlan')}</legend>
            <p className="text-caption text-[#65838b]">{mealsCopy('dailyPlanHint')}</p>
            <div className="overflow-hidden rounded-[8px] border border-[#dce8e9]">
              {MEAL_ORDER.map((mealName) => (
                <label key={mealName} className="flex min-h-11 cursor-pointer items-center gap-3 border-b border-[#e5edef] px-3 py-2 last:border-b-0">
                  <input
                    type="checkbox"
                    checked={bulkSelectedMeals[mealName]}
                    disabled={bulkBusy}
                    onChange={(event) => {
                      setBulkSelectedMeals((current) => ({ ...current, [mealName]: event.target.checked }))
                      setBulkError('')
                    }}
                    className="h-5 w-5 shrink-0 accent-[#008d8c]"
                  />
                  <span className="text-label font-semibold text-[#123748]">{mealLabel(mealName, locale)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {hasSelectedBulkMeals ? (
            <section className="space-y-2">
              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[8px] border border-[#dce8e9] px-3 py-2">
                <input type="checkbox" checked={bulkHasGuests} disabled={bulkBusy} onChange={(event) => setBulkHasGuests(event.target.checked)} className="h-5 w-5 shrink-0 accent-[#008d8c]" />
                <span className="text-label font-semibold text-[#123748]">{mealsCopy('hasGuestMeals')}</span>
              </label>
              {bulkHasGuests ? <GuestStepper value={bulkGuests} disabled={bulkBusy} label={mealsCopy('guestMealsPerDay')} decreaseLabel={mealsCopy('decreaseGuests')} increaseLabel={mealsCopy('increaseGuests')} onChange={setBulkGuests} /> : null}
            </section>
          ) : null}

          <section className="space-y-2">
            <h3 className="text-label font-bold text-[#123748]">{mealsCopy('howLongContinue')}</h3>
            <ChoiceGroup value={bulkRange === 'CUSTOM' ? 'CUSTOM' : bulkRange} options={[{ value: '1', label: mealsCopy('oneDay') }, { value: '3', label: mealsCopy('threeDays') }, { value: '7', label: mealsCopy('sevenDays') }, { value: 'MONTH', label: mealsCopy('restOfMonth') }]} disabled={bulkBusy} onChange={(value) => { setBulkRange(value); setBulkSkippedDates([]); setBulkError('') }} />
            <label className={`flex min-h-11 items-center justify-between gap-3 rounded-[8px] border px-3 py-2 ${bulkRange === 'CUSTOM' ? 'border-[#008d8c] bg-[#edfafa]' : 'border-[#dce8e9] bg-white'}`}>
              <span className="text-label font-semibold text-[#123748]">{mealsCopy('customDays')}</span>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                max="31"
                value={bulkCustomDays}
                disabled={bulkBusy}
                onFocus={() => { setBulkRange('CUSTOM'); setBulkSkippedDates([]) }}
                onChange={(event) => { setBulkRange('CUSTOM'); setBulkCustomDays(Math.min(31, Math.max(1, Number(event.target.value) || 1))); setBulkSkippedDates([]); setBulkError('') }}
                className="h-9 w-20 rounded-[7px] border border-[#9edddc] bg-white px-2 text-center text-label font-bold tabular-nums text-[#123748] outline-none focus:ring-2 focus:ring-[#008d8c]/20"
                aria-label={mealsCopy('customDays')}
              />
            </label>
          </section>

          {bulkCandidateDateList.length > 1 ? (
            <fieldset className="space-y-2">
              <legend className="text-label font-bold text-[#123748]">{mealsCopy('skipDates')}</legend>
              <p className="text-caption text-[#65838b]">{mealsCopy('skipDatesHint')}</p>
              <div className="grid grid-cols-4 gap-2">
                {bulkCandidateDateList.map((date) => {
                  const skipped = bulkSkippedDates.includes(date)
                  return (
                    <button
                      key={date}
                      type="button"
                      aria-pressed={skipped}
                      disabled={bulkBusy}
                      onClick={() => {
                        setBulkSkippedDates((current) => skipped ? current.filter((item) => item !== date) : [...current, date])
                        setBulkError('')
                      }}
                      className={`min-h-12 rounded-[8px] border px-1 py-1.5 text-center ${skipped ? 'border-[#e9a5aa] bg-[#fff1f2] text-[#b4232e]' : 'border-[#dce8e9] bg-white text-[#123748]'}`}
                    >
                      <span className="block text-label font-bold tabular-nums">{format.number(Number(date.slice(8, 10)), { useGrouping: false })}</span>
                      <span className="block text-[10px] font-semibold">{formatShortWeekday(date, locale)}</span>
                    </button>
                  )
                })}
              </div>
            </fieldset>
          ) : null}

          {bulkStartDate ? (
            <div className="rounded-[8px] bg-[#edfafa] px-3 py-2.5 text-caption font-semibold leading-relaxed text-[#245d66]">
              {mealsCopy('mealRoutineSummary', {
                meals: selectedBulkMealLabels || mealsCopy('noMealsInPlan'),
                count: format.number(bulkSelectedDateList.length),
              })}
              {bulkHasGuests && hasSelectedBulkMeals ? ` ${mealsCopy('bulkGuestSummary', { count: format.number(bulkGuests) })}` : ''}
              {bulkSkippedDates.length ? ` ${mealsCopy('skippedDatesSummary', { count: format.number(bulkSkippedDates.length) })}` : ''}
            </div>
          ) : null}
          {bulkError ? <div className="ui-notice ui-notice--danger" role="alert">{bulkError}</div> : null}
        </div>
        <footer className="border-t border-[#e9eff1] bg-[#fbfcfc] px-5 py-4"><button type="button" onClick={() => void applyBulkPlan()} disabled={bulkBusy || !bulkStartDate || !bulkSelectedDateList.length} className="app-modal-primary inline-flex w-full items-center justify-center gap-2 px-3 text-label"><Check size={17} /> {bulkBusy ? mealsCopy('applyingPlan') : mealsCopy('applyMealRoutine', { count: format.number(bulkSelectedDateList.length) })}</button></footer>
      </PersonalFormModal>
    </MobileShell>
  )
}
