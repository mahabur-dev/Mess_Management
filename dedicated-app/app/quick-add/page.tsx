'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Mic, Sparkles, Square, WandSparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { AppHeader } from '@/components/app-header'
import { HomeCard } from '@/components/home-card'
import { LoadingIndicator } from '@/components/loading-indicator'
import { MobileShell } from '@/components/mobile-shell'
import { Notice } from '@/components/ui/notice'
import { useActiveMess } from '@/hooks/use-active-mess'
import { useAudioRecorder } from '@/hooks/use-audio-recorder'
import { useMessMemberOptions } from '@/hooks/use-mess-member-options'
import { aiCopy, type AiCommand, type AiLocale } from '@/lib/ai-automation'
import { api } from '@/lib/api'
import { appHref } from '@/lib/routes'

const CATEGORIES = ['GROCERY', 'FOOD', 'RENT', 'GAS', 'ELECTRICITY', 'WIFI', 'CLEANER', 'MAINTENANCE', 'BUABILL', 'WATER', 'OTHER']
const UTILITY_TYPES = ['ELECTRICITY', 'GAS', 'WATER', 'WIFI', 'CLEANING', 'OTHER']
const MEALS = ['BREAKFAST', 'LUNCH', 'DINNER']

function label(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function InputField({
  label: fieldLabel,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: unknown
  onChange: (value: string) => void
  type?: string
}) {
  return (
    <label className="block">
      <span className="ui-field-label mb-2 block">{fieldLabel}</span>
      <input className="field min-h-14" type={type} value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function SelectField({
  label: fieldLabel,
  value,
  options,
  onChange,
}: {
  label: string
  value: unknown
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="ui-field-label mb-2 block">{fieldLabel}</span>
      <select className="field min-h-14" value={String(value ?? '')} onChange={(event) => onChange(event.target.value)}>
        <option value="">—</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  )
}

export default function QuickAddPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { activeMess, isLoading: messLoading, status: messStatus } = useActiveMess(user)
  const members = useMessMemberOptions(activeMess?.id ?? '', user)
  const [locale, setLocale] = useState<AiLocale>('en')
  const [text, setText] = useState('')
  const [command, setCommand] = useState<AiCommand | null>(null)
  const [payload, setPayload] = useState<Record<string, unknown>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const copy = aiCopy(locale)

  useEffect(() => {
    const stored = window.localStorage.getItem('messzen:ai-locale')
    if (stored === 'bn' || stored === 'en') {
      setLocale(stored)
      return
    }

    // Keep the previous voice preference when upgrading to the single
    // language selector.
    const storedSpeechLanguage = window.localStorage.getItem('messzen:ai-speech-language')
    if (storedSpeechLanguage === 'bn' || storedSpeechLanguage === 'en') {
      setLocale(storedSpeechLanguage)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem('messzen:ai-locale', locale)
    window.localStorage.setItem('messzen:ai-speech-language', locale)
    api.getAiCapabilities(locale).then((response) => setEnabled(response.data.enabled)).catch(() => setEnabled(null))
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
        speechLanguage: locale,
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

  const update = (key: string, value: unknown) => setPayload((current) => ({ ...current, [key]: value }))

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
  const expenseItems = Array.isArray(payload.items)
    ? payload.items as Array<Record<string, unknown>>
    : null
  const updateItem = (index: number, key: string, value: unknown) => {
    setPayload((current) => ({
      ...current,
      items: Array.isArray(current.items)
        ? current.items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item)
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
            <HomeCard className="overflow-hidden border border-[#cdebea] bg-[linear-gradient(145deg,#ffffff_15%,#edfafa_100%)]">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#008d8c] text-white shadow-[0_10px_22px_rgba(0,141,140,0.22)]">
                  <WandSparkles size={21} />
                </span>
                <div>
                  <p className="text-body font-bold text-[#123748]">{copy.intro}</p>
                  <p className="mt-1 text-caption leading-5 text-[#65838b]">Nothing is saved until you review and confirm.</p>
                </div>
              </div>
            </HomeCard>

            <form onSubmit={submitText}>
              <HomeCard title={copy.inputLabel}>
                <textarea
                  className="field min-h-32 resize-none py-3"
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder={copy.placeholder}
                  maxLength={2000}
                  disabled={busy || recorder.isRecording}
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {copy.examples.map((example) => (
                    <button key={example} type="button" className="quick-add-example" onClick={() => setText(example)}>
                      {example}
                    </button>
                  ))}
                </div>
                <button type="submit" className="ui-btn ui-btn--primary quick-add-button mt-4 w-full" disabled={!text.trim() || busy || enabled === false}>
                  <Sparkles size={18} /> {busy ? copy.generating : copy.generate}
                </button>
              </HomeCard>
            </form>

            <div className="relative flex items-center gap-3 py-1 text-caption font-semibold text-[#7b9299]">
              <span className="h-px flex-1 bg-[#d6e5e8]" /><span>OR</span><span className="h-px flex-1 bg-[#d6e5e8]" />
            </div>

            <button
              type="button"
              onClick={() => recorder.isRecording ? recorder.stop() : void recorder.start()}
              disabled={!recorder.supported || busy || enabled === false}
              className={`ui-btn quick-add-button w-full ${recorder.isRecording ? 'quick-add-button--recording' : 'ui-btn--secondary'}`}
            >
              {recorder.isRecording ? <Square size={16} fill="currentColor" /> : <Mic size={18} />}
              {recorder.isRecording ? `${copy.stop} · ${recorder.seconds}s` : copy.record}
            </button>
            {!recorder.supported ? <Notice tone="info">{copy.unsupportedVoice}</Notice> : null}
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
                {expenseItems && ['EXPENSE_CREATE', 'UTILITY_CREATE'].includes(command.intent) ? expenseItems.map((item, index) => (
                  <div key={index} className="grid gap-3 rounded-2xl border border-[#d6e5e8] bg-[#fbfefe] p-3">
                    <p className="text-label font-bold text-[#00777a]">{copy.fields.itemName} {index + 1}</p>
                    <InputField label={copy.fields.amount} type="number" value={item.amount} onChange={(value) => updateItem(index, 'amount', value === '' ? '' : Number(value))} />
                    {command.intent === 'EXPENSE_CREATE' ? (
                      <SelectField label={copy.fields.category} value={item.category} options={CATEGORIES.map((value) => ({ value, label: label(value) }))} onChange={(value) => updateItem(index, 'category', value)} />
                    ) : (
                      <SelectField label={copy.fields.utilityType} value={item.utilityType} options={UTILITY_TYPES.map((value) => ({ value, label: label(value) }))} onChange={(value) => updateItem(index, 'utilityType', value)} />
                    )}
                    <InputField label={copy.fields.itemName} value={item.itemName} onChange={(value) => updateItem(index, 'itemName', value)} />
                    <div className="grid grid-cols-2 gap-2">
                      <InputField label={locale === 'bn' ? 'পরিমাণ' : 'Quantity'} type="number" value={item.quantity} onChange={(value) => updateItem(index, 'quantity', value === '' ? null : Number(value))} />
                      <InputField label={locale === 'bn' ? 'ইউনিট' : 'Unit'} value={item.unit} onChange={(value) => updateItem(index, 'unit', value)} />
                    </div>
                    <InputField label={copy.fields.date} type="date" value={item.expenseDate ?? item.date} onChange={(value) => updateItem(index, 'expenseDate', value)} />
                    <InputField label={copy.fields.description} value={item.description} onChange={(value) => updateItem(index, 'description', value)} />
                  </div>
                )) : (
                  <>
                    {['EXPENSE_CREATE', 'UTILITY_CREATE', 'DEPOSIT_CREATE'].includes(command.intent) ? (
                      <InputField label={copy.fields.amount} type="number" value={payload.amount} onChange={(value) => update('amount', value === '' ? '' : Number(value))} />
                    ) : null}
                    {command.intent === 'EXPENSE_CREATE' ? (
                      <SelectField label={copy.fields.category} value={payload.category} options={CATEGORIES.map((value) => ({ value, label: label(value) }))} onChange={(value) => update('category', value)} />
                    ) : null}
                    {command.intent === 'UTILITY_CREATE' ? (
                      <SelectField label={copy.fields.utilityType} value={payload.utilityType} options={UTILITY_TYPES.map((value) => ({ value, label: label(value) }))} onChange={(value) => update('utilityType', value)} />
                    ) : null}
                    {['EXPENSE_CREATE', 'UTILITY_CREATE'].includes(command.intent) ? (
                      <InputField label={copy.fields.itemName} value={payload.itemName} onChange={(value) => update('itemName', value)} />
                    ) : null}
                  </>
                )}
                {['DEPOSIT_CREATE', 'MEAL_CREATE'].includes(command.intent) ? (
                  <SelectField label={copy.fields.memberId} value={payload.memberId} options={memberOptions} onChange={(value) => update('memberId', value)} />
                ) : null}
                {command.intent === 'MEAL_CREATE' ? (
                  <>
                    <SelectField label={copy.fields.mealName} value={payload.mealName} options={MEALS.map((value) => ({ value, label: label(value) }))} onChange={(value) => update('mealName', value)} />
                    <SelectField label={copy.fields.status} value={payload.status} options={[{ value: 'ON', label: 'On' }, { value: 'OFF', label: 'Off' }]} onChange={(value) => update('status', value)} />
                    <InputField label={copy.fields.mealCount} type="number" value={payload.mealCount} onChange={(value) => update('mealCount', value === '' ? undefined : Number(value))} />
                  </>
                ) : null}
                {['EXPENSE_CREATE', 'UTILITY_CREATE', 'DEPOSIT_CREATE', 'MEAL_CREATE'].includes(command.intent) ? (
                  <InputField label={copy.fields.date} type="date" value={payload.expenseDate ?? payload.date} onChange={(value) => update(command.intent === 'EXPENSE_CREATE' || command.intent === 'UTILITY_CREATE' ? 'expenseDate' : 'date', value)} />
                ) : null}
                {!expenseItems && ['EXPENSE_CREATE', 'UTILITY_CREATE'].includes(command.intent) ? (
                  <InputField label={copy.fields.description} value={payload.description} onChange={(value) => update('description', value)} />
                ) : command.intent === 'DEPOSIT_CREATE' ? (
                  <InputField label={copy.fields.description} value={payload.note} onChange={(value) => update('note', value)} />
                ) : null}
              </div>
            </HomeCard>

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
