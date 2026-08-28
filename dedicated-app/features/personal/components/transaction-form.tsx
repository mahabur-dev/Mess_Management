"use client";

import { useEffect, useState } from "react";
import {
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/mobile/form-controls";
import { Button } from "@/components/ui";
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
  serverError = "",
  modal = false,
  onSubmit,
  onCancel,
}: {
  locale: PersonalLocale;
  familyMembers: FamilyMember[];
  initial?: PersonalTransaction | null;
  initialType?: PersonalTransactionType;
  busy?: boolean;
  serverError?: string;
  modal?: boolean;
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
    <form onSubmit={submit} className={modal ? "" : "space-y-4"}>
      <div className={modal ? "max-h-[min(58dvh,520px)] space-y-4 overflow-y-auto overscroll-contain px-5 py-5" : "space-y-4"}>
        <SelectField
          label={copy.transactionType}
          value={type}
          onChange={changeType}
          options={["INCOME", "EXPENSE", "SAVING"] as const}
          getLabel={(value) => value === "INCOME" ? copy.income : value === "EXPENSE" ? copy.expense : copy.saving}
        />
        <SelectField
          label={copy.category}
          value={category}
          onChange={setCategory}
          options={PERSONAL_CATEGORIES[type]}
          getLabel={(value) => categoryLabel(value, locale)}
        />
        <TextField
          label={copy.amount}
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={setAmount}
          placeholder="0.00"
        />
        <TextField
          label={copy.date}
          type="date"
          value={date}
          onChange={setDate}
        />
        <TextAreaField
          label={copy.description}
          hint={copy.optional}
          value={description}
          onChange={setDescription}
          rows={3}
          maxLength={500}
        />
        <SelectField
          label={copy.familyMember}
          hint={copy.optional}
          value={familyMemberId}
          onChange={setFamilyMemberId}
          options={["", ...familyMembers.map((member) => member.id)]}
          getLabel={(value) => familyMembers.find((member) => member.id === value)?.name ?? copy.none}
        />
        {error || serverError ? (
          <div className="ui-notice ui-notice--danger" role="alert">{error || serverError}</div>
        ) : null}
      </div>
      <div className={modal ? "grid grid-cols-2 gap-3 border-t border-[#e9eff1] bg-[#fbfcfc] px-5 py-4" : "grid grid-cols-2 gap-3"}>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={busy}
        >
          {copy.cancel}
        </Button>
        <Button type="submit" busy={busy} busyLabel={copy.savingChanges}>
          {copy.save}
        </Button>
      </div>
    </form>
  );
}
