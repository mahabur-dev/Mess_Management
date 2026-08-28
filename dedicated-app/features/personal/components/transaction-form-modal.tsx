"use client";

import { ReceiptText } from "lucide-react";
import type {
  FamilyMember,
  PersonalLocale,
  PersonalTransaction,
  PersonalTransactionInput,
} from "../types";
import { personalCopy } from "../constants";
import { PersonalFormModal } from "./personal-form-modal";
import { PersonalTransactionForm } from "./transaction-form";

export function TransactionFormModal({
  transaction,
  locale,
  familyMembers,
  busy,
  message,
  onClose,
  onSubmit,
}: {
  transaction: PersonalTransaction | null;
  locale: PersonalLocale;
  familyMembers: FamilyMember[];
  busy: boolean;
  message: string;
  onClose: () => void;
  onSubmit: (input: PersonalTransactionInput) => Promise<void>;
}) {
  const copy = personalCopy(locale);
  if (!transaction) return null;

  return (
    <PersonalFormModal
      id="transaction-edit-form"
      open
      busy={busy}
      icon={ReceiptText}
      eyebrow={copy.transactionEditor}
      title={copy.editTransaction}
      description={copy.editTransactionDescription}
      closeLabel={copy.cancel}
      onClose={onClose}
    >
      <PersonalTransactionForm
        locale={locale}
        familyMembers={familyMembers}
        initial={transaction}
        busy={busy}
        serverError={message}
        modal
        onSubmit={onSubmit}
        onCancel={onClose}
      />
    </PersonalFormModal>
  );
}
