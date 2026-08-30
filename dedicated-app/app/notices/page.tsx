'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bell, Send } from 'lucide-react'
import { MessOnboardingActions } from '@/components/mess-onboarding-actions'
import { LoadingIndicator } from '@/components/loading-indicator'
import { InlineNotice } from '@/components/mobile/meals-design'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { SelectField, TextAreaField, TextField, ToggleField } from '@/components/mobile/form-controls'
import { PersonalFormModal } from '@/features/personal/components/personal-form-modal'
import { AddActionButton, Button } from '@/components/ui'
import { api } from '@/lib/api'
import { canManageMess, getActiveMessId } from '@/lib/app-permissions'
import { NOTICE_TYPES, type NoticeType } from '@/lib/form-options'
import { noticeTypeLabel, useLocale, useLocaleFormatters, useLocalizedNotice, useTranslations } from '@/lib/i18n'
import { useAuth } from '../providers'

type FormState = {
  type: NoticeType
  title: string
  body: string
  isPinned: boolean
}

type NoticeItem = {
  id: string
  type: NoticeType
  title: string
  body: string
  is_pinned?: boolean
  created_at?: string
  creator?: { name: string }
}

const INITIAL_FORM: FormState = {
  type: 'GENERAL',
  title: '',
  body: '',
  isPinned: false,
}

export default function NoticesPage() {
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const t = useTranslations('communication')
  const common = useTranslations('common')
  const { notice, clearNotice, showError, showMessage } = useLocalizedNotice('communication')
  const { user } = useAuth()
  const messId = useMemo(() => getActiveMessId(user), [user])
  const canSendNotice = canManageMess(user)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [items, setItems] = useState<NoticeItem[]>([])

  useEffect(() => {
    if (!messId) {
      setItems([])
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)

    api
      .getNoticesByMess(messId, { limit: 30, sortBy: 'created_at', sortOrder: 'desc' })
      .then((res) => {
        if (alive) setItems(Array.isArray(res.data) ? res.data : [])
      })
      .catch((error) => {
        if (alive) setItems([])
        if (alive) showError(error, 'loadNoticesFailed')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [busy, messId, showError])

  async function handleSubmit() {
    clearNotice()
    if (!messId) return showMessage('noMessSelected', 'danger')
    if (!form.title.trim()) return showMessage('titleRequired', 'danger')
    if (!form.body.trim()) return showMessage('messageRequired', 'danger')

    setBusy(true)
    try {
      await api.createNotice({
        messId,
        type: form.type,
        title: form.title.trim(),
        body: form.body.trim(),
        isPinned: form.isPinned,
      })
      setForm(INITIAL_FORM)
      showMessage('noticeSent', 'success')
      setShowForm(false)
    } catch (error) {
      showError(error, 'sendNoticeFailed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen title={t('notices')} subtitle={t('noticeSubtitle')} backHref="/" />
      <div className="screen space-y-4">
        {!messId ? <MessOnboardingActions compact /> : null}

        {messId ? (
          <>
        {notice && !showForm ? <InlineNotice tone={notice.tone}>{notice.message}</InlineNotice> : null}

        {canSendNotice ? <AddActionButton onClick={() => setShowForm(true)}>{t('sendNotice')}</AddActionButton> : null}

        <section aria-label={t('noticeList')}>
          <div className="space-y-3">
          {loading ? <LoadingIndicator variant="card" label={t('loadingNotices')} /> : null}
          {[...items].sort((left, right) => Number(Boolean(right.is_pinned)) - Number(Boolean(left.is_pinned))).map((item) => (
            <article key={item.id} className="ui-card p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#edfafa] text-[#008d8c]">
                  <Bell size={17} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-label font-bold text-[#123748]">{item.title}</h2>
                    {item.is_pinned ? <span className="rounded-full bg-[#dff4f3] px-2 py-0.5 text-caption font-bold text-[#008d8c]">{t('pinned')}</span> : null}
                  </div>
                  <div className="mt-1 text-caption font-bold uppercase tracking-[0.12em] text-[#65838b]">{noticeTypeLabel(item.type, locale)}</div>
                  <p className="mt-2 text-label text-[#65838b]">{item.body}</p>
                  {item.creator?.name || item.created_at ? (
                    <div className="mt-2 text-caption font-medium text-[#789096]">
                      {t('noticeMeta', {
                        author: item.creator?.name ?? t('unknownAuthor'),
                        date: item.created_at ? format.date(item.created_at, { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' }) : t('dateNotAvailable'),
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
          {!loading && !items.length ? <div className="app-empty-state">{t('noNotices')}</div> : null}
          </div>
        </section>
          </>
        ) : null}
      </div>
      <PersonalFormModal
        id="notice-form"
        open={showForm}
        busy={busy}
        icon={Send}
        eyebrow={t('notices')}
        title={t('sendNotice')}
        description={t('sendNoticeDescription')}
        closeLabel={common('cancel')}
        onClose={() => setShowForm(false)}
      >
        <form onSubmit={(event) => { event.preventDefault(); void handleSubmit() }}>
          <div className="space-y-4 px-5 py-5">
            <SelectField label={t('noticeType')} value={form.type} onChange={(type) => setForm((prev) => ({ ...prev, type }))} options={NOTICE_TYPES} getLabel={(value) => noticeTypeLabel(value, locale)} />
            <TextField label={t('title')} value={form.title} onChange={(title) => setForm((prev) => ({ ...prev, title }))} placeholder={t('noticeTitlePlaceholder')} autoFocus />
            <TextAreaField label={t('message')} value={form.body} onChange={(body) => setForm((prev) => ({ ...prev, body }))} placeholder={t('noticeMessagePlaceholder')} />
            <ToggleField label={t('pinned')} hint={t('pinnedHint')} checked={form.isPinned} onChange={(isPinned) => setForm((prev) => ({ ...prev, isPinned }))} />
            {notice && showForm ? <InlineNotice tone={notice.tone}>{notice.message}</InlineNotice> : null}
          </div>
          <footer className="grid grid-cols-2 gap-3 border-t border-[#e9eff1] bg-[#fbfcfc] px-5 py-4">
            <Button type="button" variant="secondary" className="w-full" onClick={() => setShowForm(false)} disabled={busy}>{common('cancel')}</Button>
            <Button type="submit" className="w-full" busy={busy} busyLabel={common('loading')}>{t('sendNotice')}</Button>
          </footer>
        </form>
      </PersonalFormModal>
    </MobileShell>
  )
}
