'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  AudioLines,
  BadgeCheck,
  CheckCircle2,
  MessageSquareText,
  Mic,
  ReceiptText,
  Sparkles,
  Square,
  UtensilsCrossed,
  WalletCards,
  WandSparkles,
  Zap,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { AppHeader, NotificationLink } from '@/components/app-header'
import { HomeCard } from '@/components/home-card'
import { LoadingIndicator } from '@/components/loading-indicator'
import { MobileShell } from '@/components/mobile-shell'
import { Notice } from '@/components/ui/notice'
import { AiMealPreview } from '@/components/mobile/ai-meal-preview'
import { AiExpensePreview } from '@/components/mobile/ai-expense-preview'
import { AiDepositPreview } from '@/components/mobile/ai-deposit-preview'
import { useActiveMess } from '@/hooks/use-active-mess'
import { useAudioRecorder } from '@/hooks/use-audio-recorder'
import { useMessMemberOptions } from '@/hooks/use-mess-member-options'
import { aiCopy, type AiCommand } from '@/lib/ai-automation'
import { api } from '@/lib/api'
import { appHref } from '@/lib/routes'
import { canManageMess } from '@/lib/app-permissions'
import { localizedErrorMessage, useLocale, useTranslations } from '@/lib/i18n'

function label(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
}

const QUICK_EXAMPLES = [
  { text: 'Today grocery 850 taka', language: 'EN', icon: ReceiptText },
  { text: 'আজ বাজার ৮৫০ টাকা', language: 'বাংলা', icon: ReceiptText },
  { text: 'Add Rahim deposit 2000', language: 'EN', icon: WalletCards },
  { text: 'রহিমের ডিপোজিট ২০০০ যোগ করো', language: 'বাংলা', icon: WalletCards },
  { text: 'Tomorrow dinner 2 meals', language: 'EN', icon: UtensilsCrossed },
  { text: 'আগামীকাল ডিনার ২ মিল', language: 'বাংলা', icon: UtensilsCrossed },
] as const

