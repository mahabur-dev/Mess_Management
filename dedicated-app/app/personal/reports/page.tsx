"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  WalletCards,
} from "lucide-react";
import { LoadingIndicator } from "@/components/loading-indicator";
import {
  ExpenseBreakdownList,
  ExpenseSurface,
} from "@/components/mobile/expense-ui";
import { MealMonthSelector } from "@/components/mobile/meals-design";
import { MobileShell } from "@/components/mobile-shell";
import { TopScreen } from "@/components/top-screen";
import { personalApi } from "@/features/personal/api/personal.api";
import {
  categoryLabel,
  currentPersonalMonth,
  formatPersonalMoney,
  personalCopy,
} from "@/features/personal/constants";
import { PersonalNavigation } from "@/features/personal/components/personal-navigation";
import { SummaryCard } from "@/features/personal/components/summary-card";
import { usePersonalLocale } from "@/features/personal/hooks/use-personal-locale";
import type { PersonalReport } from "@/features/personal/types";

export default function PersonalReportsPage() {
  const { locale } = usePersonalLocale();
  const copy = personalCopy(locale);
  const [month, setMonth] = useState(currentPersonalMonth());
  const [report, setReport] = useState<PersonalReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    personalApi
      .reports(month)
      .then((response) => {
        if (active) setReport(response.data as PersonalReport);
      })
      .catch(() => {
        if (active) setError(copy.loadFailed);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [copy.loadFailed, month]);
  return (
    <MobileShell showBottomNavigation>
      <TopScreen
        title={copy.reports}
        subtitle={copy.monthlySummary}
        backHref="/personal"
      />
      <div className="screen space-y-4">
        <MealMonthSelector month={month} onChange={setMonth} menuGap={18} />
        <PersonalNavigation locale={locale} active="reports" />
        {loading ? (
          <LoadingIndicator variant="card" label={copy.reports} />
        ) : null}
        {error ? (
          <div className="ui-notice ui-notice--danger">{error}</div>
        ) : null}
        {!loading && report ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <SummaryCard
                icon={ArrowDownLeft}
                label={copy.monthlyIncome}
                value={formatPersonalMoney(report.income, locale)}
                accent="green"
              />
              <SummaryCard
                icon={ArrowUpRight}
                label={copy.monthlyExpense}
                value={formatPersonalMoney(report.expense, locale)}
                accent="orange"
              />
              <SummaryCard
                icon={PiggyBank}
                label={copy.monthlySaving}
                value={formatPersonalMoney(report.saving, locale)}
                accent="teal"
              />
              <SummaryCard
                icon={WalletCards}
                label={copy.remainingBalance}
                value={formatPersonalMoney(report.remainingBalance, locale)}
                accent="violet"
              />
            </div>
            <ExpenseSurface title={copy.categoryBreakdown}>
              {report.expenseCategoryBreakdown.length ? (
                <ExpenseBreakdownList
                  items={report.expenseCategoryBreakdown.map((item) => ({
                    icon: ArrowUpRight,
                    label: categoryLabel(item.category, locale),
                    value: formatPersonalMoney(item.amount, locale),
                    accent: "orange" as const,
                  }))}
                />
              ) : (
                <div className="expense-empty-state">{copy.noExpenses}</div>
              )}
            </ExpenseSurface>
          </>
        ) : null}
      </div>
    </MobileShell>
  );
}
