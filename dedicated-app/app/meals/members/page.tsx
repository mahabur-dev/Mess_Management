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
  MemberMealRow,
  MealTabs,
  MealTotalsGrid,
  SearchBox,
  findAttendanceForMember,
  findMeal,
  memberName,
  mealLabel,
  normalizeMeals,
  todayIsoDate,
  type MealMember,
  type MealName,
  type MealRecord,
} from '@/components/mobile/meals-design'
import { api } from '@/lib/api'
import { getActiveMessId } from '@/lib/app-permissions'
import { useAuth } from '@/app/providers'
import { useLocale, useLocaleFormatters, useLocalizedNotice, useTranslations } from '@/lib/i18n'

export default function MemberMealsPage() {
  const { user } = useAuth()
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const mealCopy = useTranslations('meals')
  const messId = useMemo(() => getActiveMessId(user), [user])
  const [date, setDate] = useState(todayIsoDate())
  const [mealName, setMealName] = useState<MealName>('LUNCH')
  const [members, setMembers] = useState<MealMember[]>([])
  const [meals, setMeals] = useState<MealRecord[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const { notice, clearNotice, showError, showMessage } = useLocalizedNotice('meals')

  useEffect(() => {
    if (!messId) {
      setMembers([])
      setMeals([])
      setLoading(false)
      showMessage('noMessSelected', 'warning')
      return
    }
    let alive = true
    setLoading(true)
    clearNotice()

    Promise.all([
      api.getAllMembers({ limit: 500 }),
      api.getMealsByMess(messId, { startDate: date, endDate: date, limit: 20 }),
    ])
      .then(([memberRes, mealRes]) => {
        if (!alive) return
        const memberList = Array.isArray(memberRes.data) ? (memberRes.data as MealMember[]) : []
        setMembers(memberList.filter((member) => member.is_active !== false && (member.mess_id === messId || member.mess?.id === messId)))
        setMeals(normalizeMeals(mealRes.data))
      })
      .catch((error) => {
        if (!alive) return
        setMembers([])
        setMeals([])
        showError(error, 'loadMemberMealsFailed')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [clearNotice, date, messId, showError, showMessage, user?.id])

  const currentMeal = findMeal(meals, mealName)
  const filteredMembers = useMemo(() => {
    const term = search.trim().toLowerCase()
    return members.filter((member) => {
      const text = `${memberName(member, locale)} ${member.user?.email ?? ''} ${member.room_no ?? ''}`.toLowerCase()
      return !term || text.includes(term)
    })
  }, [locale, members, search])

  return (
    <MobileShell>
      <TopScreen title={mealCopy('allMemberMeals')} subtitle={mealLabel(mealName, locale)} backHref="/meals/manager" />
      <div className="screen space-y-4">
        <MealDateCard date={date} onChange={setDate} />
        <MealTabs value={mealName} onChange={setMealName} meals={meals} />

        <MealCard>
          <MealTotalsGrid meals={meals} />
        </MealCard>

        <MealCard className="space-y-3">
          <SearchBox value={search} onChange={setSearch} />
          {notice ? <InlineNotice tone={notice.tone}>{notice.message}</InlineNotice> : null}
          {loading ? <LoadingIndicator variant="card" label={mealCopy('loadingMemberMeals')} /> : null}
        </MealCard>

        <section className="space-y-2.5">
          {filteredMembers.map((member) => {
            const attendance = findAttendanceForMember(currentMeal, member.user?.id ?? member.user_id)
            const href = `/meals/member-meal?memberId=${encodeURIComponent(member.user?.id ?? member.user_id ?? '')}&meal=${mealName}&date=${date}&name=${encodeURIComponent(memberName(member, locale))}`
            return <MemberMealRow key={member.id || member.user?.id} member={member} mealName={mealName} attendance={attendance} href={href} />
          })}

          {!loading && !filteredMembers.length ? (
            <EmptyMealsState title={mealCopy('noMembersForMeal')} />
          ) : null}
        </section>

        <MealCard className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#edfafa] text-[#008d8c]">
            <Users size={19} />
          </div>
          <div>
            <div className="text-label font-bold text-[#123748]">{mealCopy('membersShown', { count: format.number(filteredMembers.length) })}</div>
            <div className="mt-1 text-label text-[#65838b]">{mealCopy('tapMemberToUpdate')}</div>
          </div>
        </MealCard>
      </div>
    </MobileShell>
  )
}
