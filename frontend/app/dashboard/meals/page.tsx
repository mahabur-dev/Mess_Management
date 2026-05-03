'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Clock, Users } from 'lucide-react'

const mealsData = [
  {
    id: 1,
    day: 'Monday',
    breakfast: 'Bread & Butter with Tea',
    lunch: 'Dal Makhani, Rice, Roti',
    dinner: 'Chicken Curry, Naan, Salad',
    attendees: 42,
  },
  {
    id: 2,
    day: 'Tuesday',
    breakfast: 'Eggs & Toast with Coffee',
    lunch: 'Paneer Butter Masala, Basmati Rice',
    dinner: 'Fish Curry, Bread, Vegetables',
    attendees: 45,
  },
  {
    id: 3,
    day: 'Wednesday',
    breakfast: 'Oatmeal with Fruits',
    lunch: 'Chole Bhature, Pickle, Yogurt',
    dinner: 'Biryani, Cucumber Raita',
    attendees: 48,
  },
  {
    id: 4,
    day: 'Thursday',
    breakfast: 'Poha & Jalebi with Tea',
    lunch: 'Rajma Rice, Salad, Pickle',
    dinner: 'Tandoori Chicken, Naan, Dal',
    attendees: 50,
  },
  {
    id: 5,
    day: 'Friday',
    breakfast: 'Idli & Sambar with Coffee',
    lunch: 'Dum Aloo, Paratha, Raita',
    dinner: 'Mutton Keema, Rice, Salad',
    attendees: 52,
  },
]

export default function MealsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader
        title="Meals"
        description="Manage and track meal plans and schedules"
      />

      <div className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Action Button */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Weekly Menu</h2>
              <p className="text-sm text-muted-foreground mt-1">Plan and manage meals for the week</p>
            </div>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground flex items-center gap-2">
              <Plus size={18} />
              Add Meal
            </Button>
          </div>

          {/* Meals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mealsData.map((meal) => (
              <Card key={meal.id} className="p-6 border-border hover:shadow-lg transition">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-foreground">{meal.day}</h3>
                  <span className="px-3 py-1 bg-accent/10 text-accent text-xs font-semibold rounded-full">
                    {meal.attendees} joining
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">
                      Breakfast
                    </p>
                    <p className="text-sm text-foreground">{meal.breakfast}</p>
                  </div>

                  <div className="border-t border-border pt-3">
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">
                      Lunch
                    </p>
                    <p className="text-sm text-foreground">{meal.lunch}</p>
                  </div>

                  <div className="border-t border-border pt-3">
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">
                      Dinner
                    </p>
                    <p className="text-sm text-foreground">{meal.dinner}</p>
                  </div>
                </div>

                <div className="border-t border-border pt-4 mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-border text-foreground hover:bg-accent/10"
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Stats */}
          <Card className="p-6 border-border bg-gradient-to-r from-primary/5 to-accent/5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users size={20} className="text-accent" />
                  <p className="text-sm text-muted-foreground">Total Attendees</p>
                </div>
                <p className="text-2xl font-bold text-foreground">237</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={20} className="text-secondary" />
                  <p className="text-sm text-muted-foreground">Avg. per Meal</p>
                </div>
                <p className="text-2xl font-bold text-foreground">47.4</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-full bg-primary" />
                  <p className="text-sm text-muted-foreground">Weeks Planned</p>
                </div>
                <p className="text-2xl font-bold text-foreground">12</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
