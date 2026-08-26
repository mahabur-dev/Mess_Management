"use client";

import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { LoadingIndicator } from "@/components/loading-indicator";
import { ExpenseSurface } from "@/components/mobile/expense-ui";
import { MobileShell } from "@/components/mobile-shell";
import { TopScreen } from "@/components/top-screen";
import { Button } from "@/components/ui";
import { useQueryParams } from "@/lib/use-query-params";
import { personalApi } from "@/features/personal/api/personal.api";
import {
  currentPersonalMonth,
  personalCopy,
} from "@/features/personal/constants";
import {
  PersonalLanguageButton,
  PersonalNavigation,
} from "@/features/personal/components/personal-navigation";
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
  const params = useQueryParams();
  const { locale, toggleLocale } = usePersonalLocale();
  const copy = personalCopy(locale);
  const [month, setMonth] = useState(currentPersonalMonth());
  const [type, setType] = useState<"ALL" | PersonalTransactionType>("ALL");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [initialType, setInitialType] =
    useState<PersonalTransactionType>("EXPENSE");
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

  useEffect(() => {
    if (params.get("action") !== "add") return;
    const requested = params.get("type");
    setInitialType(
      requested === "INCOME" || requested === "SAVING" ? requested : "EXPENSE",
    );
    setEditing(null);
    setFormOpen(true);
  }, [params]);

  const save = async (input: PersonalTransactionInput) => {
    setBusy(true);
    setMessage("");
    try {
      if (editing) await personalApi.updateTransaction(editing.id, input);
      else await personalApi.createTransaction(input);
      setFormOpen(false);
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
    <MobileShell showBottomNavigation>
      <TopScreen
        title={copy.transactions}
        subtitle={copy.transactionHistory}
        backHref="/personal"
      />
      <div className="screen space-y-4">
        <div className="flex items-center gap-2">
          <input
            className="field min-w-0 flex-1"
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
          />
          <PersonalLanguageButton locale={locale} onToggle={toggleLocale} />
        </div>
        <PersonalNavigation locale={locale} active="transactions" />
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <label className="relative">
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
          <Button
            type="button"
            onClick={() => {
              setEditing(null);
              setInitialType("EXPENSE");
              setFormOpen(true);
            }}
          >
            <Plus size={17} />
            {copy.addTransaction}
          </Button>
        </div>
        <div className="expense-segmented">
          {(["ALL", "INCOME", "EXPENSE", "SAVING"] as const).map((item) => (
            <button
              key={item}
              type="button"
              className="expense-segmented__item"
              data-active={type === item}
              onClick={() => setType(item)}
            >
              {item === "ALL"
                ? copy.all
                : item === "INCOME"
                  ? copy.income
                  : item === "EXPENSE"
                    ? copy.expense
                    : copy.saving}
            </button>
          ))}
        </div>
        {message ? (
          <div className="ui-notice ui-notice--danger">{message}</div>
        ) : null}
        {formOpen ? (
          <ExpenseSurface
            title={editing ? copy.editTransaction : copy.addTransaction}
          >
            <PersonalTransactionForm
              locale={locale}
              familyMembers={familyMembers}
              initial={editing}
              initialType={initialType}
              busy={busy}
              onSubmit={save}
              onCancel={() => {
                setFormOpen(false);
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
                    setInitialType(transaction.type);
                    setFormOpen(true);
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
    </MobileShell>
  );
}
