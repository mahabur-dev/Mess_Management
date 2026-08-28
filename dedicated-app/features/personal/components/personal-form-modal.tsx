"use client";

import { useEffect, type ReactNode } from "react";
import { X, type LucideIcon } from "lucide-react";
import { useNativeBackAction } from "@/components/native-back-actions";

export function PersonalFormModal({
  id,
  open,
  busy,
  icon: Icon,
  eyebrow,
  title,
  description,
  closeLabel,
  onClose,
  children,
}: {
  id: string;
  open: boolean;
  busy: boolean;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useNativeBackAction(open, () => {
    if (!busy) onClose();
    return true;
  });

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const previousActiveElement = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      previousActiveElement?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [busy, onClose, open]);

  if (!open) return null;

  return (
    <div
      className="app-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target && !busy) onClose();
      }}
    >
      <section
        className="app-modal app-modal--review personal-form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-description`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-start gap-3 border-b border-[#e9eff1] px-5 pb-4 pt-5">
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] border border-[#cce9e7] bg-[#e8f8f7] text-[#00777a]"
            aria-hidden="true"
          >
            <Icon size={22} strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-caption font-bold uppercase tracking-[0.12em] text-[#65838b]">
              {eyebrow}
            </p>
            <h2 id={`${id}-title`} className="mt-1 text-title font-bold text-[#123748]">
              {title}
            </h2>
            <p id={`${id}-description`} className="mt-1 text-label leading-relaxed text-[#65838b]">
              {description}
            </p>
          </div>
          <button
            type="button"
            className="app-modal-close shrink-0"
            onClick={onClose}
            disabled={busy}
            aria-label={closeLabel}
          >
            <X size={18} strokeWidth={2.4} />
          </button>
        </header>

        {children}
      </section>
    </div>
  );
}
