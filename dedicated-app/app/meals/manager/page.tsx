'use client'

import { CalendarClock, LockKeyhole, Settings2, Users, UtensilsCrossed } from 'lucide-react'
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
          <ManagerActionCard href="/meals/time" icon={<CalendarClock size={21} />} title={meals('setMealTime')} description={meals('setMealTimeDescription')} />
          <ManagerActionCard href="/meals/locks" icon={<LockKeyhole size={21} />} title={meals('lockUnlockMeals')} description={meals('lockUnlockDescription')} tone="blue" />
          <ManagerActionCard href="/meals/members" icon={<Users size={21} />} title={meals('viewAllMeals')} description={meals('viewAllMealsDescription')} tone="amber" />
          <ManagerActionCard href="/meals/settings" icon={<Settings2 size={21} />} title={meals('settings')} description={meals('settingsDescription')} tone="aqua" />
        </MealCard>

        <MealCard className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-[16px] bg-[#edfafa] text-[#008d8c]">
            <UtensilsCrossed size={22} />
          </div>
          <div>
            <div className="text-body font-bold text-[#123748]">{meals('sharedWorkflowTitle')}</div>
            <div className="mt-1 text-label text-[#65838b]">{meals('sharedWorkflowDescription')}</div>
          </div>
        </MealCard>
      </div>
    </MobileShell>
  )
}
