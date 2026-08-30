'use client'

import { CalendarDays, ChevronDown, Minus, Plus, UserRound, UtensilsCrossed, X } from 'lucide-react'
import {
  formatDisplayDate,
  formatWeekday,
  MealCard,
  MealIconBadge,
  mealLabel,
  MEAL_META,
  MEAL_ORDER,
  SaveConfirmNote,
  type MealName,
} from '@/components/mobile/meals-design'
import type { AiLocale } from '@/lib/ai-automation'
import { MobileSelectSheet, type MobileSelectOption } from '@/components/mobile/select-sheet'
import { formatNumber, useTranslations } from '@/lib/i18n'

export type AiMealPreviewItem = Record<string, unknown>

type MemberOption = {
  value: string
  label: string
}

type MealGroup = {
  key: string
  date: string
  memberId: string
  items: Array<{ item: AiMealPreviewItem; index: number }>
}

const COPY = {
  en: {
    title: 'Meal plan ready',
    helper: 'Adjust each meal before confirming.',
    entry: 'entries',
    day: 'days',
    total: 'total meals',
    member: 'Member',
    remove: 'Remove meal',
    noMeal: 'No meal',
    taking: 'Taking',
    note: 'Review the dates, members and meal counts. Nothing is saved until you confirm.',
  },
  bn: {
    title: 'মিল প্ল্যান প্রস্তুত',
    helper: 'নিশ্চিত করার আগে প্রতিটি মিল ঠিক করে নিন।',
    entry: 'টি এন্ট্রি',
    day: 'দিন',
    total: 'মোট মিল',
    member: 'সদস্য',
    remove: 'মিলটি বাদ দিন',
    noMeal: 'মিল বন্ধ',
    taking: 'মিল চালু',
    note: 'তারিখ, সদস্য ও মিল সংখ্যা দেখে নিন। নিশ্চিত না করা পর্যন্ত কিছুই সেভ হবে না।',
  },
} as const

function isMealName(value: unknown): value is MealName {
  return typeof value === 'string' && MEAL_ORDER.includes(value as MealName)
}

function itemMealName(item: AiMealPreviewItem): MealName {
  return isMealName(item.mealName) ? item.mealName : 'LUNCH'
}

function itemCount(item: AiMealPreviewItem) {
  const count = Number(item.mealCount ?? 0)
  return Number.isFinite(count) ? count : 0
}

function formatMealCount(value: number) {
  return Number(value.toFixed(2)).toString()
}

function normalizeMealCount(mealName: MealName, value: number) {
  if (!Number.isFinite(value) || value <= 0) return 0
  const step = MEAL_META[mealName].baseValue
  const rounded = Number((Math.round(value / step) * step).toFixed(2))
  return Math.min(21, Math.max(step, rounded))
}

function groupMeals(items: AiMealPreviewItem[]): MealGroup[] {
  const groups = new Map<string, MealGroup>()

  items.forEach((item, index) => {
    const date = typeof item.date === 'string' ? item.date : ''
    const memberId = typeof item.memberId === 'string' ? item.memberId : ''
    const key = `${date}:${memberId}`
    const group = groups.get(key) ?? { key, date, memberId, items: [] }
    group.items.push({ item, index })
    groups.set(key, group)
  })

  return [...groups.values()].sort((left, right) => left.date.localeCompare(right.date))
}

