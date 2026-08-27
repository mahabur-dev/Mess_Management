"use client";

import { useState } from "react";
import { ChevronDown, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { LoadingIndicator } from "@/components/loading-indicator";
import { CompactLanguageToggle } from "@/components/mobile/compact-language-toggle";
import { ExpenseSurface } from "@/components/mobile/expense-ui";
import { FloatingActionLink } from "@/components/mobile/floating-action-link";
import { MealMonthSelector } from "@/components/mobile/meals-design";
import { MobileSelectSheet, type MobileSelectOption } from "@/components/mobile/select-sheet";
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
  const typeOptions: Array<MobileSelectOption<"ALL" | PersonalTransactionType>> = [
    { value: "ALL", label: copy.all },
    { value: "INCOME", label: copy.income },
    { value: "EXPENSE", label: copy.expense },
    { value: "SAVING", label: copy.saving },
  ];

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
        <section
          aria-label={`${copy.search} / ${copy.filterType}`}
          className="grid grid-cols-[minmax(0,1fr)_minmax(126px,0.55fr)] gap-2 rounded-[18px] border border-[#dce8e9] bg-white p-2 shadow-[0_10px_28px_rgba(18,55,72,0.07)]"
        >
          <label className="group relative min-w-0">
            <span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-[#789096] transition-colors group-focus-within:text-[#008d8c]">
              <Search size={17} strokeWidth={2.25} />
            </span>
            <input
              className="h-12 w-full min-w-0 rounded-[14px] border border-transparent bg-[#f6f9fa] pl-10 pr-9 text-label font-semibold text-[#123748] outline-none transition placeholder:font-medium placeholder:text-[#8a9ba1] focus:border-[#8fd2d0] focus:bg-white focus:ring-4 focus:ring-[#008d8c]/10"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={copy.search}
              type="text"
              inputMode="search"
              enterKeyHint="search"
            />
            {search ? (
              <button
                type="button"
                aria-label={`Clear ${copy.search}`}
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-1.5 grid w-8 place-items-center text-[#789096] transition hover:text-[#123748] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008d8c]/30"
              >
                <X size={15} strokeWidth={2.5} />
              </button>
            ) : null}
          </label>

          <MobileSelectSheet
            label={copy.filterType}
            value={type}
            options={typeOptions}
            onChange={setType}
            renderTrigger={({ open, selectedLabel, buttonProps }) => (
              <button
                {...buttonProps}
                className="flex h-12 min-w-0 items-center gap-2 rounded-[14px] border border-[#bfe7e6] bg-[#f8fdfd] px-2.5 text-left outline-none transition hover:border-[#8fd2d0] focus-visible:border-[#008d8c] focus-visible:ring-4 focus-visible:ring-[#008d8c]/10"
              >
                <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-[#e3f6f5] text-[#008d8c]">
                  <SlidersHorizontal size={15} strokeWidth={2.35} />
                  {type !== "ALL" ? (
                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#008d8c] ring-2 ring-white" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-caption font-semibold leading-none text-[#789096]">
                    {copy.filterType}
                  </span>
                  <span className="mt-1 block truncate text-label font-bold leading-none text-[#123748]">
                    {selectedLabel}
                  </span>
                </span>
                <ChevronDown
                  size={15}
                  strokeWidth={2.5}
                  className={`shrink-0 text-[#008d8c] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
              </button>
            )}
          />
        </section>
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
