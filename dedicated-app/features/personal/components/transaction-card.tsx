"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Pencil,
  PiggyBank,
  Trash2,
} from "lucide-react";
import {
  categoryLabel,
  formatPersonalDate,
  formatPersonalMoney,
  personalCopy,
} from "../constants";
import type { PersonalLocale, PersonalTransaction } from "../types";

export function TransactionRow({
  transaction,
  locale,
  onEdit,
  onDelete,
}: {
  transaction: PersonalTransaction;
  locale: PersonalLocale;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const copy = personalCopy(locale);
  const config = {
    INCOME: {
      icon: ArrowDownLeft,
      sign: "+",
      color: "text-[#15953a]",
      background: "bg-[#eaf8ee]",
    },
    EXPENSE: {
      icon: ArrowUpRight,
      sign: "-",
      color: "text-[#d92d20]",
      background: "bg-[#fff1f0]",
    },
    SAVING: {
      icon: PiggyBank,
      sign: "-",
      color: "text-[#00777a]",
      background: "bg-[#e8f8f7]",
    },
  }[transaction.type];
  const Icon = config.icon;

  return (
    <article role="listitem" className="flex min-h-[68px] items-center gap-3 px-1 py-2.5">
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${config.background} ${config.color}`}
        aria-hidden="true"
      >
        <Icon size={18} strokeWidth={2.25} />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block truncate text-label text-[#123748]">
          {categoryLabel(transaction.category, locale)}
        </strong>
        <small className="mt-0.5 block truncate text-caption font-medium text-[#65838b]">
          {formatPersonalDate(transaction.date, locale)}
          {transaction.family_member?.name
            ? ` · ${transaction.family_member.name}`
            : ""}
        </small>
        {transaction.description ? (
          <small className="mt-0.5 block truncate text-caption text-[#789096]">
            {transaction.description}
          </small>
        ) : null}
      </span>
      <span className="shrink-0 text-right">
        <strong className={`block text-label ${config.color}`}>
          {config.sign} {formatPersonalMoney(transaction.amount, locale)}
        </strong>
        {onEdit || onDelete ? (
          <span className="mt-1.5 flex justify-end gap-1.5">
            {onEdit ? (
              <button
                type="button"
                onClick={onEdit}
                className="grid h-8 w-8 place-items-center rounded-[10px] text-[#00777a] transition-colors hover:bg-[#e8f8f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008d8c]/25"
                aria-label={copy.edit}
              >
                <Pencil size={13} />
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="grid h-8 w-8 place-items-center rounded-[10px] text-[#d92d20] transition-colors hover:bg-[#fff1f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d92d20]/20"
                aria-label={copy.delete}
              >
                <Trash2 size={13} />
              </button>
            ) : null}
          </span>
        ) : null}
      </span>
    </article>
  );
}
