"use client";

import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  ReceiptText,
  WalletCards,
} from "lucide-react";
import { LoadingIndicator } from "@/components/loading-indicator";
import { ExpenseSurface } from "@/components/mobile/expense-ui";
import { appHref } from "@/lib/routes";
import { useEffect, useState } from "react";
import { personalApi } from "../api/personal.api";
import { formatPersonalMoney, personalCopy } from "../constants";
import type {
  PersonalLocale,
  PersonalSummary,
} from "../types";
import { SummaryCard } from "./summary-card";
import { TransactionRow } from "./transaction-card";

export function PersonalDashboard({
  locale,
  month,
}: {
  locale: PersonalLocale;
  month: string;
}) {
  const copy = personalCopy(locale);
  const [summary, setSummary] = useState<PersonalSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    personalApi
      .summary(month)
      .then((response) => {
        if (active) setSummary(response.data as PersonalSummary);
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

  if (loading) return <LoadingIndicator variant="card" label={copy.overview} />;
  return (
    <div className="space-y-4">
      {error ? (
        <div className="ui-notice ui-notice--danger">{error}</div>
      ) : null}
      <section>
        <div className="grid grid-cols-2 gap-3">
          <SummaryCard
            icon={ArrowDownLeft}
            label={copy.monthlyIncome}
            value={formatPersonalMoney(summary?.income, locale)}
            accent="green"
          />
          <SummaryCard
            icon={ArrowUpRight}
            label={copy.monthlyExpense}
            value={formatPersonalMoney(summary?.expense, locale)}
            accent="orange"
          />
          <SummaryCard
            icon={PiggyBank}
            label={copy.monthlySaving}
            value={formatPersonalMoney(summary?.saving, locale)}
            accent="teal"
          />
          <SummaryCard
            icon={WalletCards}
            label={copy.remainingBalance}
            value={formatPersonalMoney(summary?.remainingBalance, locale)}
            accent="violet"
          />
        </div>
        {Number(summary?.remainingBalance ?? 0) < 0 ? (
          <div className="ui-notice ui-notice--warning mt-3">
            {copy.negativeBalance}
          </div>
        ) : null}
      </section>

      <ExpenseSurface
        title={copy.recentTransactions}
        aside={
          <Link
            className="text-label font-bold text-[#008d8c]"
            href={appHref("/personal/transactions")}
          >
            {copy.viewAll}
          </Link>
        }
      >
        <div role="list" className="space-y-2">
          {summary?.recentTransactions?.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              locale={locale}
            />
          ))}
          {!summary?.recentTransactions?.length ? (
            <div className="expense-empty-state">
              <ReceiptText className="mx-auto mb-2" />
              {copy.noTransactions}
            </div>
          ) : null}
        </div>
      </ExpenseSurface>
    </div>
  );
}
