'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Check, Loader2, LockKeyhole, Minus, Pencil, Plus, RotateCw, Save, Users, X } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { LoadingIndicator } from '@/components/loading-indicator'
import { useNativeBackAction } from '@/components/native-back-actions'
import { TopScreen } from '@/components/top-screen'
import {
  EmptyMealsState,
  InlineNotice,
  MealDateCard,
  SearchBox,
  attendanceMealCount,
  findAttendanceForMember,
  findMeal,
  formatDisplayDate,
  initials,
  mealIsLocked,
  mealLabel,
  memberName,
  normalizeMeals,
  todayIsoDate,
  MEAL_META,
  MEAL_ORDER,
  type MealMember,
  type MealName,
  type MealRecord,
} from '@/components/mobile/meals-design'
import { api, ApiError, type BulkMealAttendanceUpdate } from '@/lib/api'
import { getActiveMessId } from '@/lib/app-permissions'
import { useAuth } from '@/app/providers'
import { useLocale, useLocaleFormatters, useLocalizedNotice, useTranslations } from '@/lib/i18n'

type MealCountMap = Record<MealName, number>
type MealDraftMap = Record<string, Record<MealName, string>>
type MemberMealSheetRow = {
  id: string
  name: string
  email?: string | null
  room?: string | null
  meals: MealCountMap
}

function formatMealCount(value: number) {
  return Number(value.toFixed(2)).toString()
}

function parseMealCount(value: string) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function normalizeMealCount(mealName: MealName, value: string) {
  const baseValue = MEAL_META[mealName].baseValue
  const rawCount = Number(value)
  if (!Number.isFinite(rawCount) || rawCount <= 0) return 0
  const rounded = Number((Math.round(rawCount / baseValue) * baseValue).toFixed(2))
  return Math.min(21, Math.max(baseValue, rounded))
}

