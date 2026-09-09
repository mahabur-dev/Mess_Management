'use client'

import {
  Banknote,
  Calculator,
  Home,
  ReceiptText,
  Users,
  UtensilsCrossed,
  WalletCards,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { MonthlyReport } from '@/lib/api-client'
import { useLocaleFormatters, useTranslations } from '@/lib/i18n'
import { cn } from '@/lib/utils'

type MonthlyReportViewProps = {
  report: MonthlyReport
}

type SummaryMetricProps = {
  id: string
  icon: LucideIcon
  label: string
  value: string
}

function SummaryMetric({ icon: Icon, label, value }: SummaryMetricProps) {
  return (
    <article className="min-w-0 rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] p-3.5 sm:p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand)]">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-1.5 truncate text-lg font-semibold tabular-nums text-[var(--dashboard-ink)] sm:text-xl">
            {value}
          </p>
        </div>
      </div>
    </article>
  )
}

export function MonthlyReportView({ report }: MonthlyReportViewProps) {
  const t = useTranslations('monthlyReports')
  const format = useLocaleFormatters()
  const { summary, expenseSummary, members } = report.snapshot

  const metrics: SummaryMetricProps[] = [
    { id: 'members', icon: Users, label: t('summary.totalMembers'), value: format.number(summary.totalMembers) },
    { id: 'meals', icon: UtensilsCrossed, label: t('summary.totalMeals'), value: format.number(summary.totalMeals) },
    { id: 'expense', icon: ReceiptText, label: t('summary.totalExpense'), value: format.money(summary.totalExpense) },
    { id: 'deposit', icon: WalletCards, label: t('summary.totalDeposit'), value: format.money(summary.totalDeposit) },
    { id: 'meal-rate', icon: Calculator, label: t('summary.mealRate'), value: format.money(summary.mealRate) },
    { id: 'mess-cost', icon: Banknote, label: t('summary.totalMessCost'), value: format.money(summary.totalMessCost) },
  ]

  const expenseRows = [
    { id: 'food', label: t('expense.foodBazar'), value: expenseSummary.foodBazar, icon: UtensilsCrossed },
    { id: 'utility', label: t('expense.utility'), value: expenseSummary.utility, icon: Wrench },
    { id: 'rent', label: t('expense.rentHouse'), value: expenseSummary.rentHouse, icon: Home },
    { id: 'other', label: t('expense.other'), value: expenseSummary.otherExpenses, icon: ReceiptText },
  ]

  const balanceText = (member: (typeof members)[number]) => {
    if (member.due > 0) return t('member.dueValue', { amount: format.money(member.due) })
    if (member.credit > 0) return t('member.creditValue', { amount: format.money(member.credit) })
    return t('member.settled')
  }

  return (
    <div className="space-y-5">
      <section aria-labelledby="report-mess-summary">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="report-mess-summary" className="text-sm font-semibold text-[var(--dashboard-ink)]">
            {t('summary.title')}
          </h2>
          <span className="rounded-md border border-[var(--dashboard-line)] bg-[var(--dashboard-surface-subtle)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
            {t('version', { version: report.version })}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
          {metrics.map((metric) => (
            <SummaryMetric key={metric.id} {...metric} />
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)]" aria-labelledby="report-expense-summary">
        <div className="border-b border-[var(--dashboard-line)] px-4 py-3.5 sm:px-5">
          <h2 id="report-expense-summary" className="text-sm font-semibold text-[var(--dashboard-ink)]">
            {t('expense.title')}
          </h2>
        </div>
        <div className="grid sm:grid-cols-2">
          {expenseRows.map(({ id, label, value, icon: Icon }, index) => (
            <div
              key={id}
              className={cn(
                'flex items-center gap-3 border-[var(--dashboard-line)] px-4 py-3.5 sm:px-5',
                index < expenseRows.length - 1 && 'border-b',
                index % 2 === 0 && 'sm:border-r',
                index === 2 && 'sm:border-b-0',
              )}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--dashboard-surface-subtle)] text-[var(--brand)]">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1 text-xs font-semibold text-muted-foreground">{label}</span>
              <span className="text-sm font-semibold tabular-nums text-[var(--dashboard-ink)]">{format.money(value)}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-[var(--dashboard-line)] bg-[var(--dashboard-surface-subtle)] px-4 py-3.5 sm:px-5">
          <span className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">{t('expense.totalMessCost')}</span>
          <span className="text-base font-semibold tabular-nums text-[var(--brand)]">{format.money(expenseSummary.totalMessCost)}</span>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)]" aria-labelledby="report-member-summary">
        <div className="border-b border-[var(--dashboard-line)] px-4 py-3.5 sm:px-5">
          <h2 id="report-member-summary" className="text-sm font-semibold text-[var(--dashboard-ink)]">
            {t('member.title')}
          </h2>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            {report.can_manage ? t('member.managerDescription') : t('member.personalDescription')}
          </p>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-[var(--dashboard-line)] bg-[var(--dashboard-surface-subtle)]">
                {[
                  ['member', t('member.name')],
                  ['meals', t('member.meals')],
                  ['meal-cost', t('member.mealCost')],
                  ['other-cost', t('member.otherCost')],
                  ['deposit', t('member.deposit')],
                  ['balance', t('member.balance')],
                ].map(([id, label], index) => (
                  <th
                    key={id}
                    className={cn(
                      'px-4 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground',
                      index ? 'text-right' : 'text-left',
                    )}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--dashboard-line)]">
              {members.map((member) => (
                <tr key={member.memberId} className="transition-colors hover:bg-[var(--dashboard-surface-subtle)]">
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-semibold text-[var(--dashboard-ink)]">{member.name}</p>
                    <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{member.email}</p>
                  </td>
                  <td className="px-4 py-3.5 text-right text-sm font-semibold tabular-nums text-[var(--dashboard-ink)]">{format.number(member.totalMeals)}</td>
                  <td className="px-4 py-3.5 text-right text-sm font-semibold tabular-nums text-[var(--dashboard-ink)]">{format.money(member.mealCost)}</td>
                  <td className="px-4 py-3.5 text-right text-sm font-semibold tabular-nums text-[var(--dashboard-ink)]">{format.money(member.otherCost)}</td>
                  <td className="px-4 py-3.5 text-right text-sm font-semibold tabular-nums text-[var(--dashboard-ink)]">{format.money(member.deposit)}</td>
                  <td
                    className={cn(
                      'px-4 py-3.5 text-right text-sm font-semibold tabular-nums',
                      member.due > 0
                        ? 'text-destructive'
                        : member.credit > 0
                          ? 'text-[var(--brand)]'
                          : 'text-muted-foreground',
                    )}
                  >
                    {balanceText(member)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-[var(--dashboard-line)] md:hidden">
          {members.map((member) => (
            <article key={member.memberId} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-[var(--dashboard-ink)]">{member.name}</h3>
                  <p className="mt-0.5 truncate text-[11px] font-medium text-muted-foreground">{member.email}</p>
                </div>
                <span
                  className={cn(
                    'shrink-0 text-xs font-bold',
                    member.due > 0
                      ? 'text-destructive'
                      : member.credit > 0
                        ? 'text-[var(--brand)]'
                        : 'text-muted-foreground',
                  )}
                >
                  {balanceText(member)}
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-[var(--dashboard-surface-subtle)] p-3">
                {[
                  { id: 'meals', label: t('member.meals'), value: format.number(member.totalMeals) },
                  { id: 'meal-cost', label: t('member.mealCost'), value: format.money(member.mealCost) },
                  { id: 'other-cost', label: t('member.otherCost'), value: format.money(member.otherCost) },
                  { id: 'deposit', label: t('member.deposit'), value: format.money(member.deposit) },
                ].map(({ id, label, value }) => (
                  <div key={id}>
                    <dt className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground">{label}</dt>
                    <dd className="mt-0.5 text-xs font-semibold tabular-nums text-[var(--dashboard-ink)]">{value}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
