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

export function TransactionCard({
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
    <article className="flex items-center gap-3 border-b border-[#edf1f4] px-3 py-3 last:border-b-0">
      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-[14px] ${config.background} ${config.color}`}
      >
        <Icon size={20} />
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
          <span className="mt-1 flex justify-end gap-1">
            {onEdit ? (
              <button
                type="button"
                onClick={onEdit}
                className="grid h-7 w-7 place-items-center rounded-full bg-[#edfafa] text-[#00777a]"
                aria-label={copy.edit}
              >
                <Pencil size={13} />
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="grid h-7 w-7 place-items-center rounded-full bg-[#fff1f0] text-[#d92d20]"
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
