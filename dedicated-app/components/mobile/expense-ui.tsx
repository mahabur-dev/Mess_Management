'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { Check, ChevronRight, CircleDollarSign, Scale, UserRound, WalletCards } from 'lucide-react'
import type { ReactNode } from 'react'

type Accent = 'teal' | 'blue' | 'violet' | 'green' | 'orange'

const ACCENTS: Record<Accent, { foreground: string; background: string }> = {
  teal: { foreground: '#008d8c', background: '#dff4f3' },
  blue: { foreground: '#0aa0a0', background: '#edfafa' },
  violet: { foreground: '#00777a', background: '#dff4f3' },
  green: { foreground: '#4bbfc0', background: '#edfafa' },
  orange: { foreground: '#008d8c', background: '#edfafa' },
}

export function ExpenseSurface({
  title,
  aside,
  children,
  className = '',
}: {
  title?: string
  aside?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`ui-card ${className}`}>
      {title || aside ? (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title ? <h2 className="ui-section-title mb-0!">{title}</h2> : <span />}
          {aside}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export function ExpenseSegmentedControl({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string; icon: LucideIcon }>
}) {
  return (
    <div className="expense-segmented" role="tablist" aria-label="Expense view">
      {options.map((option) => {
        const selected = option.value === value
        const Icon = option.icon
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className="expense-segmented__item"
            data-active={selected}
          >
            <Icon size={18} strokeWidth={2.25} />
            <span>{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export function ExpenseSummaryCard({
  icon: Icon,
  label,
  value,
  caption,
  href,
  accent = 'teal',
}: {
  icon: LucideIcon
  label: string
  value: ReactNode
  caption?: ReactNode
  href?: string
  accent?: Accent
}) {
  const tone = ACCENTS[accent]
  const content = (
    <>
      <span className="expense-summary-card__icon" style={{ backgroundColor: tone.background, color: tone.foreground }}>
        <Icon size={21} strokeWidth={2.3} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="expense-summary-card__label">{label}</span>
        <span className="expense-summary-card__value" style={{ color: tone.foreground }}>
          {value}
        </span>
        {caption ? <span className="expense-summary-card__caption">{caption}</span> : null}
      </span>
      {href ? <ChevronRight size={18} className="shrink-0 text-[#3d5560]" strokeWidth={2.4} /> : null}
    </>
  )

  const className = 'expense-summary-card'
  return href ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  )
}

export function ExpenseDetailsCta({
  href,
  title = 'View Details',
  subtitle = 'Monthly costs in one place',
  buttonLabel = 'View details',
}: {
  href: string
  title?: string
  subtitle?: string
  buttonLabel?: string
}) {
  return (
    <section className="expense-details-cta" aria-label={title}>
      <span className="expense-details-cta__icon" aria-hidden="true">
        <CircleDollarSign size={34} strokeWidth={1.9} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="expense-details-cta__title">{title}</span>
        <span className="expense-details-cta__subtitle">{subtitle}</span>
      </span>
      <Link href={href} className="expense-details-cta__button">
        {buttonLabel}
        <ChevronRight size={15} strokeWidth={2.6} />
      </Link>
    </section>
  )
}

export function ExpenseBreakdownList({
  items,
}: {
  items: Array<{ icon: LucideIcon; label: string; value: ReactNode; accent?: Accent }>
}) {
  return (
    <div className="expense-breakdown-list">
      {items.map((item) => {
        const Icon = item.icon
        const tone = ACCENTS[item.accent ?? 'teal']
        return (
          <div key={item.label} className="expense-breakdown-row">
            <span className="expense-breakdown-row__icon" style={{ backgroundColor: tone.background, color: tone.foreground }}>
              <Icon size={16} strokeWidth={2.35} />
            </span>
            <span className="min-w-0 flex-1 truncate text-label font-medium text-[#3d5560]">{item.label}</span>
            <span className="text-label font-semibold text-[#1d3a42]">{item.value}</span>
          </div>
        )
      })}
    </div>
  )
}

export function ExpenseChoiceCard({
  active,
  icon: Icon,
  title,
  subtitle,
  accent = 'teal',
  onClick,
  compact = false,
  layout = 'horizontal',
}: {
  active: boolean
  icon: LucideIcon
  title: string
  subtitle?: string
  accent?: Accent
  onClick: () => void
  compact?: boolean
  layout?: 'horizontal' | 'vertical'
}) {
  const tone = ACCENTS[accent]
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className="expense-choice-card"
      data-active={active}
      data-compact={compact}
      data-layout={layout}
    >
      {active ? (
        <span className="expense-choice-card__check" aria-hidden="true">
          <Check size={12} strokeWidth={3} />
        </span>
      ) : null}
      <span className="expense-choice-card__icon" style={{ backgroundColor: tone.background, color: tone.foreground }}>
        <Icon size={compact ? 20 : 23} strokeWidth={2.2} />
      </span>
      <span className="min-w-0">
        <span className="expense-choice-card__title">{title}</span>
        {subtitle ? <span className="expense-choice-card__subtitle">{subtitle}</span> : null}
      </span>
    </button>
  )
}

export function ExpenseMetric({
  label,
  value,
  color = '#008d8c',
}: {
  label: string
  value: ReactNode
  color?: string
}) {
  return (
    <div className="expense-metric">
      <span className="expense-metric__label">{label}</span>
      <span className="expense-metric__value" style={{ color }}>
        {value}
      </span>
    </div>
  )
}

export function MemberInitials({ name, accent = 'teal' }: { name?: string | null; accent?: Accent }) {
  const tone = ACCENTS[accent]
  const initials =
    name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'M'

  return (
    <span className="expense-member-avatar" style={{ backgroundColor: tone.background, color: tone.foreground }} aria-hidden="true">
      {initials}
    </span>
  )
}

export function ExpenseActionBar({ children }: { children: ReactNode }) {
  return <div className="expense-action-bar">{children}</div>
}

export function ExpensePrimaryAction({
  children,
  onClick,
  type = 'button',
  disabled,
}: {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className="expense-primary-action">
      {children}
    </button>
  )
}

export function ExpenseSecondaryAction({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="expense-secondary-action">
      {children}
    </button>
  )
}

export type SplitPreviewShare = {
  memberId: string
  memberName?: string | null
  shareAmount: number
  isPayer?: boolean
}

export function SplitPreviewContent({
  title,
  amount,
  paidFrom,
  usedBy,
  splitMethod,
  payerCredit,
  totalSharedCost,
  shares,
  formatMoney,
  busy,
  onBack,
  onSave,
}: {
  title: string
  amount: number
  paidFrom: string
  usedBy: string
  splitMethod: string
  payerCredit: number
  totalSharedCost: number
  shares: SplitPreviewShare[]
  formatMoney: (value?: number | null) => string
  busy?: boolean
  onBack: () => void
  onSave: () => void
}) {
  return (
    <>
      <ExpenseSurface>
        <div className="flex items-center gap-3">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#e6f7f6] text-[#008d8c]">
            <CircleDollarSign size={27} strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-body font-semibold text-[#1d3a42]">{title}</div>
            <div className="mt-1 text-headline font-semibold text-[#008d8c]">{formatMoney(amount)}</div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-[#edf1f4] pt-3">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e6f7f6] text-[#008d8c]"><WalletCards size={17} /></span>
            <span><span className="block text-caption font-medium text-[#65838b]">Paid From</span><span className="block text-label font-semibold text-[#1d3a42]">{paidFrom}</span></span>
          </div>
          <div className="flex items-center gap-2 border-l border-[#edf1f4] pl-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e6f7f6] text-[#008d8c]"><UserRound size={17} /></span>
            <span><span className="block text-caption font-medium text-[#65838b]">Used By</span><span className="block text-label font-semibold text-[#1d3a42]">{usedBy}</span></span>
          </div>
          <div className="col-span-2 flex items-center gap-2 border-t border-[#edf1f4] pt-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e6f7f6] text-[#008d8c]"><Scale size={17} /></span>
            <span><span className="block text-caption font-medium text-[#65838b]">Split Method</span><span className="block text-label font-semibold text-[#1d3a42]">{splitMethod}</span></span>
          </div>
        </div>
      </ExpenseSurface>

      <ExpenseSurface title="Member Allocation">
        <div className="-mx-3 overflow-hidden rounded-[15px] border border-[#edf1f4]">
          {shares.map((share, index) => (
            <div key={share.memberId} className="flex items-center gap-3 border-b border-[#edf1f4] bg-white px-3 py-3 last:border-b-0">
              <MemberInitials name={share.memberName ?? share.memberId} accent={index % 2 ? 'blue' : 'teal'} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-label font-semibold text-[#1d3a42]">{share.memberName ?? share.memberId}</span>
                {share.isPayer ? <span className="mt-0.5 inline-flex rounded-full bg-[#e6f7f6] px-2 py-0.5 text-caption font-semibold text-[#008d8c]">Paid by</span> : null}
              </span>
              <span className="text-right">
                <span className="block text-caption font-medium text-[#65838b]">Added cost</span>
                <span className="mt-0.5 block text-body font-semibold text-[#00777a]">{formatMoney(share.shareAmount)}</span>
              </span>
            </div>
          ))}
          {!shares.length ? <div className="expense-empty-state">No member shares were returned.</div> : null}
        </div>
      </ExpenseSurface>

      <ExpenseSurface title="Allocation Summary">
        <div className="grid grid-cols-2">
          <ExpenseMetric label="Payer Credit" value={formatMoney(payerCredit)} color="#15953a" />
          <ExpenseMetric label="Shared Cost" value={formatMoney(totalSharedCost)} color="#00777a" />
        </div>
      </ExpenseSurface>

      <ExpenseActionBar>
        <ExpenseSecondaryAction onClick={onBack}>Back to Edit</ExpenseSecondaryAction>
        <ExpensePrimaryAction onClick={onSave} disabled={busy}>{busy ? 'Saving...' : 'Confirm & Save'}</ExpensePrimaryAction>
      </ExpenseActionBar>
    </>
  )
}
