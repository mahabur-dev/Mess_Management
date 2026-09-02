import type { AiCommand, AiCommandIntent } from "@/lib/api-client";

const STORAGE_KEY = "messzen:web-ai-command-draft:v1";

export type AiCommandDraft = Pick<
  AiCommand,
  "id" | "intent" | "payload" | "preview" | "transcript" | "input" | "createdAt"
>;

const TARGET_BY_INTENT: Partial<Record<AiCommandIntent, string>> = {
  EXPENSE_CREATE: "/dashboard/finance",
  UTILITY_CREATE: "/dashboard/finance",
  DEPOSIT_CREATE: "/dashboard/payments",
  MEAL_CREATE: "/dashboard/meals",
};

export function aiCommandTarget(intent: AiCommandIntent) {
  return TARGET_BY_INTENT[intent] ?? null;
}

export function storeAiCommandDraft(command: AiCommand) {
  if (typeof window === "undefined") return;
  const draft: AiCommandDraft = {
    id: command.id,
    intent: command.intent,
    payload: command.payload ?? null,
    preview: command.preview,
    transcript: command.transcript,
    input: command.input,
    createdAt: command.createdAt,
  };
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export function readAiCommandDraft(
  commandId?: string | null,
): AiCommandDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as AiCommandDraft;
    if (!draft?.id || !draft.intent || !draft.payload) return null;
    if (commandId && draft.id !== commandId) return null;
    return draft;
  } catch {
    return null;
  }
}

export function clearAiCommandDraft(commandId?: string) {
  if (typeof window === "undefined") return;
  const current = readAiCommandDraft();
  if (!commandId || current?.id === commandId)
    window.sessionStorage.removeItem(STORAGE_KEY);
}
