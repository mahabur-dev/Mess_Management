"use client";

import { Tag, WalletCards } from "lucide-react";
import { DesignedSelect } from "@/components/mobile/expense-design";
import { Button } from "@/components/ui";
import {
  categoryLabel,
  PERSONAL_CATEGORIES,
  personalCopy,
} from "../constants";
import type { PersonalLocale } from "../types";
import { PersonalFormModal } from "./personal-form-modal";

export function BudgetFormModal({
  open,
  editing,
  locale,
  category,
  amount,
  busy,
  message,
  onCategoryChange,
  onAmountChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editing: boolean;
  locale: PersonalLocale;
  category: string;
  amount: string;
  busy: boolean;
  message: string;
  onCategoryChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const copy = personalCopy(locale);
  const title = editing ? copy.editBudget : copy.addBudget;

  return (
    <PersonalFormModal
      id="budget-form"
      open={open}
      busy={busy}
      icon={WalletCards}
      eyebrow={copy.budgetEditor}
      title={title}
      description={editing ? copy.editBudgetDescription : copy.addBudgetDescription}
      closeLabel={copy.cancel}
      onClose={onClose}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!busy) onSubmit();
        }}
      >
        <div className="space-y-4 px-5 py-5">
          <DesignedSelect
            label={copy.category}
            icon={Tag}
            disabled={editing || busy}
            value={category}
            onChange={(event) => onCategoryChange(event.target.value)}
          >
            {PERSONAL_CATEGORIES.EXPENSE.map((item) => (
              <option key={item} value={item}>
                {categoryLabel(item, locale)}
              </option>
            ))}
          </DesignedSelect>

          {editing ? (
            <p className="-mt-2 text-caption font-medium text-[#65838b]">
              {copy.categoryLocked}
            </p>
          ) : null}

          <label className="block">
            <span className="mb-2 block text-label font-bold text-[#123748]">
              {copy.limitAmount}
            </span>
            <input
              className="field ui-mono-number min-h-[52px]"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => onAmountChange(event.target.value)}
              disabled={busy}
              placeholder="0.00"
              required
            />
          </label>

          {message ? (
            <div className="ui-notice ui-notice--danger" role="alert">
              {message}
            </div>
          ) : null}
        </div>

        <footer className="grid grid-cols-2 gap-3 border-t border-[#e9eff1] bg-[#fbfcfc] px-5 py-4">
          <Button type="button" variant="secondary" className="w-full" onClick={onClose} disabled={busy}>
            {copy.cancel}
          </Button>
          <Button type="submit" className="w-full" busy={busy} busyLabel={copy.savingChanges}>
            {copy.save}
          </Button>
        </footer>
      </form>
    </PersonalFormModal>
  );
}
