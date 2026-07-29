'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { Check, ChevronRight, CircleDollarSign, Eye, Scale, ShieldCheck, UserRound, UsersRound, WalletCards } from 'lucide-react'
import type { ReactNode } from 'react'

type Accent = 'teal' | 'blue' | 'violet' | 'green' | 'orange'

const ACCENTS: Record<Accent, { foreground: string; background: string }> = {
  teal: { foreground: '#008d8c', background: '#e6f7f6' },
  blue: { foreground: '#1473e6', background: '#eaf3ff' },
  violet: { foreground: '#7c3aed', background: '#f2ebff' },
  green: { foreground: '#15953a', background: '#eaf7ec' },
  orange: { foreground: '#f07818', background: '#fff2e6' },
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
    <section className={`expense-surface ${className}`}>
      {title || aside ? (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title ? <h2 className="expense-section-title">{title}</h2> : <span />}
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
        <Icon size={25} strokeWidth={2.25} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="expense-summary-card__label">{label}</span>
        <span className="expense-summary-card__value" style={{ color: tone.foreground }}>
          {value}
        </span>
        {caption ? <span className="expense-summary-card__caption">{caption}</span> : null}
      </span>
      {href ? <ChevronRight size={20} className="shrink-0 text-[#123748]" strokeWidth={2.4} /> : null}
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
  const sharedPerMember = shares.length ? totalSharedCost / shares.length : 0

  return (
    <>
      <ExpenseSurface>
        <div className="flex items-center gap-3">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#e6f7f6] text-[#008d8c]">
            <CircleDollarSign size={27} strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-body font-extrabold text-[#123748]">{title}</div>
            <div className="mt-1 text-headline font-black text-[#008d8c]">{formatMoney(amount)}</div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-[#edf1f4] pt-3">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e6f7f6] text-[#008d8c]"><WalletCards size={17} /></span>
            <span><span className="block text-caption font-semibold text-[#65838b]">Paid From</span><span className="block text-label font-bold text-[#123748]">{paidFrom}</span></span>
          </div>
          <div className="flex items-center gap-2 border-l border-[#edf1f4] pl-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e6f7f6] text-[#008d8c]"><UserRound size={17} /></span>
            <span><span className="block text-caption font-semibold text-[#65838b]">Used By</span><span className="block text-label font-bold text-[#123748]">{usedBy}</span></span>
          </div>
          <div className="col-span-2 flex items-center gap-2 border-t border-[#edf1f4] pt-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e6f7f6] text-[#008d8c]"><Scale size={17} /></span>
            <span><span className="block text-caption font-semibold text-[#65838b]">Split Method</span><span className="block text-label font-bold text-[#123748]">{splitMethod}</span></span>
          </div>
        </div>
      </ExpenseSurface>

      <div className="rounded-[18px] border border-[#cfeeed] bg-[#f3fbfb]/90 p-4">
        <h2 className="flex items-center gap-2 text-body font-extrabold text-[#123748]"><Eye size={18} className="text-[#008d8c]" /> How this will work</h2>
        <div className="mt-3 space-y-0 text-label text-[#123748]">
          <div className="flex items-center gap-3 border-b border-dashed border-[#bfe7e6] py-2.5">
            <WalletCards size={18} className="shrink-0 text-[#008d8c]" />
            <span>Payer gets deposit credit: <strong className="text-[#008d8c]">{formatMoney(payerCredit)}</strong></span>
          </div>
          <div className="flex items-center gap-3 border-b border-dashed border-[#bfe7e6] py-2.5">
            <UsersRound size={18} className="shrink-0 text-[#008d8c]" />
            <span>Average member share: <strong className="text-[#008d8c]">{formatMoney(sharedPerMember)}</strong></span>
          </div>
          <div className="flex items-center gap-3 pt-2.5">
            <ShieldCheck size={18} className="shrink-0 text-[#008d8c]" />
            <span>This expense affects only the selected members.</span>
          </div>
        </div>
      </div>

      <ExpenseSurface title="Member-wise Preview">
        <div className="-mx-3 overflow-hidden rounded-[15px] border border-[#edf1f4]">
          {shares.map((share, index) => (
            <div key={share.memberId} className="flex items-center gap-3 border-b border-[#edf1f4] bg-white px-3 py-3 last:border-b-0">
              <MemberInitials name={share.memberName ?? share.memberId} accent={index % 2 ? 'blue' : 'teal'} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-label font-bold text-[#123748]">{share.memberName ?? share.memberId}</span>
                {share.isPayer ? <span className="mt-0.5 inline-flex rounded-full bg-[#e6f7f6] px-2 py-0.5 text-caption font-bold text-[#008d8c]">Paid by</span> : null}
              </span>
              <span className="text-right">
                <span className="block text-caption font-semibold text-[#65838b]">Added cost</span>
                <span className="mt-0.5 block text-body font-black text-[#1473e6]">{formatMoney(share.shareAmount)}</span>
              </span>
            </div>
          ))}
          {!shares.length ? <div className="expense-empty-state">No member shares were returned.</div> : null}
        </div>
      </ExpenseSurface>

      <ExpenseSurface title="Final Impact">
        <div className="grid grid-cols-3">
          <ExpenseMetric label="Payer Credit" value={formatMoney(payerCredit)} color="#15953a" />
          <ExpenseMetric label="Shared Cost" value={formatMoney(totalSharedCost)} color="#1473e6" />
          <ExpenseMetric label="Net Benefit" value={formatMoney(Math.max(0, payerCredit))} color="#15953a" />
        </div>
      </ExpenseSurface>

      <ExpenseActionBar>
        <ExpenseSecondaryAction onClick={onBack}>Back to Edit</ExpenseSecondaryAction>
        <ExpensePrimaryAction onClick={onSave} disabled={busy}>{busy ? 'Saving...' : 'Confirm & Save'}</ExpensePrimaryAction>
      </ExpenseActionBar>
    </>
  )
}
