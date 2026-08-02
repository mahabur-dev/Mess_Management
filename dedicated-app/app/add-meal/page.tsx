'use client'

import { useEffect, useMemo, useState } from 'react'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { FieldCard, SelectField, SubmitButton, TextField } from '@/components/mobile/form-controls'
import { GuestMealCountInput, MEAL_META, MealOptionRow } from '@/components/mobile/meals-design'
import { api } from '@/lib/api'
import { canManageMess } from '@/lib/app-permissions'
import { LABELS, MEAL_NAMES, type MealName } from '@/lib/form-options'
import { useAuth } from '../providers'

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
  date: new Date().toISOString().slice(0, 10),
}

function normalizeGuestMealCount(value: string) {
  const count = Number(value)
  if (!Number.isFinite(count)) return 1
  return Math.min(20, Math.max(1, Number(count.toFixed(1))))
}

export default function AddMealPage() {
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? '', [user])
  const isManager = canManageMess(user)
  const [members, setMembers] = useState<MemberOption[]>([])
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!messId) return

    let alive = true
    const currentUser = user ? { id: user.id, name: user.name, email: user.email } : null

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
      .catch(() => {
        if (!alive) return
        setMembers(currentUser ? [currentUser] : [])
      })

    return () => {
      alive = false
    }
  }, [isManager, messId, user])

  const mealChoice = form.status === 'OFF' ? 'NO' : Number(form.guests || 0) > 0 ? 'GUEST' : 'TAKE'
  const guestMeals = mealChoice === 'GUEST' ? normalizeGuestMealCount(form.guests) : 0
  const mealCount = useMemo(() => {
    if (form.status === 'OFF') return 0
    return Number((MEAL_META[form.mealName].baseValue + guestMeals).toFixed(2))
  }, [form.mealName, form.status, guestMeals])

  function setMealChoice(choice: 'GUEST' | 'NO' | 'TAKE') {
    setForm((prev) => {
      if (choice === 'NO') return { ...prev, status: 'OFF', guests: '0' }
      if (choice === 'GUEST') return { ...prev, status: 'ON', guests: Number(prev.guests) > 0 ? prev.guests : '1' }
      return { ...prev, status: 'ON', guests: '0' }
    })
  }

  async function handleSubmit() {
    setMessage('')
    if (!messId) return setMessage('No mess selected.')
    if (!form.date) return setMessage('Date is required.')

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
      setMessage('Meal saved successfully.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to save meal.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen title="Add Meal" subtitle="DTO mapped form" backHref="/" />
      <div className="screen space-y-4">
        <div className="glass rounded-[28px] p-4 space-y-4">
          <SelectField
            label="Meal Name"
            value={form.mealName}
            onChange={(mealName) => setForm((prev) => ({ ...prev, mealName }))}
            options={MEAL_NAMES}
            getLabel={(value) => LABELS.MEAL_NAMES[value]}
          />

          <SelectField
            label="Member"
            hint={isManager ? 'Optional for manager entry' : 'Your own meal only'}
            value={form.memberId}
            onChange={(memberId) => setForm((prev) => ({ ...prev, memberId }))}
            options={(isManager ? ['', ...members.map((member) => member.id)] : members.map((member) => member.id)) as string[]}
            getLabel={(value) => {
              if (!value) return 'Select member'
              const member = members.find((item) => item.id === value)
              return member ? member.name : value
            }}
          />

          <FieldCard label="Meal Status">
            <div className="space-y-2 rounded-2xl border border-[#bfe7e6] bg-white px-3 py-3">
              <MealOptionRow
                selected={mealChoice === 'GUEST'}
                title="Guest Meal"
                hint="Adds guest meals with regular meal"
                rightText="Optional"
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
              <MealOptionRow selected={mealChoice === 'NO'} title="No Meal" hint="Member will not take this meal" onClick={() => setMealChoice('NO')} />
              <MealOptionRow selected={mealChoice === 'TAKE'} title="I will take meal" hint="Regular meal count" onClick={() => setMealChoice('TAKE')} />
            </div>
          </FieldCard>

          <TextField
            label="Date"
            value={form.date}
            onChange={(date) => setForm((prev) => ({ ...prev, date }))}
            type="date"
          />

          <FieldCard label="Calculated Meal Count" hint="Backend `mealCount` payload">
            <div className="field bg-[#edfafa] py-3 font-bold text-[#123748]">{mealCount}</div>
          </FieldCard>

          {message ? <div className="rounded-2xl border border-[#bfe7e6] bg-[#edfafa] px-4 py-3 text-label font-semibold text-[#008d8c]">{message}</div> : null}

          <SubmitButton busy={busy} onClick={handleSubmit}>
            Save Meal
          </SubmitButton>
        </div>
      </div>
    </MobileShell>
  )
}
