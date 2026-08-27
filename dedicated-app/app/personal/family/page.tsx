"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { LoadingIndicator } from "@/components/loading-indicator";
import { CompactLanguageToggle } from "@/components/mobile/compact-language-toggle";
import { ExpenseSurface } from "@/components/mobile/expense-ui";
import { MealMonthSelector } from "@/components/mobile/meals-design";
import { MobileShell } from "@/components/mobile-shell";
import { TopScreen } from "@/components/top-screen";
import { Button } from "@/components/ui";
import { personalApi } from "@/features/personal/api/personal.api";
import {
  currentPersonalMonth,
  PERSONAL_RELATIONS,
  personalCopy,
  relationLabel,
} from "@/features/personal/constants";
import { FamilyCard } from "@/features/personal/components/family-card";
import { PersonalNavigation } from "@/features/personal/components/personal-navigation";
import { useFamilyMembers } from "@/features/personal/hooks/use-family-members";
import { usePersonalLocale } from "@/features/personal/hooks/use-personal-locale";
import { validateFamilyMember } from "@/features/personal/schemas/personal.schema";
import type { FamilyMember } from "@/features/personal/types";

export default function PersonalFamilyPage() {
  const { locale, toggleLocale } = usePersonalLocale();
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
      await refresh();
    } catch {
      setMessage(copy.saveFailed);
    } finally {
      setBusy(false);
    }
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
        trailing={<CompactLanguageToggle locale={locale} onToggle={toggleLocale} />}
      />
      <div className="screen space-y-4">
        <MealMonthSelector month={month} onChange={setMonth} />
        <PersonalNavigation locale={locale} active="family" />
        <Button className="w-full" onClick={() => openForm()}>
          <Plus size={17} />
          {copy.addFamilyMember}
        </Button>
        {formOpen ? (
          <ExpenseSurface
            title={editing ? copy.editFamilyMember : copy.addFamilyMember}
          >
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-label font-bold text-[#123748]">
                  {copy.name}
                </span>
                <input
                  className="field"
                  value={name}
                  maxLength={100}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-label font-bold text-[#123748]">
                  {copy.relation}
                </span>
                <select
                  className="field"
                  value={relation}
                  onChange={(event) => setRelation(event.target.value)}
                >
                  {PERSONAL_RELATIONS.map((item) => (
                    <option key={item} value={item}>
                      {relationLabel(item, locale)}
                    </option>
                  ))}
                </select>
              </label>
              {message ? (
                <div className="ui-notice ui-notice--danger">{message}</div>
              ) : null}
              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" onClick={() => setFormOpen(false)}>
                  {copy.cancel}
                </Button>
                <Button busy={busy} onClick={save}>
                  {copy.save}
                </Button>
              </div>
            </div>
          </ExpenseSurface>
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
    </MobileShell>
  );
}
