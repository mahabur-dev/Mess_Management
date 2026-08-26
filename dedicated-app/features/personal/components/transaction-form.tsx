"use client";

import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui";
import { ExpenseChoiceCard } from "@/components/mobile/expense-ui";
import {
  PERSONAL_CATEGORIES,
  categoryLabel,
  currentPersonalDate,
  personalCopy,
} from "../constants";
import { validatePersonalTransaction } from "../schemas/personal.schema";
import type {
  FamilyMember,
  PersonalLocale,
  PersonalTransaction,
  PersonalTransactionInput,
  PersonalTransactionType,
} from "../types";

export function PersonalTransactionForm({
  locale,
  familyMembers,
  initial,
  initialType = "EXPENSE",
  busy,
  onSubmit,
  onCancel,
}: {
  locale: PersonalLocale;
  familyMembers: FamilyMember[];
  initial?: PersonalTransaction | null;
  initialType?: PersonalTransactionType;
  busy?: boolean;
  onSubmit: (input: PersonalTransactionInput) => Promise<void>;
  onCancel: () => void;
}) {
  const copy = personalCopy(locale);
  const [type, setType] = useState<PersonalTransactionType>(
    initial?.type ?? initialType,
  );
  const [category, setCategory] = useState(
    initial?.category ?? PERSONAL_CATEGORIES[initial?.type ?? initialType][0],
  );
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [date, setDate] = useState(
    initial?.date?.slice(0, 10) ?? currentPersonalDate(),
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [familyMemberId, setFamilyMemberId] = useState(
    initial?.family_member_id ?? "",
  );
  const [error, setError] = useState("");

  useEffect(() => {
    const nextType = initial?.type ?? initialType;
    setType(nextType);
    setCategory(initial?.category ?? PERSONAL_CATEGORIES[nextType][0]);
    setAmount(initial ? String(initial.amount) : "");
    setDate(initial?.date?.slice(0, 10) ?? currentPersonalDate());
    setDescription(initial?.description ?? "");
    setFamilyMemberId(initial?.family_member_id ?? "");
    setError("");
  }, [initial, initialType]);

  const changeType = (next: PersonalTransactionType) => {
    setType(next);
    setCategory(PERSONAL_CATEGORIES[next][0]);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const input: PersonalTransactionInput = {
      type,
      category,
      amount: Number(amount),
      date,
      description: description.trim() || undefined,
      familyMemberId: familyMemberId || null,
    };
    const validation = validatePersonalTransaction(input);
    if (validation) {
      setError(
        validation === "amount" ? copy.invalidAmount : copy.requiredFields,
      );
      return;
    }
    setError("");
    await onSubmit(input);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <ExpenseChoiceCard
          active={type === "INCOME"}
          icon={ArrowDownLeft}
          title={copy.income}
          onClick={() => changeType("INCOME")}
          compact
          layout="vertical"
          accent="green"
        />
        <ExpenseChoiceCard
          active={type === "EXPENSE"}
          icon={ArrowUpRight}
          title={copy.expense}
          onClick={() => changeType("EXPENSE")}
          compact
          layout="vertical"
          accent="orange"
        />
        <ExpenseChoiceCard
          active={type === "SAVING"}
          icon={PiggyBank}
          title={copy.saving}
          onClick={() => changeType("SAVING")}
          compact
          layout="vertical"
          accent="teal"
        />
      </div>

      <label className="block">
        <span className="mb-1.5 block text-label font-bold text-[#123748]">
          {copy.category}
        </span>
        <select
          className="field"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          {PERSONAL_CATEGORIES[type].map((item) => (
            <option key={item} value={item}>
              {categoryLabel(item, locale)}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-label font-bold text-[#123748]">
          {copy.amount}
        </span>
        <input
          className="field ui-mono-number"
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="0.00"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-label font-bold text-[#123748]">
          {copy.date}
        </span>
        <input
          className="field"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-label font-bold text-[#123748]">
          {copy.description} ({copy.optional})
        </span>
        <textarea
          className="field min-h-[92px] resize-none py-3"
          value={description}
          maxLength={500}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-label font-bold text-[#123748]">
          {copy.familyMember} ({copy.optional})
        </span>
        <select
          className="field"
          value={familyMemberId}
          onChange={(event) => setFamilyMemberId(event.target.value)}
        >
          <option value="">{copy.none}</option>
          {familyMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </label>
      {error ? (
        <div className="ui-notice ui-notice--danger">{error}</div>
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={busy}
        >
          {copy.cancel}
        </Button>
        <Button type="submit" busy={busy}>
          {copy.save}
        </Button>
      </div>
    </form>
  );
}
