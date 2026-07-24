'use client'

import Link from 'next/link'
import type { ComponentType, ReactNode } from 'react'
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  Coffee,
  Lock,
  Moon,
  Search,
  Sun,
  Unlock,
  UtensilsCrossed,
  type LucideProps,
} from 'lucide-react'

export type MealName = 'BREAKFAST' | 'LUNCH' | 'DINNER'
export type AttendanceStatus = 'ON' | 'OFF'
export type MealRecordStatus = 'PENDING' | 'CONFIRMED' | 'LOCKED' | string

export type MealMember = {
  id: string
  user_id?: string
  mess_id?: string
  is_active?: boolean
  room_no?: string | null
  mess?: {
    id: string
    name?: string | null
  }
  user?: {
    id: string
    name?: string | null
    email?: string | null
    phone?: string | null
    avatar_url?: string | null
  }
}

export type MealAttendance = {
  id?: string
  status?: AttendanceStatus
  guests?: number | string | null
  member_id?: string
  member?: {
    id: string
    name?: string | null
    email?: string | null
    avatar_url?: string | null
  }
}

export type MealRecord = {
  id: string
  name: MealName
  scheduled_date?: string
  status?: MealRecordStatus
  is_locked?: boolean
  attendances?: MealAttendance[]
}

export type MealDeadlineInfo = {
  startTime?: string
  endTime?: string
  isWindowOpen?: boolean
  windowStartTime?: string
  windowEndTime?: string
}

export const MEAL_ORDER: MealName[] = ['BREAKFAST', 'LUNCH', 'DINNER']

export const MEAL_LABELS: Record<MealName, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
}

export const MEAL_META: Record<
  MealName,
  { icon: ComponentType<LucideProps>; color: string; soft: string; baseValue: number; defaultTime: string }
> = {
  BREAKFAST: { icon: Coffee, color: '#4bbfc0', soft: '#edfafa', baseValue: 0.5, defaultTime: '06:00 AM' },
  LUNCH: { icon: Sun, color: '#008d8c', soft: '#dff4f3', baseValue: 1, defaultTime: '01:00 PM' },
  DINNER: { icon: Moon, color: '#00777a', soft: '#edfafa', baseValue: 1, defaultTime: '08:30 PM' },
}

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

export function formatLocalIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDisplayDate(date: string) {
  if (!date) return '--'
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatWeekday(date: string) {
  if (!date) return ''
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' })
}

export function formatTime(time?: string | null) {
  if (!time) return '--'
  const [hourValue, minuteValue] = time.split(':').map(Number)
  if (Number.isNaN(hourValue) || Number.isNaN(minuteValue)) return time
  const suffix = hourValue >= 12 ? 'PM' : 'AM'
  const hour = hourValue % 12 || 12
  return `${hour}:${String(minuteValue).padStart(2, '0')} ${suffix}`
}

export function deadlineLabel(deadline?: MealDeadlineInfo | null) {
  return `${formatTime(deadline?.startTime)} - ${formatTime(deadline?.endTime)}`
}

export function memberName(member?: MealMember | null) {
  return member?.user?.name || 'Unknown member'
}

export function initials(name?: string | null) {
  const parts = String(name || 'Member').trim().split(/\s+/).slice(0, 2)
  return parts.map((part) => part[0]?.toUpperCase()).join('') || 'M'
}

export function attendanceMealCount(mealName: MealName, attendance?: MealAttendance | null) {
  if (!attendance || attendance.status === 'OFF') return 0
  return MEAL_META[mealName].baseValue + Number(attendance.guests ?? 0)
}

export function mealIsLocked(meal?: MealRecord | null) {
  return Boolean(meal?.is_locked || meal?.status === 'LOCKED')
}

export function findMeal(meals: MealRecord[], mealName: MealName) {
  return meals.find((meal) => meal.name === mealName) ?? null
}

export function findAttendanceForMember(meal: MealRecord | null | undefined, memberId?: string | null) {
  if (!meal || !memberId) return null
  return meal.attendances?.find((attendance) => attendance.member?.id === memberId || attendance.member_id === memberId) ?? null
}

export function calculateTotals(meals: MealRecord[]) {
  const perMeal = MEAL_ORDER.reduce(
    (total, mealName) => {
      const meal = findMeal(meals, mealName)
      total[mealName] =
        meal?.attendances?.reduce((sum, attendance) => sum + attendanceMealCount(mealName, attendance), 0) ?? 0
      return total
    },
    { BREAKFAST: 0, LUNCH: 0, DINNER: 0 } as Record<MealName, number>
  )

  return {
    perMeal,
    total: Number((perMeal.BREAKFAST + perMeal.LUNCH + perMeal.DINNER).toFixed(2)),
  }
}

export function normalizeMeals(data: unknown): MealRecord[] {
  return Array.isArray(data) ? (data as MealRecord[]) : []
}

export function MealCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <section className={`rounded-[20px] bg-white px-4 py-4 shadow-[0_10px_24px_rgba(0,119,122,0.08)] ${className ?? ''}`}>{children}</section>
}

