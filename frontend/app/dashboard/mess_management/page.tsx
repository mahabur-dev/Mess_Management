'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/app/context/auth-context'
import { apiClient, type Mess } from '@/lib/api-client'
import { Building2, CheckCircle2, Loader2, Save } from 'lucide-react'
import { useEffect, useState } from 'react'

const setupFields = [
  ['totalSeats', 'Total seats', 'number'],
  ['monthlyRent', 'Monthly rent', 'number'],
  ['electricityBill', 'Electricity bill', 'number'],
  ['gasBill', 'Gas bill', 'number'],
  ['wifiBill', 'WiFi bill', 'number'],
  ['cleanerBill', 'Cleaner bill', 'number'],
  ['extraCost', 'Extra cost', 'number'],
  ['paymentDeadlineDay', 'Payment deadline day', 'number'],
  ['mealOffDeadline', 'Meal off deadline', 'text'],
] as const

export default function MessManagementPage() {
  const { user } = useAuth()
  const [messes, setMesses] = useState<Mess[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [requestForm, setRequestForm] = useState({ messName: '', address: '', totalSeats: '', monthlyRent: '', description: '' })
  const [setup, setSetup] = useState<Record<string, string>>({})
  const activeMess = messes[0]
  const isAdmin = user?.role === 'ADMIN'
  const isManager = user?.role === 'MANAGER' || user?.role === 'ORGANIZER'

  async function load() {
    setLoading(true)
    try {
      const response = isAdmin ? await apiClient.getAllMesses({ limit: 100 }) : await apiClient.getMesses()
      const list = Array.isArray(response.data) ? response.data : response.data ? [response.data] : []
      setMesses(list)
      if (list[0]) {
        setSetup({
          messName: list[0].name ?? '',
          address: list[0].address ?? '',
          totalSeats: String(list[0].total_seats ?? ''),
          monthlyRent: String(list[0].monthly_rent ?? ''),
          electricityBill: String(list[0].electricity_bill ?? ''),
          gasBill: String(list[0].gas_bill ?? ''),
          wifiBill: String(list[0].wifi_bill ?? ''),
          cleanerBill: String(list[0].cleaner_bill ?? ''),
          extraCost: String(list[0].extra_cost ?? ''),
          paymentDeadlineDay: String(list[0].payment_deadline_day ?? 10),
          mealOffDeadline: list[0].meal_off_deadline ?? '22:00',
          bazarRules: '',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [user?.role])

  async function submitRequest() {
    setMessage('')
    await apiClient.requestMessRegistration({
      messName: requestForm.messName,
      address: requestForm.address,
      totalSeats: requestForm.totalSeats ? Number(requestForm.totalSeats) : undefined,
      monthlyRent: requestForm.monthlyRent ? Number(requestForm.monthlyRent) : undefined,
      description: requestForm.description || undefined,
    })
    setRequestForm({ messName: '', address: '', totalSeats: '', monthlyRent: '', description: '' })
    setMessage('Mess registration request submitted. Super admin will review it.')
  }

  async function saveSetup() {
    if (!activeMess) return
    setMessage('')
    await apiClient.updateMessSetup(activeMess.id, {
      messName: setup.messName,
      address: setup.address,
      totalSeats: setup.totalSeats ? Number(setup.totalSeats) : undefined,
      monthlyRent: setup.monthlyRent ? Number(setup.monthlyRent) : undefined,
      electricityBill: setup.electricityBill ? Number(setup.electricityBill) : undefined,
      gasBill: setup.gasBill ? Number(setup.gasBill) : undefined,
      wifiBill: setup.wifiBill ? Number(setup.wifiBill) : undefined,
      cleanerBill: setup.cleanerBill ? Number(setup.cleanerBill) : undefined,
      extraCost: setup.extraCost ? Number(setup.extraCost) : undefined,
      paymentDeadlineDay: setup.paymentDeadlineDay ? Number(setup.paymentDeadlineDay) : undefined,
      mealOffDeadline: setup.mealOffDeadline,
      bazarRules: setup.bazarRules,
      mealTypes: ['BREAKFAST', 'LUNCH', 'DINNER'],
      mealRateMethod: 'EXPENSE_DIVIDED_BY_MEAL_COUNT',
    })
    setMessage('Mess setup saved successfully.')
    await load()
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title={isAdmin ? 'All Messes' : isManager ? 'Mess Settings' : 'Request Mess Registration'}
        description={isAdmin ? 'Super admin approved/rejected mess overview' : 'Follow the approved backend workflow'}
      />
      <div className="p-4 sm:p-6 lg:p-8">
        {message && (
          <div className="mb-5 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
            <CheckCircle2 size={17} /> {message}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="animate-spin" size={16} /> Loading...</div>
        ) : isAdmin ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {messes.map((mess) => (
              <Card key={mess.id} className="app-card p-5">
                <div className="flex gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#efe9ff] text-[#6f3df4]"><Building2 size={20} /></span>
                  <div>
                    <h3 className="text-lg font-black">{mess.name}</h3>
                    <p className="text-sm font-semibold text-muted-foreground">{mess.address || 'No address'}</p>
                    <p className="mt-2 text-xs font-black">Members: {mess._count?.memberships ?? 0} • Setup: {mess.settings_completed ? 'Complete' : 'Incomplete'}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : isManager && activeMess ? (
          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <Card className="app-card p-5">
              <h2 className="mb-5 text-lg font-black">Complete Mess Setup</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-bold">Mess name</span>
                  <input className="soft-input w-full" value={setup.messName ?? ''} onChange={(e) => setSetup((s) => ({ ...s, messName: e.target.value }))} />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-bold">Address</span>
                  <input className="soft-input w-full" value={setup.address ?? ''} onChange={(e) => setSetup((s) => ({ ...s, address: e.target.value }))} />
                </label>
                {setupFields.map(([key, label, type]) => (
                  <label key={key}>
                    <span className="mb-2 block text-sm font-bold">{label}</span>
                    <input className="soft-input w-full" type={type} value={setup[key] ?? ''} onChange={(e) => setSetup((s) => ({ ...s, [key]: e.target.value }))} />
                  </label>
                ))}
                <label className="md:col-span-2">
                  <span className="mb-2 block text-sm font-bold">Bazar rules</span>
                  <textarea className="min-h-28 w-full rounded-lg border border-border bg-white p-3 text-sm outline-none focus:border-[#6f3df4] focus:ring-2 focus:ring-[#6f3df4]/15" value={setup.bazarRules ?? ''} onChange={(e) => setSetup((s) => ({ ...s, bazarRules: e.target.value }))} />
                </label>
              </div>
              <Button onClick={saveSetup} className="gradient-button mt-5 rounded-lg font-bold"><Save size={16} className="mr-2" /> Save Setup</Button>
            </Card>
            <Card className="app-card h-fit p-5">
              <h3 className="text-lg font-black">{activeMess.name}</h3>
              <p className="mt-2 text-sm font-semibold text-muted-foreground">{activeMess.settings_completed ? 'Setup completed' : 'Setup incomplete'}</p>
              <p className="mt-4 text-sm font-bold">Monthly bill deadline: {activeMess.payment_deadline_day ?? 10}</p>
              <p className="text-sm font-bold">Meal off deadline: {activeMess.meal_off_deadline ?? '22:00'}</p>
            </Card>
          </div>
        ) : (
          <Card className="app-card mx-auto max-w-2xl p-5">
            <h2 className="text-xl font-black">Request Mess Registration</h2>
            <p className="mt-2 text-sm font-semibold text-muted-foreground">
              You are registered as a member. Submit this request to become a manager after super admin approval.
            </p>
            <div className="mt-5 grid gap-4">
              <input className="soft-input" placeholder="Mess name" value={requestForm.messName} onChange={(e) => setRequestForm((f) => ({ ...f, messName: e.target.value }))} />
              <input className="soft-input" placeholder="Address" value={requestForm.address} onChange={(e) => setRequestForm((f) => ({ ...f, address: e.target.value }))} />
              <div className="grid gap-4 sm:grid-cols-2">
                <input className="soft-input" type="number" placeholder="Total seats" value={requestForm.totalSeats} onChange={(e) => setRequestForm((f) => ({ ...f, totalSeats: e.target.value }))} />
                <input className="soft-input" type="number" placeholder="Monthly rent" value={requestForm.monthlyRent} onChange={(e) => setRequestForm((f) => ({ ...f, monthlyRent: e.target.value }))} />
              </div>
              <textarea className="min-h-28 rounded-lg border border-border bg-white p-3 text-sm outline-none focus:border-[#6f3df4] focus:ring-2 focus:ring-[#6f3df4]/15" placeholder="Description" value={requestForm.description} onChange={(e) => setRequestForm((f) => ({ ...f, description: e.target.value }))} />
              <Button onClick={submitRequest} className="gradient-button rounded-lg font-bold">Submit Request</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
