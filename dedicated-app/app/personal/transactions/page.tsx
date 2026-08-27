"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { LoadingIndicator } from "@/components/loading-indicator";
import { CompactLanguageToggle } from "@/components/mobile/compact-language-toggle";
import { ExpenseSurface } from "@/components/mobile/expense-ui";
import { SelectField } from "@/components/mobile/form-controls";
import { FloatingActionLink } from "@/components/mobile/floating-action-link";
import { MealMonthSelector } from "@/components/mobile/meals-design";
import { MobileShell } from "@/components/mobile-shell";
import { TopScreen } from "@/components/top-screen";
import { personalApi } from "@/features/personal/api/personal.api";
import {
  currentPersonalMonth,
  personalCopy,
} from "@/features/personal/constants";
import { PersonalNavigation } from "@/features/personal/components/personal-navigation";
import { PersonalTransactionForm } from "@/features/personal/components/transaction-form";
import { TransactionCard } from "@/features/personal/components/transaction-card";
import { useFamilyMembers } from "@/features/personal/hooks/use-family-members";
import { usePersonalLocale } from "@/features/personal/hooks/use-personal-locale";
import { useTransactions } from "@/features/personal/hooks/use-transactions";
import type {
  PersonalTransaction,
  PersonalTransactionInput,
  PersonalTransactionType,
} from "@/features/personal/types";

export default function PersonalTransactionsPage() {
  const { locale, toggleLocale } = usePersonalLocale();
  const copy = personalCopy(locale);
  const [month, setMonth] = useState(currentPersonalMonth());
  const [type, setType] = useState<"ALL" | PersonalTransactionType>("ALL");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<PersonalTransaction | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const { transactions, loading, error, refresh } = useTransactions(
    {
      month,
      type: type === "ALL" ? undefined : type,
      search: search || undefined,
      limit: 100,
    },
    copy.loadFailed,
  );
  const { familyMembers } = useFamilyMembers(month, copy.loadFailed);

  const save = async (input: PersonalTransactionInput) => {
    if (!editing) return;
    setBusy(true);
    setMessage("");
    try {
      await personalApi.updateTransaction(editing.id, input);
      setEditing(null);
      await refresh();
    } catch {
      setMessage(copy.saveFailed);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (transaction: PersonalTransaction) => {
    if (!window.confirm(copy.confirmDeleteTransaction)) return;
    try {
      await personalApi.deleteTransaction(transaction.id);
      await refresh();
    } catch {
      setMessage(copy.deleteFailed);
    }
  };

  return (
    <MobileShell showBottomNavigation hasFloatingAction>
      <TopScreen
        title={copy.transactions}
        subtitle={copy.transactionHistory}
        backHref="/personal"
        trailing={<CompactLanguageToggle locale={locale} onToggle={toggleLocale} />}
      />
      <div className="screen space-y-4">
        <MealMonthSelector month={month} onChange={setMonth} />
        <PersonalNavigation locale={locale} active="transactions" />
        <label className="relative block">
          <Search
            className="absolute left-3 top-3.5 text-[#65838b]"
            size={17}
          />
          <input
            className="field pl-10"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={copy.search}
          />
        </label>
        <SelectField
          label={copy.filterType}
          value={type}
          onChange={setType}
          options={["ALL", "INCOME", "EXPENSE", "SAVING"] as const}
          getLabel={(value) => value === "ALL" ? copy.all : value === "INCOME" ? copy.income : value === "EXPENSE" ? copy.expense : copy.saving}
        />
        {message ? (
          <div className="ui-notice ui-notice--danger">{message}</div>
        ) : null}
        {editing ? (
          <ExpenseSurface
            title={copy.editTransaction}
          >
            <PersonalTransactionForm
              locale={locale}
              familyMembers={familyMembers}
              initial={editing}
              busy={busy}
              onSubmit={save}
              onCancel={() => {
                setEditing(null);
              }}
            />
          </ExpenseSurface>
        ) : null}
        {loading ? (
          <LoadingIndicator variant="card" label={copy.transactions} />
        ) : null}
        {error ? (
          <div className="ui-notice ui-notice--danger">{error}</div>
        ) : null}
        {!loading ? (
          <ExpenseSurface>
            <div className="overflow-hidden rounded-[15px] border border-[#edf1f4]">
              {transactions.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  locale={locale}
                  onEdit={() => {
                    setEditing(transaction);
                  }}
                  onDelete={() => remove(transaction)}
                />
              ))}
              {!transactions.length ? (
                <div className="expense-empty-state">{copy.noTransactions}</div>
              ) : null}
            </div>
          </ExpenseSurface>
        ) : null}
      </div>
      <FloatingActionLink
        href="/personal/transactions/add"
        label={copy.addTransaction}
        icon={<Plus size={24} strokeWidth={2.4} />}
      />
    </MobileShell>
  );
}
