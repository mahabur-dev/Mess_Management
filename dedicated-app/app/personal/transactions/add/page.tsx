"use client";

import { useEffect, useState } from "react";
import { ReceiptText } from "lucide-react";
import { useRouter } from "next/navigation";
import { NotificationLink } from "@/components/app-header";
import {
  FormPageShell,
  FormSection,
  FormStatusMessage,
} from "@/components/mobile/expense-design";
import { MobileShell } from "@/components/mobile-shell";
import { personalApi } from "@/features/personal/api/personal.api";
import { PersonalTransactionForm } from "@/features/personal/components/transaction-form";
import {
  currentPersonalMonth,
  personalCopy,
} from "@/features/personal/constants";
import { useFamilyMembers } from "@/features/personal/hooks/use-family-members";
import { usePersonalLocale } from "@/features/personal/hooks/use-personal-locale";
import type {
  PersonalTransactionInput,
  PersonalTransactionType,
} from "@/features/personal/types";
import { appHref } from "@/lib/routes";
import { useQueryParams } from "@/lib/use-query-params";

export default function AddPersonalTransactionPage() {
  const router = useRouter();
  const params = useQueryParams();
  const { locale } = usePersonalLocale();
  const copy = personalCopy(locale);
  const [initialType, setInitialType] =
    useState<PersonalTransactionType>("EXPENSE");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const { familyMembers } = useFamilyMembers(
    currentPersonalMonth(),
    copy.loadFailed,
  );

  useEffect(() => {
    const requestedType = params.get("type");
    if (
      requestedType === "INCOME" ||
      requestedType === "EXPENSE" ||
      requestedType === "SAVING"
    ) {
      setInitialType(requestedType);
    }
  }, [params]);

  const save = async (input: PersonalTransactionInput) => {
    setBusy(true);
    setMessage("");
    try {
      await personalApi.createTransaction(input);
      router.replace(appHref("/personal/transactions"));
    } catch {
      setMessage(copy.saveFailed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <MobileShell>
      <FormPageShell
        title={copy.addTransaction}
        description={copy.transactionHistory}
        icon={ReceiptText}
        backHref="/personal/transactions"
        trailing={<NotificationLink />}
      >
        <FormSection title={copy.addTransaction}>
          <PersonalTransactionForm
            locale={locale}
            familyMembers={familyMembers}
            initialType={initialType}
            busy={busy}
            onSubmit={save}
            onCancel={() => router.replace(appHref("/personal/transactions"))}
          />
        </FormSection>
        <FormStatusMessage message={message} />
      </FormPageShell>
    </MobileShell>
  );
}
