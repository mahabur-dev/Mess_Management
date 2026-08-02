'use client'

import { useEffect, useMemo, useState } from 'react'
import { Users } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { LoadingIndicator } from '@/components/loading-indicator'
import { TopScreen } from '@/components/top-screen'
import {
  EmptyMealsState,
  InlineNotice,
  MealCard,
  MealDateCard,
  MEAL_LABELS,
  MemberMealRow,
  MealTabs,
  MealTotalsGrid,
  SearchBox,
  findAttendanceForMember,
  findMeal,
  memberName,
  normalizeMeals,
  todayIsoDate,
  type MealMember,
  type MealName,
  type MealRecord,
} from '@/components/mobile/meals-design'
import { api } from '@/lib/api'
import { useAuth } from '@/app/providers'

export default function MemberMealsPage() {
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? '', [user])
  const [date, setDate] = useState(todayIsoDate())
  const [mealName, setMealName] = useState<MealName>('LUNCH')
  const [members, setMembers] = useState<MealMember[]>([])
  const [meals, setMeals] = useState<MealRecord[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!messId) return
    let alive = true
    setLoading(true)
    setMessage('')

    Promise.all([
      api.getAllMembers({ limit: 500 }),
      api.getMealsByMess(messId, { startDate: date, endDate: date, limit: 20 }),
    ])
      .then(([memberRes, mealRes]) => {
        if (!alive) return
        const memberList = Array.isArray(memberRes.data) ? (memberRes.data as MealMember[]) : []
        setMembers(memberList.filter((member) => member.mess_id === messId || member.mess?.id === messId))
        setMeals(normalizeMeals(mealRes.data))
      })
      .catch((error) => {
        if (!alive) return
        setMembers([])
        setMeals([])
        setMessage(error instanceof Error ? error.message : 'Failed to load member meals.')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [date, messId, user?.id])

  const currentMeal = findMeal(meals, mealName)
  const filteredMembers = useMemo(() => {
    const term = search.trim().toLowerCase()
    return members.filter((member) => {
      const text = `${memberName(member)} ${member.user?.email ?? ''} ${member.room_no ?? ''}`.toLowerCase()
      return !term || text.includes(term)
    })
  }, [members, search])

  return (
    <MobileShell>
      <TopScreen title="All Member Meals" subtitle={MEAL_LABELS[mealName]} backHref="/meals/manager" />
      <div className="screen space-y-4">
        <MealDateCard date={date} onChange={setDate} />
        <MealTabs value={mealName} onChange={setMealName} meals={meals} />

        <MealCard>
          <MealTotalsGrid meals={meals} />
        </MealCard>

        <MealCard className="space-y-3">
          <SearchBox value={search} onChange={setSearch} />
          {message ? <InlineNotice tone="danger">{message}</InlineNotice> : null}
          {loading ? <LoadingIndicator variant="card" label="Loading member meals" /> : null}
        </MealCard>

        <section className="space-y-2.5">
          {filteredMembers.map((member) => {
            const attendance = findAttendanceForMember(currentMeal, member.user?.id ?? member.user_id)
            const href = `/meals/member-meal?memberId=${encodeURIComponent(member.user?.id ?? member.user_id ?? '')}&meal=${mealName}&date=${date}&name=${encodeURIComponent(memberName(member))}`
            return <MemberMealRow key={member.id || member.user?.id} member={member} mealName={mealName} attendance={attendance} href={href} />
          })}

          {!loading && !filteredMembers.length ? (
            <EmptyMealsState title="No members found for this meal." />
          ) : null}
        </section>

        <MealCard className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#edfafa] text-[#008d8c]">
            <Users size={19} />
          </div>
          <div>
            <div className="text-label font-bold text-[#123748]">{filteredMembers.length} members shown</div>
            <div className="mt-1 text-label text-[#65838b]">Tap a member to update instantly.</div>
          </div>
        </MealCard>
      </div>
    </MobileShell>
  )
}
