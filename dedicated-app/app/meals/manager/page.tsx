'use client'

import { CalendarClock, LockKeyhole, Settings2, Users, UtensilsCrossed } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { ManagerActionCard, MealCard } from '@/components/mobile/meals-design'

export default function MealManagerPage() {
  return (
    <MobileShell>
      <TopScreen title="Manager Controls" subtitle="Meal operation tools" backHref="/meals" />
      <div className="screen space-y-4">
        <MealCard className="space-y-3">
          <ManagerActionCard href="/meals/time" icon={<CalendarClock size={21} />} title="Set Meal Time" description="Manage meal update window for members" />
          <ManagerActionCard href="/meals/locks" icon={<LockKeyhole size={21} />} title="Lock / Unlock Meals" description="Lock meals after deadline or reopen when needed" tone="blue" />
          <ManagerActionCard href="/meals/members" icon={<Users size={21} />} title="View All Meals" description="See and update all members meal status" tone="amber" />
          <ManagerActionCard href="/meals/settings" icon={<Settings2 size={21} />} title="Meal Settings" description="Configure meal preferences and reminders" tone="aqua" />
        </MealCard>

        <MealCard className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-[16px] bg-[#edfafa] text-[#008d8c]">
            <UtensilsCrossed size={22} />
          </div>
          <div>
            <div className="text-[13px] font-black text-[#123748]">Reusable meal feature</div>
            <div className="mt-1 text-[11px] font-semibold leading-4 text-[#65838b]">All manager pages use the same meal cards, tabs and API client methods.</div>
          </div>
        </MealCard>
      </div>
    </MobileShell>
  )
}