function MealCountControl({
  item,
  locale,
  onPatch,
}: {
  item: AiMealPreviewItem
  locale: AiLocale
  onPatch: (patch: Record<string, unknown>) => void
}) {
  const meals = useTranslations('meals')
  const mealName = itemMealName(item)
  const label = mealLabel(mealName, locale)
  const baseValue = MEAL_META[mealName].baseValue
  const count = item.status === 'OFF' ? 0 : itemCount(item)

  const setCount = (nextValue: number) => {
    const mealCount = normalizeMealCount(mealName, nextValue)
    onPatch({ mealCount, status: mealCount === 0 ? 'OFF' : 'ON' })
  }

  return (
    <div className="flex h-10 shrink-0 items-center overflow-hidden rounded-[12px] border border-[#9edddc] bg-[#f8fbfb]">
      <button
        type="button"
        aria-label={meals('decreaseMeal', { meal: label })}
        onClick={() => setCount(count - baseValue)}
        className="grid h-full w-9 place-items-center text-[#00777a] transition active:bg-[#dff4f3]"
      >
        <Minus size={16} />
      </button>
      <input
        aria-label={meals('mealCount', { meal: label })}
        className="h-full w-14 border-x border-[#bfe7e6] bg-transparent px-1 text-center text-label font-bold tabular-nums text-[#245d66] outline-none"
        type="number"
        inputMode="decimal"
        min="0"
        max="21"
        step={baseValue}
        value={formatMealCount(count)}
        onChange={(event) => setCount(Number(event.target.value))}
        onBlur={(event) => setCount(Number(event.target.value))}
      />
      <button
        type="button"
        aria-label={meals('increaseMeal', { meal: label })}
        onClick={() => setCount(count === 0 ? baseValue : count + baseValue)}
        className="grid h-full w-9 place-items-center bg-[#008d8c] text-white transition active:bg-[#00777a]"
      >
        <Plus size={16} />
      </button>
    </div>
  )
}