function shiftDate(date: string, days: number) {
  const next = new Date(`${date}T00:00:00`)
  next.setDate(next.getDate() + days)
  const year = next.getFullYear()
  const month = String(next.getMonth() + 1).padStart(2, '0')
  const day = String(next.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function memberId(member: MealMember) {
  return member.user?.id ?? member.user_id ?? ''
}

export default function MemberMealsPage() {
  const { user } = useAuth()
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const mealCopy = useTranslations('meals')
  const common = useTranslations('common')
  const messId = useMemo(() => getActiveMessId(user), [user])
  const [date, setDate] = useState(todayIsoDate())
  const [members, setMembers] = useState<MealMember[]>([])
  const [meals, setMeals] = useState<MealRecord[]>([])
  const [search, setSearch] = useState('')
  const [membersLoading, setMembersLoading] = useState(false)
  const [mealsLoading, setMealsLoading] = useState(false)
  const [membersLoadFailed, setMembersLoadFailed] = useState(false)
  const [mealsLoadFailed, setMealsLoadFailed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [drafts, setDrafts] = useState<MealDraftMap>({})
  const [saving, setSaving] = useState(false)
  const { notice, clearNotice, showError, showMessage } = useLocalizedNotice('meals')

  useEffect(() => {
    if (!messId) {
      setMembers([])
      setMembersLoading(false)
      setMembersLoadFailed(false)
      showMessage('noMessSelected', 'warning')
      return
    }

    let alive = true
    setMembersLoading(true)
    setMembersLoadFailed(false)
    api.getMealMembers(messId)
      .then((response) => {
        if (!alive) return
        const list = Array.isArray(response.data) ? response.data as MealMember[] : []
        setMembers(list.filter((member) => member.is_active !== false))
      })
      .catch(() => {
        if (!alive) return
        setMembers([])
        setMembersLoadFailed(true)
      })
      .finally(() => {
        if (alive) setMembersLoading(false)
      })

    return () => { alive = false }
  }, [messId, reloadKey, showMessage])

  useEffect(() => {
    if (!messId) {
      setMeals([])
      setMealsLoading(false)
      setMealsLoadFailed(false)
      return
    }

    let alive = true
    setMealsLoading(true)
    setMealsLoadFailed(false)
    setMeals([])
    api.getMealsByMess(messId, { startDate: date, endDate: date, limit: 20 })
      .then((response) => {
        if (!alive) return
        setMeals(normalizeMeals(response.data))
      })
      .catch(() => {
        if (!alive) return
        setMeals([])
        setMealsLoadFailed(true)
      })
      .finally(() => {
        if (alive) setMealsLoading(false)
      })

    return () => { alive = false }
  }, [date, messId, reloadKey])

  const rows = useMemo<MemberMealSheetRow[]>(() => members.flatMap((member) => {
    const id = memberId(member)
    if (!id) return []
    const counts = MEAL_ORDER.reduce((result, mealName) => {
      result[mealName] = attendanceMealCount(mealName, findAttendanceForMember(findMeal(meals, mealName), id))
      return result
    }, { BREAKFAST: 0, LUNCH: 0, DINNER: 0 } as MealCountMap)
    return [{
      id,
      name: memberName(member, locale),
      email: member.user?.email,
      room: member.room_no,
      meals: counts,
    }]
  }).sort((a, b) => a.name.localeCompare(b.name)), [locale, meals, members])

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase()
    return rows.filter((row) => !term || `${row.name} ${row.email ?? ''} ${row.room ?? ''}`.toLowerCase().includes(term))
  }, [rows, search])

  const dirtyUpdates = useMemo<BulkMealAttendanceUpdate[]>(() => {
    if (!isEditing) return []
    return rows.flatMap((row) => MEAL_ORDER.flatMap((mealName) => {
      const raw = drafts[row.id]?.[mealName]
      if (raw === undefined || raw.trim() === '') return []
      const mealCount = Number(raw)
      if (!Number.isFinite(mealCount) || Math.abs(mealCount - row.meals[mealName]) < 0.001) return []
      return [{ memberId: row.id, mealName, mealCount, expectedMealCount: row.meals[mealName] }]
    }))
  }, [drafts, isEditing, rows])

  const hasInvalidDraft = useMemo(() => isEditing && rows.some((row) => MEAL_ORDER.some((mealName) => {
    const raw = drafts[row.id]?.[mealName]
    if (raw === undefined || raw.trim() === '') return true
    const value = Number(raw)
    return !Number.isFinite(value) || value < 0 || value > 21 || (value > 0 && value < MEAL_META[mealName].baseValue)
  })), [drafts, isEditing, rows])

  const dirtyMemberIds = useMemo(() => new Set(dirtyUpdates.map((update) => update.memberId)), [dirtyUpdates])
  const hiddenDirtyMembers = useMemo(() => {
    const visibleIds = new Set(filteredRows.map((row) => row.id))
    return [...dirtyMemberIds].filter((id) => !visibleIds.has(id)).length
  }, [dirtyMemberIds, filteredRows])

  const totals = useMemo(() => MEAL_ORDER.reduce((result, mealName) => {
    result[mealName] = rows.reduce((sum, row) => sum + (isEditing
      ? parseMealCount(drafts[row.id]?.[mealName] ?? formatMealCount(row.meals[mealName]))
      : row.meals[mealName]), 0)
    return result
  }, { BREAKFAST: 0, LUNCH: 0, DINNER: 0 } as MealCountMap), [drafts, isEditing, rows])
  const grandTotal = MEAL_ORDER.reduce((sum, mealName) => sum + totals[mealName], 0)
  const loading = membersLoading || mealsLoading
  const loadFailed = membersLoadFailed || mealsLoadFailed
  const hasUnsavedDraft = dirtyUpdates.length > 0 || hasInvalidDraft

  function startEditing() {
    setDrafts(Object.fromEntries(rows.map((row) => [row.id, MEAL_ORDER.reduce((values, mealName) => {
      values[mealName] = formatMealCount(row.meals[mealName])
      return values
    }, {} as Record<MealName, string>)])))
    clearNotice()
    setIsEditing(true)
  }

  function cancelEditing(skipConfirmation = false) {
    if (!skipConfirmation && hasUnsavedDraft && !window.confirm(mealCopy('discardMealChanges'))) return
    setIsEditing(false)
    setDrafts({})
  }

  function updateDraft(row: MemberMealSheetRow, mealName: MealName, value: string) {
    setDrafts((current) => ({
      ...current,
      [row.id]: {
        ...(current[row.id] ?? MEAL_ORDER.reduce((values, name) => {
          values[name] = formatMealCount(row.meals[name])
          return values
        }, {} as Record<MealName, string>)),
        [mealName]: value,
      },
    }))
  }

  function stepDraft(row: MemberMealSheetRow, mealName: MealName, direction: 1 | -1) {
    const current = normalizeMealCount(mealName, drafts[row.id]?.[mealName] ?? formatMealCount(row.meals[mealName]))
    const step = MEAL_META[mealName].baseValue
    const next = direction === 1
      ? current === 0 ? step : Math.min(21, current + step)
      : current <= step ? 0 : current - step
    updateDraft(row, mealName, formatMealCount(next))
  }

  function isCellDirty(row: MemberMealSheetRow, mealName: MealName) {
    const raw = drafts[row.id]?.[mealName]
    return raw !== undefined && raw.trim() !== '' && Number.isFinite(Number(raw)) && Math.abs(Number(raw) - row.meals[mealName]) >= 0.001
  }

  function isCellInvalid(row: MemberMealSheetRow, mealName: MealName) {
    if (!isEditing) return false
    const raw = drafts[row.id]?.[mealName]
    if (raw === undefined || raw.trim() === '') return true
    const value = Number(raw)
    return !Number.isFinite(value) || value < 0 || value > 21 || (value > 0 && value < MEAL_META[mealName].baseValue)
  }

  async function saveAllChanges() {
    if (!messId || !dirtyUpdates.length) return
    if (hasInvalidDraft) {
      showMessage('invalidMealCount', 'danger')
      return
    }

    setSaving(true)
    clearNotice()
    try {
      const response = await api.bulkUpdateMealAttendances(messId, { date, updates: dirtyUpdates })
      cancelEditing(true)
      showMessage('bulkMealsUpdated', 'success', {
        cells: format.number(response.data.updatedCount),
        members: format.number(response.data.affectedMemberCount),
      })

      try {
        const refreshed = await api.getMealsByMess(messId, { startDate: date, endDate: date, limit: 20 })
        setMeals(normalizeMeals(refreshed.data))
      } catch {
        setReloadKey((value) => value + 1)
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) showMessage('mealSheetConflict', 'danger')
      else showError(error, 'bulkMealSaveFailed')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (!hasUnsavedDraft) return
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warnBeforeLeaving)
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving)
  }, [hasUnsavedDraft])

  useNativeBackAction(isEditing && hasUnsavedDraft, () => {
    if (!window.confirm(mealCopy('discardMealChanges'))) return true
    cancelEditing(true)
    return false
  })

  return (
    <MobileShell hasFloatingAction={isEditing}>
      <TopScreen title={mealCopy('allMemberMeals')} subtitle={formatDisplayDate(date, locale)} backHref={isEditing ? undefined : '/meals/manager'} />
      <div className="screen space-y-4">
        <MealDateCard
          date={date}
          onChange={isEditing ? undefined : setDate}
          onPrevious={isEditing ? undefined : () => setDate((current) => shiftDate(current, -1))}
          onNext={isEditing ? undefined : () => setDate((current) => shiftDate(current, 1))}
        />

        {notice ? <InlineNotice tone={notice.tone}>{notice.message}</InlineNotice> : null}

        <section className="overflow-hidden rounded-[16px] border border-[#dce8e9] bg-white shadow-[0_4px_14px_rgba(18,55,72,0.06)]" aria-label={mealCopy('dailyMealSummary')}>
          <div className="grid grid-cols-4 divide-x divide-[#e7eff0]">
            {MEAL_ORDER.map((mealName) => (
              <div key={mealName} className="min-w-0 px-1.5 py-3 text-center">
                <div className="flex items-center justify-center gap-1 text-caption font-bold uppercase tracking-[0.04em] text-[#65838b]">
                  <span className="truncate">{mealLabel(mealName, locale)}</span>
                  {mealIsLocked(findMeal(meals, mealName)) ? <LockKeyhole size={10} className="shrink-0 text-[#ee1f2f]" /> : null}
                </div>
                <div className="mt-1 text-title-sm font-bold tabular-nums text-[#123748]">{format.number(totals[mealName])}</div>
              </div>
            ))}
            <div className="min-w-0 bg-[#edfafa] px-1.5 py-3 text-center">
              <div className="truncate text-caption font-bold uppercase tracking-[0.04em] text-[#00777a]">{mealCopy('total')}</div>
              <div className="mt-1 text-title-sm font-bold tabular-nums text-[#00777a]">{format.number(grandTotal)}</div>
            </div>
          </div>
        </section>

        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1"><SearchBox value={search} onChange={setSearch} /></div>
          {!isEditing ? (
            <button
              type="button"
              onClick={startEditing}
              disabled={loading || loadFailed || !rows.length}
              className="flex min-h-12 shrink-0 items-center justify-center gap-1.5 rounded-[14px] bg-[#008d8c] px-3.5 text-label font-bold text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Pencil size={15} /> {mealCopy('editAll')}
            </button>
          ) : (
            <div className="flex min-h-12 shrink-0 items-center gap-1.5 rounded-[14px] border border-[#9edddc] bg-[#edfafa] px-3 text-caption font-bold text-[#00777a]">
              <Check size={14} /> {mealCopy('editing')}
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="rounded-[14px] border border-[#bfe7e6] bg-[#f4fbfb] px-3.5 py-2.5 text-caption font-semibold text-[#00777a]">
            {mealCopy('mealSheetChangeSummary', { cells: format.number(dirtyUpdates.length), members: format.number(dirtyMemberIds.size) })}
            {hiddenDirtyMembers ? <span className="mt-1 block text-[#65838b]">{mealCopy('hiddenMealChanges', { count: format.number(hiddenDirtyMembers) })}</span> : null}
          </div>
        ) : null}

        {loadFailed ? (
          <div className="rounded-[16px] border border-[#ffd8d8] bg-[#fff7f7] p-4">
            <div className="flex items-start gap-3 text-[#a51d2a]">
              <AlertTriangle size={19} className="mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-label font-bold">{mealCopy('loadMemberMealsFailed')}</div>
                <button type="button" onClick={() => setReloadKey((value) => value + 1)} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-[12px] border border-[#efb7bd] bg-white px-3 text-label font-bold text-[#a51d2a]">
                  <RotateCw size={15} /> {common('retry')}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {loading ? <LoadingIndicator variant="card" label={mealCopy('loadingMemberMeals')} /> : null}

        {!loading && !loadFailed ? (
          <section className="space-y-3" aria-label={mealCopy('memberMealSheet')}>
            {filteredRows.map((row) => {
              const rowTotal = MEAL_ORDER.reduce((sum, mealName) => sum + (isEditing
                ? parseMealCount(drafts[row.id]?.[mealName] ?? formatMealCount(row.meals[mealName]))
                : row.meals[mealName]), 0)
              const rowDirty = dirtyMemberIds.has(row.id)
              return (
                <article key={row.id} className={`overflow-hidden rounded-[16px] border bg-white shadow-[0_4px_14px_rgba(18,55,72,0.055)] transition-colors ${rowDirty ? 'border-[#4bbfc0]' : 'border-[#e2ebec]'}`}>
                  <header className={`flex items-center gap-3 px-3.5 py-3 ${rowDirty ? 'bg-[#f2fbfb]' : ''}`}>
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-[#edfafa] text-caption font-bold text-[#008d8c]">{initials(row.name)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="truncate text-label font-bold text-[#123748]">{row.name}</div>
                        {rowDirty ? <span className="h-2 w-2 shrink-0 rounded-full bg-[#008d8c]" aria-label={mealCopy('changed')} /> : null}
                      </div>
                      <div className="mt-0.5 truncate text-caption font-medium text-[#65838b]">{row.email ?? row.room ?? mealCopy('messMember')}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-caption font-bold uppercase tracking-wide text-[#65838b]">{mealCopy('total')}</div>
                      <div className="mt-0.5 text-body font-bold tabular-nums text-[#00777a]">{format.number(rowTotal)}</div>
                    </div>
                  </header>

                  {isEditing ? (
                    <div className="border-t border-[#e7eff0]">
                      {MEAL_ORDER.map((mealName) => {
                        const label = mealLabel(mealName, locale)
                        const invalid = isCellInvalid(row, mealName)
                        const dirty = isCellDirty(row, mealName)
                        return (
                          <div key={mealName} className={`flex min-h-[58px] items-center gap-3 border-b border-[#e7eff0] px-3.5 py-2.5 last:border-b-0 ${invalid ? 'bg-[#fff7f7]' : dirty ? 'bg-[#f4fbfb]' : ''}`}>
                            <label htmlFor={`meal-${row.id}-${mealName}`} className="min-w-0 flex-1">
                              <span className="block text-label font-bold text-[#123748]">{label}</span>
                              <span className={`mt-0.5 block text-caption font-semibold ${invalid ? 'text-[#c12634]' : dirty ? 'text-[#008d8c]' : 'text-[#65838b]'}`}>{invalid ? mealCopy('invalidValue') : dirty ? mealCopy('changed') : mealCopy('unchanged')}</span>
                            </label>
                            <div className={`flex h-11 shrink-0 items-center overflow-hidden rounded-[12px] border bg-white ${invalid ? 'border-[#ee7d88]' : dirty ? 'border-[#4bbfc0]' : 'border-[#bfe7e6]'}`}>
                              <button type="button" aria-label={mealCopy('decreaseMeal', { meal: label })} onClick={() => stepDraft(row, mealName, -1)} disabled={saving} className="grid h-full w-10 place-items-center text-[#00777a] active:bg-[#dff4f3] disabled:opacity-50"><Minus size={16} /></button>
                              <input
                                id={`meal-${row.id}-${mealName}`}
                                aria-label={mealCopy('mealCount', { meal: label })}
                                aria-invalid={invalid}
                                className="h-full w-14 border-x border-[#dce8e9] bg-transparent px-1 text-center text-body font-bold tabular-nums text-[#123748] outline-none"
                                type="number"
                                inputMode="decimal"
                                min="0"
                                max="21"
                                step={MEAL_META[mealName].baseValue}
                                value={drafts[row.id]?.[mealName] ?? formatMealCount(row.meals[mealName])}
                                disabled={saving}
                                onChange={(event) => updateDraft(row, mealName, event.target.value)}
                                onBlur={(event) => updateDraft(row, mealName, formatMealCount(normalizeMealCount(mealName, event.target.value)))}
                              />
                              <button type="button" aria-label={mealCopy('addMoreMeal', { meal: label })} onClick={() => stepDraft(row, mealName, 1)} disabled={saving} className="grid h-full w-10 place-items-center bg-[#008d8c] text-white active:bg-[#00777a] disabled:opacity-50"><Plus size={16} /></button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 border-t border-[#e7eff0] divide-x divide-[#e7eff0]">
                      {MEAL_ORDER.map((mealName) => (
                        <div key={mealName} className="min-w-0 px-2 py-2.5 text-center">
                          <div className="truncate text-caption font-bold uppercase tracking-wide text-[#65838b]">{mealLabel(mealName, locale)}</div>
                          <div className={`mt-1 text-body font-bold tabular-nums ${row.meals[mealName] > 0 ? 'text-[#00777a]' : 'text-[#a3b5b9]'}`}>{format.number(row.meals[mealName])}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              )
            })}

            {!filteredRows.length ? <EmptyMealsState title={mealCopy('noMembersForMeal')} /> : null}
          </section>
        ) : null}

        {!loading && !loadFailed && rows.length ? (
          <div className="flex items-center gap-3 rounded-[14px] bg-[#f7fafb] px-3.5 py-3 text-[#65838b]">
            <Users size={17} className="shrink-0 text-[#008d8c]" />
            <span className="text-caption font-semibold">{mealCopy('membersShown', { count: format.number(filteredRows.length) })}</span>
          </div>
        ) : null}
      </div>

      {isEditing ? (
        <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 border-t border-[#dce8e9] bg-white/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_28px_rgba(18,55,72,0.12)] backdrop-blur-xl" role="region" aria-label={mealCopy('mealSheetActions')}>
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className={`truncate text-caption font-bold ${hasInvalidDraft ? 'text-[#c12634]' : 'text-[#65838b]'}`}>{hasInvalidDraft ? mealCopy('invalidMealCount') : dirtyUpdates.length ? mealCopy('unsavedMealChanges', { count: format.number(dirtyUpdates.length) }) : mealCopy('noMealChanges')}</div>
            <div className="shrink-0 text-caption font-semibold text-[#65838b]">{mealCopy(dirtyMemberIds.size === 1 ? 'memberCount' : 'membersCount', { count: format.number(dirtyMemberIds.size) })}</div>
          </div>
          <div className="grid grid-cols-[0.85fr_1.4fr] gap-2.5">
            <button type="button" onClick={() => cancelEditing()} disabled={saving} className="flex min-h-12 items-center justify-center gap-2 rounded-[14px] border border-[#cddcde] bg-white px-3 text-label font-bold text-[#536f76] active:bg-[#f2f7f7] disabled:opacity-50"><X size={17} /> {common('cancel')}</button>
            <button type="button" onClick={saveAllChanges} disabled={saving || hasInvalidDraft || !dirtyUpdates.length} className="flex min-h-12 items-center justify-center gap-2 rounded-[14px] bg-[#008d8c] px-3 text-label font-bold text-white shadow-[0_5px_14px_rgba(0,119,122,0.2)] active:bg-[#00777a] disabled:cursor-not-allowed disabled:opacity-50">{saving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}{saving ? mealCopy('savingMeals') : mealCopy('saveAllChanges')}</button>
          </div>
        </div>
      ) : null}
    </MobileShell>
  )
}
