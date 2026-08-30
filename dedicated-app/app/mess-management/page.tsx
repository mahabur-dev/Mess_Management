'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Building2,
  CircleDollarSign,
  Clock3,
  MapPin,
  Plus,
  Save,
  Trash2,
} from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { LoadingIndicator } from '@/components/loading-indicator'
import { MessOnboardingActions } from '@/components/mess-onboarding-actions'
import { AssistantMetricsCard } from '@/components/mobile/assistant-metrics-card'
import {
  FieldCard,
  SettingsSection,
  SubmitButton,
  TextAreaField,
  TextField,
} from '@/components/mobile/form-controls'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { getActiveMessId } from '@/lib/app-permissions'
import {
  messPlanLabel,
  messSubscriptionStatusLabel,
  useLocale,
  useLocaleFormatters,
  useLocalizedNotice,
  useTranslations,
} from '@/lib/i18n'
import { useAuth } from '../providers'

type RoomDraft = {
  id: string
  roomName: string
  perPerson: string
  roomPrice: string
}

type SetupState = {
  messName: string
  address: string
  totalSeats: string
  monthlyRent: string
  messCategory: string
  paymentDeadlineDay: string
  mealOffDeadline: string
  bazarRules: string
  rooms: RoomDraft[]
}

type SubscriptionSummary = {
  plan: string
  status: string
  start_date: string
  end_date: string | null
}

type SubscriptionPlanInfo = {
  label: string
  price: number
  days: number
  currency?: string
}

const createRoomDraft = (room?: Partial<RoomDraft>): RoomDraft => ({
  id: room?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  roomName: room?.roomName ?? '',
  perPerson: room?.perPerson ?? '',
  roomPrice: room?.roomPrice ?? '',
})

const createEmptySetup = (): SetupState => ({
  messName: '',
  address: '',
  totalSeats: '',
  monthlyRent: '',
  messCategory: '',
  paymentDeadlineDay: '10',
  mealOffDeadline: '22:00',
  bazarRules: '',
  rooms: [createRoomDraft()],
})

function normalizeRooms(rooms?: unknown): RoomDraft[] {
  if (!Array.isArray(rooms) || rooms.length === 0) return [createRoomDraft()]

  return rooms.map((room) => {
    const value = (room ?? {}) as Record<string, unknown>
    return createRoomDraft({
      roomName: typeof value.roomName === 'string' ? value.roomName : '',
      perPerson: value.perPerson !== undefined && value.perPerson !== null ? String(value.perPerson) : '',
      roomPrice: value.roomPrice !== undefined && value.roomPrice !== null ? String(value.roomPrice) : '',
    })
  })
}

function getDaysRemaining(endDate?: string | null) {
  if (!endDate) return null
  const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return Math.max(days, 0)
}

function getActiveMemberCount(mess?: {
  memberships?: unknown
  _count?: { memberships?: unknown }
}) {
  if (Array.isArray(mess?.memberships)) {
    return mess.memberships.filter((membership) => {
      if (!membership || typeof membership !== 'object') return false
      return (membership as { is_active?: boolean }).is_active !== false
    }).length
  }

  const count = Number(mess?._count?.memberships)
  return Number.isFinite(count) && count >= 0 ? count : 0
}

function StatusPill({ status, label }: { status?: string; label: string }) {
  const normalized = (status ?? '').toUpperCase()
  const tone =
    normalized === 'ACTIVE'
      ? 'ui-badge--success'
      : normalized === 'EXPIRED'
        ? 'ui-badge--danger'
        : normalized === 'CANCELLED'
          ? 'ui-badge--neutral'
          : 'ui-badge--warning'

  return <span className={`ui-badge ${tone}`}>{label}</span>
}

