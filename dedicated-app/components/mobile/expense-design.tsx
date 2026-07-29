'use client'

import Link from 'next/link'
import { AppHeader } from '@/components/app-header'
import {
  Children,
  isValidElement,
  type ChangeEvent,
  type ComponentType,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import {
  BadgeInfo,
  Banknote,
  Bed,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
  HandCoins,
  Home,
  Landmark,
  Pencil,
  ReceiptText,
  Save,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Tag,
  Trash2,
  UploadCloud,
  User,
  UsersRound,
  UserPlus,
  UtensilsCrossed,
  WalletCards,
  Zap,
  LucideIcon,
  type LucideProps,
} from 'lucide-react'
import { MobileSelectSheet, type MobileSelectOption } from '@/components/mobile/select-sheet'
import { LABELS, type ExpenseCategory, type ExpensePaymentType } from '@/lib/form-options'

type IconType = ComponentType<LucideProps>

function joinClasses(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(' ')
}

const formLabelClass = 'mb-2 block text-label font-semibold text-[#123748]'
const formIconClass = 'absolute left-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-[11px] bg-[#e8f8f7] text-[#008d8c]'
const formControlClass =
  'h-[52px] w-full rounded-[14px] border border-[#d6e5e8] bg-white px-3.5 pl-[54px] text-body font-medium text-[#123748] outline-none shadow-[0_8px_18px_rgba(18,55,72,0.03)] transition placeholder:text-[#8a98ad] focus:border-[#008d8c] focus:ring-4 focus:ring-[#008d8c]/10'

export function formatBDT(value?: string | number | null) {
  const amount = Number(value ?? 0)
  if (!Number.isFinite(amount)) return `0`
  return `${amount.toLocaleString('en-US')}`
}

export function formatTaka(value?: string | number | null) {
  const amount = Number(value ?? 0)
  const safeAmount = Number.isFinite(amount) ? amount : 0
  return `${String.fromCodePoint(0x09f3)} ${safeAmount.toLocaleString('en-US')}`
}

export function formatDate(value?: string | null) {
  if (!value) return 'Not set'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function formatDateTime(value?: string | null) {
  if (!value) return 'Not set'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return formatDate(value)
  return date.toLocaleString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function categoryLabel(category?: string | null) {
  const key = String(category ?? 'OTHER').toUpperCase() as ExpenseCategory
  return LABELS.EXPENSE_CATEGORIES[key] ?? key.replaceAll('_', ' ')
}

export function paymentLabel(paymentType?: string | null) {
  const key = String(paymentType ?? 'FROM_DEPOSIT').toUpperCase() as ExpensePaymentType
  return LABELS.EXPENSE_PAYMENT_TYPES[key] ?? key.replaceAll('_', ' ')
}

export function categoryIcon(category?: string | null): IconType {
  const key = String(category ?? '').toUpperCase()
  if (key === 'FOOD') return UtensilsCrossed
  if (key === 'GROCERY') return HandCoins
  if (key === 'RENT') return Home
  if (key === 'ELECTRICITY') return Zap
  if (key === 'UTILITY' || key === 'WATER' || key === 'GAS' || key === 'WIFI') return Zap
  if (key === 'CLEANER' || key === 'MAINTENANCE' || key === 'BUABILL') return ReceiptText
  return Tag
}

export function categoryTone(category?: string | null) {
  const key = String(category ?? '').toUpperCase()
  if (key === 'FOOD') return { bg: '#e8fbfa', fg: '#008d8c' }
  if (key === 'ELECTRICITY') return { bg: '#fff1e9', fg: '#f04438' }
  if (key === 'RENT') return { bg: '#f0edff', fg: '#6e65c7' }
  if (key === 'GROCERY' || key === 'UTILITY' || key === 'CLEANER') return { bg: '#e8fbfa', fg: '#008d8c' }
  return { bg: '#edfafa', fg: '#008d8c' }
}

export function CircleIcon({
  icon: Icon,
  className = '',
  size = 'md',
  tone,
}: {
  icon: IconType
  className?: string
  size?: 'sm' | 'md' | 'lg'
  tone?: { bg: string; fg: string }
}) {
  const sizeClass = size === 'lg' ? 'h-12 w-12' : size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full ${sizeClass} ${className}`}
      style={{ backgroundColor: tone?.bg ?? '#dff4f3', color: tone?.fg ?? '#008d8c' }}
      aria-hidden="true"
    >
      <Icon size={size === 'lg' ? 21 : size === 'sm' ? 15 : 18} strokeWidth={2.35} />
    </span>
  )
}

// export function ScreenHeader({
//   title,
//   subtitle,
//   left,
//   right,
// }: {
//   title: string
//   subtitle?: string
//   left?: ReactNode
//   right?: ReactNode
// }) {
//   return (
//     <header className="expense-top px-4 pb-6">
//       <div className="grid grid-cols-[40px_1fr_40px] items-center gap-2">
//         <div>{left}</div>
//         <div className="min-w-0 text-center text-white">
//           <h1 className="truncate text-body font-bold leading-tight">{title}</h1>
//           {subtitle ? <p className="mt-1 truncate text-caption font-medium text-white/88">{subtitle}</p> : null}
//         </div>
//         <div>{right}</div>
//       </div>
//     </header>
//   )
// }
export function ScreenHeader({
  title,
  subtitle,
  backHref,
  left,
  right,
}: {
  title: string
  subtitle?: string
  backHref?: string
  left?: ReactNode
  right?: ReactNode
}) {
  return <AppHeader title={title} subtitle={subtitle} backHref={backHref} leading={left} trailing={right} />
}

// export function HeaderIconButton({ href, icon, label }: { href?: string; icon: ReactNode; label: string }) {
//   const className = 'relative grid h-10 w-10 place-items-center rounded-full bg-white/14 text-white ring-1 ring-white/12 backdrop-blur'
//   if (href) {
//     return (
//       <Link href={href} className={className} aria-label={label} title={label}>
//         {icon}
//       </Link>
//     )
//   }
//   return (
//     <button type="button" className={className} aria-label={label} title={label}>
//       {icon}
//     </button>
//   )
// }
export function HeaderIconButton({
  href,
  icon,
  label,
}: {
  href?: string
  icon: ReactNode
  label: string
}) {
  const className = `
    grid h-10 w-10
    place-items-center rounded-full
    bg-white/10 text-white
    ring-1 ring-white/10
    transition-all duration-200
    hover:bg-white/15
    active:scale-95
  `

  if (href) {
    return (
      <Link
        href={href}
        className={className}
        aria-label={label}
        title={label}
      >
        {icon}
      </Link>
    )
  }

  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  )
}

// export function ExpenseActionCard({
//   href,
//   icon: Icon,
//   title,
//   subtitle,
//   accent = 'teal',
// }: {
//   href: string
//   icon: IconType
//   title: string
//   subtitle: string
//   accent?: 'teal' | 'blue'
// }) {
//   const iconClass = accent === 'blue' ? 'from-[#4867ff] to-[#7f61ff]' : 'from-[#00777a] to-[#0aa0a0]'
//   return (
//     <Link href={href} className="expense-action-card">
//       <span className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br ${iconClass} text-white shadow-[0_12px_26px_rgba(0,119,122,0.20)]`}>
//         <Icon size={19} strokeWidth={2.25} />
//         <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-[#dff4f3] text-[#008d8c] ring-2 ring-white">
//           <ChevronRight size={12} />
//         </span>
//       </span>
//       <span className="min-w-0 flex-1">
//         <span className="block truncate text-label font-bold text-[#061638]">{title}</span>
//         <span className="mt-1 block truncate text-caption font-medium text-[#65838b]">{subtitle}</span>
//       </span>
//       <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f3f6f8] text-[#061638]">
//         <ChevronRight size={16} strokeWidth={2.6} />
//       </span>
//     </Link>
//   )
// }
export function ExpenseActionCard({
  href,
  icon: Icon,
  title,
  subtitle,
  accent = 'teal',
}: {
  href: string
  icon: IconType
  title: string
  subtitle: string
  accent?: 'teal' | 'blue'
}) {
  const isBlue = accent === 'blue'

  return (
    <Link
      href={href}
      className={`
        group relative flex min-h-[78px]
        items-center gap-3 overflow-hidden
        rounded-[18px] border
        bg-white px-3.5 py-3
        shadow-[0_10px_28px_rgba(18,55,72,0.07)]
        transition-all duration-200
        hover:-translate-y-0.5
        hover:shadow-[0_16px_34px_rgba(18,55,72,0.11)]
        active:scale-[0.99]
        ${
          isBlue
            ? 'border-[#cfc5ff]'
            : 'border-[#9edddc]'
        }
      `}
    >
      <span
        className={`
          grid h-11 w-11 shrink-0
          place-items-center rounded-[14px]
          text-white
          shadow-[0_10px_22px_rgba(0,119,122,0.18)]
          ${
            isBlue
              ? 'bg-gradient-to-br from-[#6455f5] to-[#815cf5]'
              : 'bg-gradient-to-br from-[#008d8c] to-[#05a5a1]'
          }
        `}
      >
        <Icon size={20} strokeWidth={2.25} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-label font-bold text-[#061638]">
          {title}
        </span>

        <span className="mt-1 block truncate text-caption font-medium text-[#758893]">
          {subtitle}
        </span>
      </span>

      <span
        className="
          grid h-8 w-8 shrink-0
          place-items-center rounded-full
          bg-[#f5f8f9] text-[#123748]
          transition-all duration-200
          group-hover:bg-[#edfafa]
          group-hover:text-[#008d8c]
        "
      >
        <ChevronRight size={16} strokeWidth={2.6} />
      </span>
    </Link>
  )
}

// export function ExpenseStatCard({
//   icon,
//   label,
//   value,
//   caption = 'This Month',
//   tone = { bg: '#dff4f3', fg: '#008d8c' },
// }: {
//   icon: IconType
//   label: string
//   value: ReactNode
//   caption?: string
//   tone?: { bg: string; fg: string }
// }) {
//   return (
//     <div className="expense-stat-card">
//       <CircleIcon icon={icon} tone={tone} />
//       <div className="min-w-0">
//         <div className="text-caption font-bold text-[#65838b]">{label}</div>
//         <div className="mt-1.5 truncate text-body font-bold leading-none text-[#061638]">{value}</div>
//         <div className="mt-1.5 text-caption font-medium text-[#65838b]">{caption}</div>
//       </div>
//     </div>
//   )
// }
interface ExpenseStatCardProps {
  icon: LucideIcon
  title: string
  value: ReactNode
  color: string
  bg: string
}
export function ExpenseStatCard({
  icon: Icon,
  title,
  value,
  color,
  bg,
}: ExpenseStatCardProps) {
  return (
    <div
      className="
        relative overflow-hidden
        rounded-[18px]
        border border-[#eef2f4]
        bg-white
        p-4
        shadow-[0_8px_24px_rgba(17,24,39,.05)]
      "
    >
      <div className="flex items-center gap-3">
  <div
    className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
    style={{ background: bg }}
  >
    <Icon
      size={21}
      strokeWidth={2.2}
      style={{ color }}
    />
  </div>

  <div className="flex-1">
    <p className="whitespace-nowrap text-caption font-semibold text-[#94a3b8]">
      {title}
    </p>

    <h3
      className="mt-1 whitespace-nowrap text-title font-bold leading-none"
      style={{ color }}
    >
      {value}
    </h3>
  </div>

  <svg
    width="46"
    height="30"
    viewBox="0 0 54 34"
    fill="none"
    className="shrink-0 self-end"
  >
    <path
      d="M2 29
         C12 29
         15 10
         25 18
         C31 22
         35 6
         45 6
         L52 2"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    <circle
      cx="52"
      cy="2"
      r="3"
      fill={color}
    />
  </svg>
</div>
    </div>
  )
}

export function ExpenseOverviewTile({
  label,
  value,
  caption,
  href,
  accent = 'teal',
}: {
  label?: string
  value: ReactNode
  caption?: string
  href?: string
  accent?: 'teal' | 'blue'
}) {
  const color = accent === 'blue' ? '#1666d9' : '#008d8c'
  const borderColor = accent === 'blue' ? '#cfe0ff' : '#cfeeed'
  const valueOnly = !label && !caption
  const content = (
    <>
      {label ? <div className="overview-card-label">{label}</div> : null}
      <div className={joinClasses('overview-card-value', valueOnly && 'mt-0 w-full text-left')} style={{ color }}>
        {value}
      </div>
      {caption ? <div className="mt-2 truncate text-caption font-semibold text-[#65838b]">{caption}</div> : null}
    </>
  )
  const className = joinClasses(
    'overview-card block min-h-[82px] transition active:scale-[0.99]',
    valueOnly && 'grid items-center justify-stretch'
  )

  if (href) {
    return (
      <Link href={href} className={className} style={{ borderColor }}>
        {content}
      </Link>
    )
  }

  return (
    <div className={className} style={{ borderColor }}>
      {content}
    </div>
  )
}

export function ExpenseOverviewPanel({
  title = 'Overview',
  children,
}: {
  title?: string
  children: ReactNode
}) {
  return (
    <section className="home-panel">
      <div className="section-title">{title}</div>
      <div className="grid grid-cols-2 gap-2">{children}</div>
    </section>
  )
}

export function SearchPanel({
  search,
  onSearch,
  children,
}: {
  search: string
  onSearch: (value: string) => void
  children: ReactNode
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="relative min-w-0 flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4f6375]" size={18} />
          <input
            className="h-12 w-full rounded-[14px] border border-white/70 bg-white px-4 pl-11 text-body font-medium text-[#123748] shadow-[0_10px_24px_rgba(18,55,72,0.06)] outline-none placeholder:text-[#7d8a9d] focus:border-[#9edddc]"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search expenses..."
          />
        </label>
        <button type="button" className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] border border-white/70 bg-white text-[#123748] shadow-[0_10px_24px_rgba(18,55,72,0.06)]" aria-label="Filter expenses">
          <ChevronDown size={18} />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">{children}</div>
    </section>
  )
}

// export function FilterPill({
//   icon: Icon,
//   label,
//   active,
//   onClick,
// }: {
//   icon: IconType
//   label: string
//   active?: boolean
//   onClick?: () => void
// }) {
//   return (
//     <button
//       type="button"
//       onClick={onClick}
//       className={`flex h-9 items-center justify-center gap-1 rounded-full border px-2 text-caption font-bold shadow-[0_8px_18px_rgba(18,55,72,0.05)] ${
//         active ? 'border-[#9edddc] bg-[#edfafa] text-[#008d8c]' : 'border-white/80 bg-white text-[#123748]'
//       }`}
//     >
//       <Icon size={13} className="shrink-0 text-[#008d8c]" />
//       <span className="truncate">{label}</span>
//       <ChevronDown size={12} className="shrink-0 text-[#4f6375]" />
//     </button>
//   )
// }
export function FilterPill({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: IconType
  label: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex h-9 min-w-0
        items-center justify-center
        gap-1.5 rounded-full
        border px-2.5
        text-caption font-bold
        shadow-[0_7px_18px_rgba(18,55,72,0.05)]
        transition-all duration-200
        active:scale-[0.98]
        ${
          active
            ? 'border-[#008d8c] bg-[#008d8c] text-white'
            : 'border-white/90 bg-white text-[#123748] hover:border-[#9edddc]'
        }
      `}
    >
      <Icon
        size={13}
        strokeWidth={2.2}
        className={`shrink-0 ${
          active ? 'text-white' : 'text-[#008d8c]'
        }`}
      />

      <span className="truncate">{label}</span>

      <ChevronDown
        size={12}
        className={`shrink-0 ${
          active ? 'text-white/90' : 'text-[#627984]'
        }`}
      />
    </button>
  )
}

export type ExpenseListRecord = {
  id: string
  category?: string | null
  itemName?: string | null
  amount?: string | number | null
  expenseDate?: string | null
  expense_date?: string | null
  paymentType?: string | null
  payment_method?: string | null
}

// export function ExpenseListItem({ item, href }: { item: ExpenseListRecord; href: string }) {
//   const Icon = categoryIcon(item.category)
//   const tone = categoryTone(item.category)
//   const label = item.itemName?.trim() || categoryLabel(item.category)
//   const payment = item.paymentType === 'PERSONAL' ? 'Personal' : item.payment_method || paymentLabel(item.paymentType)

//   return (
//     <Link href={href} className="expense-list-item">
//       <CircleIcon icon={Icon} tone={tone} />
//       <span className="min-w-0 flex-1">
//         <span className="block truncate text-label font-bold uppercase text-[#061638]">{label}</span>
//         <span className="mt-1.5 flex min-w-0 items-center gap-1.5">
//           <span className="truncate text-caption font-medium text-[#4f6375]">{formatDate(item.expenseDate ?? item.expense_date)}</span>
//           <span className="rounded-full bg-[#dff4f3] px-2 py-0.5 text-caption font-bold text-[#008d8c]">{payment}</span>
//         </span>
//       </span>
//       <span className="shrink-0 text-right text-body font-bold text-[#008d8c]">{formatTaka(item.amount).replace(' ', ' ')}</span>
//       <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f3f6f8] text-[#061638]">
//         <ChevronRight size={16} strokeWidth={2.7} />
//       </span>
//     </Link>
//   )
// }
export function ExpenseListItem({
  item,
  href,
  variant = 'card',
}: {
  item: ExpenseListRecord
  href: string
  variant?: 'card' | 'horizontal'
}) {
  const Icon = categoryIcon(item.category)
  const tone = categoryTone(item.category)
  const isHorizontal = variant === 'horizontal'

  const label =
    item.itemName?.trim() ||
    categoryLabel(item.category)

  const payment =
    item.paymentType === 'PERSONAL'
      ? 'Personal'
      : item.payment_method ||
        paymentLabel(item.paymentType)

  return (
    <Link
      href={href}
      className={joinClasses(
        `
        group relative flex min-h-[76px]
        items-center gap-3 overflow-hidden bg-white/95
        transition-all duration-200
        active:scale-[0.995]
        `,
        isHorizontal
          ? 'border-y border-x-0 border-[#cfeeed] py-3 shadow-none'
          : 'rounded-[17px] border border-white/90 px-3 py-3 shadow-[0_10px_26px_rgba(18,55,72,0.065)] hover:-translate-y-0.5 hover:shadow-[0_15px_32px_rgba(18,55,72,0.10)]'
      )}
    >
      {!isHorizontal ? (
        <span
          className="
            absolute inset-y-0 left-0
            w-[3px] rounded-r-full
          "
          style={{ backgroundColor: tone.fg }}
        />
      ) : null}

      <span
        className={joinClasses(
          `
          grid h-10 w-10 shrink-0
          place-items-center rounded-full
          `,
          !isHorizontal && 'ml-1'
        )}
        style={{
          backgroundColor: tone.bg,
          color: tone.fg,
        }}
      >
        <Icon size={17} strokeWidth={2.3} />
      </span>

      <span className="min-w-0 flex-1">
        <span
          className="
            block truncate
            text-label font-bold
            uppercase tracking-[-0.01em]
            text-[#061638]
          "
        >
          {label}
        </span>

        <span className="mt-1.5 flex min-w-0 items-center gap-1.5">
          <span className="truncate text-caption font-medium text-[#667d87]">
            {formatDate(
              item.expenseDate ??
                item.expense_date
            )}
          </span>

          <span
            className="
              truncate rounded-full
              bg-[#e8f8f7]
              px-2 py-0.5
              text-caption font-bold
              text-[#008d8c]
            "
          >
            {payment}
          </span>
        </span>
      </span>

      <span
        className="
          shrink-0 whitespace-nowrap
          text-right text-body
          font-bold tracking-[-0.02em]
        "
        style={{ color: tone.fg }}
      >
        {formatTaka(item.amount)}
      </span>

      <span
        className="
          grid h-8 w-8 shrink-0
          place-items-center
          rounded-full
          bg-[#f4f7f8]
          text-[#123748]
          transition-all duration-200
          group-hover:bg-[#edfafa]
          group-hover:text-[#008d8c]
        "
      >
        <ChevronRight size={16} strokeWidth={2.7} />
      </span>
    </Link>
  )
}

export function FormPageShell({
  title,
  description,
  icon: Icon,
  backHref,
  children,
}: {
  title: string
  description: string
  icon: IconType
  backHref: string
  children: ReactNode
}) {
  return (
    <>
      <AppHeader
        title={title}
        subtitle={description}
        backHref={backHref}
        trailing={
          <span className="app-header-action" aria-hidden="true">
            <Icon size={18} strokeWidth={2.4} />
          </span>
        }
      />

      <div className="screen expense-form-screen space-y-4">{children}</div>
    </>
  )
}

export function FormSection({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="expense-form-card">
      {title ? <h2 className="mb-3 text-body font-extrabold leading-tight text-[#123748]">{title}</h2> : null}
      <div className="space-y-3.5">{children}</div>
    </section>
  )
}

export function FormFieldGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>
}

export function FormStatusMessage({ message, success = false }: { message: string; success?: boolean }) {
  if (!message) return null

  return (
    <div
      className={`rounded-[15px] border px-3.5 py-3 text-label font-semibold ${
        success
          ? 'border-[#bfe7e6] bg-[#edfafa] text-[#008d8c]'
          : 'border-[#f4c7c7] bg-[#fff5f5] text-[#b42318]'
      }`}
    >
      {message}
    </div>
  )
}

export function FormSummaryCard({
  eyebrow,
  title,
  description,
  icon: Icon,
}: {
  eyebrow: string
  title: string
  description?: string
  icon: IconType
}) {
  return (
    <div className="flex items-center gap-3 rounded-[15px] border border-[#cfeeed] bg-[#edfafa] px-3.5 py-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-white text-[#008d8c]">
        <Icon size={18} strokeWidth={2.35} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-caption font-bold uppercase tracking-[0.12em] text-[#65838b]">{eyebrow}</span>
        <span className="mt-1 block truncate text-label font-bold text-[#123748]">{title}</span>
        {description ? <span className="mt-0.5 block truncate text-caption font-semibold text-[#65838b]">{description}</span> : null}
      </span>
    </div>
  )
}

export function PaymentTypeSelector({
  value,
  onChange,
  showHeading = true,
}: {
  value: ExpensePaymentType
  onChange: (value: ExpensePaymentType) => void
  showHeading?: boolean
}) {
  const choices: Array<{ value: ExpensePaymentType; label: string; description: string; icon: IconType }> = [
    { value: 'PERSONAL', label: 'Personal', description: 'Paid by you', icon: User },
    { value: 'FROM_DEPOSIT', label: 'From Deposit', description: 'Use deposit credit', icon: Landmark },
    { value: 'COLLECTED_FUND', label: 'Collected Fund', description: 'Use collected fund', icon: UsersRound },
  ]

  return (
    <div>
      {showHeading ? <h2 className="mb-3 text-body font-extrabold leading-tight text-[#123748]">Paid From</h2> : null}
      <div className="grid grid-cols-3 gap-2.5">
        {choices.map((choice) => {
          const selected = value === choice.value
          const Icon = choice.icon
          return (
            <button
              key={choice.value}
              type="button"
              onClick={() => onChange(choice.value)}
              className={`relative flex min-h-[88px] flex-col items-center justify-center gap-1.5 rounded-[15px] border px-2 py-2 text-center transition ${
                selected
                  ? 'border-[#008d8c] bg-[#f7ffff] text-[#061638] shadow-[0_12px_24px_rgba(0,141,140,0.10)]'
                  : 'border-[#dce5ec] bg-white text-[#061638] shadow-[0_8px_18px_rgba(18,55,72,0.04)]'
              }`}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e8f8f7] text-[#008d8c]">
                <Icon size={18} strokeWidth={2.25} />
              </span>
              <span className="min-w-0 text-caption font-bold leading-tight">{choice.label}</span>
              <span className="min-w-0 text-caption font-medium leading-tight text-[#65838b]">{choice.description}</span>
              {selected ? (
                <span className="absolute right-1.5 top-1.5 grid h-[20px] w-[20px] shrink-0 place-items-center rounded-full bg-[#008d8c] text-white shadow-[0_8px_18px_rgba(0,141,140,0.22)]">
                  <Check size={13} strokeWidth={3} />
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
      <p className="mt-3 flex items-center gap-2 rounded-[13px] bg-[#edfafa] px-3.5 py-3 text-label font-medium text-[#52727b]">
        <BadgeInfo className="shrink-0 text-[#65838b]" size={16} />
        If paid personally, the payer may receive deposit credit based on who shared the expense.
      </p>
    </div>
  )
}

type DesignedFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  icon: IconType
}

export function DesignedInput({ label, icon: Icon, className = '', ...props }: DesignedFieldProps) {
  return (
    <label className="block">
      <span className={formLabelClass}>{label}</span>
      <span className="relative block">
        <span className={formIconClass}>
          <Icon size={16} strokeWidth={2.35} />
        </span>
        <input
          className={joinClasses(formControlClass, className)}
          {...props}
        />
      </span>
    </label>
  )
}

type DesignedSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  icon: IconType
  children: ReactNode
}

type OptionElementProps = {
  value?: string | number
  children?: ReactNode
  disabled?: boolean
}

function getOptionText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(getOptionText).join('').trim()
  if (isValidElement<OptionElementProps>(node)) return getOptionText(node.props.children)
  return ''
}

function getDesignedSelectOptions(children: ReactNode): MobileSelectOption[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<OptionElementProps>(child)) return []

    const label = getOptionText(child.props.children)
    const value = child.props.value === undefined ? label : String(child.props.value)

    return [
      {
        value,
        label,
        disabled: child.props.disabled,
      },
    ]
  })
}

export function DesignedSelect({
  label,
  icon: Icon,
  children,
  className = '',
  value,
  defaultValue,
  disabled,
  name,
  required,
  id,
  onChange,
}: DesignedSelectProps) {
  const options = getDesignedSelectOptions(children)
  const selectedValue = String(value ?? defaultValue ?? '')

  function handleChange(nextValue: string) {
    onChange?.({
      target: { value: nextValue, name },
      currentTarget: { value: nextValue, name },
    } as unknown as ChangeEvent<HTMLSelectElement>)
  }

  return (
    <div className="block">
      <label className={formLabelClass} htmlFor={id}>
        {label}
      </label>
      <span className="relative block">
        <span className={`${formIconClass} z-10`}>
          <Icon size={16} strokeWidth={2.35} />
        </span>
        <MobileSelectSheet
          label={label}
          value={selectedValue}
          options={options}
          onChange={handleChange}
          disabled={disabled}
          renderTrigger={({ open, selectedLabel, buttonProps }) => (
            <button
              {...buttonProps}
              id={id}
              className={joinClasses(
                `${formControlClass} flex items-center pr-10 text-left disabled:cursor-not-allowed disabled:opacity-60`,
                className,
              )}
            >
              <span className={joinClasses('min-w-0 flex-1 truncate', selectedValue ? 'text-[#123748]' : 'text-[#65838b]')}>
                {selectedLabel}
              </span>
              <ChevronDown
                className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4f6375] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                size={17}
                strokeWidth={2.4}
              />
            </button>
          )}
        />
        {name ? <input type="hidden" name={name} value={selectedValue} required={required} /> : null}
      </span>
    </div>
  )
}

type DesignedTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  icon: IconType
  count?: string
}

export function DesignedTextarea({ label, icon: Icon, count, className = '', ...props }: DesignedTextareaProps) {
  return (
    <label className="block">
      <span className={formLabelClass}>{label}</span>
      <span className="relative block">
        <span className="absolute left-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-[11px] bg-[#e8f8f7] text-[#008d8c]">
          <Icon size={16} strokeWidth={2.35} />
        </span>
        <textarea
          className={joinClasses(
            'min-h-[104px] w-full resize-none rounded-[14px] border border-[#d6e5e8] bg-white px-3.5 py-3.5 pl-[54px] text-body font-medium text-[#123748] outline-none shadow-[0_8px_18px_rgba(18,55,72,0.03)] transition placeholder:text-[#8a98ad] focus:border-[#008d8c] focus:ring-4 focus:ring-[#008d8c]/10',
            className
          )}
          {...props}
        />
        {count ? <span className="absolute bottom-3.5 right-4 text-caption font-bold text-[#7d8a9d]">{count}</span> : null}
      </span>
    </label>
  )
}

export function UploadField({ onChange, fileName, label = 'Receipt (Optional)' }: { onChange: (file: File | null) => void; fileName?: string; label?: string }) {
  return (
    <label className="block">
      <span className={formLabelClass}>{label}</span>
      <span className="flex min-h-[66px] items-center justify-center gap-2.5 rounded-[14px] border border-dashed border-[#58bfc0] bg-[#f6ffff] px-3.5 text-center">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-white text-[#008d8c]">
          <UploadCloud size={23} strokeWidth={2.1} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-label font-semibold text-[#123748]">{fileName || 'Upload receipt image'}</span>
          <span className="mt-1 block text-caption font-semibold text-[#65838b]">JPG, PNG, PDF up to 5MB</span>
        </span>
        <input className="sr-only" type="file" accept="image/*,application/pdf" onChange={(event) => onChange(event.target.files?.[0] ?? null)} />
      </span>
    </label>
  )
}

export function DesignedToggle({
  label,
  hint,
  icon: Icon,
  checked,
  onChange,
}: {
  label: string
  hint?: string
  icon: IconType
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex min-h-[60px] items-center justify-between gap-3 rounded-[14px] border border-[#d6e5e8] bg-white px-3.5 py-3 shadow-[0_8px_18px_rgba(18,55,72,0.03)]">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[11px] bg-[#e8f8f7] text-[#008d8c]">
          <Icon size={16} strokeWidth={2.35} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-label font-semibold text-[#123748]">{label}</span>
          {hint ? <span className="mt-0.5 block truncate text-caption font-semibold text-[#65838b]">{hint}</span> : null}
        </span>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-[#008d8c]' : 'bg-[#c9dede]'}`}
        aria-pressed={checked}
      >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${checked ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  )
}

export function SubmitGradientButton({ children, busy }: { children: ReactNode; busy?: boolean }) {
  return (
    <div className="mt-4 rounded-[18px] border border-white/85 bg-white/96 p-2.5 shadow-[0_12px_30px_rgba(18,55,72,0.10)]">
      <button type="submit" disabled={busy} className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[15px] border-0 bg-gradient-to-br from-[#008d8c] to-[#00777a] text-label font-bold text-white shadow-[0_14px_26px_rgba(0,119,122,0.22)] transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70">
        <Save size={17} strokeWidth={2.5} />
        {busy ? 'Saving...' : children}
      </button>
    </div>
  )
}

export const expenseFormIcons = {
  amount: Banknote,
  category: Tag,
  date: CalendarDays,
  description: FileText,
  item: ClipboardList,
  member: UserPlus,
  payment: WalletCards,
  receipt: ReceiptText,
}

export const detailIcons = {
  amount: Pencil,
  category: Tag,
  date: CalendarDays,
  payment: WalletCards,
  added: CalendarDays,
  receipt: FileText,
  description: ReceiptText,
  purchased: HandCoins,
  user: UserPlus,
  room: Bed,
  role: User,
  status: ShieldCheck,
  delete: Trash2,
}
