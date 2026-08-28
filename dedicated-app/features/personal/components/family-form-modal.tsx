"use client";

import { UsersRound } from "lucide-react";
import { DesignedSelect } from "@/components/mobile/expense-design";
import { Button } from "@/components/ui";
import {
  PERSONAL_RELATIONS,
  personalCopy,
  relationLabel,
} from "../constants";
import type { PersonalLocale } from "../types";
import { PersonalFormModal } from "./personal-form-modal";

export function FamilyFormModal({
  open,
  editing,
  locale,
  name,
  relation,
  busy,
  message,
  onNameChange,
  onRelationChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editing: boolean;
  locale: PersonalLocale;
  name: string;
  relation: string;
  busy: boolean;
  message: string;
  onNameChange: (value: string) => void;
  onRelationChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const copy = personalCopy(locale);

  return (
    <PersonalFormModal
      id="family-form"
      open={open}
      busy={busy}
      icon={UsersRound}
      eyebrow={copy.familyEditor}
      title={editing ? copy.editFamilyMember : copy.addFamilyMember}
      description={editing ? copy.editFamilyDescription : copy.addFamilyDescription}
      closeLabel={copy.cancel}
      onClose={onClose}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!busy) onSubmit();
        }}
      >
        <div className="space-y-4 px-5 py-5">
          <label className="block">
            <span className="mb-2 block text-label font-bold text-[#123748]">
              {copy.name}
            </span>
            <input
              className="field min-h-[52px]"
              value={name}
              maxLength={100}
              onChange={(event) => onNameChange(event.target.value)}
              disabled={busy}
              autoFocus
              required
            />
          </label>

          <DesignedSelect
            label={copy.relation}
            icon={UsersRound}
            value={relation}
            disabled={busy}
            onChange={(event) => onRelationChange(event.target.value)}
          >
            {PERSONAL_RELATIONS.map((item) => (
              <option key={item} value={item}>
                {relationLabel(item, locale)}
              </option>
            ))}
          </DesignedSelect>

          {message ? (
            <div className="ui-notice ui-notice--danger" role="alert">
              {message}
            </div>
          ) : null}
        </div>

        <footer className="grid grid-cols-2 gap-3 border-t border-[#e9eff1] bg-[#fbfcfc] px-5 py-4">
          <Button type="button" variant="secondary" className="w-full" onClick={onClose} disabled={busy}>
            {copy.cancel}
          </Button>
          <Button type="submit" className="w-full" busy={busy} busyLabel={copy.savingChanges}>
            {copy.save}
          </Button>
        </footer>
      </form>
    </PersonalFormModal>
  );
}
