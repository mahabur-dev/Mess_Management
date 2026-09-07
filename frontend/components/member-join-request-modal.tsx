'use client'

import { useEffect, useMemo, useState } from 'react'
import { Building2, Loader2, MapPin, Send, X } from 'lucide-react'
import { apiClient, type Mess } from '@/lib/api-client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { localizedErrorMessage, useLocale, useTranslations } from '@/lib/i18n'

type MemberJoinRequestModalProps = {
  open: boolean
  onClose: () => void
  onSubmitted?: () => void
  hasPendingRequest?: boolean
}

export function MemberJoinRequestModal({ open, onClose, onSubmitted, hasPendingRequest = false }: MemberJoinRequestModalProps) {
  const { locale } = useLocale()
  const common = useTranslations('common')
  const t = useTranslations('dashboard')
  const [messes, setMesses] = useState<Mess[]>([])
  const [selectedMessId, setSelectedMessId] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const selectedMess = useMemo(
    () => messes.find((mess) => mess.id === selectedMessId) ?? null,
    [messes, selectedMessId],
  )

  useEffect(() => {
    if (!open) return

    let cancelled = false
    setLoading(true)
    setError('')

    apiClient
      .getActiveMesses({ limit: 100 })
      .then((response) => {
        if (cancelled) return
        const list = Array.isArray(response.data) ? response.data : []
        setMesses(list)
        setSelectedMessId((current) => current || list[0]?.id || '')
      })
      .catch((error) => {
        if (!cancelled) {
          setError(localizedErrorMessage(error, locale, t('joinRequest.loadError')))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [locale, open, t])

  if (!open) return null

  async function submit() {
    if (hasPendingRequest) return
    if (!selectedMessId) {
      setError(t('joinRequest.selectRequired'))
      return
    }

    setError('')
    setSubmitting(true)

    try {
      await apiClient.requestMemberJoin(selectedMessId)
      onSubmitted?.()
      onClose()
    } catch (error) {
      setError(localizedErrorMessage(error, locale, t('joinRequest.sendError')))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-[500px] overflow-hidden rounded-lg border border-border bg-background">
        <div className="absolute inset-x-0 top-0 h-1.5  bg-primary  " />

        <div className="relative flex items-center justify-between border-b border-border px-5 py-5 sm:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">{t('joinRequest.eyebrow')}</p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">{t('joinRequest.title')}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted text-primary transition hover:border-primary hover:bg-muted"
            aria-label={common('close')}
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative p-5 sm:p-6">
          <label htmlFor="join-request-mess" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {t('joinRequest.selectMess')}
          </label>
          <Select value={selectedMessId} onValueChange={setSelectedMessId} disabled={loading || messes.length === 0}>
            <SelectTrigger id="join-request-mess" className="h-[48px] w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground shadow-none outline-none focus:border-primary focus:ring-4 focus:ring-primary/20">
              <SelectValue placeholder={loading ? t('joinRequest.loadingMesses') : t('joinRequest.selectActive')} />
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-border bg-background ">
              {messes.map((mess) => (
                <SelectItem
                  key={mess.id}
                  value={mess.id}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-foreground focus:bg-muted focus:text-primary"
                >
                  {mess.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedMess && (
            <div className="mt-4 rounded-xl border border-border bg-muted p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted text-primary">
                  <Building2 size={18} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{selectedMess.name}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                    <MapPin size={12} className="shrink-0 text-primary" />
                    <span className="truncate">{selectedMess.address || t('joinRequest.noAddress')}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {!loading && messes.length === 0 && (
            <div className="mt-4 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
              {t('joinRequest.noneAvailable')}
            </div>
          )}

          {error && (
            <div role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
              {error}
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1.5fr]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="h-12 rounded-xl border border-border bg-background px-4 font-semibold text-muted-foreground transition hover:bg-muted disabled:opacity-60"
            >
              {common('cancel')}
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={loading || submitting || hasPendingRequest || !selectedMessId}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl  bg-primary  px-4 font-semibold text-primary-foreground  transition  disabled:opacity-70"
            >
              {submitting || loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              {hasPendingRequest ? t('joinRequest.pending') : submitting ? t('joinRequest.sending') : t('joinRequest.send')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
