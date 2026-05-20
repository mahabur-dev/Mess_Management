'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/app/context/auth-context'
import { apiClient, type ExpenseCategory, type Mess, type MonthlyBill } from '@/lib/api-client'
import { ClipboardList, Plus, ReceiptText, WalletCards } from 'lucide-react'
import { useEffect, useState } from 'react'

const categories: ExpenseCategory[] = ['FOOD', 'GAS', 'ELECTRICITY', 'WIFI', 'CLEANER', 'MAINTENANCE', 'OTHER']

export default function FinancePage() {
  const { user } = useAuth()
  const [messes, setMesses] = useState<Mess[]>([])
  const [bills, setBills] = useState<MonthlyBill[]>([])
  const [expense, setExpense] = useState({ itemName: '', quantity: '', amount: '', category: 'FOOD' as ExpenseCategory, expenseDate: new Date().toISOString().slice(0, 10) })
  const [message, setMessage] = useState('')
  const activeMess = messes[0] ?? user?.memberships?.[0]?.mess
  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'ORGANIZER'

  async function load() {
    const messRes = await apiClient.getMesses().catch(() => null)
    const list = Array.isArray(messRes?.data)
      ? messRes.data
      : messRes?.data
        ? [messRes.data]
        : ((user?.memberships?.map((item) => item.mess).filter(Boolean) ?? []) as Mess[])
    setMesses(list)
    if (list[0]) {
      const billRes = isManager ? await apiClient.getBillsByMess(list[0].id).catch(() => null) : await apiClient.getMyBills().catch(() => null)
      setBills(Array.isArray(billRes?.data) ? billRes.data : [])
    }
  }

  useEffect(() => {
    load()
  }, [user?.role])

  async function addExpense() {
    if (!activeMess || !expense.amount) return
    await apiClient.createExpense({
      messId: activeMess.id,
      category: expense.category,
      amount: Number(expense.amount),
      itemName: expense.itemName,
      quantity: expense.quantity ? Number(expense.quantity) : undefined,
      expenseDate: expense.expenseDate,
    })
    setExpense({ itemName: '', quantity: '', amount: '', category: 'FOOD', expenseDate: new Date().toISOString().slice(0, 10) })
    setMessage('Expense added successfully.')
  }

  async function generateBill() {
    if (!activeMess) return
    await apiClient.generateMonthlyBill({ messId: activeMess.id, month: new Date().toISOString().slice(0, 8) + '01' })
    setMessage('Monthly bills generated successfully.')
    await load()
  }

  const totalDue = bills.reduce((sum, bill) => sum + Number(bill.final_due ?? 0), 0)
  const paid = bills.reduce((sum, bill) => sum + Number(bill.paid_amount ?? 0), 0)

  return (
    <div className="min-h-screen">
      <DashboardHeader title={isManager ? 'Bazar / Expenses & Monthly Bills' : 'My Bill'} description="Auto calculation from food, rent, utility and payment data" />
      <div className="p-4 sm:p-6 lg:p-8">
        {message && <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">{message}</div>}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card className="app-card p-5">
            <WalletCards className="mb-4 text-[#6f3df4]" />
            <p className="text-sm font-bold text-muted-foreground">Final Due</p>
            <p className="mt-2 text-2xl font-black">৳ {totalDue.toLocaleString()}</p>
          </Card>
          <Card className="app-card p-5">
            <ReceiptText className="mb-4 text-[#22b66f]" />
            <p className="text-sm font-bold text-muted-foreground">Paid Amount</p>
            <p className="mt-2 text-2xl font-black">৳ {paid.toLocaleString()}</p>
          </Card>
          <Card className="app-card p-5">
            <ClipboardList className="mb-4 text-[#f59e0b]" />
            <p className="text-sm font-bold text-muted-foreground">Bills</p>
            <p className="mt-2 text-2xl font-black">{bills.length}</p>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
          {isManager && (
            <Card className="app-card h-fit p-5">
              <h2 className="mb-4 text-lg font-black">Add Bazar / Expense</h2>
              <div className="space-y-4">
                <input className="soft-input w-full" placeholder="Item name" value={expense.itemName} onChange={(e) => setExpense((f) => ({ ...f, itemName: e.target.value }))} />
                <div className="grid grid-cols-2 gap-3">
                  <input className="soft-input w-full" type="number" placeholder="Quantity" value={expense.quantity} onChange={(e) => setExpense((f) => ({ ...f, quantity: e.target.value }))} />
                  <input className="soft-input w-full" type="number" placeholder="Price" value={expense.amount} onChange={(e) => setExpense((f) => ({ ...f, amount: e.target.value }))} />
                </div>
                <select className="soft-input w-full" value={expense.category} onChange={(e) => setExpense((f) => ({ ...f, category: e.target.value as ExpenseCategory }))}>
                  {categories.map((item) => <option key={item}>{item}</option>)}
                </select>
                <input className="soft-input w-full" type="date" value={expense.expenseDate} onChange={(e) => setExpense((f) => ({ ...f, expenseDate: e.target.value }))} />
                <Button onClick={addExpense} disabled={!activeMess} className="gradient-button w-full rounded-lg font-bold"><Plus size={16} className="mr-2" /> Add Expense</Button>
                <Button onClick={generateBill} disabled={!activeMess} variant="outline" className="w-full rounded-lg font-bold">Generate Monthly Bill</Button>
              </div>
            </Card>
          )}

          <Card className={`app-card overflow-hidden ${isManager ? '' : 'xl:col-span-2'}`}>
            <div className="border-b border-border p-5">
              <h2 className="text-lg font-black">{isManager ? 'Monthly Bills' : 'My Monthly Bills'}</h2>
            </div>
            <div className="divide-y divide-border">
              {bills.length === 0 && <p className="p-5 text-sm font-semibold text-muted-foreground">No bills generated yet.</p>}
              {bills.map((bill) => (
                <div key={bill.id} className="grid gap-3 p-4 md:grid-cols-5 md:items-center">
                  <div className="md:col-span-2">
                    <p className="font-black">{bill.member?.name ?? 'My Bill'}</p>
                    <p className="text-xs font-semibold text-muted-foreground">{new Date(bill.month).toLocaleDateString()}</p>
                  </div>
                  <p className="text-sm font-bold">Meals: {bill.total_meals}</p>
                  <p className="text-sm font-bold">Due: ৳ {Number(bill.final_due).toLocaleString()}</p>
                  <span className="w-fit rounded-full bg-[#f4f7fb] px-3 py-1 text-xs font-black">{bill.status}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
