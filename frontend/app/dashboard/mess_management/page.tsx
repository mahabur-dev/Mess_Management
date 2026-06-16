'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/app/context/auth-context'
import { apiClient, type Mess } from '@/lib/api-client'
import { Building2, CheckCircle2, Loader2, Save, Home, Settings2, MapPin, Users, CalendarDays, Clock, FileText, Send, AlertCircle } from 'lucide-react'
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
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [requestForm, setRequestForm] = useState({ messName: '', address: '', totalSeats: '', monthlyRent: '', description: '' })
  const [setup, setSetup] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
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
    setSubmitting(true)
    try {
      await apiClient.requestMessRegistration({
        messName: requestForm.messName,
        address: requestForm.address,
        totalSeats: requestForm.totalSeats ? Number(requestForm.totalSeats) : undefined,
        monthlyRent: requestForm.monthlyRent ? Number(requestForm.monthlyRent) : undefined,
        description: requestForm.description || undefined,
      })
      setRequestForm({ messName: '', address: '', totalSeats: '', monthlyRent: '', description: '' })
      setMessage('Mess registration request submitted. Super admin will review it.')
      setMessageType('success')
    } catch {
      setMessage('Failed to submit request. Please try again.')
      setMessageType('error')
    } finally {
      setSubmitting(false)
    }
  }

  async function saveSetup() {
    if (!activeMess) return
    setMessage('')
    setSaving(true)
    try {
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
      setMessageType('success')
      await load()
    } catch {
      setMessage('Failed to save setup. Please try again.')
      setMessageType('error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fafcff]">
      <DashboardHeader
        title={isAdmin ? 'All Messes' : isManager ? 'Mess Settings' : 'Request Mess Registration'}
        description={isAdmin ? 'Super admin approved/rejected mess overview' : 'Follow the approved backend workflow'}
      />
      <div className="p-4 sm:p-6 lg:p-8">
        {message && (
          <div className={`mb-6 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-bold shadow-sm ${
            messageType === 'success'
              ? 'border-emerald-200/60 bg-emerald-50 text-emerald-700'
              : 'border-red-200/60 bg-red-50 text-red-700'
          }`}>
            {messageType === 'success' ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
            {message}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm font-bold text-[#6b7a99]">
            <Loader2 className="animate-spin text-[#2f80ed]" size={20} />
            Loading mess data...
          </div>
        ) : isAdmin ? (
          /* ── Admin: All Messes Grid ── */
          <div>
            <div className="mb-7 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#2f80ed]/15 to-[#8b5cf6]/15 shadow-sm">
                <Building2 size={24} className="text-[#8b5cf6]" />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#172554]">All Registered Messes</h2>
                <p className="mt-0.5 text-xs font-semibold text-[#6b7a99]">{messes.length} mess{messes.length !== 1 ? 'es' : ''} found</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {messes.map((mess) => (
                <div
                  key={mess.id}
                  className="group relative overflow-hidden rounded-xl border border-[#e6ebf4] bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-[#a9ccfb] hover:shadow-md"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#2f80ed] via-[#58d68d] to-[#ffb84d]" />
                  <div className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2f80ed]/10 to-[#8b5cf6]/10 shadow-sm">
                        <Home size={20} className="text-[#2f80ed]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-black text-[#172554]">{mess.name}</h3>
                        <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-[#6b7a99]">
                          <MapPin size={12} className="shrink-0 text-[#ffb84d]" />
                          {mess.address || 'No address'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-[#f8faff] p-3">
                      <div>
                        <p className="text-[10px] font-black uppercase text-[#6b7a99]">Members</p>
                        <p className="mt-0.5 text-sm font-bold text-[#172554]">
                          {mess._count?.memberships ?? 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-[#6b7a99]">Status</p>
                        <span className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          mess.settings_completed
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                            : 'bg-amber-50 text-amber-700 border border-amber-200/50'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${mess.settings_completed ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {mess.settings_completed ? 'Complete' : 'Incomplete'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : isManager && activeMess ? (
          /* ── Manager: Mess Setup Form ── */
          <div className="grid gap-7 xl:grid-cols-[1fr_380px]">
            {/* Setup Form */}
            <div className="overflow-hidden rounded-xl border border-[#e6ebf4] bg-white shadow-[0_8px_30px_rgba(65,103,153,0.08)]">
              <div className="border-b border-[#e6ebf4] bg-gradient-to-r from-[#f8faff] via-white to-[#fafcff] px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#2f80ed]/15 to-[#58d68d]/15 shadow-sm">
                    <Settings2 size={22} className="text-[#2f80ed]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#2f80ed]">Configuration</p>
                    <h2 className="mt-1 text-lg font-black text-[#172554]">Complete Mess Setup</h2>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Mess Name</label>
                    <input
                      className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                      value={setup.messName ?? ''}
                      onChange={(e) => setSetup((s) => ({ ...s, messName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Address</label>
                    <input
                      className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                      value={setup.address ?? ''}
                      onChange={(e) => setSetup((s) => ({ ...s, address: e.target.value }))}
                    />
                  </div>
                  {setupFields.map(([key, label, type]) => (
                    <div key={key}>
                      <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">{label}</label>
                      <input
                        className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                        type={type}
                        value={setup[key] ?? ''}
                        onChange={(e) => setSetup((s) => ({ ...s, [key]: e.target.value }))}
                      />
                    </div>
                  ))}
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Bazar Rules</label>
                    <textarea
                      className="min-h-[120px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 py-3 text-sm font-semibold text-[#172554] outline-none focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                      value={setup.bazarRules ?? ''}
                      onChange={(e) => setSetup((s) => ({ ...s, bazarRules: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={saveSetup}
                    disabled={saving}
                    className="inline-flex h-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-6 font-black text-white shadow-[0_12px_28px_rgba(47,128,237,0.25)] transition hover:shadow-[0_16px_35px_rgba(47,128,237,0.32)] disabled:opacity-70"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? 'Saving...' : 'Save Setup'}
                  </button>
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="h-fit overflow-hidden rounded-xl border border-[#e6ebf4] bg-white shadow-[0_8px_30px_rgba(65,103,153,0.08)]">
              <div className="border-b border-[#e6ebf4] bg-gradient-to-r from-[#f8faff] via-white to-[#fafcff] px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-orange-100 shadow-sm">
                    <Home size={22} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-600">Overview</p>
                    <h2 className="mt-1 text-lg font-black text-[#172554]">{activeMess.name}</h2>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-xl border border-[#e6ebf4] bg-[#fafcff] p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-50 to-green-100">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#172554]">Setup Status</p>
                      <p className="text-xs font-semibold text-[#6b7a99]">
                        {activeMess.settings_completed ? 'Setup completed' : 'Setup incomplete'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-[#e6ebf4] bg-[#fafcff] p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-50 to-orange-100">
                      <CalendarDays size={16} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#172554]">Payment Deadline</p>
                      <p className="text-xs font-semibold text-[#6b7a99]">
                        Day {activeMess.payment_deadline_day ?? 10} of each month
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-[#e6ebf4] bg-[#fafcff] p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100">
                      <Clock size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#172554]">Meal Off Deadline</p>
                      <p className="text-xs font-semibold text-[#6b7a99]">
                        {activeMess.meal_off_deadline ?? '22:00'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── Regular Member: Request Registration ── */
          <div className="mx-auto max-w-2xl">
            <div className="overflow-hidden rounded-xl border border-[#e6ebf4] bg-white shadow-[0_8px_30px_rgba(65,103,153,0.08)]">
              <div className="border-b border-[#e6ebf4] bg-gradient-to-r from-[#f8faff] via-white to-[#fafcff] px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#2f80ed]/15 to-[#8b5cf6]/15 shadow-sm">
                    <Building2 size={22} className="text-[#8b5cf6]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#2f80ed]">Registration</p>
                    <h2 className="mt-1 text-lg font-black text-[#172554]">Request Mess Registration</h2>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="mb-6 text-sm font-semibold leading-relaxed text-[#6b7a99]">
                  You are registered as a member. Submit this request to become a manager after super admin approval.
                </p>

                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Mess Name</label>
                    <input
                      className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                      placeholder="Enter mess name"
                      value={requestForm.messName}
                      onChange={(e) => setRequestForm((f) => ({ ...f, messName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Address</label>
                    <input
                      className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                      placeholder="Enter mess address"
                      value={requestForm.address}
                      onChange={(e) => setRequestForm((f) => ({ ...f, address: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Total Seats</label>
                      <input
                        className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                        type="number"
                        placeholder="e.g. 10"
                        value={requestForm.totalSeats}
                        onChange={(e) => setRequestForm((f) => ({ ...f, totalSeats: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Monthly Rent (৳)</label>
                      <input
                        className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                        type="number"
                        placeholder="e.g. 5000"
                        value={requestForm.monthlyRent}
                        onChange={(e) => setRequestForm((f) => ({ ...f, monthlyRent: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Description</label>
                    <textarea
                      className="min-h-[120px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 py-3 text-sm font-semibold text-[#172554] outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                      placeholder="Add any additional details about your mess..."
                      value={requestForm.description}
                      onChange={(e) => setRequestForm((f) => ({ ...f, description: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={submitRequest}
                    disabled={submitting || !requestForm.messName.trim()}
                    className="inline-flex h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-6 font-black text-white shadow-[0_12px_28px_rgba(47,128,237,0.25)] transition hover:shadow-[0_16px_35px_rgba(47,128,237,0.32)] disabled:opacity-70 sm:w-auto"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}