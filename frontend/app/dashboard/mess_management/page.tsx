'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { useAuth } from '@/app/context/auth-context'
import { apiClient, type Mess, type MessRoom, type SubscriptionPlan, type SubscriptionStatus } from '@/lib/api-client'
import {
  AlertCircle,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  Home,
  Loader2,
  MapPin,
  Plus,
  Save,
  Send,
  Settings2,
} from 'lucide-react'
import { useEffect, useState } from 'react'

type RoomDraft = {
  id: string
  roomName: string
  perPerson: string
  roomPrice: string
}

type RoomPayload = {
  roomName: string
  perPerson?: number
  roomPrice?: number
}

type SetupState = {
  messName: string
  address: string
  totalSeats: string
  monthlyRent: string
  messCategory: string
  paymentDeadlineDay: string
  mealOffDeadline: string
  bazarRules: string
  rooms: RoomDraft[]
}

type MessSubscriptionSummary = {
  plan: SubscriptionPlan
  status: SubscriptionStatus
  start_date: string
  end_date: string | null
}

const createRoomDraft = (room?: Partial<RoomDraft>): RoomDraft => ({
  id: room?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  roomName: room?.roomName ?? '',
  perPerson: room?.perPerson ?? '',
  roomPrice: room?.roomPrice ?? '',
})

const createEmptySetup = (): SetupState => ({
  messName: '',
  address: '',
  totalSeats: '',
  monthlyRent: '',
  messCategory: '',
  paymentDeadlineDay: '10',
  mealOffDeadline: '22:00',
  bazarRules: '',
  rooms: [createRoomDraft()],
})

