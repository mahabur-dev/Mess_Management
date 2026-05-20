'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { apiClient, type Mess, type Payment, type PaymentMethod } from '@/lib/api-client'
import { useAuth } from '@/app/context/auth-context'
import { Check, CreditCard, Loader2, Plus, X } from 'lucide-react'
import { useEffect, useState } from 'react'

const methods: PaymentMethod[] = ['CASH', 'BKASH', 'NAGAD', 'ROCKET', 'BANK']

export default function PaymentsPage() {
  const [messes, setMesses] = useState<Mess[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('BKASH')
  const { user } = useAuth()
  const activeMess = messes[0] ?? user?.memberships?.[0]?.mess
  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'ORGANIZER'

  async function load() {
    setLoading(true)
    try {
      const messRes = await apiClient.getMesses().catch(() => null)
      const list = Array.isArray(messRes?.data)
        ? messRes.data
        : messRes?.data
          ? [messRes.data]
          : ((user?.memberships?.map((item) => item.mess).filter(Boolean) ?? []) as Mess[])
      setMesses(list)
      if (list[0]) {
        const paymentRes = isManager ? await apiClient.getPaymentsByMess(list[0].id).catch(() => null) : await apiClient.getMyPayments().catch(() => null)
        setPayments(Array.isArray(paymentRes?.data) ? paymentRes.data : [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [user?.role])

  async function submitPayment() {
    if (!activeMess || !amount) return
    await apiClient.submitPayment({ messId: activeMess.id, amount: Number(amount), method })
    setAmount('')
    await load()
  }

  async function review(id: string, status: 'APPROVED' | 'REJECTED') {
    await apiClient.reviewPayment(id, { status })
    await load()
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader title="Payments" description="Approve member payments and track transaction status" />
      <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[360px_1fr] lg:p-8">
        <Card className="app-card h-fit p-5">
          <h2 className="mb-4 text-lg font-black">Submit Payment</h2>
          <div className="space-y-4">
            <input className="soft-input w-full" type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <select className="soft-input w-full" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
              {methods.map((item) => <option key={item}>{item}</option>)}
            </select>
            <Button disabled={!activeMess} onClick={submitPayment} className="gradient-button w-full rounded-lg font-bold">
              <Plus size={16} className="mr-2" /> Submit Payment
            </Button>
          </div>
        </Card>

        <Card className="app-card p-5">
          <h2 className="mb-4 text-lg font-black">Payment Requests</h2>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="animate-spin" size={16} /> Loading payments...</div>
          ) : payments.length === 0 ? (
            <p className="text-sm font-semibold text-muted-foreground">No payment records yet.</p>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="flex flex-col gap-3 rounded-lg border border-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#efe9ff] text-[#6f3df4]"><CreditCard size={20} /></span>
                    <div>
                      <p className="font-black">৳ {Number(payment.amount).toLocaleString()} via {payment.method}</p>
                      <p className="text-xs font-semibold text-muted-foreground">{payment.member?.name ?? 'Member'} • {payment.status}</p>
                    </div>
                  </div>
                  {isManager && payment.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => review(payment.id, 'APPROVED')} className="bg-[#22b66f] hover:bg-[#1fa463]"><Check size={14} /></Button>
                      <Button size="sm" variant="outline" onClick={() => review(payment.id, 'REJECTED')} className="text-destructive"><X size={14} /></Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
