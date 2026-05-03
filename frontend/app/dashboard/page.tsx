'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth, UserRole } from '@/app/context/auth-context'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'
import { ArrowUpRight, Users, UtensilsCrossed, ShoppingCart, TrendingUp } from 'lucide-react'

const dashboardData = [
  { month: 'Jan', users: 65, meals: 45 },
  { month: 'Feb', users: 78, meals: 52 },
  { month: 'Mar', users: 92, meals: 68 },
  { month: 'Apr', users: 110, meals: 85 },
  { month: 'May', users: 130, meals: 95 },
  { month: 'Jun', users: 150, meals: 110 },
]

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader
        title={`Welcome back, ${user?.name}!`}
        description={`You are logged in as a ${user?.role}`}
      />

      <div className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Total Members',
                value: '150',
                icon: Users,
                change: '+12%',
                trend: 'up',
              },
              {
                label: 'Meals This Month',
                value: '95',
                icon: UtensilsCrossed,
                change: '+8%',
                trend: 'up',
              },
              {
                label: 'Pending Orders',
                value: '23',
                icon: ShoppingCart,
                change: '-3%',
                trend: 'down',
              },
              {
                label: 'Attendance Rate',
                value: '92%',
                icon: TrendingUp,
                change: '+5%',
                trend: 'up',
              },
            ].map((stat, index) => {
              const Icon = stat.icon
              return (
                <Card key={index} className="p-6 border-border">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-lg bg-accent/10">
                      <Icon size={24} className="text-accent" />
                    </div>
                    <span
                      className={`text-xs font-semibold flex items-center gap-1 ${
                        stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {stat.change}
                      <ArrowUpRight size={14} />
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </Card>
              )
            })}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <Card className="p-6 border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">Member & Meal Growth</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: `1px solid var(--border)`,
                      borderRadius: '0.5rem',
                    }}
                    labelStyle={{ color: 'var(--foreground)' }}
                  />
                  <Bar dataKey="users" fill="var(--primary)" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="meals" fill="var(--accent)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Line Chart */}
            <Card className="p-6 border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">Attendance Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboardData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: `1px solid var(--border)`,
                      borderRadius: '0.5rem',
                    }}
                    labelStyle={{ color: 'var(--foreground)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="var(--secondary)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--secondary)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Role-Based Content */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-foreground">Quick Actions</h2>

            {user?.role === UserRole.ADMIN && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-6 border-border bg-gradient-to-br from-primary/5 to-accent/5">
                  <h3 className="font-semibold text-foreground mb-4">Admin Panel</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Manage users, finances, and system settings
                  </p>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    Manage Users
                  </Button>
                </Card>
                <Card className="p-6 border-border bg-gradient-to-br from-accent/5 to-secondary/5">
                  <h3 className="font-semibold text-foreground mb-4">System Health</h3>
                  <p className="text-sm text-muted-foreground mb-4">Check system status and reports</p>
                  <Button variant="outline" className="border-accent text-accent">
                    View Reports
                  </Button>
                </Card>
              </div>
            )}

            {user?.role === UserRole.MANAGER && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-6 border-border bg-gradient-to-br from-secondary/5 to-accent/5">
                  <h3 className="font-semibold text-foreground mb-4">Meal Planning</h3>
                  <p className="text-sm text-muted-foreground mb-4">Plan and manage weekly meals</p>
                  <Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                    Plan Meals
                  </Button>
                </Card>
                <Card className="p-6 border-border bg-gradient-to-br from-accent/5 to-primary/5">
                  <h3 className="font-semibold text-foreground mb-4">Finance Overview</h3>
                  <p className="text-sm text-muted-foreground mb-4">Track mess expenses and income</p>
                  <Button variant="outline" className="border-accent text-accent">
                    View Finance
                  </Button>
                </Card>
              </div>
            )}

            {user?.role === UserRole.USER && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-6 border-border bg-gradient-to-br from-primary/5 to-secondary/5">
                  <h3 className="font-semibold text-foreground mb-4">Mark Attendance</h3>
                  <p className="text-sm text-muted-foreground mb-4">Record your attendance for meals</p>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    Mark Present
                  </Button>
                </Card>
                <Card className="p-6 border-border bg-gradient-to-br from-accent/5 to-secondary/5">
                  <h3 className="font-semibold text-foreground mb-4">View Schedule</h3>
                  <p className="text-sm text-muted-foreground mb-4">Check meal schedule and menu</p>
                  <Button variant="outline" className="border-accent text-accent">
                    View Schedule
                  </Button>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
