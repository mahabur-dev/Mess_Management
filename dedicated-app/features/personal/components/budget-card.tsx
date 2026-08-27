"use client";

import { Pencil, Trash2 } from "lucide-react";
import { categoryLabel, formatPersonalMoney, personalCopy } from "../constants";
import type { PersonalBudget, PersonalLocale } from "../types";

export function BudgetCard({
  budget,
  locale,
  onEdit,
  onDelete,
}: {
  budget: PersonalBudget;
  locale: PersonalLocale;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const copy = personalCopy(locale);
  const progress = Math.max(
    0,
    Math.min(Number(budget.progressPercent ?? 0), 100),
  );
  return (
    <article className="ui-card space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-body font-bold text-[#123748]">
            {categoryLabel(budget.category, locale)}
          </h3>
          <p
            className={`mt-1 text-label font-semibold ${budget.isExceeded ? "text-[#d92d20]" : "text-[#65838b]"}`}
          >
            {budget.isExceeded
              ? copy.exceeded
              : `${copy.remaining}: ${formatPersonalMoney(budget.remainingAmount, locale)}`}
          </p>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="grid h-8 w-8 place-items-center rounded-full bg-[#edfafa] text-[#00777a]"
            aria-label={copy.edit}
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="grid h-8 w-8 place-items-center rounded-full bg-[#fff1f0] text-[#d92d20]"
            aria-label={copy.delete}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[#edf1f4]">
        <div
          className={`h-full rounded-full ${budget.isExceeded ? "bg-[#d92d20]" : "bg-[#008d8c]"}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between text-caption font-semibold text-[#65838b]">
        <span>
          {copy.spent}: {formatPersonalMoney(budget.spentAmount, locale)}
        </span>
        <span>
          {copy.budget}: {formatPersonalMoney(budget.limit_amount, locale)}
        </span>
      </div>
    </article>
  );
}