export default function QuickAddPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { locale } = useLocale()
  const tCommon = useTranslations('common')
  const canManage = canManageMess(user)
  const { activeMess, isLoading: messLoading, status: messStatus } = useActiveMess(user)
  const members = useMessMemberOptions(activeMess?.id ?? '', user)
  const [text, setText] = useState('')
  const [command, setCommand] = useState<AiCommand | null>(null)
  const [payload, setPayload] = useState<Record<string, unknown>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [voiceEnabled, setVoiceEnabled] = useState<boolean | null>(null)
  const copy = aiCopy(locale)
  const errorMessage = error ? localizedErrorMessage(error, locale) : ''
  const experienceCopy = locale === 'bn'
    ? {
        assistant: 'MESSZEN AI ASSISTANT',
        safe: 'আপনি যাচাই করে নিশ্চিত না করা পর্যন্ত কিছুই সেভ হবে না',
        command: 'কমান্ড লিখুন',
        tryCommand: 'দ্রুত উদাহরণ',
        suggestions: 'টি সাজেশন',
        exampleHint: 'ব্যবহার করতে যেকোনো উদাহরণে চাপ দিন',
        processing: 'AI আপনার কমান্ড বিশ্লেষণ করছে',
      }
    : {
        assistant: 'MESSZEN AI ASSISTANT',
        safe: 'Nothing is saved until you review and confirm every detail',
        command: 'Write a command',
        tryCommand: 'Quick examples',
        suggestions: 'suggestions',
        exampleHint: 'Tap an example to use it as your command',
        processing: 'AI is analyzing your command',
      }
  useEffect(() => {
    api.getAiCapabilities(locale)
      .then((response) => {
        setEnabled(response.data.enabled)
        setVoiceEnabled(response.data.voice.enabled)
      })
      .catch(() => {
        setEnabled(null)
        setVoiceEnabled(null)
      })
  }, [locale])

  const receiveCommand = useCallback((next: AiCommand) => {
    setCommand(next)
    setPayload(next.payload ?? {})
    setText(next.transcript ?? next.input ?? '')
  }, [])

  const sendVoice = useCallback(async (blob: Blob) => {
    if (!activeMess?.id) return
    setBusy(true)
    setError(null)
    try {
      const response = await api.createAiVoiceCommand({
        messId: activeMess.id,
        audio: blob,
        locale,
        speechLanguage: locale,
        idempotencyKey: crypto.randomUUID(),
      })
      receiveCommand(response.data)
    } catch (value) {
      setError(value)
    } finally {
      setBusy(false)
    }
  }, [activeMess?.id, locale, receiveCommand])

  const recorder = useAudioRecorder(sendVoice, 60)

  const submitText = async (event: FormEvent) => {
    event.preventDefault()
    if (!activeMess?.id || !text.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      const response = await api.createAiTextCommand({
        messId: activeMess.id,
        text: text.trim(),
        locale,
        idempotencyKey: crypto.randomUUID(),
      })
      receiveCommand(response.data)
    } catch (value) {
      setError(value)
    } finally {
      setBusy(false)
    }
  }

  const confirm = async () => {
    if (!command || busy) return
    setBusy(true)
    setError(null)
    try {
      const response = await api.confirmAiCommand(command.id, payload)
      setCommand(response.data)
      setPayload(response.data.payload ?? payload)
    } catch (value) {
      setError(value)
    } finally {
      setBusy(false)
    }
  }

  const reset = async (cancelPending = false) => {
    if (cancelPending && command && (command.status === 'PENDING' || command.status === 'NEEDS_CLARIFICATION')) {
      api.cancelAiCommand(command.id).catch(() => undefined)
    }
    setCommand(null)
    setPayload({})
    setText('')
    setError(null)
  }

  const memberOptions = useMemo(() => members.map((member) => ({ value: member.id, label: member.name })), [members])
  const completed = command?.status === 'CONFIRMED'
  const intentLabel = command ? label(command.intent) : ''
  const payloadItems = Array.isArray(payload.items)
    ? payload.items as Array<Record<string, unknown>>
    : null
  const expenseItems = command && ['EXPENSE_CREATE', 'UTILITY_CREATE'].includes(command.intent)
    ? payloadItems ?? []
    : null
  const mealItems = command?.intent === 'MEAL_CREATE'
    ? payloadItems ?? [payload]
    : null
  const patchPayloadItem = (index: number, patch: Record<string, unknown>) => {
    setPayload((current) => {
      if (!Array.isArray(current.items)) return { ...current, ...patch }
      return {
        ...current,
        items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
      }
    })
  }
  const patchPayload = (patch: Record<string, unknown>) => {
    setPayload((current) => ({ ...current, ...patch }))
  }
  const removePayloadItem = (index: number) => {
    setPayload((current) => ({
      ...current,
      items: Array.isArray(current.items)
        ? current.items.filter((_item, itemIndex) => itemIndex !== index)
        : current.items,
    }))
  }
  const replacePayloadItems = (items: Array<Record<string, unknown>>) => {
    setPayload((current) => ({ ...current, items }))
  }
  const isExpenseReview = Boolean(
    command
      && !completed
      && command.status === 'PENDING'
      && expenseItems
      && (command.intent === 'EXPENSE_CREATE' || command.intent === 'UTILITY_CREATE'),
  )
  const isDepositReview = Boolean(
    command && !completed && command.status === 'PENDING' && command.intent === 'DEPOSIT_CREATE',
  )
  const isCanonicalEntryReview = isExpenseReview || isDepositReview
  const reviewTitle = isExpenseReview
    ? command?.intent === 'UTILITY_CREATE' ? copy.addUtility : copy.addExpense
    : isDepositReview
      ? copy.submitDeposit
      : copy.title
  if (messLoading) return <LoadingIndicator variant="screen" label={copy.loadingWorkspace} />

  return (
    <MobileShell>
      <AppHeader
        title={reviewTitle}
        subtitle={isCanonicalEntryReview ? copy.reviewSubtitle : copy.subtitle}
        backHref="/"
        trailing={<NotificationLink />}
      />

      <div className={`screen space-y-3.5 pb-8 ${isCanonicalEntryReview ? 'expense-form-screen' : ''}`}>
        {messStatus !== 'connected' ? <Notice tone="warning">{copy.messRequired}</Notice> : null}
        {enabled === false ? <Notice tone="warning">{copy.disabled}</Notice> : null}

        {!command ? (
          <>
            <section className="quick-add-hero" aria-labelledby="quick-add-hero-title">
              <span className="quick-add-hero-glow" aria-hidden="true" />
              <span className="quick-add-hero-dots" aria-hidden="true" />
              <div className="quick-add-hero-heading">
                <span className="quick-add-hero-icon" aria-hidden="true">
                  <WandSparkles size={23} strokeWidth={2.2} />
                </span>
                <div>
                  <p>{experienceCopy.assistant}</p>
                  <h2 id="quick-add-hero-title">{copy.intro}</h2>
                </div>
              </div>

              <div className="quick-add-capabilities" aria-label={tCommon('supportedEntryTypes')}>
                <span><ReceiptText size={14} /> {copy.expenseType}</span>
                <span><Zap size={14} /> {copy.utilityType}</span>
                <span><WalletCards size={14} /> {copy.depositType}</span>
                <span><UtensilsCrossed size={14} /> {copy.mealType}</span>
              </div>

              <div className="quick-add-safety-note">
                <BadgeCheck size={16} strokeWidth={2.3} aria-hidden="true" />
                <span>{experienceCopy.safe}</span>
              </div>
            </section>

            <form onSubmit={submitText} className="quick-add-composer">
              <div className="quick-add-composer-heading">
                <div>
                  <span className="quick-add-composer-icon" aria-hidden="true"><MessageSquareText size={18} /></span>
                  <div>
                    <p>{experienceCopy.command}</p>
                    <h2>{copy.inputLabel}</h2>
                  </div>
                </div>
                <span className="quick-add-character-count">{text.length}/2000</span>
              </div>

              <div className="quick-add-textarea-shell" data-has-value={text.trim() ? 'true' : 'false'}>
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder={copy.placeholder}
                  maxLength={2000}
                  disabled={busy || recorder.isRecording}
                  aria-describedby="quick-add-text-help"
                />
                <div className="quick-add-textarea-footer">
                  <div id="quick-add-text-help" className="quick-add-input-status" aria-live="polite">
                    {recorder.isRecording ? <AudioLines size={14} aria-hidden="true" /> : <Sparkles size={13} aria-hidden="true" />}
                    <span>
                      {recorder.isRecording
                        ? `${copy.recording} · ${copy.recordingProgress(recorder.seconds)}`
                        : busy
                          ? experienceCopy.processing
                          : copy.supportedLanguages}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="quick-add-inline-voice"
                    data-recording={recorder.isRecording ? 'true' : 'false'}
                    onClick={() => recorder.isRecording ? recorder.stop() : void recorder.start()}
                    disabled={!recorder.supported || busy || enabled === false || voiceEnabled === false}
                    aria-label={recorder.isRecording ? copy.stop : copy.record}
                    aria-pressed={recorder.isRecording}
                    title={recorder.isRecording ? copy.stop : copy.record}
                  >
                    {recorder.isRecording ? <Square size={16} fill="currentColor" /> : <Mic size={19} />}
                  </button>
                </div>
                {recorder.isRecording ? (
                  <div className="quick-add-inline-waveform" aria-hidden="true">
                    {Array.from({ length: 18 }, (_value, index) => <span key={index} />)}
                  </div>
                ) : null}
              </div>

              <button type="submit" className="quick-add-generate" disabled={!text.trim() || busy || enabled === false}>
                <span className="quick-add-generate-icon" aria-hidden="true"><Sparkles size={18} /></span>
                <span>{busy ? copy.generating : copy.generate}</span>
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            </form>

            <section className="quick-add-examples-card" aria-labelledby="quick-add-examples-title">
              <div className="quick-add-examples-heading">
                <div>
                  <span id="quick-add-examples-title">{experienceCopy.tryCommand}</span>
                  <p>{experienceCopy.exampleHint}</p>
                </div>
                <small>{QUICK_EXAMPLES.length} {experienceCopy.suggestions}</small>
              </div>

              <div className="quick-add-examples">
                {QUICK_EXAMPLES.map((example) => {
                  const ExampleIcon = example.icon
                  return (
                    <button key={example.text} type="button" className="quick-add-example" onClick={() => setText(example.text)} disabled={busy || recorder.isRecording}>
                      <span className="quick-add-example-icon" aria-hidden="true"><ExampleIcon size={15} /></span>
                      <span className="quick-add-example-copy">
                        <small>{example.language}</small>
                        <strong>{example.text}</strong>
                      </span>
                      <ArrowRight size={14} aria-hidden="true" />
                    </button>
                  )
                })}
              </div>
            </section>
            {!recorder.supported ? <Notice tone="info">{copy.unsupportedVoice}</Notice> : null}
            {voiceEnabled === false ? <Notice tone="warning">{copy.voiceDisabled}</Notice> : null}
            {recorder.error ? <Notice tone="danger">{copy.microphoneDenied}</Notice> : null}
          </>
        ) : completed ? (
          <HomeCard className="py-7 text-center">
            <CheckCircle2 size={52} className="mx-auto text-[#008d8c]" />
            <h2 className="mt-4 text-title-sm font-bold text-[#123748]">
              {command.intent === 'DEPOSIT_CREATE' && !canManage ? copy.depositSubmitted : copy.success}
            </h2>
            <p className="mt-2 text-label text-[#65838b]">
              {command.intent === 'DEPOSIT_CREATE' && !canManage ? copy.pendingApproval : intentLabel}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" className="ui-btn ui-btn--secondary" onClick={() => void reset()}>{copy.newCommand}</button>
              <button type="button" className="ui-btn ui-btn--primary" onClick={() => router.replace(appHref(command.result?.redirectTo ?? '/'))}>{copy.view}</button>
            </div>
          </HomeCard>
        ) : (
          <>
            {!isCanonicalEntryReview ? (
            <HomeCard title={copy.preview} caption={copy.previewHelp}>
              <div className="mb-4 flex items-center justify-between rounded-xl bg-[#edfafa] px-3 py-2">
                <span className="text-label font-bold text-[#00777a]">{intentLabel}</span>
                {command.confidence != null ? <span className="text-caption font-semibold text-[#65838b]">{Math.round(command.confidence * 100)}%</span> : null}
              </div>
              {command.transcript ? <Notice tone="info" className="mb-4"><strong>{copy.transcript}:</strong> {command.transcript}</Notice> : null}
              {command.clarification ? <Notice tone="warning" className="mb-4">{command.clarification}</Notice> : null}

              <div className="grid gap-3">
                {mealItems ? (
                  <AiMealPreview
                    items={mealItems}
                    members={memberOptions}
                    locale={locale}
                    onPatchItem={patchPayloadItem}
                    onRemoveItem={removePayloadItem}
                  />
                ) : null}
              </div>
            </HomeCard>
            ) : null}

            {command.status === 'PENDING' && expenseItems && (command.intent === 'EXPENSE_CREATE' || command.intent === 'UTILITY_CREATE') ? (
              <AiExpensePreview
                key={command.id}
                intent={command.intent}
                payload={payload}
                items={expenseItems}
                members={members}
                canManage={canManage}
                disabled={busy}
                onPatchPayload={patchPayload}
                onReplaceItems={replacePayloadItems}
                onCancel={() => void reset(true)}
                onConfirm={() => void confirm()}
              />
            ) : null}

            {command.status === 'PENDING' && command.intent === 'DEPOSIT_CREATE' ? (
              <AiDepositPreview
                key={command.id}
                payload={payload}
                members={members}
                canManage={canManage}
                currentUserId={user?.id}
                disabled={busy}
                onPatch={patchPayload}
                onCancel={() => void reset(true)}
                onConfirm={() => void confirm()}
              />
            ) : null}

            {errorMessage ? <Notice tone="danger">{errorMessage}</Notice> : null}
            {!isCanonicalEntryReview ? (
            <div className="grid grid-cols-[0.85fr_1.4fr] gap-2">
              <button type="button" className="ui-btn ui-btn--secondary" disabled={busy} onClick={() => void reset(true)}>{copy.cancel}</button>
              <button type="button" className="ui-btn ui-btn--primary" disabled={busy || command.intent === 'UNKNOWN' || command.intent === 'NEEDS_CLARIFICATION'} onClick={() => void confirm()}>
                {busy ? copy.confirming : copy.confirm}
              </button>
            </div>
            ) : null}
          </>
        )}

        {errorMessage && !command ? <Notice tone="danger">{errorMessage}</Notice> : null}
      </div>
    </MobileShell>
  )
}
