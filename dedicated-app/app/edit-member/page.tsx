'use client'

import { type FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from 'lucide-react'
import { LoadingIndicator } from '@/components/loading-indicator'
import { MobileShell } from '@/components/mobile-shell'
import {
  DesignedInput,
  DesignedSelect,
  DesignedToggle,
  FormFieldGrid,
  FormPageShell,
  FormSection,
  FormStatusMessage,
  FormSummaryCard,
  SubmitGradientButton,
  detailIcons,
  expenseFormIcons,
} from '@/components/mobile/expense-design'
import { api } from '@/lib/api'
import { getActiveMessId } from '@/lib/app-permissions'
import { MEMBER_ROLES, type MemberRole } from '@/lib/form-options'
import { memberRoleLabel, useLocale, useLocaleFormatters, useLocalizedNotice, useTranslations } from '@/lib/i18n'
import { useQueryParams } from '@/lib/use-query-params'
import { useAuth } from '../providers'

type MemberRecord = {
  user_id: string
  mess_id: string
  role: MemberRole
  is_active?: boolean
  room_no?: string | null
  seat_no?: string | null
  monthly_rent?: string | number | null
  deposit_amount?: string | number | null
  user?: { id: string; name: string; email: string }
  mess?: { id: string; name: string }
}

type FormState = {
  role: MemberRole
  roomNo: string
  seatNo: string
  monthlyRent: string
  depositAmount: string
  isActive: boolean
}

const INITIAL_FORM: FormState = {
  role: 'MEMBER',
  roomNo: '',
  seatNo: '',
  monthlyRent: '',
  depositAmount: '',
  isActive: true,
}

export default function EditMemberPage() {
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const t = useTranslations('members')
  const { notice, clearNotice, showError, showMessage } = useLocalizedNotice('members')
  const searchParams = useQueryParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const memberId = searchParams.get('memberId') ?? ''
  const messId = searchParams.get('messId') ?? getActiveMessId(user)
  const [member, setMember] = useState<MemberRecord | null>(null)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!memberId || !messId) {
      setMember(null)
      setLoading(false)
      showMessage('missingMemberContext', 'danger')
      return
    }
    let alive = true
    setLoading(true)
    clearNotice()
    api
      .getAllMembers({ limit: 500 })
      .then((res) => {
        if (!alive) return
        const list = Array.isArray(res.data) ? res.data : []
        const found = list.find((item: MemberRecord) => item.user_id === memberId && item.mess_id === messId) ?? null
        setMember(found)
        if (found) {
          setForm({
            role: found.role ?? 'MEMBER',
            roomNo: found.room_no ?? '',
            seatNo: found.seat_no ?? '',
            monthlyRent: found.monthly_rent ? String(found.monthly_rent) : '',
            depositAmount: found.deposit_amount ? String(found.deposit_amount) : '',
            isActive: found.is_active ?? true,
          })
        } else {
          showMessage('memberNotFound', 'danger')
        }
      })
      .catch((error) => {
        if (!alive) return
        setMember(null)
        showError(error, 'loadMemberDetailsFailed')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [authLoading, clearNotice, memberId, messId, showError, showMessage])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    clearNotice()
    if (!memberId || !messId) return showMessage('missingMemberContext', 'danger')

    setBusy(true)
    try {
      await api.updateMember(messId, memberId, {
        role: form.role,
        roomNo: form.roomNo.trim() || undefined,
        seatNo: form.seatNo.trim() || undefined,
        monthlyRent: form.monthlyRent ? Number(form.monthlyRent) : undefined,
        depositAmount: form.depositAmount ? Number(form.depositAmount) : undefined,
        isActive: form.isActive,
      })
      showMessage('memberUpdated', 'success')
      router.push('/members')
    } catch (error) {
      showError(error, 'updateMemberFailed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <MobileShell>
      <form onSubmit={handleSubmit}>
        <FormPageShell title={t('editMember')} description={member?.user?.name ?? t('editMemberDescription')} icon={User} backHref="/members">
          {loading ? (
            <FormSection>
              <LoadingIndicator variant="card" label={t('loadingMemberDetails')} />
            </FormSection>
          ) : null}

          {!loading && member ? (
            <>
          <FormSection>
            <FormSummaryCard
              eyebrow={t('member')}
              title={member?.user?.name ?? memberId}
              description={member?.user?.email ?? t('memberProfile')}
              icon={User}
            />
          </FormSection>

          <FormSection title={t('memberDetails')}>
            <DesignedSelect
              label={t('role')}
              icon={detailIcons.role}
              value={form.role}
              onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value as MemberRole }))}
            >
              {MEMBER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {memberRoleLabel(role, locale)}
                </option>
              ))}
            </DesignedSelect>

            <FormFieldGrid>
              <DesignedInput label={t('roomNo')} icon={detailIcons.room} value={form.roomNo} onChange={(event) => setForm((prev) => ({ ...prev, roomNo: event.target.value }))} placeholder="A-2" />
              <DesignedInput label={t('seatNo')} icon={detailIcons.seat} value={form.seatNo} onChange={(event) => setForm((prev) => ({ ...prev, seatNo: event.target.value }))} placeholder="S-05" />
            </FormFieldGrid>

            <FormFieldGrid>
              <DesignedInput
                label={t('monthlyRent')}
                icon={expenseFormIcons.amount}
                value={form.monthlyRent}
                onChange={(event) => setForm((prev) => ({ ...prev, monthlyRent: event.target.value }))}
                placeholder={format.number(4500)}
                type="number"
              />
              <DesignedInput
                label={t('depositAmount')}
                icon={expenseFormIcons.amount}
                value={form.depositAmount}
                onChange={(event) => setForm((prev) => ({ ...prev, depositAmount: event.target.value }))}
                placeholder={format.number(5000)}
                type="number"
              />
            </FormFieldGrid>

            <DesignedToggle
              label={t('activeMember')}
              hint={t('inactiveMemberHint')}
              icon={detailIcons.status}
              checked={form.isActive}
              onChange={(isActive) => setForm((prev) => ({ ...prev, isActive }))}
            />
          </FormSection>

          <FormStatusMessage message={notice?.message ?? ''} />

          <SubmitGradientButton busy={busy}>{t('saveChanges')}</SubmitGradientButton>
            </>
          ) : null}

          {!loading && !member ? <FormStatusMessage message={notice?.message ?? t('memberNotFound')} /> : null}
        </FormPageShell>
      </form>
    </MobileShell>
  )
}
