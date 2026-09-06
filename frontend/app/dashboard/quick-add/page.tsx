"use client";

import { useAuth } from "@/app/context/auth-context";
import { DashboardHeader } from "@/components/dashboard-header";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { aiCommandTarget, storeAiCommandDraft } from "@/lib/ai-quick-add";
import {
  ApiError,
  apiClient,
  type AiCapabilities,
  type AiCommand,
  type AiLocale,
  type Mess,
} from "@/lib/api-client";
import {
  ArrowRight,
  AudioLines,
  CheckCircle2,
  Languages,
  Loader2,
  Mic,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Square,
  UtensilsCrossed,
  WalletCards,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const EXAMPLES = [
  "Add grocery expense 850 taka for today",
  "আজ বাজার খরচ ৮৫০ টাকা যোগ করো",
  "Add a 2000 taka cash deposit for me today",
  "আজকে আমার বিকাশ ডিপোজিট ১৫০০ টাকা",
  "Set 2 dinner meals for me today",
  "Add WiFi bill 1200 taka for this month",
];

function commandError(error: unknown) {
  if (error instanceof ApiError || error instanceof Error) return error.message;
  return "The command could not be processed. Please try again.";
}

function idempotencyKey() {
  return crypto.randomUUID();
}

export default function QuickAddAiPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [messes, setMesses] = useState<Mess[]>([]);
  const [capabilities, setCapabilities] = useState<AiCapabilities | null>(null);
  const [locale, setLocale] = useState<AiLocale>("en");
  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<"text" | "voice" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const activeMess =
    messes[0] ?? user?.memberships?.find((item) => item.is_active)?.mess;
  const quota = capabilities?.quota;
  const exhausted = quota?.exhausted ?? false;

  const loadCapabilities = useCallback(
    async (nextLocale: AiLocale = locale) => {
      const response = await apiClient.getAiCapabilities(nextLocale);
      setCapabilities(response.data);
      return response.data;
    },
    [locale],
  );

  useEffect(() => {
    let alive = true;
    async function loadPage() {
      setLoading(true);
      try {
        const [messResponse, capabilityResponse] = await Promise.all([
          apiClient.getMesses().catch(() => null),
          apiClient.getAiCapabilities(locale),
        ]);
        if (!alive) return;
        const messData = messResponse?.data;
        setMesses(
          Array.isArray(messData) ? messData : messData ? [messData] : [],
        );
        setCapabilities(capabilityResponse.data);
      } catch (error) {
        if (alive) setMessage(commandError(error));
      } finally {
        if (alive) setLoading(false);
      }
    }
    void loadPage();
    return () => {
      alive = false;
    };
  }, [locale]);

  const continueToReview = useCallback(
    async (created: AiCommand) => {
      await loadCapabilities(locale).catch(() => null);
      const target = aiCommandTarget(created.intent);
      if (created.status === "PENDING" && created.payload && target) {
        storeAiCommandDraft(created);
        router.push(`${target}?aiCommand=${encodeURIComponent(created.id)}`);
        return;
      }

      const clarification = created.clarification?.trim();
      setMessage(
        clarification ||
          "I could not prepare a complete entry. Add the missing date, amount, member, or meal details and try again.",
      );
      if (created.transcript)
        setCommand((current) =>
          current.trim() ? current : (created.transcript ?? ""),
        );
    },
    [loadCapabilities, locale, router],
  );

  const handleRecorded = useCallback(
    async (audio: Blob) => {
      if (!activeMess || exhausted) return;
      setProcessing("voice");
      setMessage(null);
      try {
        const response = await apiClient.createAiVoiceCommand({
          messId: activeMess.id,
          audio,
          locale,
          speechLanguage: "auto",
          idempotencyKey: idempotencyKey(),
        });
        await continueToReview(response.data);
      } catch (error) {
        setMessage(commandError(error));
        await loadCapabilities(locale).catch(() => null);
      } finally {
        setProcessing(null);
      }
    },
    [activeMess, continueToReview, exhausted, loadCapabilities, locale],
  );

  const recorder = useAudioRecorder(
    handleRecorded,
    capabilities?.voice.maxDurationSeconds ?? 60,
  );

  async function submitText() {
    if (!activeMess || !command.trim() || exhausted) return;
    setProcessing("text");
    setMessage(null);
    try {
      const response = await apiClient.createAiTextCommand({
        messId: activeMess.id,
        text: command.trim(),
        locale,
        idempotencyKey: idempotencyKey(),
      });
      await continueToReview(response.data);
    } catch (error) {
      setMessage(commandError(error));
      await loadCapabilities(locale).catch(() => null);
    } finally {
      setProcessing(null);
    }
  }

  const usedPercent = useMemo(() => {
    if (!quota?.limit) return 0;
    return Math.min(100, Math.round((quota.used / quota.limit) * 100));
  }, [quota]);

  const cannotSubmit =
    loading ||
    processing !== null ||
    !activeMess ||
    exhausted ||
    capabilities?.enabled === false;
  const voiceUnavailable = capabilities?.voice.enabled === false;

  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)]">
      <DashboardHeader
        title="Quick Add AI"
        description="Turn a short text or voice command into a review-ready entry."
        showQuickAddButton={false}
      />

      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <section className="dashboard-card overflow-hidden">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="p-5 sm:p-7 lg:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-2xl">
                  <div className="mb-3 flex size-11 items-center justify-center rounded-xl border border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand)]">
                    <Sparkles className="size-5" />
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight text-[var(--dashboard-ink)] sm:text-2xl">
                    What would you like to add?
                  </h2>
                  <p className="mt-2 text-sm font-medium leading-6 text-[var(--dashboard-muted)]">
                    Include the amount, date, member, or meal where relevant.
                    You will review every detail in the existing form before
                    anything is saved.
                  </p>
                </div>

                <div className="inline-flex w-fit rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-surface-subtle)] p-1">
                  {(["en", "bn"] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setLocale(item)}
                      className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                        locale === item
                          ? "bg-[var(--dashboard-surface)] text-[var(--brand)] "
                          : "text-[var(--dashboard-muted)]"
                      }`}
                    >
                      {item === "en" ? "English" : "বাংলা"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-7 rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] p-3  sm:p-4">
                <textarea
                  value={command}
                  onChange={(event) =>
                    setCommand(event.target.value.slice(0, 2000))
                  }
                  onKeyDown={(event) => {
                    if (
                      (event.ctrlKey || event.metaKey) &&
                      event.key === "Enter"
                    )
                      void submitText();
                  }}
                  disabled={cannotSubmit}
                  placeholder={
                    locale === "bn"
                      ? "যেমন: আজ বাজার খরচ ৮৫০ টাকা যোগ করো"
                      : "For example: Add grocery expense 850 taka for today"
                  }
                  className="min-h-36 w-full resize-none bg-transparent px-2 py-2 text-[15px] font-medium leading-7 text-[var(--dashboard-ink)] outline-none placeholder:text-[var(--dashboard-muted)]/70 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <div className="mt-3 flex flex-col gap-3 border-t border-[var(--dashboard-line)] pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        recorder.isRecording
                          ? recorder.stop()
                          : void recorder.start()
                      }
                      disabled={
                        cannotSubmit ||
                        voiceUnavailable ||
                        !recorder.supported ||
                        processing === "text"
                      }
                      className={`inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        recorder.isRecording
                          ? "border-destructive/30 bg-destructive/10 text-destructive"
                          : "border-[var(--dashboard-line)] bg-[var(--dashboard-surface-subtle)] text-[var(--dashboard-ink)] hover:border-[var(--brand-border)] hover:text-[var(--brand)]"
                      }`}
                    >
                      {processing === "voice" ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : recorder.isRecording ? (
                        <Square className="size-4 fill-current" />
                      ) : (
                        <Mic className="size-4" />
                      )}
                      {processing === "voice"
                        ? "Processing voice"
                        : recorder.isRecording
                          ? `Stop · ${recorder.seconds}s`
                          : "Voice command"}
                    </button>
                    <span className="hidden text-xs font-semibold text-[var(--dashboard-muted)] sm:inline">
                      English or Bangla
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => void submitText()}
                    disabled={
                      cannotSubmit || !command.trim() || recorder.isRecording
                    }
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-5 text-sm font-bold text-primary-foreground  transition hover:bg-[var(--brand-dark)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {processing === "text" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Sparkles className="size-4" />
                    )}
                    {processing === "text"
                      ? "Preparing review"
                      : "Create preview"}
                    {!processing && <ArrowRight className="size-4" />}
                  </button>
                </div>
              </div>

              {(message || recorder.error) && (
                <div className="mt-4 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-semibold leading-6 text-primary">
                  {message || recorder.error}
                </div>
              )}

              {!activeMess && !loading && (
                <div className="mt-4 rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-surface-subtle)] px-4 py-3 text-sm font-semibold text-[var(--dashboard-muted)]">
                  Join or create a mess before using AI Quick Add.
                </div>
              )}

              {capabilities?.enabled === false && (
                <div className="mt-4 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
                  AI Quick Add is temporarily unavailable. You can continue
                  using the regular meal, expense, and deposit forms.
                </div>
              )}
            </div>

            <aside className="border-t border-[var(--dashboard-line)] bg-[var(--dashboard-surface-subtle)] p-5 sm:p-7 lg:border-l lg:border-t-0">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
                Free command usage
              </p>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-3xl font-semibold tracking-tight text-[var(--dashboard-ink)]">
                    {quota?.used ?? 0}
                    <span className="text-lg text-[var(--dashboard-muted)]">
                      /{quota?.limit ?? 10}
                    </span>
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[var(--dashboard-muted)]">
                    commands used
                  </p>
                </div>
                <span className="rounded-lg border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] px-2.5 py-1.5 text-xs font-bold text-[var(--dashboard-muted)]">
                  {quota?.remaining ?? 10} left
                </span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--dashboard-line)]">
                <div
                  className="h-full rounded-full bg-[var(--brand)] transition-all"
                  style={{ width: `${usedPercent}%` }}
                />
              </div>

              {exhausted ? (
                <div className="mt-5 rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm font-semibold leading-6 text-primary">
                  Your 10 free AI commands have been used. Manual entry pages
                  are still available.
                </div>
              ) : (
                <div className="mt-5 space-y-3 text-sm font-semibold text-[var(--dashboard-muted)]">
                  <p className="flex items-start gap-2.5">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--brand)]" />
                    Nothing is saved without your confirmation.
                  </p>
                  <p className="flex items-start gap-2.5">
                    <Languages className="mt-0.5 size-4 shrink-0 text-[var(--brand)]" />
                    Speak or type naturally in English or Bangla.
                  </p>
                </div>
              )}

              <div className="mt-6 border-t border-[var(--dashboard-line)] pt-5">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
                  Available actions
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    [UtensilsCrossed, "Meal"],
                    [ReceiptText, "Expense"],
                    [WalletCards, "Deposit"],
                  ].map(([Icon, label]) => {
                    const ActionIcon = Icon as typeof UtensilsCrossed;
                    return (
                      <div
                        key={String(label)}
                        className="rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] p-3 text-center"
                      >
                        <ActionIcon className="mx-auto size-4 text-[var(--brand)]" />
                        <p className="mt-2 text-[11px] font-bold text-[var(--dashboard-ink)]">
                          {String(label)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="dashboard-card p-5 sm:p-7">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
              <AudioLines className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--dashboard-ink)]">
                Command examples
              </h2>
              <p className="mt-1 text-sm font-medium text-[var(--dashboard-muted)]">
                Select one to place it in the command box, then edit any detail
                you need.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {EXAMPLES.map((example, index) => (
              <button
                key={example}
                type="button"
                onClick={() => {
                  setCommand(example);
                  setLocale(/[\u0980-\u09ff]/.test(example) ? "bn" : "en");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                disabled={cannotSubmit}
                className="group flex min-h-24 items-start gap-3 rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-surface-subtle)] p-4 text-left transition hover:border-[var(--brand-border)] hover:bg-[var(--brand-soft)] disabled:opacity-50"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] text-xs font-bold text-[var(--dashboard-muted)]">
                  {index + 1}
                </span>
                <span className="text-sm font-semibold leading-6 text-[var(--dashboard-ink)]">
                  “{example}”
                </span>
              </button>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-[var(--dashboard-muted)]">
            <CheckCircle2 className="size-4 text-[var(--brand)]" />
            Dates like “today” and “tomorrow” are resolved using your local
            timezone.
          </div>
        </section>
      </div>
    </div>
  );
}
