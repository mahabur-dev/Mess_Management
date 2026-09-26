"use client";

import { useState } from "react";
import { LoadingIndicator } from "@/components/loading-indicator";
import { MealMonthSelector } from "@/components/mobile/meals-design";
import { MobileShell } from "@/components/mobile-shell";
import { TopScreen } from "@/components/top-screen";
import { AddActionButton } from "@/components/ui";
import { personalApi } from "@/features/personal/api/personal.api";
import {
  currentPersonalMonth,
  personalCopy,
} from "@/features/personal/constants";
import { BudgetCard } from "@/features/personal/components/budget-card";
import { BudgetFormModal } from "@/features/personal/components/budget-form-modal";
import { PersonalNavigation } from "@/features/personal/components/personal-navigation";
import { useBudget } from "@/features/personal/hooks/use-budget";
import { usePersonalLocale } from "@/features/personal/hooks/use-personal-locale";
import { validatePersonalBudget } from "@/features/personal/schemas/personal.schema";
import type { PersonalBudget } from "@/features/personal/types";

export default function PersonalBudgetPage() {
  const { locale } = usePersonalLocale();
  const copy = personalCopy(locale);
  const [month, setMonth] = useState(currentPersonalMonth());
  const { budgets, loading, error, refresh } = useBudget(
    month,
    copy.loadFailed,
  );
  const [editing, setEditing] = useState<PersonalBudget | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [category, setCategory] = useState("FOOD");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const openForm = (budget?: PersonalBudget) => {
    setEditing(budget ?? null);
    setCategory(budget?.category ?? "FOOD");
    setAmount(budget ? String(budget.limit_amount) : "");
    setMessage("");
    setFormOpen(true);
  };
  const save = async () => {
    const value = Number(amount);
    if (!validatePersonalBudget(category, value)) {
      setMessage(copy.invalidAmount);
      return;
    }
    setBusy(true);
    try {
      if (editing) await personalApi.updateBudget(editing.id, value);
      else
        await personalApi.createBudget({ month, category, limitAmount: value });
      setFormOpen(false);
      setEditing(null);
      await refresh();
    } catch {
      setMessage(copy.saveFailed);
    } finally {
      setBusy(false);
    }
  };
  const closeForm = () => {
    if (busy) return;
    setFormOpen(false);
    setEditing(null);
    setMessage("");
  };
  const remove = async (budget: PersonalBudget) => {
    if (!window.confirm(copy.confirmDeleteBudget)) return;
    try {
      await personalApi.deleteBudget(budget.id);
      await refresh();
    } catch {
      setMessage(copy.deleteFailed);
    }
  };
  return (
    <MobileShell showBottomNavigation>
      <TopScreen
        title={copy.budget}
        subtitle={copy.budgetSubtitle}
        backHref="/personal"
      />
      <div className="screen space-y-4">
        <MealMonthSelector month={month} onChange={setMonth} menuGap={18} />
        <PersonalNavigation locale={locale} active="budget" />
        <AddActionButton onClick={() => openForm()}>
          {copy.addBudget}
        </AddActionButton>
        {!formOpen && message ? (
          <div className="ui-notice ui-notice--danger">{message}</div>
        ) : null}
        {loading ? (
          <LoadingIndicator variant="card" label={copy.monthlyBudget} />
        ) : null}
        {error ? (
          <div className="ui-notice ui-notice--danger">{error}</div>
        ) : null}
        <div className="space-y-3">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              locale={locale}
              onEdit={() => openForm(budget)}
              onDelete={() => remove(budget)}
            />
          ))}
          {!loading && !budgets.length ? (
            <div className="expense-empty-state ui-card">{copy.noBudgets}</div>
          ) : null}
        </div>
      </div>
      <BudgetFormModal
        open={formOpen}
        editing={Boolean(editing)}
        locale={locale}
        category={category}
        amount={amount}
        busy={busy}
        message={message}
        onCategoryChange={setCategory}
        onAmountChange={setAmount}
        onClose={closeForm}
        onSubmit={() => void save()}
      />
    </MobileShell>
  );
}
