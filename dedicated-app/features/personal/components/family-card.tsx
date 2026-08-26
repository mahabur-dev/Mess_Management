"use client";

import { Pencil, Trash2, UserRound } from "lucide-react";
import { formatPersonalMoney, personalCopy, relationLabel } from "../constants";
import type { FamilyMember, PersonalLocale } from "../types";

export function FamilyCard({
  member,
  locale,
  onEdit,
  onDelete,
}: {
  member: FamilyMember;
  locale: PersonalLocale;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const copy = personalCopy(locale);
  return (
    <article className="ui-card flex items-center gap-3 p-4">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[15px] bg-[#e8f8f7] text-[#008d8c]">
        <UserRound size={23} />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block truncate text-body text-[#123748]">
          {member.name}
        </strong>
        <small className="block text-label font-medium text-[#65838b]">
          {relationLabel(member.relation, locale)}
        </small>
        <small className="mt-1 block text-caption text-[#65838b]">
          {copy.monthlyFamilyExpense}:{" "}
          <b className="text-[#00777a]">
            {formatPersonalMoney(member.monthlyExpense, locale)}
          </b>
        </small>
      </span>
      <span className="flex gap-1">
        <button
          type="button"
          onClick={onEdit}
          className="grid h-9 w-9 place-items-center rounded-full bg-[#edfafa] text-[#00777a]"
          aria-label={copy.edit}
        >
          <Pencil size={15} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="grid h-9 w-9 place-items-center rounded-full bg-[#fff1f0] text-[#d92d20]"
          aria-label={copy.delete}
        >
          <Trash2 size={15} />
        </button>
      </span>
    </article>
  );
}
