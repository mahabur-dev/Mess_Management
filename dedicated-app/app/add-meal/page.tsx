'use client'

import { useEffect, useMemo, useState } from 'react'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { FieldCard, SelectField, SubmitButton } from '@/components/mobile/form-controls'
import { DatePicker } from '@/components/mobile/date-picker'
import { GuestMealCountInput, MEAL_META, MealIconBadge, MealOptionRow, mealHint, mealLabel, todayIsoDate } from '@/components/mobile/meals-design'
import { api } from '@/lib/api'
import { canManageMess } from '@/lib/app-permissions'
import { MEAL_NAMES, type MealName } from '@/lib/form-options'
import { useAuth } from '../providers'
import { useLocale, useLocaleFormatters, useLocalizedNotice, useTranslations } from '@/lib/i18n'

type MemberOption = {
  id: string
  name: string
  email: string
}

type FormState = {
  memberId: string
  mealName: MealName
  status: 'ON' | 'OFF'
  guests: string
  date: string
}

const INITIAL_FORM: FormState = {
  memberId: '',
  mealName: 'BREAKFAST',
  status: 'ON',
  guests: '0',
  date: todayIsoDate(),
}

const INITIAL_MEAL_COUNTS: Record<MealName, number> = {
  BREAKFAST: 0.5,
  LUNCH: 1,
  DINNER: 1,
}
function normalizeGuestMealCount(value: string) {
  const count = Number(value)
  if (!Number.isFinite(count)) return 1
  return Math.min(20, Math.max(1, Number(count.toFixed(1))))
}

