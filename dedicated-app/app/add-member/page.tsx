'use client'

import { useMemo, useState } from 'react'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { SelectField, SubmitButton, TextField } from '@/components/mobile/form-controls'
import { InlineNotice } from '@/components/mobile/meals-design'
import { MessOnboardingActions } from '@/components/mess-onboarding-actions'
import { api } from '@/lib/api'
import { getActiveMessId } from '@/lib/app-permissions'
import { MEMBER_ROLES, type MemberRole } from '@/lib/form-options'
import { memberRoleLabel, useLocale, useLocaleFormatters, useLocalizedNotice, useTranslations } from '@/lib/i18n'
import { useAuth } from '../providers'

type FormState = {
  email: string
  role: MemberRole
  roomNo: string
  seatNo: string
  monthlyRent: string
  depositAmount: string
}

const INITIAL_FORM: FormState = {
  email: '',
  role: 'MEMBER',
  roomNo: '',
  seatNo: '',
  monthlyRent: '',
  depositAmount: '',
}

export default function AddMemberPage() {
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const t = useTranslations('members')
  const { notice, clearNotice, showError, showMessage } = useLocalizedNotice('members')
  const { user } = useAuth()
  const messId = useMemo(() => getActiveMessId(user), [user])
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [busy, setBusy] = useState(false)

  async function handleSubmit() {
    clearNotice()
    if (!messId) return showMessage('noMessSelected', 'danger')
    if (!form.email.trim()) return showMessage('emailRequired', 'danger')

    setBusy(true)
    try {
      await api.addMember(messId, {
        email: form.email.trim().toLowerCase(),
        role: form.role,
        roomNo: form.roomNo.trim() || undefined,
        seatNo: form.seatNo.trim() || undefined,
        monthlyRent: form.monthlyRent ? Number(form.monthlyRent) : undefined,
        depositAmount: form.depositAmount ? Number(form.depositAmount) : undefined,
      })
      setForm(INITIAL_FORM)
      showMessage('memberAdded', 'success')
    } catch (error) {
      showError(error, 'addMemberFailed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen title={t('addMember')} subtitle={t('addMemberSubtitle')} backHref="/members" />
      <div className="screen space-y-4">
        {!messId ? <MessOnboardingActions compact /> : null}
        {messId ? (
        <section className="app-section app-form-section space-y-4">
          <TextField label={t('email')} value={form.email} onChange={(email) => setForm((prev) => ({ ...prev, email }))} placeholder={t('emailPlaceholder')} />
          <SelectField
            label={t('role')}
            value={form.role}
            onChange={(role) => setForm((prev) => ({ ...prev, role }))}
            options={MEMBER_ROLES}
            getLabel={(value) => memberRoleLabel(value, locale)}
          />
          <TextField label={t('roomNo')} value={form.roomNo} onChange={(roomNo) => setForm((prev) => ({ ...prev, roomNo }))} placeholder="A-2" />
          <TextField label={t('seatNo')} value={form.seatNo} onChange={(seatNo) => setForm((prev) => ({ ...prev, seatNo }))} placeholder="S-05" />
          <TextField label={t('monthlyRent')} value={form.monthlyRent} onChange={(monthlyRent) => setForm((prev) => ({ ...prev, monthlyRent }))} placeholder={format.number(4500)} type="number" />
          <TextField label={t('depositAmount')} value={form.depositAmount} onChange={(depositAmount) => setForm((prev) => ({ ...prev, depositAmount }))} placeholder={format.number(5000)} type="number" />

          {notice ? <InlineNotice tone={notice.tone}>{notice.message}</InlineNotice> : null}

          <SubmitButton busy={busy} onClick={handleSubmit}>
            {t('saveMember')}
          </SubmitButton>
        </section>
        ) : null}
      </div>
    </MobileShell>
  )
}