export function MealDateCard({
  date,
  onChange,
  onPrevious,
  onNext,
}: {
  date: string
  onChange?: (date: string) => void
  onPrevious?: () => void
  onNext?: () => void
}) {
  return (
    <MealCard className="flex items-center justify-between gap-3">
      {onPrevious ? (
        <button type="button" onClick={onPrevious} aria-label="Previous date" className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[#edfafa] text-[#008d8c] active:scale-[0.97]">
          <ChevronLeft size={18} />
        </button>
      ) : null}

      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-black text-[#123748]">{formatDisplayDate(date)}</div>
        <div className="mt-1 text-[11px] font-semibold text-[#65838b]">{formatWeekday(date)}</div>
      </div>

      {onChange ? (
        <label className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-[14px] bg-[#edfafa] text-[#008d8c] active:scale-[0.97]">
          <CalendarDays size={18} />
          <input
            aria-label="Select date"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            type="date"
            value={date}
            onChange={(event) => onChange(event.target.value)}
          />
        </label>
      ) : (
        <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#edfafa] text-[#008d8c]">
          <CalendarDays size={18} />
        </div>
      )}

      {onNext ? (
        <button type="button" onClick={onNext} aria-label="Next date" className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[#edfafa] text-[#008d8c] active:scale-[0.97]">
          <ChevronRight size={18} />
        </button>
      ) : null}
    </MealCard>
  )
}

export function MealTabs({
  value,
  onChange,
  meals = [],
}: {
  value: MealName
  onChange: (value: MealName) => void
  meals?: MealRecord[]
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {MEAL_ORDER.map((mealName) => {
        const meal = findMeal(meals, mealName)
        const active = value === mealName
        const locked = mealIsLocked(meal)
        return (
          <button
            key={mealName}
            type="button"
            onClick={() => onChange(mealName)}
            className={`min-h-14 rounded-[14px] border px-2 text-center transition active:scale-[0.98] ${
              active
                ? 'border-[#008d8c] bg-[#008d8c] text-white shadow-[0_10px_22px_rgba(0,119,122,0.16)]'
                : locked
                  ? 'border-[#ffd8d8] bg-[#fff3f3] text-[#ee1f2f]'
                  : 'border-[#d8eeee] bg-white text-[#123748]'
            }`}
          >
            <span className="block text-[11px] font-black leading-tight">{MEAL_LABELS[mealName]}</span>
            <span className="mt-1 block text-[10px] font-black uppercase">{locked ? 'Locked' : active ? 'Selected' : 'Open'}</span>
          </button>
        )
      })}
    </div>
  )
}

export function MealStatusPill({
  tone,
  children,
}: {
  tone: 'open' | 'closed' | 'neutral' | 'danger'
  children: ReactNode
}) {
  const classes = {
    open: 'bg-[#dff4f3] text-[#008d8c]',
    closed: 'bg-[#fff0f0] text-[#ee1f2f]',
    neutral: 'bg-[#edfafa] text-[#65838b]',
    danger: 'bg-[#ee1f2f] text-white',
  }

  return <span className={`inline-flex min-h-7 items-center rounded-full px-3 text-[10px] font-black uppercase ${classes[tone]}`}>{children}</span>
}

export function MealIconBadge({
  mealName,
  size = 'md',
}: {
  mealName: MealName
  size?: 'sm' | 'md' | 'lg'
}) {
  const meta = MEAL_META[mealName]
  const Icon = meta.icon
  const sizes = {
    sm: 'h-9 w-9 rounded-[12px]',
    md: 'h-11 w-11 rounded-[14px]',
    lg: 'h-20 w-20 rounded-[24px]',
  }
  const iconSize = size === 'lg' ? 34 : size === 'md' ? 19 : 16

  return (
    <div className={`grid place-items-center ${sizes[size]}`} style={{ backgroundColor: `${meta.color}12`, color: meta.color }}>
      <Icon size={iconSize} />
    </div>
  )
}

export function MealStateIllustration({
  state,
  mealName,
}: {
  state: 'open' | 'locked'
  mealName: MealName
}) {
  const meta = MEAL_META[mealName]
  const isLocked = state === 'locked'

  return (
    <div className="relative mx-auto h-32 w-32">
      <svg viewBox="0 0 160 160" role="img" aria-label={isLocked ? 'Locked meal illustration' : 'Open meal illustration'} className="h-full w-full">
        <defs>
          <linearGradient id={`meal-bowl-${state}-${mealName}`} x1="28" x2="132" y1="92" y2="130" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0aa0a0" stopOpacity="0.95" />
            <stop offset="1" stopColor="#00777a" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id={`meal-lock-${state}-${mealName}`} x1="60" x2="104" y1="56" y2="111" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ff3b4f" />
            <stop offset="1" stopColor="#e9192d" />
          </linearGradient>
          <filter id={`meal-soft-shadow-${state}-${mealName}`} x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx="0" dy="10" stdDeviation="7" floodColor="#00777a" floodOpacity="0.14" />
          </filter>
        </defs>

        <circle cx="80" cy="78" r="55" fill={isLocked ? '#edfafa' : meta.soft} />

        {!isLocked ? (
          <>
            <path d="M31 76c-3-3-3-8 1-11 4-3 9-3 12 1l35 36-9 8-39-34Z" fill="#65c8c5" />
            <ellipse cx="84" cy="103" rx="52" ry="18" fill="#dff4f3" />
            <path d="M37 88c8 25 27 39 47 39s39-14 47-39H37Z" fill={`url(#meal-bowl-${state}-${mealName})`} filter={`url(#meal-soft-shadow-${state}-${mealName})`} />
            <path d="M42 88c8 12 75 12 84 0-4-12-20-20-42-20S47 76 42 88Z" fill="#e9fffb" />
            <circle cx="61" cy="78" r="8" fill="#ffca63" />
            <circle cx="82" cy="74" r="7" fill="#ff9f45" />
            <circle cx="101" cy="80" r="8" fill="#f06f45" />
            <circle cx="73" cy="87" r="6" fill="#ffd98a" />
            <path d="M72 60c9 1 15 6 18 15-11 2-20-2-25-11 2-3 4-4 7-4Z" fill="#0f8f61" />
            <path d="M91 58c9 2 14 8 15 17-10 0-18-5-21-14 2-2 4-3 6-3Z" fill="#15a56f" />
            <path d="M79 55c4 6 4 13 0 20-8-6-10-14-4-23 2 0 3 1 4 3Z" fill="#0f8f61" />
            <path d="M50 114c17 8 50 8 68 0" fill="none" stroke="#006e71" strokeWidth="5" strokeLinecap="round" opacity="0.55" />
            <ellipse cx="116" cy="123" rx="17" ry="10" fill="#bdeae8" />
          </>
        ) : (
          <>
            <ellipse cx="80" cy="106" rx="54" ry="18" fill="#dff4f3" />
            <path d="M34 89c8 24 26 37 46 37s38-13 46-37H34Z" fill="#e9fffb" filter={`url(#meal-soft-shadow-${state}-${mealName})`} />
            <path d="M39 91c7 7 76 7 83 0-5-11-20-18-42-18S44 80 39 91Z" fill="#f7fffe" />
            <path d="M35 98c9 18 25 28 45 28 19 0 36-10 45-28" fill="none" stroke="#008d8c" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
            <rect x="57" y="74" width="46" height="39" rx="8" fill={`url(#meal-lock-${state}-${mealName})`} />
            <path d="M66 76V63c0-11 7-19 16-19s16 8 16 19v13" fill="none" stroke="#e9192d" strokeWidth="6" strokeLinecap="round" />
            <circle cx="80" cy="93" r="4" fill="#ffffff" />
            <path d="M80 95v8" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
            <path d="M34 89c-11-1-19 3-24 10 14 6 28 7 43 1" fill="#7cd4ce" opacity="0.75" />
            <path d="M126 89c11-1 19 3 24 10-14 6-28 7-43 1" fill="#7cd4ce" opacity="0.75" />
            <circle cx="54" cy="86" r="5" fill="#ffca63" opacity="0.9" />
            <circle cx="110" cy="86" r="5" fill="#ff9f45" opacity="0.9" />
          </>
        )}

        {!isLocked ? (
          <g>
            <circle cx="124" cy="36" r="18" fill="#24b47e" />
            <path d="m116 36 6 6 11-13" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ) : null}
      </svg>
    </div>
  )
}

export function MealTotalsGrid({
  meals,
}: {
  meals: MealRecord[]
}) {
  const totals = calculateTotals(meals)
  const items: Array<{ label: string; value: number; mealName?: MealName; icon?: ComponentType<LucideProps> }> = [
    { label: 'Breakfast', value: totals.perMeal.BREAKFAST, mealName: 'BREAKFAST' as MealName },
    { label: 'Lunch', value: totals.perMeal.LUNCH, mealName: 'LUNCH' as MealName },
    { label: 'Dinner', value: totals.perMeal.DINNER, mealName: 'DINNER' as MealName },
    { label: 'Total', value: totals.total, icon: UtensilsCrossed },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => {
        const Icon = 'icon' in item ? item.icon : null
        return (
          <div key={item.label} className="overview-card">
            <div className="flex items-start gap-2.5">
              {item.mealName ? <MealIconBadge mealName={item.mealName} size="sm" /> : null}
              {Icon ? (
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px] bg-[#edfafa] text-[#008d8c]">
                  <Icon size={16} />
                </div>
              ) : null}
              <div className="min-w-0">
                <div className="overview-card-label">{item.label}</div>
                <div className="overview-card-value">{item.value}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function MealOptionRow({
  selected,
  title,
  hint,
  rightText,
  onClick,
}: {
  selected: boolean
  title: string
  hint?: string
  rightText?: string
  onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-12 w-full items-center gap-3 rounded-[14px] bg-white px-1 text-left">
      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${selected ? 'border-[#008d8c]' : 'border-[#789096]'}`}>
        {selected ? <span className="h-2.5 w-2.5 rounded-full bg-[#008d8c]" /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-bold text-[#123748]">{title}</span>
        {hint ? <span className="mt-0.5 block text-[10px] font-semibold text-[#65838b]">{hint}</span> : null}
      </span>
      {rightText ? <span className="text-[11px] font-bold text-[#65838b]">{rightText}</span> : null}
    </button>
  )
}

export function MemberMealRow({
  member,
  mealName,
  attendance,
  href,
}: {
  member: MealMember
  mealName: MealName
  attendance?: MealAttendance | null
  href?: string
}) {
  const count = attendanceMealCount(mealName, attendance)
  const statusText = count > 0 ? 'I will take meal' : 'No Meal'
  const tone = count > 0 ? 'text-[#008d8c]' : 'text-[#ee1f2f]'
  const content = (
    <>
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[#edfafa] text-[12px] font-black text-[#008d8c]">
        {initials(memberName(member))}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-black text-[#123748]">{memberName(member)}</div>
        <div className="mt-0.5 truncate text-[10px] font-semibold text-[#65838b]">{member.user?.email ?? member.room_no ?? 'Mess member'}</div>
      </div>
      <div className={`shrink-0 text-right text-[11px] font-black ${tone}`}>
        <div>{statusText}</div>
        {count > 1 ? <div className="mt-0.5 text-[10px] text-[#65838b]">{count} meals</div> : null}
      </div>
      {href ? <ChevronRight size={16} className="shrink-0 text-[#9ab2b8]" /> : null}
    </>
  )

  if (href) {
    return (
      <Link href={href} className="flex min-h-[64px] items-center gap-3 rounded-[16px] bg-white px-3 py-2 shadow-[0_8px_20px_rgba(18,55,72,0.06)]">
        {content}
      </Link>
    )
  }

  return <div className="flex min-h-[64px] items-center gap-3 rounded-[16px] bg-white px-3 py-2 shadow-[0_8px_20px_rgba(18,55,72,0.06)]">{content}</div>
}

export function SearchBox({
  value,
  onChange,
  placeholder = 'Search member...',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#65838b]" size={17} />
      <input
        className="field h-12 text-[13px] font-semibold"
        style={{ paddingLeft: 44 }}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

export function ManagerActionCard({
  href,
  icon,
  title,
  description,
  tone = 'teal',
}: {
  href: string
  icon: ReactNode
  title: string
  description: string
  tone?: 'teal' | 'aqua' | 'blue' | 'amber'
}) {
  const tones = {
    teal: 'bg-[#edfafa] text-[#008d8c]',
    aqua: 'bg-[#e9f8f8] text-[#4bbfc0]',
    blue: 'bg-[#eef5ff] text-[#2d70da]',
    amber: 'bg-[#fff8e9] text-[#e29a16]',
  }

  return (
    <Link href={href} className="flex min-h-[78px] items-center gap-3 rounded-[16px] bg-white px-3 py-3 shadow-[0_8px_20px_rgba(18,55,72,0.06)]">
      <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-[16px] ${tones[tone]}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-black text-[#123748]">{title}</div>
        <div className="mt-1 text-[11px] font-semibold leading-4 text-[#65838b]">{description}</div>
      </div>
      <ChevronRight size={17} className="shrink-0 text-[#789096]" />
    </Link>
  )
}

export function LockStateIcon({ locked }: { locked: boolean }) {
  return locked ? <Lock size={16} /> : <Unlock size={16} />
}

export function InlineNotice({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'warning' | 'success' | 'danger'
  children: ReactNode
}) {
  const classes = {
    info: 'border-[#a8cff8] bg-[#eef7ff] text-[#2365b1]',
    warning: 'border-[#f5dfab] bg-[#fff8e9] text-[#7a5a13]',
    success: 'border-[#bfe7e6] bg-[#edfafa] text-[#008d8c]',
    danger: 'border-[#ffd8d8] bg-[#fff3f3] text-[#ee1f2f]',
  }

  return <div className={`rounded-[16px] border px-4 py-3 text-[12px] font-bold leading-5 ${classes[tone]}`}>{children}</div>
}

export function EmptyMealsState({ title = 'No meal data found.' }: { title?: string }) {
  return (
    <div className="rounded-[20px] bg-white/90 p-6 text-center text-sm font-bold text-[#65838b]">
      <Circle size={34} className="mx-auto mb-2 text-[#9edddc]" />
      {title}
    </div>
  )
}

export function SaveConfirmNote({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[16px] border border-[#bfe7e6] bg-[#edfafa] px-4 py-3 text-[12px] font-bold leading-5 text-[#008d8c]">
      <span className="mr-2 inline-grid h-5 w-5 place-items-center rounded-full bg-[#008d8c] align-middle text-white">
        <Check size={13} />
      </span>
      {children}
    </div>
  )
}
