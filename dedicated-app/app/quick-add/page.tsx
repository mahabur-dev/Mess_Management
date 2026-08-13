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
import { AppHeader } from '@/components/app-header'
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
import { aiCopy, type AiCommand, type AiLocale } from '@/lib/ai-automation'
import { api } from '@/lib/api'
import { appHref } from '@/lib/routes'
import { canManageMess } from '@/lib/app-permissions'

function label(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default function QuickAddPage() {
  const router = useRouter()
  const { user } = useAuth()
  const canManage = canManageMess(user)
  const { activeMess, isLoading: messLoading, status: messStatus } = useActiveMess(user)
  const members = useMessMemberOptions(activeMess?.id ?? '', user)
  const [locale, setLocale] = useState<AiLocale>('en')
  const [text, setText] = useState('')
  const [command, setCommand] = useState<AiCommand | null>(null)
  const [payload, setPayload] = useState<Record<string, unknown>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [voiceEnabled, setVoiceEnabled] = useState<boolean | null>(null)
  const copy = aiCopy(locale)
  const experienceCopy = locale === 'bn'
    ? {
        assistant: 'MESSZEN AI ASSISTANT',
        safe: 'আপনি যাচাই করে নিশ্চিত না করা পর্যন্ত কিছুই সেভ হবে না',
        command: 'কমান্ড লিখুন',
        tryCommand: 'দ্রুত উদাহরণ',
        suggestions: 'টি সাজেশন',
        voiceTitle: 'কথা বলে দ্রুত যোগ করুন',
        voiceHint: 'বাংলা, English বা Banglish—স্বাভাবিকভাবে বলুন',
        voiceReady: 'রেকর্ডিং শুরু করতে চাপ দিন',
        processing: 'AI আপনার কমান্ড বিশ্লেষণ করছে',
      }
    : {
        assistant: 'MESSZEN AI ASSISTANT',
        safe: 'Nothing is saved until you review and confirm every detail',
        command: 'Write a command',
        tryCommand: 'Quick examples',
        suggestions: 'suggestions',
        voiceTitle: 'Add faster with your voice',
        voiceHint: 'Speak naturally in Bangla, English, or Banglish',
        voiceReady: 'Tap the microphone to start',
        processing: 'AI is analyzing your command',
      }
  const exampleIcons = [ReceiptText, WalletCards, UtensilsCrossed]

  useEffect(() => {
    const stored = window.localStorage.getItem('messzen:ai-locale')
    if (stored === 'bn' || stored === 'en') {
      setLocale(stored)
      return
    }

  }, [])

  useEffect(() => {
    window.localStorage.setItem('messzen:ai-locale', locale)
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
    setError('')
    try {
      const response = await api.createAiVoiceCommand({
        messId: activeMess.id,
        audio: blob,
        locale,
        speechLanguage: 'auto',
        idempotencyKey: crypto.randomUUID(),
      })
      receiveCommand(response.data)
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Voice command failed.')
    } finally {
      setBusy(false)
    }
  }, [activeMess?.id, locale, receiveCommand])

  const recorder = useAudioRecorder(sendVoice, 60)

  const submitText = async (event: FormEvent) => {
    event.preventDefault()
    if (!activeMess?.id || !text.trim() || busy) return
    setBusy(true)
    setError('')
    try {
      const response = await api.createAiTextCommand({
        messId: activeMess.id,
        text: text.trim(),
        locale,
        idempotencyKey: crypto.randomUUID(),
      })
      receiveCommand(response.data)
    } catch (value) {
      setError(value instanceof Error ? value.message : 'AI command failed.')
    } finally {
      setBusy(false)
    }
  }

  const confirm = async () => {
    if (!command || busy) return
    setBusy(true)
    setError('')
    try {
      const response = await api.confirmAiCommand(command.id, payload)
      setCommand(response.data)
      setPayload(response.data.payload ?? payload)
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Could not save the command.')
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
    setError('')
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

  if (messLoading) return <LoadingIndicator variant="screen" label="Loading mess workspace" />

  return (
    <MobileShell>
      <AppHeader title={copy.title} subtitle={copy.subtitle} backHref="/" trailing={(
        <div className="quick-add-language-select">
          <button
            type="button"
            onClick={() => setLocale((current) => current === 'en' ? 'bn' : 'en')}
            disabled={busy || recorder.isRecording}
            aria-label={locale === 'en' ? 'Switch to Bangla' : 'Switch to English'}
            title={locale === 'en' ? 'বাংলা' : 'English'}
          >
            {locale === 'en' ? 'En' : 'বাং'}
          </button>
        </div>
      )} />

      <div className="screen space-y-3.5 pb-8">
        {messStatus !== 'connected' ? <Notice tone="warning">Connect to a mess workspace before using AI Quick Add.</Notice> : null}
        {enabled === false ? <Notice tone="warning">{copy.disabled}</Notice> : null}

        {!command ? (
          <>
            <section className="quick-add-hero" aria-labelledby="quick-add-hero-title">
              <span className="quick-add-hero-glow" aria-hidden="true" />
              <div className="quick-add-hero-heading">
                <span className="quick-add-hero-icon" aria-hidden="true">
                  <WandSparkles size={23} strokeWidth={2.2} />
                </span>
                <div>
                  <p>{experienceCopy.assistant}</p>
                  <h2 id="quick-add-hero-title">{copy.intro}</h2>
                </div>
              </div>

              <div className="quick-add-capabilities" aria-label="Supported entry types">
                <span><ReceiptText size={14} /> Expense</span>
                <span><Zap size={14} /> Utility</span>
                <span><WalletCards size={14} /> Deposit</span>
                <span><UtensilsCrossed size={14} /> Meal</span>
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
                <div id="quick-add-text-help" className="quick-add-input-status">
                  <Sparkles size={13} aria-hidden="true" />
                  <span>Bangla · English · Banglish</span>
                </div>
              </div>

              <div className="quick-add-examples-heading">
                <span>{experienceCopy.tryCommand}</span>
                <small>{copy.examples.length} {experienceCopy.suggestions}</small>
              </div>

              <div className="quick-add-examples">
                {copy.examples.map((example, index) => {
                  const ExampleIcon = exampleIcons[index] ?? Sparkles
                  return (
                    <button key={example} type="button" className="quick-add-example" onClick={() => setText(example)} disabled={busy || recorder.isRecording}>
                      <span aria-hidden="true"><ExampleIcon size={15} /></span>
                      <strong>{example}</strong>
                      <ArrowRight size={14} aria-hidden="true" />
                    </button>
                  )
                })}
              </div>

              <button type="submit" className="quick-add-generate" disabled={!text.trim() || busy || enabled === false}>
                <span className="quick-add-generate-icon" aria-hidden="true"><Sparkles size={18} /></span>
                <span>{busy ? copy.generating : copy.generate}</span>
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            </form>

            <section className="quick-add-voice-card" data-recording={recorder.isRecording ? 'true' : 'false'}>
              <div className="quick-add-voice-copy">
                <span className="quick-add-voice-label"><AudioLines size={15} /> VOICE COMMAND</span>
                <h2>{experienceCopy.voiceTitle}</h2>
                <p>{recorder.isRecording ? `${copy.recording} · ${recorder.seconds}s` : busy ? experienceCopy.processing : experienceCopy.voiceHint}</p>
              </div>

              <button
                type="button"
                onClick={() => recorder.isRecording ? recorder.stop() : void recorder.start()}
                disabled={!recorder.supported || busy || enabled === false || voiceEnabled === false}
                className="quick-add-voice-trigger"
                aria-label={recorder.isRecording ? copy.stop : copy.record}
              >
                <span className="quick-add-voice-ripple" aria-hidden="true" />
                <span className="quick-add-voice-orb" aria-hidden="true">
                  {recorder.isRecording ? <Square size={18} fill="currentColor" /> : <Mic size={23} />}
                </span>
                <strong>{recorder.isRecording ? copy.stop : copy.record}</strong>
                <small>{recorder.isRecording ? `${recorder.seconds}s / 60s` : experienceCopy.voiceReady}</small>
              </button>

              {recorder.isRecording ? (
                <div className="quick-add-waveform" aria-hidden="true">
                  {Array.from({ length: 22 }, (_value, index) => <span key={index} />)}
                </div>
              ) : null}
            </section>
            {!recorder.supported ? <Notice tone="info">{copy.unsupportedVoice}</Notice> : null}
            {voiceEnabled === false ? <Notice tone="warning">{copy.voiceDisabled}</Notice> : null}
            {recorder.error ? <Notice tone="danger">{copy.microphoneDenied}</Notice> : null}
          </>
        ) : completed ? (
          <HomeCard className="py-7 text-center">
            <CheckCircle2 size={52} className="mx-auto text-[#008d8c]" />
            <h2 className="mt-4 text-title-sm font-bold text-[#123748]">{copy.success}</h2>
            <p className="mt-2 text-label text-[#65838b]">{intentLabel}</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" className="ui-btn ui-btn--secondary" onClick={() => void reset()}>{copy.newCommand}</button>
              <button type="button" className="ui-btn ui-btn--primary" onClick={() => router.replace(appHref(command.result?.redirectTo ?? '/'))}>View</button>
            </div>
          </HomeCard>
        ) : (
          <>
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

            {expenseItems && (command.intent === 'EXPENSE_CREATE' || command.intent === 'UTILITY_CREATE') ? (
              <AiExpensePreview
                key={command.id}
                intent={command.intent}
                payload={payload}
                items={expenseItems}
                initialPreview={command.preview}
                members={members}
                currentUserId={user?.id}
                canManage={canManage}
                disabled={busy}
                onPatchPayload={patchPayload}
                onPatchItem={patchPayloadItem}
                onRemoveItem={removePayloadItem}
              />
            ) : null}

            {command.intent === 'DEPOSIT_CREATE' ? (
              <AiDepositPreview
                key={command.id}
                payload={payload}
                members={members}
                disabled={busy}
                onPatch={(patch) => patchPayloadItem(0, patch)}
              />
            ) : null}

            {error ? <Notice tone="danger">{error}</Notice> : null}
            <div className="grid grid-cols-[0.85fr_1.4fr] gap-2">
              <button type="button" className="ui-btn ui-btn--secondary" disabled={busy} onClick={() => void reset(true)}>{copy.cancel}</button>
              <button type="button" className="ui-btn ui-btn--primary" disabled={busy || command.intent === 'UNKNOWN' || command.intent === 'NEEDS_CLARIFICATION'} onClick={() => void confirm()}>
                {busy ? copy.confirming : copy.confirm}
              </button>
            </div>
          </>
        )}

        {error && !command ? <Notice tone="danger">{error}</Notice> : null}
      </div>
    </MobileShell>
  )
}
