'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, TrendingUp, DollarSign, PieChart } from 'lucide-react'
import { ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend, Tooltip } from 'recharts'

const expenseData = [
  { name: 'Groceries', value: 4500 },
  { name: 'Utilities', value: 1200 },
  { name: 'Maintenance', value: 800 },
  { name: 'Other', value: 500 },
]

const COLORS = ['var(--primary)', 'var(--accent)', 'var(--secondary)', 'var(--chart-5)']

const recentTransactions = [
  { id: 1, description: 'Grocery Purchase', amount: -450, type: 'expense', date: '2024-05-03' },
  { id: 2, description: 'Member Payment', amount: 5000, type: 'income', date: '2024-05-02' },
  { id: 3, description: 'Electricity Bill', amount: -300, type: 'expense', date: '2024-05-01' },
  { id: 4, description: 'Member Payment', amount: 5000, type: 'income', date: '2024-04-30' },
  { id: 5, description: 'Water Supply', amount: -150, type: 'expense', date: '2024-04-29' },
]

export default function FinancePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader
        title="Finance"
        description="Track expenses, income, and manage financial reports"
      />

      <div className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="p-6 border-border bg-gradient-to-br from-accent/10 to-primary/10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Total Income</p>
                  <p className="text-3xl font-bold text-foreground">₹50,000</p>
                </div>
                <div className="p-3 rounded-lg bg-accent/20">
                  <TrendingUp size={24} className="text-accent" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </Card>

            <Card className="p-6 border-border bg-gradient-to-br from-primary/10 to-secondary/10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Total Expenses</p>
                  <p className="text-3xl font-bold text-foreground">₹7,000</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/20">
                  <DollarSign size={24} className="text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </Card>

            <Card className="p-6 border-border bg-gradient-to-br from-secondary/10 to-accent/10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Balance</p>
                  <p className="text-3xl font-bold text-foreground">₹43,000</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/20">
                  <PieChart size={24} className="text-secondary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Available funds</p>
            </Card>
          </div>

          {/* Charts & Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pie Chart */}
            <Card className="p-6 border-border lg:col-span-2">
              <h3 className="text-lg font-semibold text-foreground mb-4">Expense Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name} - ₹${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value}`} />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6 border-border flex flex-col">
              <h3 className="text-lg font-semibold text-foreground mb-4">Actions</h3>
              <div className="space-y-3 flex-1">
                <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground flex items-center gap-2 justify-center">
                  <Plus size={18} />
                  Add Expense
                </Button>
                <Button variant="outline" className="w-full border-border text-foreground hover:bg-accent/10">
                  Add Income
                </Button>
                <Button variant="outline" className="w-full border-border text-foreground hover:bg-accent/10">
                  Generate Report
                </Button>
              </div>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card className="p-6 border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Recent Transactions</h3>
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-card/50 transition"
                >
                  <div>
                    <p className="font-medium text-foreground">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">{transaction.date}</p>
                  </div>
                  <div
                    className={`text-lg font-bold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {transaction.type === 'income' ? '+' : ''}₹{Math.abs(transaction.amount)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
