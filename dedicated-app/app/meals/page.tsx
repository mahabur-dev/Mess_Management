'use client'

import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { CalendarDays, Coffee, Moon, Sun } from 'lucide-react'

const meals = [
  { name: 'Breakfast', time: '06:00 AM', icon: Coffee, color: '#f59e0b' },
  { name: 'Lunch', time: '01:00 PM', icon: Sun, color: '#0f7e86' },
  { name: 'Dinner', time: '08:30 PM', icon: Moon, color: '#3b82f6' },
]

export default function MealsPage() {
  return (
    <MobileShell>
      <TopScreen title="Meals" subtitle="Meal management" />
      <div className="screen space-y-4">
        <div className="glass rounded-[28px] p-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              ['Today Meal', '3'],
              ['Total Meals', '90'],
              ['Meal Rate', 'BDT 80'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-white px-3 py-4 text-center shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-[0.14em] text-[#667b8a]">{label}</div>
                <div className="mt-1 text-xl font-black text-[#14324a]">{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="section-title">Today</div>
        <div className="space-y-3">
          {meals.map(({ name, time, icon: Icon, color }) => (
            <div key={name} className="glass flex items-center gap-3 rounded-[24px] p-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl" style={{ backgroundColor: `${color}18`, color }}>
                <Icon size={20} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-extrabold text-[#14324a]">{name}</div>
                <div className="mt-1 flex items-center gap-1 text-xs font-medium text-[#667b8a]">
                  <CalendarDays size={12} /> {time}
                </div>
              </div>
              <div className="text-sm font-black text-[#14324a]">BDT 80</div>
            </div>
          ))}
        </div>
      </div>
    </MobileShell>
  )
}