export default function MessManagementPage() {
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const t = useTranslations('mess')
  const { notice, clearNotice, showError, showMessage } = useLocalizedNotice('mess')
  const { user } = useAuth()
  const messId = useMemo(() => getActiveMessId(user), [user])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [setup, setSetup] = useState<SetupState>(createEmptySetup)
  const [activeMemberCount, setActiveMemberCount] = useState(0)
  const [subscription, setSubscription] = useState<SubscriptionSummary | null>(null)
  const [subscriptionPlans, setSubscriptionPlans] = useState<Record<string, SubscriptionPlanInfo>>({})
  const displayPlan = (plan?: string) => {
    if (!plan) return t('notAvailable')
    const normalized = plan.toUpperCase()
    return ['TRIAL', 'MONTHLY', 'YEARLY'].includes(normalized)
      ? messPlanLabel(normalized, locale)
      : subscriptionPlans[plan]?.label || messPlanLabel(plan, locale)
  }

  useEffect(() => {
    let alive = true
    if (!messId) {
      setLoading(false)
      return
    }

    async function loadMessSettings(showLoader = true) {
      if (showLoader) setLoading(true)
      clearNotice()

      const [messesResult, subscriptionResult, plansResult] = await Promise.allSettled([
        api.getMesses(),
        api.getMessSubscription(messId),
        api.getSubscriptionPlans(),
      ])

      if (!alive) return

      if (messesResult.status === 'fulfilled') {
        const list = Array.isArray(messesResult.value.data) ? messesResult.value.data : []
        const mess = list.find((item) => item?.id === messId) ?? list[0]

        if (mess) {
          setActiveMemberCount(getActiveMemberCount(mess))
          setSetup({
            messName: mess?.name ?? '',
            address: mess?.address ?? '',
            totalSeats: mess?.total_seats !== undefined && mess?.total_seats !== null ? String(mess.total_seats) : '',
            monthlyRent: mess?.monthly_rent !== undefined && mess?.monthly_rent !== null ? String(mess.monthly_rent) : '',
            messCategory: mess?.mess_category ?? '',
            paymentDeadlineDay: String(mess?.payment_deadline_day ?? 10),
            mealOffDeadline: mess?.meal_off_deadline ?? '22:00',
            bazarRules: mess?.bazar_rules ?? '',
            rooms: normalizeRooms(mess?.rooms),
          })
        } else {
          setActiveMemberCount(0)
          setSetup(createEmptySetup())
        }
      } else {
        setActiveMemberCount(0)
        setSetup(createEmptySetup())
      }

      if (subscriptionResult.status === 'fulfilled') {
        const data = subscriptionResult.value?.data
        if (data && typeof data === 'object') {
          setSubscription({
            plan: data.plan ?? 'TRIAL',
            status: data.status ?? 'ACTIVE',
            start_date: data.start_date ?? '',
            end_date: data.end_date ?? null,
          })
        } else {
          setSubscription(null)
        }
      } else {
        setSubscription(null)
      }

      if (plansResult.status === 'fulfilled' && plansResult.value?.data) {
        setSubscriptionPlans(plansResult.value.data)
      }

      const failedResult = [messesResult, subscriptionResult, plansResult].find((result) => result.status === 'rejected')
      if (failedResult?.status === 'rejected') showError(failedResult.reason, 'loadFailed')

      if (showLoader) setLoading(false)
    }

    void loadMessSettings()

    const refreshVisibleData = () => {
      if (document.visibilityState !== 'hidden') void loadMessSettings(false)
    }

    window.addEventListener('focus', refreshVisibleData)
    document.addEventListener('visibilitychange', refreshVisibleData)

    return () => {
      alive = false
      window.removeEventListener('focus', refreshVisibleData)
      document.removeEventListener('visibilitychange', refreshVisibleData)
    }
  }, [clearNotice, messId, showError])

  function updateRoom(index: number, field: keyof RoomDraft, value: string) {
    setSetup((current) => ({
      ...current,
      rooms: current.rooms.map((room, roomIndex) =>
        roomIndex === index ? { ...room, [field]: value } : room,
      ),
    }))
  }

  function addRoom() {
    setSetup((current) => ({
      ...current,
      rooms: [...current.rooms, createRoomDraft()],
    }))
  }

  function removeRoom(index: number) {
    setSetup((current) => ({
      ...current,
      rooms: current.rooms.length > 1 ? current.rooms.filter((_, roomIndex) => roomIndex !== index) : current.rooms,
    }))
  }

  async function handleSave() {
    if (!messId) return
    clearNotice()
    setSaving(true)

    try {
      const rooms = setup.rooms
        .map((room) => {
          const roomName = room.roomName.trim()
          const perPerson = room.perPerson.trim()
          const roomPrice = room.roomPrice.trim()

          if (!roomName && !perPerson && !roomPrice) return null

          return {
            roomName,
            perPerson: perPerson ? Number(perPerson) : undefined,
            roomPrice: roomPrice ? Number(roomPrice) : undefined,
          }
        })
        .filter((room): room is { roomName: string; perPerson: number | undefined; roomPrice: number | undefined } => room !== null)

      await api.updateMessSetup(messId, {
        messName: setup.messName.trim(),
        address: setup.address.trim(),
        totalSeats: setup.totalSeats ? Number(setup.totalSeats) : undefined,
        monthlyRent: setup.monthlyRent ? Number(setup.monthlyRent) : undefined,
        messCategory: setup.messCategory.trim() || undefined,
        rooms: rooms.length ? rooms : undefined,
        paymentDeadlineDay: setup.paymentDeadlineDay ? Number(setup.paymentDeadlineDay) : undefined,
        mealOffDeadline: setup.mealOffDeadline,
        bazarRules: setup.bazarRules,
        mealTypes: ['BREAKFAST', 'LUNCH', 'DINNER'],
        mealRateMethod: 'EXPENSE_DIVIDED_BY_MEAL_COUNT',
      })

      showMessage('saveSuccess', 'success')
    } catch (error) {
      showError(error, 'saveFailed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen title={t('title')} subtitle={t('subtitle')} backHref="/" />

      <div className="screen mess-management-page">
        {!messId ? (
          <MessOnboardingActions compact />
        ) : loading ? (
          <LoadingIndicator variant="card" label={t('loading')} />
        ) : (
          <>
            {/* Overview */}
            <AssistantMetricsCard
              icon={Building2}
              eyebrow={t('workspace')}
              title={setup.messName || t('yourMess')}
              titleId="mess-overview-heading"
              subtitle={(
                <>
                  <MapPin size={13} aria-hidden="true" />
                  <span className="truncate">{setup.address || t('addressNotSet')}</span>
                </>
              )}
              status={<StatusPill status={subscription?.status} label={subscription?.status ? messSubscriptionStatusLabel(subscription.status, locale) : t('unknown')} />}
              metrics={[
                {
                  label: t('plan'),
                  value: displayPlan(subscription?.plan),
                },
                {
                  label: t('daysLeft'),
                  value: subscription?.end_date ? format.number(getDaysRemaining(subscription.end_date) ?? 0) : t('notAvailable'),
                },
                { label: t('members'), value: format.number(activeMemberCount) },
              ]}
            />

            {/* Subscription summary */}
            {subscription ? (
              <SettingsSection id="subscription-heading" title={t('subscription')}>
                <div className="management-subscription__plan">
                  <div className="management-subscription__identity">
                    <div className="management-subscription__icon" aria-hidden="true">
                      <CircleDollarSign size={18} />
                    </div>
                    <div>
                      <p className="management-subscription__label">{t('plan')}</p>
                      <p className="management-subscription__value">
                        {displayPlan(subscription.plan)}
                      </p>
                    </div>
                  </div>
                  <StatusPill status={subscription.status} label={messSubscriptionStatusLabel(subscription.status, locale)} />
                </div>

                <dl className="management-subscription__dates">
                  <div>
                    <dt>{t('started')}</dt>
                    <dd>{subscription.start_date ? format.date(subscription.start_date) : t('notAvailable')}</dd>
                  </div>
                  <div>
                    <dt>{t('ends')}</dt>
                    <dd>{subscription.end_date ? format.date(subscription.end_date) : t('notAvailable')}</dd>
                  </div>
                </dl>
              </SettingsSection>
            ) : null}

            {/* Setup form */}
            <SettingsSection id="settings-heading" title={t('messSettings')}>
              <div className="management-form-stack">
                <TextField
                  label={t('messName')}
                  value={setup.messName}
                  onChange={(messName) => setSetup((current) => ({ ...current, messName }))}
                  placeholder={t('messNamePlaceholder')}
                />

                <TextField
                  label={t('address')}
                  value={setup.address}
                  onChange={(address) => setSetup((current) => ({ ...current, address }))}
                  placeholder={t('addressPlaceholder')}
                />

                <div className="management-form-grid">
                  <TextField
                    label={t('messCategory')}
                    value={setup.messCategory}
                    onChange={(messCategory) => setSetup((current) => ({ ...current, messCategory }))}
                    placeholder={t('messCategoryPlaceholder')}
                  />
                  <TextField
                    label={t('totalSeats')}
                    value={setup.totalSeats}
                    onChange={(totalSeats) => setSetup((current) => ({ ...current, totalSeats }))}
                    placeholder={t('numberExample', { value: format.number(12) })}
                    type="number"
                  />
                </div>

                <div className="management-form-grid">
                  <TextField
                    label={t('monthlyRent')}
                    value={setup.monthlyRent}
                    onChange={(monthlyRent) => setSetup((current) => ({ ...current, monthlyRent }))}
                    placeholder={t('numberExample', { value: format.number(50000) })}
                    type="number"
                  />
                  <TextField
                    label={t('paymentDeadlineDay')}
                    value={setup.paymentDeadlineDay}
                    onChange={(paymentDeadlineDay) => setSetup((current) => ({ ...current, paymentDeadlineDay }))}
                    placeholder={t('numberExample', { value: format.number(10) })}
                    type="number"
                  />
                </div>

                <FieldCard
                  className="management-deadline-field"
                  label={t('mealOffDeadline')}
                  hint={t('mealOffDeadlineHint')}
                >
                  <div className="management-time-control">
                    <span className="management-time-control__icon" aria-hidden="true">
                      <Clock3 size={17} />
                    </span>
                    <input
                      type="time"
                      className="field meal-time-input management-time-control__input"
                      value={setup.mealOffDeadline}
                      onChange={(event) =>
                        setSetup((current) => ({ ...current, mealOffDeadline: event.target.value }))
                      }
                    />
                  </div>
                </FieldCard>

                <TextAreaField
                  label={t('bazarRules')}
                  value={setup.bazarRules}
                  onChange={(bazarRules) => setSetup((current) => ({ ...current, bazarRules }))}
                  placeholder={t('bazarRulesPlaceholder')}
                  rows={3}
                />
              </div>
            </SettingsSection>

            {/* Rooms */}
            <SettingsSection
              id="rooms-heading"
              title={t('rooms')}
              action={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addRoom}
                  className="management-add-room"
                >
                  <Plus size={14} strokeWidth={2.6} aria-hidden="true" />
                  {t('addRoom')}
                </Button>
              }
            >
              <div className="management-room-list">
                {setup.rooms.map((room, index) => (
                  <article key={room.id} className="management-room-card">
                    <div className="management-room-card__header">
                      <p>{t('roomIndex', { index: format.number(index + 1) })}</p>
                      {setup.rooms.length > 1 ? (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => removeRoom(index)}
                          className="management-room-card__remove"
                          aria-label={t('removeRoom', { index: format.number(index + 1) })}
                        >
                          <Trash2 size={14} strokeWidth={2.3} aria-hidden="true" />
                        </Button>
                      ) : null}
                    </div>

                    <div className="management-room-card__fields">
                      <TextField
                        label={t('roomName')}
                        value={room.roomName}
                        onChange={(roomName) => updateRoom(index, 'roomName', roomName)}
                        placeholder={t('roomNamePlaceholder')}
                      />
                      <div className="management-form-grid">
                        <TextField
                          label={t('totalPerson')}
                          value={room.perPerson}
                          onChange={(perPerson) => updateRoom(index, 'perPerson', perPerson)}
                          placeholder={t('numberExample', { value: format.number(2) })}
                          type="number"
                        />
                        <TextField
                          label={t('roomPrice')}
                          value={room.roomPrice}
                          onChange={(roomPrice) => updateRoom(index, 'roomPrice', roomPrice)}
                          placeholder={t('numberExample', { value: format.number(12000) })}
                          type="number"
                        />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </SettingsSection>

            {notice ? <div className={`ui-notice ui-notice--${notice.tone}`} role="status">{notice.message}</div> : null}

            <div className="management-save-action">
              <SubmitButton busy={saving} onClick={() => void handleSave()}>
                <Save size={17} aria-hidden="true" />
                {t('saveSetup')}
              </SubmitButton>
            </div>
          </>
        )}
      </div>
    </MobileShell>
  )
}
