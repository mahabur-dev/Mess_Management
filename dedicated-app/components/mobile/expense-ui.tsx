'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { Check, ChevronRight, CircleDollarSign, Scale, SlidersHorizontal, UserRound, Users, WalletCards } from 'lucide-react'
import type { ReactNode } from 'react'
import type { ExpenseSplitMethod, ExpenseUsedBy } from '@/lib/form-options'
import { DeferredFormSection } from '@/components/mobile/deferred-form-section'
import { DesignedSelect } from '@/components/mobile/expense-design'

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
    <section className={`ui-card app-section ${className}`}>
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

export function ExpenseSecondaryAction({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="expense-secondary-action">
      {children}
    </button>
  )
}

export function ExpenseUsedBySelector({
  value,
  onChange,
  allowMealMembers = true,
}: {
  value: ExpenseUsedBy
  onChange: (value: ExpenseUsedBy) => void
  allowMealMembers?: boolean
}) {
  const options: Array<{ value: ExpenseUsedBy; label: string }> = [
    { value: 'ALL_MEMBERS', label: 'All Members' },
    { value: 'SELECTED_MEMBERS', label: 'Specific Members' },
    ...(allowMealMembers
      ? [{ value: 'MEAL_ON_MEMBERS' as const, label: 'Meal Members' }]
      : []),
    { value: 'SELF_ONLY', label: 'Only Me' },
  ]

  return (
    <DesignedSelect
      label="Shared With"
      icon={Users}
      value={value}
      onChange={(event) => onChange(event.target.value as ExpenseUsedBy)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </DesignedSelect>
  )
}

export function ExpenseSplitMethodSelector({
  value,
  onChange,
  allowCustom = true,
  allowMealCount = true,
}: {
  value: ExpenseSplitMethod
  onChange: (value: ExpenseSplitMethod) => void
  allowCustom?: boolean
  allowMealCount?: boolean
}) {
  const options: Array<{ value: ExpenseSplitMethod; label: string }> = [
    { value: 'EQUAL', label: 'Equal' },
    ...(allowMealCount
      ? [{ value: 'MEAL_COUNT' as const, label: 'By Meal Count' }]
      : []),
    ...(allowCustom ? [{ value: 'CUSTOM' as const, label: 'Manual Split' }] : []),
  ]

  return (
    <DesignedSelect
      label="Split Method"
      icon={Scale}
      value={value}
      onChange={(event) => onChange(event.target.value as ExpenseSplitMethod)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </DesignedSelect>
  )
}

export function ExpenseAdvancedOptions({
  open,
  usedBy,
  splitMethod,
  allowMealMembers = true,
  allowMealCount = true,
  allowCustom = true,
  children,
  onOpen,
  onClose,
  onUsedByChange,
  onSplitMethodChange,
}: {
  open: boolean
  usedBy: ExpenseUsedBy
  splitMethod: ExpenseSplitMethod
  allowMealMembers?: boolean
  allowMealCount?: boolean
  allowCustom?: boolean
  children?: ReactNode
  onOpen: () => void
  onClose: () => void
  onUsedByChange: (value: ExpenseUsedBy) => void
  onSplitMethodChange: (value: ExpenseSplitMethod) => void
}) {
  const usedByLabels: Record<ExpenseUsedBy, string> = {
    ALL_MEMBERS: 'All Members',
    SELECTED_MEMBERS: 'Specific Members',
    MEAL_ON_MEMBERS: 'Meal Members',
    SELF_ONLY: 'Only Me',
  }
  const splitLabels: Record<ExpenseSplitMethod, string> = {
    EQUAL: 'Equal',
    MEAL_COUNT: 'By Meal Count',
    CUSTOM: 'Manual Split',
  }
  const summary = `${usedByLabels[usedBy]} · ${splitLabels[splitMethod]}`

  return (
    <DeferredFormSection
      open={open}
      title="Advanced Features"
      description={summary}
      actionLabel="Advanced Features (Optional)"
      icon={<SlidersHorizontal size={19} strokeWidth={2.3} />}
      onOpen={onOpen}
      onClose={onClose}
    >
      <ExpenseUsedBySelector
        value={usedBy}
        onChange={onUsedByChange}
        allowMealMembers={allowMealMembers}
      />

      {usedBy !== 'SELF_ONLY' ? (
        <ExpenseSplitMethodSelector
          value={splitMethod}
          onChange={onSplitMethodChange}
          allowCustom={allowCustom}
          allowMealCount={allowMealCount}
        />
      ) : null}

      {children}
    </DeferredFormSection>
  )
}

export type MemberAllocationShare = {
  memberId: string
  memberName?: string | null
  shareAmount: number
  isPayer?: boolean
}

export function MemberAllocationList({
  shares,
  formatMoney,
  amountLabel = 'Allocated amount',
  emptyMessage = 'No member allocations were returned.',
}: {
  shares: MemberAllocationShare[]
  formatMoney: (value?: number | null) => string
  amountLabel?: string
  emptyMessage?: string
}) {
  return (
    <div className="overflow-hidden rounded-[15px] border border-[#e4eaec] bg-white">
      {shares.map((share, index) => {
        const memberName = share.memberName?.trim() || share.memberId

        return (
          <div
            key={share.memberId}
            className="flex min-h-[68px] items-center gap-3 border-b border-[#e4eaec] px-3 py-3 last:border-b-0"
          >
            <MemberInitials name={memberName} accent={index % 2 ? 'blue' : 'teal'} />
            <span className="min-w-0 flex-1">
              <span className="block text-label font-bold leading-snug text-[#123748] [overflow-wrap:anywhere]">
                {memberName}
              </span>
              {share.isPayer ? (
                <span className="mt-1 inline-flex rounded-full bg-[#dff4f3] px-2 py-0.5 text-caption font-semibold text-[#00777a]">
                  Payer
                </span>
              ) : (
                <span className="mt-1 block text-caption font-medium text-[#65838b]">Member share</span>
              )}
            </span>
            <span className="min-w-[96px] shrink-0 text-right">
              <span className="block text-caption font-medium text-[#65838b]">{amountLabel}</span>
              <span className="ui-mono-number mt-1 block text-body font-bold text-[#00777a]">
                {formatMoney(share.shareAmount)}
              </span>
            </span>
          </div>
        )
      })}
      {!shares.length ? <div className="expense-empty-state">{emptyMessage}</div> : null}
    </div>
  )
}

export type SplitPreviewShare = MemberAllocationShare

export function SplitPreviewContent({
  title,
  amount,
  paidFrom,
  usedBy,
  splitMethod,
  payerCredit,
  totalSharedCost,
  items,
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
  items?: Array<{ itemName: string; quantity?: number | null; unit?: string | null; amount: number }>
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
            <span><span className="block text-caption font-medium text-[#65838b]">Payment Source</span><span className="block text-label font-semibold text-[#1d3a42]">{paidFrom}</span></span>
          </div>
          <div className="flex items-center gap-2 border-l border-[#edf1f4] pl-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e6f7f6] text-[#008d8c]"><UserRound size={17} /></span>
            <span><span className="block text-caption font-medium text-[#65838b]">Shared With</span><span className="block text-label font-semibold text-[#1d3a42]">{usedBy}</span></span>
          </div>
          <div className="col-span-2 flex items-center gap-2 border-t border-[#edf1f4] pt-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e6f7f6] text-[#008d8c]"><Scale size={17} /></span>
            <span><span className="block text-caption font-medium text-[#65838b]">Split Rule</span><span className="block text-label font-semibold text-[#1d3a42]">{splitMethod}</span></span>
          </div>
        </div>
      </ExpenseSurface>

      {items?.length ? (
        <ExpenseSurface
          title="Purchased Items"
          aside={<span className="ui-badge ui-badge--info">{items.length} {items.length === 1 ? 'item' : 'items'}</span>}
        >
          <div className="overflow-hidden rounded-[14px] border border-[#e4eaec] bg-white">
            {items.map((item, index) => (
              <div key={`${item.itemName}-${index}`} className="flex items-center justify-between gap-3 border-b border-[#edf1f4] px-3 py-3 last:border-b-0">
                <div className="min-w-0">
                  <div className="truncate text-label font-bold text-[#123748]">{item.itemName}</div>
                  {item.quantity != null ? <div className="mt-0.5 text-caption font-semibold text-[#65838b]">{item.quantity} {item.unit ?? ''}</div> : null}
                </div>
                <span className="shrink-0 text-label font-bold text-[#00777a]">{formatMoney(item.amount)}</span>
              </div>
            ))}
          </div>
        </ExpenseSurface>
      ) : null}

      <ExpenseSurface
        title="Member Allocation"
        aside={<span className="ui-badge ui-badge--info">{shares.length} {shares.length === 1 ? 'member' : 'members'}</span>}
      >
        <MemberAllocationList
          shares={shares}
          formatMoney={formatMoney}
          amountLabel="Added cost"
          emptyMessage="No member shares were returned."
        />
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
