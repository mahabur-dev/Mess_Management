'use client'

import { CalendarClock, LockKeyhole, Settings2, Users } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { ManagerActionCard, MealCard } from '@/components/mobile/meals-design'
import { useTranslations } from '@/lib/i18n'

export default function MealManagerPage() {
  const meals = useTranslations('meals')
  return (
    <MobileShell>
      <TopScreen title={meals('managerControls')} subtitle={meals('managerTools')} backHref="/meals" />
      <div className="screen space-y-4">
        <MealCard className="space-y-3">
          <ManagerActionCard href="/meals/members" icon={<Users size={21} />} title={meals('viewAllMeals')} description={meals('viewAllMealsDescription')} tone="amber" />
          <ManagerActionCard href="/meals/time" icon={<CalendarClock size={21} />} title={meals('setMealTime')} description={meals('setMealTimeDescription')} />
          <ManagerActionCard href="/meals/settings" icon={<Settings2 size={21} />} title={meals('settings')} description={meals('settingsDescription')} tone="aqua" />
          <ManagerActionCard href="/meals/locks" icon={<LockKeyhole size={21} />} title={meals('lockUnlockMeals')} description={meals('lockUnlockDescription')} tone="blue" />
        </MealCard>
      </div>
    </MobileShell>
  )
}