function normalizeRooms(rooms?: MessRoom[] | null): RoomDraft[] {
  if (!Array.isArray(rooms) || rooms.length === 0) {
    return [createRoomDraft()]
  }

  return rooms.map((room) =>
    createRoomDraft({
      roomName: room?.roomName ?? '',
      perPerson: room?.perPerson !== undefined && room?.perPerson !== null ? String(room.perPerson) : '',
      roomPrice: room?.roomPrice !== undefined && room?.roomPrice !== null ? String(room.roomPrice) : '',
    }),
  )
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'N/A'
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getDaysRemaining(endDate: string | null | undefined) {
  if (!endDate) return null
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function planLabel(plan?: SubscriptionPlan | null) {
  if (!plan) return 'N/A'
  if (plan === 'MONTHLY') return 'Monthly'
  if (plan === 'YEARLY') return 'Yearly'
  return 'Trial'
}

export default function MessManagementPage() {
  const { user } = useAuth()
  const [messes, setMesses] = useState<Mess[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [requestForm, setRequestForm] = useState({
    messName: '',
    address: '',
    totalSeats: '',
    monthlyRent: '',
    description: '',
  })
  const [setup, setSetup] = useState<SetupState>(createEmptySetup)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [subscription, setSubscription] = useState<MessSubscriptionSummary | null>(null)
  const activeMess = messes[0]
  const isAdmin = user?.role === 'ADMIN'
  const isManager = user?.role === 'MANAGER' || user?.role === 'ORGANIZER'

  async function load() {
    setLoading(true)
    try {
      const response = isAdmin ? await apiClient.getAllMesses({ limit: 100 }) : await apiClient.getMesses()
      const list = Array.isArray(response.data) ? response.data : response.data ? [response.data] : []
      setMesses(list)
      setSubscription(null)

      if (list[0]) {
        if (isManager) {
          const subscriptionResponse = await apiClient.getMessSubscription(list[0].id).catch(() => null)
          const data = subscriptionResponse?.data
          if (data && typeof data === 'object' && 'plan' in data) {
            setSubscription({
              plan: data.plan as SubscriptionPlan,
              status: data.status as SubscriptionStatus,
              start_date: data.start_date,
              end_date: data.end_date,
            })
          }
        }

        setSetup({
          messName: list[0].name ?? '',
          address: list[0].address ?? '',
          totalSeats: String(list[0].total_seats ?? ''),
          monthlyRent: String(list[0].monthly_rent ?? ''),
          messCategory: list[0].mess_category ?? '',
          paymentDeadlineDay: String(list[0].payment_deadline_day ?? 10),
          mealOffDeadline: list[0].meal_off_deadline ?? '22:00',
          bazarRules: list[0].bazar_rules ?? '',
          rooms: normalizeRooms(list[0].rooms),
        })
      } else {
        setSetup(createEmptySetup())
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
      const rooms: RoomPayload[] = setup.rooms
        .map((room): RoomPayload | null => {
          const roomName = room.roomName.trim()
          const perPerson = room.perPerson.trim()
          const roomPrice = room.roomPrice.trim()

          if (!roomName && !perPerson && !roomPrice) return null

          return {
            roomName,
            perPerson: perPerson ? Number(perPerson) : undefined,
            roomPrice: roomPrice ? Number(roomPrice) : undefined,
          }
        })
        .filter((room): room is RoomPayload => room !== null)

      await apiClient.updateMessSetup(activeMess.id, {
        messName: setup.messName,
        address: setup.address,
        totalSeats: setup.totalSeats ? Number(setup.totalSeats) : undefined,
        monthlyRent: setup.monthlyRent ? Number(setup.monthlyRent) : undefined,
        messCategory: setup.messCategory || undefined,
        rooms: rooms.length ? rooms : undefined,
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

  function updateRoom(index: number, field: keyof RoomDraft, value: string) {
    setSetup((current) => ({
      ...current,
      rooms: current.rooms.map((room, roomIndex) =>
        roomIndex === index ? { ...room, [field]: value } : room,
      ),
    }))
  }

  function addRoom() {
    setSetup((current) => ({
      ...current,
      rooms: [...current.rooms, createRoomDraft()],
    }))
  }

  return (
    <div className="min-h-screen bg-[#fafcff]">
      <DashboardHeader
        title={isAdmin ? 'All Messes' : isManager ? 'Mess Settings' : 'Request Mess Registration'}
        description={isAdmin ? 'Super admin approved/rejected mess overview' : 'Follow the approved backend workflow'}
      />
      <div className="p-4 sm:p-6 lg:p-8">
        {message && (
          <div
            className={`mb-6 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-bold shadow-sm ${
              messageType === 'success'
                ? 'border-emerald-200/60 bg-emerald-50 text-emerald-700'
                : 'border-red-200/60 bg-red-50 text-red-700'
            }`}
          >
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
          <div>
            <div className="mb-7 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#2f80ed]/15 to-[#8b5cf6]/15 shadow-sm">
                <Building2 size={24} className="text-[#8b5cf6]" />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#172554]">All Registered Messes</h2>
                <p className="mt-0.5 text-xs font-semibold text-[#6b7a99]">
                  {messes.length} mess{messes.length !== 1 ? 'es' : ''} found
                </p>
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
                        <p className="mt-0.5 text-sm font-bold text-[#172554]">{mess._count?.memberships ?? 0}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-[#6b7a99]">Status</p>
                        <span
                          className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            mess.settings_completed
                              ? 'border border-emerald-200/50 bg-emerald-50 text-emerald-700'
                              : 'border border-amber-200/50 bg-amber-50 text-amber-700'
                          }`}
                        >
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
          <div className="grid gap-7 xl:grid-cols-[1fr_380px]">
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
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">
                      Mess Name
                    </label>
                    <input
                      className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                      value={setup.messName}
                      onChange={(e) => setSetup((current) => ({ ...current, messName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">
                      Address
                    </label>
                    <input
                      className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                      value={setup.address}
                      onChange={(e) => setSetup((current) => ({ ...current, address: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">
                      Mess Category
                    </label>
                    <input
                      className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                      placeholder="flat, mess"
                      value={setup.messCategory}
                      onChange={(e) => setSetup((current) => ({ ...current, messCategory: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">
                      Total Seats
                    </label>
                    <input
                      className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                      type="number"
                      value={setup.totalSeats}
                      onChange={(e) => setSetup((current) => ({ ...current, totalSeats: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">
                      Monthly Rent
                    </label>
                    <input
                      className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                      type="number"
                      value={setup.monthlyRent}
                      onChange={(e) => setSetup((current) => ({ ...current, monthlyRent: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">
                      Payment Deadline Day
                    </label>
                    <input
                      className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                      type="number"
                      value={setup.paymentDeadlineDay}
                      onChange={(e) => setSetup((current) => ({ ...current, paymentDeadlineDay: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">
                      Meal Off Deadline
                    </label>
                    <input
                      className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                      value={setup.mealOffDeadline}
                      onChange={(e) => setSetup((current) => ({ ...current, mealOffDeadline: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">
                      Rooms
                    </label>
                    <div className="space-y-4">
                      {setup.rooms.map((room, index) => (
                        <div key={room.id} className="rounded-xl border border-[#d8e6f8] bg-[#fafcff] p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#172554]">
                              Room {index + 1}
                            </p>
                          </div>
                          <div className="grid gap-4 md:grid-cols-3">
                            <div>
                              <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">
                                Room Name
                              </label>
                              <input
                                className="h-[44px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                                value={room.roomName}
                                onChange={(e) => updateRoom(index, 'roomName', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">
                                Total Person
                              </label>
                              <input
                                className="h-[44px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                                type="number"
                                value={room.perPerson}
                                onChange={(e) => updateRoom(index, 'perPerson', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">
                                Room Price
                              </label>
                              <input
                                className="h-[44px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                                type="number"
                                value={room.roomPrice}
                                onChange={(e) => updateRoom(index, 'roomPrice', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={addRoom}
                      className="mt-4 inline-flex h-[44px] items-center justify-center gap-2 rounded-xl border border-[#cfe0fb] bg-[#f8faff] px-4 text-sm font-black text-[#2f80ed] transition hover:border-[#a9ccfb] hover:bg-white"
                    >
                      <Plus size={16} />
                      Add More Room
                    </button>
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">
                      Bazar Rules
                    </label>
                    <textarea
                      className="min-h-[120px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 py-3 text-sm font-semibold text-[#172554] outline-none focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                      value={setup.bazarRules}
                      onChange={(e) => setSetup((current) => ({ ...current, bazarRules: e.target.value }))}
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
                    <div className="rounded-xl border border-[#cfe0fb] bg-gradient-to-br from-[#f8faff] to-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#2f80ed]">Subscription</p>
                          <h3 className="mt-1 text-base font-black text-[#172554]">
                            {subscription ? planLabel(subscription.plan) : 'Subscription not loaded'}
                          </h3>
                        </div>
                        {subscription && (
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black ${
                              subscription.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700'
                                : subscription.status === 'EXPIRED'
                                  ? 'bg-red-50 text-red-700'
                                  : subscription.status === 'CANCELLED'
                                    ? 'bg-slate-50 text-slate-700'
                                    : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {subscription.status}
                          </span>
                        )}
                      </div>

                      {subscription ? (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-lg border border-[#e6ebf4] bg-white p-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Started</p>
                            <p className="mt-1 text-sm font-bold text-[#172554]">{formatDate(subscription.start_date)}</p>
                          </div>
                          <div className="rounded-lg border border-[#e6ebf4] bg-white p-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Ends</p>
                            <p className="mt-1 text-sm font-bold text-[#172554]">{formatDate(subscription.end_date)}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-3 text-xs font-semibold text-[#6b7a99]">No subscription details found for this mess.</p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="inline-flex items-center rounded-full border border-[#e6ebf4] bg-white px-3 py-1 text-xs font-bold text-[#53617d]">
                          Days left: {subscription && subscription.end_date ? `${Math.max(getDaysRemaining(subscription.end_date) ?? 0, 0)} days` : 'N/A'}
                        </span>
                        <span className="inline-flex items-center rounded-full border border-[#e6ebf4] bg-white px-3 py-1 text-xs font-bold text-[#53617d]">
                          Plan: {planLabel(subscription?.plan)}
                        </span>
                      </div>
                    </div>

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
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-50 to-blue-100">
                      <Building2 size={16} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#172554]">Mess Category</p>
                      <p className="text-xs font-semibold text-[#6b7a99]">{activeMess.mess_category || 'Not set'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-[#e6ebf4] bg-[#fafcff] p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-sky-50 to-cyan-100">
                      <Settings2 size={16} className="text-sky-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#172554]">Rooms</p>
                      <p className="text-xs font-semibold text-[#6b7a99]">{activeMess.rooms?.length ?? 0} room sections</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-[#e6ebf4] bg-[#fafcff] p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-50 to-orange-100">
                      <CalendarDays size={16} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#172554]">Payment Deadline</p>
                      <p className="text-xs font-semibold text-[#6b7a99]">Day {activeMess.payment_deadline_day ?? 10} of each month</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-[#e6ebf4] bg-[#fafcff] p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100">
                      <Clock size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#172554]">Meal Off Deadline</p>
                      <p className="text-xs font-semibold text-[#6b7a99]">{activeMess.meal_off_deadline ?? '22:00'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
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
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">
                      Mess Name
                    </label>
                    <input
                      className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                      placeholder="Enter mess name"
                      value={requestForm.messName}
                      onChange={(e) => setRequestForm((current) => ({ ...current, messName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">
                      Address
                    </label>
                    <input
                      className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                      placeholder="Enter mess address"
                      value={requestForm.address}
                      onChange={(e) => setRequestForm((current) => ({ ...current, address: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">
                        Total Seats
                      </label>
                      <input
                        className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                        type="number"
                        placeholder="e.g. 10"
                        value={requestForm.totalSeats}
                        onChange={(e) => setRequestForm((current) => ({ ...current, totalSeats: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">
                        Monthly Rent (৳)
                      </label>
                      <input
                        className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                        type="number"
                        placeholder="e.g. 5000"
                        value={requestForm.monthlyRent}
                        onChange={(e) => setRequestForm((current) => ({ ...current, monthlyRent: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">
                      Description
                    </label>
                    <textarea
                      className="min-h-[120px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 py-3 text-sm font-semibold text-[#172554] outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                      placeholder="Add any additional details about your mess..."
                      value={requestForm.description}
                      onChange={(e) => setRequestForm((current) => ({ ...current, description: e.target.value }))}
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