export default function AddMealPage() {
  const { user } = useAuth()
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const common = useTranslations('common')
  const mealsCopy = useTranslations('meals')
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? '', [user])
  const currentUser = useMemo(
    () => user ? { id: user.id, name: user.name, email: user.email } : null,
    [user?.email, user?.id, user?.name],
  )
  const isManager = canManageMess(user)
  const [members, setMembers] = useState<MemberOption[]>([])
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [mealCounts, setMealCounts] = useState<Record<MealName, number>>(INITIAL_MEAL_COUNTS)
  const [busy, setBusy] = useState(false)
  const { notice, clearNotice, showError, showMessage } = useLocalizedNotice('meals')

  useEffect(() => {
    if (!messId) {
      setMembers([])
      showMessage('noMessSelected', 'warning')
      return
    }

    clearNotice()

    let alive = true
    if (!isManager) {
      setMembers(currentUser ? [currentUser] : [])
      setForm((prev) => ({
        ...prev,
        memberId: currentUser?.id ?? '',
      }))
      return () => {
        alive = false
      }
    }

    api
      .getAllMembers({ limit: 200 })
      .then((res) => {
        if (!alive) return
        const list = Array.isArray(res.data) ? res.data : []
        const currentMessMembers = list
          .filter((item: any) => item.mess?.id === messId && item.user)
          .map((item: any) => ({ id: item.user.id, name: item.user.name, email: item.user.email }))
        setMembers(currentMessMembers.length ? currentMessMembers : currentUser ? [currentUser] : [])
      })
      .catch((error) => {
        if (!alive) return
        setMembers(currentUser ? [currentUser] : [])
        showError(error, 'loadMemberMealsFailed')
      })

    return () => {
      alive = false
    }
  }, [clearNotice, currentUser, isManager, messId, showError, showMessage])

  const mealChoice = form.status === 'OFF' ? 'NO' : Number(form.guests || 0) > 0 ? 'GUEST' : 'TAKE'
  const guestMeals = mealChoice === 'GUEST' ? normalizeGuestMealCount(form.guests) : 0
  const mealCount = useMemo(() => {
    if (form.status === 'OFF') return 0
    return Number((mealCounts[form.mealName] + guestMeals).toFixed(2))
  }, [form.mealName, form.status, guestMeals, mealCounts])

  function changeMealCount(mealName: MealName, direction: -1 | 1) {
    const step = MEAL_META[mealName].baseValue
    setMealCounts((current) => ({
      ...current,
      [mealName]: Math.max(0, Number((current[mealName] + direction * step).toFixed(2))),
    }))
  }

  function setMealChoice(choice: 'GUEST' | 'NO' | 'TAKE') {
    setForm((prev) => {
      if (choice === 'NO') return { ...prev, status: 'OFF', guests: '0' }
      if (choice === 'GUEST') return { ...prev, status: 'ON', guests: Number(prev.guests) > 0 ? prev.guests : '1' }
      return { ...prev, status: 'ON', guests: '0' }
    })
  }

  async function handleSubmit() {
    clearNotice()
    if (!messId) return showMessage('noMessSelected', 'warning')
    if (!form.date) return showMessage('dateRequired', 'danger')

    setBusy(true)
    try {
      await api.createMeal({
        messId,
        memberId: form.memberId || undefined,
        mealName: form.mealName,
        status: form.status,
        mealCount,
        guests: guestMeals,
        date: form.date,
      })
      setForm(INITIAL_FORM)
      setMealCounts(INITIAL_MEAL_COUNTS)
      showMessage('mealSaved', 'success')
    } catch (error) {
      showError(error, 'mealSaveFailed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen title={mealsCopy('addMeal')} subtitle={mealsCopy('addMealDescription')} backHref="/" />
      <div className="screen space-y-4">
        <section className="app-section app-form-section space-y-4">
          <FieldCard label={mealsCopy('mealName')} hint={mealsCopy('chooseAndAdjust')}>
            <div className="overflow-hidden rounded-[12px] border border-[#dce8e9] bg-white px-3">
              {MEAL_NAMES.map((mealName) => {
                const selected = form.mealName === mealName
                return <div
                  key={mealName}
                  className={`flex w-full items-center gap-3 border-b border-[#dce8e9] py-3 last:border-b-0 ${selected ? 'bg-[#fbffff]' : ''}`}
                >
                  <button type="button" onClick={() => setForm((prev) => ({ ...prev, mealName }))} aria-pressed={selected} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <MealIconBadge mealName={mealName} size="sm" />
                    <span className="min-w-0"><span className="block text-label font-semibold text-[#245d66]">{mealLabel(mealName, locale)}</span><span className="block text-caption text-[#65838b]">{mealHint(mealName, locale)}</span></span>
                  </button>
                  <div className="flex h-9 shrink-0 items-center overflow-hidden border border-[#9edddc] bg-[#f8fbfb]">
                    <button type="button" aria-label={mealsCopy('reduceMeal', { meal: mealLabel(mealName, locale) })} onClick={() => changeMealCount(mealName, -1)} className="grid h-full w-8 place-items-center text-[#00777a] hover:bg-[#dff4f3]">−</button>
                    <span className="grid h-full min-w-10 place-items-center border-x border-[#bfe7e6] px-1 text-label font-semibold text-[#245d66]">{format.number(mealCounts[mealName], { maximumFractionDigits: 1 })}</span>
                    <button type="button" aria-label={mealsCopy('addMoreMeal', { meal: mealLabel(mealName, locale) })} onClick={() => changeMealCount(mealName, 1)} className="grid h-full w-8 place-items-center bg-[#008d8c] text-white hover:bg-[#00777a]">+</button>
                  </div>
                </div>
              })}
            </div>
          </FieldCard>

          <SelectField
            label={mealsCopy('member')}
            hint={isManager ? mealsCopy('managerMemberHint') : mealsCopy('ownMealHint')}
            value={form.memberId}
            onChange={(memberId) => setForm((prev) => ({ ...prev, memberId }))}
            options={(isManager ? ['', ...members.map((member) => member.id)] : members.map((member) => member.id)) as string[]}
            getLabel={(value) => {
              if (!value) return mealsCopy('selectMember')
              const member = members.find((item) => item.id === value)
              return member ? member.name : value
            }}
          />

          <FieldCard label={mealsCopy('mealStatus')}>
            <div className="space-y-2 rounded-2xl border border-[#bfe7e6] bg-white px-3 py-3">
              <MealOptionRow
                selected={mealChoice === 'GUEST'}
                title={mealsCopy('guestMeal')}
                hint={mealsCopy('guestMealHint')}
                rightText={common('optional')}
                rightSlot={
                  mealChoice === 'GUEST' ? (
                    <GuestMealCountInput
                      value={form.guests}
                      onChange={(guests) => setForm((prev) => ({ ...prev, guests }))}
                      disabled={busy}
                    />
                  ) : undefined
                }
                onClick={() => setMealChoice('GUEST')}
              />
              <MealOptionRow selected={mealChoice === 'NO'} title={mealsCopy('noMeal')} hint={mealsCopy('noMealHint')} onClick={() => setMealChoice('NO')} />
              <MealOptionRow selected={mealChoice === 'TAKE'} title={mealsCopy('takeMeal')} hint={mealsCopy('takeMealHint')} onClick={() => setMealChoice('TAKE')} />
            </div>
          </FieldCard>

          <DatePicker
            label={mealsCopy('date')}
            value={form.date}
            onChange={(date) => setForm((prev) => ({ ...prev, date }))}
          />

          <FieldCard label={mealsCopy('calculatedMealCount')} hint={mealsCopy('calculatedMealHint')}>
            <div className="field bg-[#edfafa] py-3 font-semibold text-[#123748]">{format.number(mealCount, { maximumFractionDigits: 1 })}</div>
          </FieldCard>

          {notice ? <div className={`ui-notice ui-notice--${notice.tone}`}>{notice.message}</div> : null}

          <SubmitButton busy={busy} onClick={handleSubmit}>
            {mealsCopy('saveMeal')}
          </SubmitButton>
        </section>
      </div>
    </MobileShell>
  )
}
