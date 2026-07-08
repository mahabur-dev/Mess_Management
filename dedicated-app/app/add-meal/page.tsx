'use client'

import { useEffect, useMemo, useState } from 'react'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { FieldCard, SelectField, SubmitButton, TextField } from '@/components/mobile/form-controls'
import { api } from '@/lib/api'
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

export default function AddMealPage() {
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? '', [user])
  const [members, setMembers] = useState<MemberOption[]>([])
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!messId) return

    let alive = true
    const currentUser = user ? { id: user.id, name: user.name, email: user.email } : null
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
  }, [messId, user])

  const mealCount = useMemo(() => {
    if (form.status === 'OFF') return 0
    return 1 + Number(form.guests || 0)
  }, [form.guests, form.status])

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
        guests: Number(form.guests || 0),
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
            hint="Optional for manager entry"
            value={form.memberId}
            onChange={(memberId) => setForm((prev) => ({ ...prev, memberId }))}
            options={['', ...members.map((member) => member.id)] as string[]}
            getLabel={(value) => {
              if (!value) return 'Select member'
              const member = members.find((item) => item.id === value)
              return member ? member.name : value
            }}
          />

          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Status"
              value={form.status}
              onChange={(status) => setForm((prev) => ({ ...prev, status }))}
              options={['ON', 'OFF']}
              getLabel={(value) => value}
            />
            <TextField
              label="Guests"
              value={form.guests}
              onChange={(guests) => setForm((prev) => ({ ...prev, guests }))}
              placeholder="0"
              type="number"
            />
          </div>

          <TextField
            label="Date"
            value={form.date}
            onChange={(date) => setForm((prev) => ({ ...prev, date }))}
            type="date"
          />

          <FieldCard label="Calculated Meal Count" hint="Backend `mealCount` payload">
            <div className="field bg-[#f7fbfd] py-3 font-black text-[#14324a]">{mealCount}</div>
          </FieldCard>

          {message ? <div className="rounded-2xl border border-[#ffd8c0] bg-[#fff4ea] px-4 py-3 text-sm font-semibold text-[#fc782d]">{message}</div> : null}

          <SubmitButton busy={busy} onClick={handleSubmit}>
            Save Meal
          </SubmitButton>
        </div>
      </div>
    </MobileShell>
  )
}
