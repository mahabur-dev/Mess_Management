"use client";

import { useState } from "react";
import { LoadingIndicator } from "@/components/loading-indicator";
import { MealMonthSelector } from "@/components/mobile/meals-design";
import { MobileShell } from "@/components/mobile-shell";
import { TopScreen } from "@/components/top-screen";
import { AddActionButton } from "@/components/ui";
import { personalApi } from "@/features/personal/api/personal.api";
import {
  currentPersonalMonth,
  personalCopy,
} from "@/features/personal/constants";
import { FamilyCard } from "@/features/personal/components/family-card";
import { FamilyFormModal } from "@/features/personal/components/family-form-modal";
import { PersonalNavigation } from "@/features/personal/components/personal-navigation";
import { useFamilyMembers } from "@/features/personal/hooks/use-family-members";
import { usePersonalLocale } from "@/features/personal/hooks/use-personal-locale";
import { validateFamilyMember } from "@/features/personal/schemas/personal.schema";
import type { FamilyMember } from "@/features/personal/types";

export default function PersonalFamilyPage() {
  const { locale } = usePersonalLocale();
  const copy = personalCopy(locale);
  const [month, setMonth] = useState(currentPersonalMonth());
  const { familyMembers, loading, error, refresh } = useFamilyMembers(
    month,
    copy.loadFailed,
  );
  const [editing, setEditing] = useState<FamilyMember | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("FATHER");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const openForm = (member?: FamilyMember) => {
    setEditing(member ?? null);
    setName(member?.name ?? "");
    setRelation(member?.relation ?? "FATHER");
    setMessage("");
    setFormOpen(true);
  };
  const save = async () => {
    if (!validateFamilyMember(name, relation)) {
      setMessage(copy.requiredFields);
      return;
    }
    setBusy(true);
    try {
      if (editing)
        await personalApi.updateFamilyMember(editing.id, { name, relation });
      else await personalApi.createFamilyMember({ name, relation });
      setFormOpen(false);
      setEditing(null);
      await refresh();
    } catch {
      setMessage(copy.saveFailed);
    } finally {
      setBusy(false);
    }
  };
  const closeForm = () => {
    if (busy) return;
    setFormOpen(false);
    setEditing(null);
    setMessage("");
  };
  const remove = async (member: FamilyMember) => {
    if (!window.confirm(copy.confirmDeleteFamily)) return;
    try {
      await personalApi.deleteFamilyMember(member.id);
      await refresh();
    } catch {
      setMessage(copy.deleteFailed);
    }
  };
  return (
    <MobileShell showBottomNavigation>
      <TopScreen
        title={copy.family}
        subtitle={copy.familySubtitle}
        backHref="/personal"
      />
      <div className="screen space-y-4">
        <MealMonthSelector month={month} onChange={setMonth} menuGap={18} />
        <PersonalNavigation locale={locale} active="family" />
        <AddActionButton onClick={() => openForm()}>
          {copy.addFamilyMember}
        </AddActionButton>
        {!formOpen && message ? (
          <div className="ui-notice ui-notice--danger">{message}</div>
        ) : null}
        {loading ? (
          <LoadingIndicator variant="card" label={copy.familyMembers} />
        ) : null}
        {error ? (
          <div className="ui-notice ui-notice--danger">{error}</div>
        ) : null}
        <div className="space-y-3">
          {familyMembers.map((member) => (
            <FamilyCard
              key={member.id}
              member={member}
              locale={locale}
              onEdit={() => openForm(member)}
              onDelete={() => remove(member)}
            />
          ))}
          {!loading && !familyMembers.length ? (
            <div className="expense-empty-state ui-card">{copy.noFamily}</div>
          ) : null}
        </div>
      </div>
      <FamilyFormModal
        open={formOpen}
        editing={Boolean(editing)}
        locale={locale}
        name={name}
        relation={relation}
        busy={busy}
        message={message}
        onNameChange={setName}
        onRelationChange={setRelation}
        onClose={closeForm}
        onSubmit={() => void save()}
      />
    </MobileShell>
  );
}
