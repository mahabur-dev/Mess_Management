"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { LoadingIndicator } from "@/components/loading-indicator";
import { CompactLanguageToggle } from "@/components/mobile/compact-language-toggle";
import { ExpenseSurface } from "@/components/mobile/expense-ui";
import { MealMonthSelector } from "@/components/mobile/meals-design";
import { MobileShell } from "@/components/mobile-shell";
import { TopScreen } from "@/components/top-screen";
import { Button } from "@/components/ui";
import { personalApi } from "@/features/personal/api/personal.api";
import {
  categoryLabel,
  currentPersonalMonth,
  PERSONAL_CATEGORIES,
  personalCopy,
} from "@/features/personal/constants";
import { BudgetCard } from "@/features/personal/components/budget-card";
import { PersonalNavigation } from "@/features/personal/components/personal-navigation";
import { useBudget } from "@/features/personal/hooks/use-budget";
import { usePersonalLocale } from "@/features/personal/hooks/use-personal-locale";
import { validatePersonalBudget } from "@/features/personal/schemas/personal.schema";
import type { PersonalBudget } from "@/features/personal/types";

export default function PersonalBudgetPage() {
  const { locale, toggleLocale } = usePersonalLocale();
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
      await refresh();
    } catch {
      setMessage(copy.saveFailed);
    } finally {
      setBusy(false);
    }
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
        trailing={<CompactLanguageToggle locale={locale} onToggle={toggleLocale} />}
      />
      <div className="screen space-y-4">
        <MealMonthSelector month={month} onChange={setMonth} />
        <PersonalNavigation locale={locale} active="budget" />
        <Button className="w-full" onClick={() => openForm()}>
          <Plus size={17} />
          {copy.addBudget}
        </Button>
        {formOpen ? (
          <ExpenseSurface title={editing ? copy.editBudget : copy.addBudget}>
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-label font-bold text-[#123748]">
                  {copy.category}
                </span>
                <select
                  className="field"
                  disabled={Boolean(editing)}
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  {PERSONAL_CATEGORIES.EXPENSE.map((item) => (
                    <option key={item} value={item}>
                      {categoryLabel(item, locale)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-label font-bold text-[#123748]">
                  {copy.limitAmount}
                </span>
                <input
                  className="field ui-mono-number"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />
              </label>
              {message ? (
                <div className="ui-notice ui-notice--danger">{message}</div>
              ) : null}
              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" onClick={() => setFormOpen(false)}>
                  {copy.cancel}
                </Button>
                <Button busy={busy} onClick={save}>
                  {copy.save}
                </Button>
              </div>
            </div>
          </ExpenseSurface>
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
    </MobileShell>
  );
}