export function AiMealPreview({
  items,
  members,
  locale,
  onPatchItem,
  onRemoveItem,
}: {
  items: AiMealPreviewItem[]
  members: MemberOption[]
  locale: AiLocale
  onPatchItem: (index: number, patch: Record<string, unknown>) => void
  onRemoveItem: (index: number) => void
}) {
  const meals = useTranslations('meals')
  const copy = COPY[locale]
  const groups = groupMeals(items)
  const totalDays = new Set(groups.map((group) => group.date)).size
  const total = Number(
    items
      .reduce((sum, item) => sum + (item.status === 'OFF' ? 0 : itemCount(item)), 0)
      .toFixed(2),
  )

  const patchGroup = (group: MealGroup, patch: Record<string, unknown>) => {
    group.items.forEach(({ index }) => onPatchItem(index, patch))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-[18px] bg-[linear-gradient(135deg,#edfafa_0%,#dff4f3_100%)] p-3.5">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[16px] bg-[#008d8c] text-white shadow-[0_9px_18px_rgba(0,119,122,0.18)]">
          <UtensilsCrossed size={21} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-body font-bold text-[#123748]">{copy.title}</p>
          <p className="mt-0.5 text-caption font-medium text-[#65838b]">{copy.helper}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-title-sm font-bold tabular-nums text-[#00777a]">{formatNumber(total, locale, { maximumFractionDigits: 2 })}</p>
          <p className="text-caption font-semibold text-[#65838b]">{copy.total}</p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-caption font-semibold text-[#65838b]">
        <span className="rounded-full bg-white px-3 py-1.5 shadow-[0_5px_14px_rgba(18,55,72,0.06)]">{formatNumber(items.length, locale)} {copy.entry}</span>
        <span className="rounded-full bg-white px-3 py-1.5 shadow-[0_5px_14px_rgba(18,55,72,0.06)]">{formatNumber(totalDays, locale)} {copy.day}</span>
      </div>

      {groups.map((group) => (
        <MealCard key={group.key} className="overflow-hidden !p-0">
          <div className="flex items-center gap-3 border-b border-[#d8eeee] bg-[#f5fbfb] px-3.5 py-3">
            <label className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-[14px] bg-[#dff4f3] text-[#008d8c] active:scale-[0.98]">
              <CalendarDays size={18} />
              <input
                aria-label={meals('selectDate')}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                type="date"
                value={group.date}
                onChange={(event) => patchGroup(group, { date: event.target.value })}
              />
            </label>
            <div className="min-w-0 flex-1">
              <p className="text-label font-bold text-[#123748]">{formatDisplayDate(group.date, locale)}</p>
              <p className="mt-0.5 text-caption font-medium text-[#65838b]">{formatWeekday(group.date, locale)}</p>
            </div>
            <div className="max-w-[46%]">
              <MobileSelectSheet
                label={copy.member}
                value={group.memberId}
                options={[
                  { value: '', label: copy.member },
                  ...members,
                ] satisfies MobileSelectOption[]}
                onChange={(memberId) => patchGroup(group, { memberId })}
                renderTrigger={({ open, selectedLabel, buttonProps }) => (
                  <button
                    {...buttonProps}
                    className="flex w-full items-center gap-1.5 rounded-[12px] border border-[#bfe7e6] bg-white px-2.5 py-2 text-left text-caption font-semibold text-[#245d66]"
                  >
                    <UserRound size={14} className="shrink-0 text-[#008d8c]" />
                    <span className="min-w-0 flex-1 truncate">{selectedLabel}</span>
                    <ChevronDown size={13} className={`shrink-0 text-[#789096] transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                )}
              />
            </div>
          </div>

          <div className="divide-y divide-[#e3eeee]">
            {group.items.map(({ item, index }) => {
              const mealName = itemMealName(item)
              const statusOn = item.status !== 'OFF' && itemCount(item) > 0
              return (
                <div key={`${group.key}:${index}`} className="px-3.5 py-3">
                  <div className="flex items-center gap-3">
                    <MealIconBadge mealName={mealName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <MobileSelectSheet
                        label={meals('mealName')}
                        value={mealName}
                        options={MEAL_ORDER.map((name) => ({ value: name, label: mealLabel(name, locale) }))}
                        onChange={(nextMeal) => {
                          const nextCount = Math.max(MEAL_META[nextMeal].baseValue, itemCount(item))
                          onPatchItem(index, { mealName: nextMeal, mealCount: nextCount, status: 'ON' })
                        }}
                        renderTrigger={({ open, selectedLabel, buttonProps }) => (
                          <button {...buttonProps} className="w-full cursor-pointer text-left">
                            <span className="flex items-center gap-1 text-label font-bold text-[#123748]">
                              {selectedLabel}
                              <ChevronDown size={13} className={`text-[#789096] transition-transform ${open ? 'rotate-180' : ''}`} />
                            </span>
                            <span className="mt-0.5 block text-caption text-[#65838b]">
                              {mealName === 'BREAKFAST' ? meals('halfMealPerServing') : meals('oneMealPerServing')}
                            </span>
                          </button>
                        )}
                      />
                    </div>
                    <MealCountControl item={item} locale={locale} onPatch={(patch) => onPatchItem(index, patch)} />
                    {items.length > 1 ? (
                      <button
                        type="button"
                        aria-label={copy.remove}
                        title={copy.remove}
                        onClick={() => onRemoveItem(index)}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px] text-[#ee1f2f] transition active:bg-[#fff0f0]"
                      >
                        <X size={17} />
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-2.5 flex items-center gap-2 pl-12">
                    <button
                      type="button"
                      aria-pressed={statusOn}
                      onClick={() => onPatchItem(index, { status: 'ON', mealCount: Math.max(itemCount(item), MEAL_META[mealName].baseValue) })}
                      className={`rounded-full px-3 py-1.5 text-caption font-bold transition ${statusOn ? 'bg-[#dff4f3] text-[#008d8c]' : 'bg-[#f2f6f6] text-[#789096]'}`}
                    >
                      {copy.taking}
                    </button>
                    <button
                      type="button"
                      aria-pressed={!statusOn}
                      onClick={() => onPatchItem(index, { status: 'OFF', mealCount: 0 })}
                      className={`rounded-full px-3 py-1.5 text-caption font-bold transition ${!statusOn ? 'bg-[#fff0f0] text-[#ee1f2f]' : 'bg-[#f2f6f6] text-[#789096]'}`}
                    >
                      {copy.noMeal}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </MealCard>
      ))}

      <SaveConfirmNote>{copy.note}</SaveConfirmNote>
    </div>
  )
}
