'use client'

import Link from 'next/link'
import type { ComponentType, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
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
  Tag,
  Trash2,
  UploadCloud,
  User,
  UserPlus,
  UtensilsCrossed,
  WalletCards,
  Zap,
  type LucideProps,
} from 'lucide-react'
import { LABELS, type ExpenseCategory, type ExpensePaymentType } from '@/lib/form-options'

type IconType = ComponentType<LucideProps>

export function formatBDT(value?: string | number | null, prefix = 'BDT') {
  const amount = Number(value ?? 0)
  if (!Number.isFinite(amount)) return `${prefix} 0`
  return `${prefix} ${amount.toLocaleString('en-US')}`
}

export function formatTaka(value?: string | number | null) {
  const amount = Number(value ?? 0)
  if (!Number.isFinite(amount)) return '৳ 0'
  return `৳ ${amount.toLocaleString('en-US')}`
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

export function ScreenHeader({
  title,
  subtitle,
  left,
  right,
}: {
  title: string
  subtitle?: string
  left?: ReactNode
  right?: ReactNode
}) {
  return (
    <header className="expense-top px-4 pb-6">
      <div className="grid grid-cols-[40px_1fr_40px] items-center gap-2">
        <div>{left}</div>
        <div className="min-w-0 text-center text-white">
          <h1 className="truncate text-[16px] font-black leading-tight">{title}</h1>
          {subtitle ? <p className="mt-1 truncate text-[11px] font-medium text-white/88">{subtitle}</p> : null}
        </div>
        <div>{right}</div>
      </div>
    </header>
  )
}

export function HeaderIconButton({ href, icon, label }: { href?: string; icon: ReactNode; label: string }) {
  const className = 'relative grid h-10 w-10 place-items-center rounded-full bg-white/14 text-white ring-1 ring-white/12 backdrop-blur'
  if (href) {
    return (
      <Link href={href} className={className} aria-label={label} title={label}>
        {icon}
      </Link>
    )
  }
  return (
    <button type="button" className={className} aria-label={label} title={label}>
      {icon}
    </button>
  )
}

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
  const iconClass = accent === 'blue' ? 'from-[#4867ff] to-[#7f61ff]' : 'from-[#00777a] to-[#0aa0a0]'
  return (
    <Link href={href} className="expense-action-card">
      <span className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br ${iconClass} text-white shadow-[0_12px_26px_rgba(0,119,122,0.20)]`}>
        <Icon size={19} strokeWidth={2.25} />
        <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-[#dff4f3] text-[#008d8c] ring-2 ring-white">
          <ChevronRight size={12} />
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-black text-[#061638]">{title}</span>
        <span className="mt-1 block truncate text-[10px] font-medium text-[#65838b]">{subtitle}</span>
      </span>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f3f6f8] text-[#061638]">
        <ChevronRight size={16} strokeWidth={2.6} />
      </span>
    </Link>
  )
}

export function ExpenseStatCard({
  icon,
  label,
  value,
  caption = 'This Month',
  tone = { bg: '#dff4f3', fg: '#008d8c' },
}: {
  icon: IconType
  label: string
  value: ReactNode
  caption?: string
  tone?: { bg: string; fg: string }
}) {
  return (
    <div className="expense-stat-card">
      <CircleIcon icon={icon} tone={tone} />
      <div className="min-w-0">
        <div className="text-[10px] font-bold text-[#65838b]">{label}</div>
        <div className="mt-1.5 truncate text-[16px] font-black leading-none text-[#061638]">{value}</div>
        <div className="mt-1.5 text-[10px] font-medium text-[#65838b]">{caption}</div>
      </div>
    </div>
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
            className="h-12 w-full rounded-[14px] border border-white/70 bg-white px-4 pl-11 text-[13px] font-medium text-[#123748] shadow-[0_10px_24px_rgba(18,55,72,0.06)] outline-none placeholder:text-[#7d8a9d] focus:border-[#9edddc]"
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
      className={`flex h-9 items-center justify-center gap-1 rounded-full border px-2 text-[10px] font-bold shadow-[0_8px_18px_rgba(18,55,72,0.05)] ${
        active ? 'border-[#9edddc] bg-[#edfafa] text-[#008d8c]' : 'border-white/80 bg-white text-[#123748]'
      }`}
    >
      <Icon size={13} className="shrink-0 text-[#008d8c]" />
      <span className="truncate">{label}</span>
      <ChevronDown size={12} className="shrink-0 text-[#4f6375]" />
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

export function ExpenseListItem({ item, href }: { item: ExpenseListRecord; href: string }) {
  const Icon = categoryIcon(item.category)
  const tone = categoryTone(item.category)
  const label = item.itemName?.trim() || categoryLabel(item.category)
  const payment = item.paymentType === 'PERSONAL' ? 'Personal' : item.payment_method || paymentLabel(item.paymentType)

  return (
    <Link href={href} className="expense-list-item">
      <CircleIcon icon={Icon} tone={tone} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-black uppercase text-[#061638]">{label}</span>
        <span className="mt-1.5 flex min-w-0 items-center gap-1.5">
          <span className="truncate text-[10px] font-medium text-[#4f6375]">{formatDate(item.expenseDate ?? item.expense_date)}</span>
          <span className="rounded-full bg-[#dff4f3] px-2 py-0.5 text-[8px] font-black text-[#008d8c]">{payment}</span>
        </span>
      </span>
      <span className="shrink-0 text-right text-[15px] font-black text-[#008d8c]">{formatTaka(item.amount).replace(' ', ' ')}</span>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f3f6f8] text-[#061638]">
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
    <div className="screen">
      <section className="design-form-card">
        <div className="flex items-start gap-3">
          <CircleIcon icon={Icon} size="lg" tone={{ bg: '#008d8c', fg: '#ffffff' }} />
          <div className="min-w-0 flex-1">
            <h1 className="text-[18px] font-black leading-tight text-[#061638]">{title}</h1>
            <p className="mt-1.5 text-[12px] leading-[18px] text-[#65838b]">{description}</p>
          </div>
          <Link href={backHref} className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] border border-[#dce5ec] bg-white text-[#4f6375]" aria-label="Close form">
            <ChevronDown className="rotate-45" size={18} />
          </Link>
        </div>
        <div className="mt-5 space-y-4">{children}</div>
      </section>
    </div>
  )
}

export function FormSection({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-[14px] border border-[#dce5ec] bg-white/76 p-3.5">
      {title ? <h2 className="mb-3 text-[14px] font-black text-[#061638]">{title}</h2> : null}
      <div className="space-y-4">{children}</div>
    </section>
  )
}

export function PaymentTypeSelector({
  value,
  onChange,
}: {
  value: ExpensePaymentType
  onChange: (value: ExpensePaymentType) => void
}) {
  const choices: Array<{ value: ExpensePaymentType; label: string; icon: IconType }> = [
    { value: 'FROM_DEPOSIT', label: 'From Deposit', icon: Landmark },
    { value: 'PERSONAL', label: 'Personal', icon: User },
  ]

  return (
    <div>
      <h2 className="mb-3 text-[14px] font-black text-[#061638]">Payment Type</h2>
      <div className="grid grid-cols-2 gap-3">
        {choices.map((choice) => {
          const selected = value === choice.value
          const Icon = choice.icon
          return (
            <button
              key={choice.value}
              type="button"
              onClick={() => onChange(choice.value)}
              className={`flex h-[52px] items-center justify-center gap-2 rounded-[13px] border px-2 text-[12px] font-black transition ${
                selected ? 'border-[#008d8c] bg-[#f4ffff] text-[#008d8c]' : 'border-[#dce5ec] bg-white text-[#4f6375]'
              }`}
            >
              <Icon size={18} />
              <span className="truncate">{choice.label}</span>
              {selected ? (
                <span className="grid h-5 w-5 place-items-center rounded-full bg-[#008d8c] text-white">
                  <Check size={13} />
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
      <p className="mt-3 flex items-start gap-2 text-[11px] font-medium leading-4 text-[#65838b]">
        <BadgeInfo className="mt-0.5 shrink-0" size={14} />
        Amount will be split among all members in monthly bill calculation.
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
      <span className="mb-2 block text-[13px] font-black text-[#061638]">{label}</span>
      <span className="relative block">
        <span className="absolute left-2.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-[10px] bg-[#e8f8f7] text-[#008d8c]">
          <Icon size={17} />
        </span>
        <input
          className={`h-[54px] w-full rounded-[13px] border border-[#dce5ec] bg-white px-3.5 pl-[58px] text-[14px] font-semibold text-[#123748] outline-none placeholder:text-[#8a98ad] focus:border-[#9edddc] ${className}`}
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

export function DesignedSelect({ label, icon: Icon, children, className = '', ...props }: DesignedSelectProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-black text-[#061638]">{label}</span>
      <span className="relative block">
        <span className="absolute left-2.5 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-[10px] bg-[#e8f8f7] text-[#008d8c]">
          <Icon size={17} />
        </span>
        <select
          className={`h-[54px] w-full appearance-none rounded-[13px] border border-[#dce5ec] bg-white px-3.5 pl-[58px] pr-10 text-[14px] font-semibold text-[#123748] outline-none focus:border-[#9edddc] ${className}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#4f6375]" size={18} />
      </span>
    </label>
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
      <span className="mb-2 block text-[13px] font-black text-[#061638]">{label}</span>
      <span className="relative block">
        <span className="absolute left-2.5 top-3 z-10 grid h-9 w-9 place-items-center rounded-[10px] bg-[#e8f8f7] text-[#008d8c]">
          <Icon size={17} />
        </span>
        <textarea
          className={`min-h-[120px] w-full resize-none rounded-[13px] border border-[#dce5ec] bg-white px-3.5 py-4 pl-[58px] text-[14px] font-semibold text-[#123748] outline-none placeholder:text-[#8a98ad] focus:border-[#9edddc] ${className}`}
          {...props}
        />
        {count ? <span className="absolute bottom-3 right-4 text-[10px] font-medium text-[#7d8a9d]">{count}</span> : null}
      </span>
    </label>
  )
}

export function UploadField({ onChange, fileName }: { onChange: (file: File | null) => void; fileName?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-black text-[#061638]">Receipt Image/PDF (Optional)</span>
      <span className="flex min-h-[70px] items-center gap-3 rounded-[13px] border border-dashed border-[#cbd8e1] bg-white px-4">
        <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-[#e8f8f7] text-[#008d8c]">
          <UploadCloud size={19} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-black text-[#061638]">{fileName || 'Upload Receipt'}</span>
          <span className="mt-1 block text-[10px] font-medium text-[#65838b]">PNG, JPG, PDF up to 5MB</span>
        </span>
        <input className="sr-only" type="file" accept="image/*,application/pdf" onChange={(event) => onChange(event.target.files?.[0] ?? null)} />
      </span>
    </label>
  )
}

export function SubmitGradientButton({ children, busy }: { children: ReactNode; busy?: boolean }) {
  return (
    <button type="submit" disabled={busy} className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] border-0 bg-gradient-to-br from-[#008d8c] to-[#00777a] text-[14px] font-black text-white shadow-[0_16px_30px_rgba(0,119,122,0.22)] disabled:cursor-not-allowed disabled:opacity-70">
      <Save size={18} />
      {busy ? 'Saving...' : children}
    </button>
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
