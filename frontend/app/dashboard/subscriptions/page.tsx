'use client'

import { useEffect, useState, useCallback } from 'react'
import { apiClient, BackendResponse } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CreditCard,
  Building2,
} from 'lucide-react'

interface SubscriptionData {
  id: string
  mess_id: string
  plan: 'TRIAL' | 'MONTHLY' | 'YEARLY'
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING'
  start_date: string
  end_date: string | null
  cancelled_at: string | null
  created_at: string
  mess: {
    id: string
    name: string
    address: string | null
    _count: { memberships: number }
  }
}

const planLabels: Record<string, { label: string; color: string; bg: string; icon: typeof Zap }> = {
  TRIAL: { label: '7 Days Free', color: '#6b7a99', bg: '#f0f6ff', icon: Clock },
  MONTHLY: { label: 'Monthly', color: '#2f80ed', bg: '#e7f1ff', icon: Zap },
  YEARLY: { label: 'Yearly', color: '#f59e0b', bg: '#fffbeb', icon: Sparkles },
}

const statusColors: Record<string, string> = {
  ACTIVE: 'text-[#10b981] bg-[#ecfdf5]',
  EXPIRED: 'text-[#ef4444] bg-[#fef2f2]',
  CANCELLED: 'text-[#6b7a99] bg-[#f1f5f9]',
  PENDING: 'text-[#f59e0b] bg-[#fffbeb]',
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function daysRemaining(endDate: string | null) {
  if (!endDate) return null
  const diff = new Date(endDate).getTime() - Date.now()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  return days
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPlan, setFilterPlan] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [checkingExpired, setCheckingExpired] = useState(false)

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true)
      const params: Record<string, string> = {}
      if (filterPlan) params.plan = filterPlan
      if (filterStatus) params.status = filterStatus
      
      const res = await apiClient.getSubscriptions(params)
      if (res?.data) {
        setSubscriptions(res.data as unknown as SubscriptionData[])
      }
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err)
    } finally {
      setLoading(false)
    }
  }, [filterPlan, filterStatus])

  useEffect(() => {
    fetchSubscriptions()
  }, [fetchSubscriptions])

  const handleCheckExpired = async () => {
    try {
      setCheckingExpired(true)
      await apiClient.checkExpiredSubscriptions()
      await fetchSubscriptions()
    } catch (err) {
      console.error('Failed to check expired:', err)
    } finally {
      setCheckingExpired(false)
    }
  }

  const handleInitializeTrial = async (messId: string) => {
    try {
      await apiClient.initializeTrial(messId)
      await fetchSubscriptions()
    } catch (err) {
      console.error('Failed to initialize trial:', err)
    }
  }

  const handleUpdatePlan = async (id: string, plan: string) => {
    try {
      await apiClient.updateSubscription(id, { plan })
      await fetchSubscriptions()
    } catch (err) {
      console.error('Failed to update plan:', err)
    }
  }

  const filteredSubscriptions = subscriptions.filter(s => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return s.mess.name.toLowerCase().includes(term) || 
             (s.mess.address?.toLowerCase().includes(term))
    }
    return true
  })

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'ACTIVE').length,
    expired: subscriptions.filter(s => s.status === 'EXPIRED').length,
    trial: subscriptions.filter(s => s.plan === 'TRIAL').length,
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#172554]">Subscriptions</h1>
          <p className="mt-1 text-sm font-semibold text-[#6b7a99]">
            Manage mess subscription plans and billing
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleCheckExpired}
            disabled={checkingExpired}
            className="h-10 rounded-xl border border-[#e6ebf4] bg-white px-4 text-sm font-bold text-[#53617d] hover:bg-[#f8faff]"
          >
            <RefreshCw size={15} className={`mr-1.5 ${checkingExpired ? 'animate-spin' : ''}`} />
            Check Expired
          </Button>
          <Button className="h-10 rounded-xl bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-5 font-bold text-white shadow-[0_8px_20px_rgba(47,128,237,0.25)]">
            <CreditCard size={15} className="mr-1.5" />
            Plans Info
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          ['Total', stats.total.toString(), 'from-[#2f80ed] to-[#6f3df4]', Building2],
          ['Active', stats.active.toString(), 'from-[#10b981] to-[#34d399]', CheckCircle2],
          ['Expired', stats.expired.toString(), 'from-[#ef4444] to-[#f43f5e]', AlertTriangle],
          ['Trial', stats.trial.toString(), 'from-[#f59e0b] to-[#f97316]', Clock],
        ].map(([label, value, gradient, Icon]) => (
          <div key={label as string} className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#f8faff] to-white border border-[#e6ebf4] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#6b7a99]">{label as string}</p>
                <p className="mt-1 text-2xl font-black text-[#172554]">{value as string}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r ${gradient} text-white`}>
                <Icon size={18} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a9bb5]" />
          <input
            type="text"
            placeholder="Search by mess name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 w-full rounded-xl border border-[#e6ebf4] bg-white pl-10 pr-4 text-sm font-semibold text-[#172554] placeholder:text-[#8a9bb5] focus:border-[#2f80ed] focus:outline-none"
          />
        </div>
        <select
          value={filterPlan}
          onChange={(e) => setFilterPlan(e.target.value)}
          className="h-11 rounded-xl border border-[#e6ebf4] bg-white px-4 text-sm font-semibold text-[#53617d] focus:border-[#2f80ed] focus:outline-none"
        >
          <option value="">All Plans</option>
          <option value="TRIAL">7 Days Free</option>
          <option value="MONTHLY">Monthly</option>
          <option value="YEARLY">Yearly</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-11 rounded-xl border border-[#e6ebf4] bg-white px-4 text-sm font-semibold text-[#53617d] focus:border-[#2f80ed] focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="EXPIRED">Expired</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="PENDING">Pending</option>
        </select>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded-xl border border-[#e6ebf4] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e6ebf4] bg-[#fafcff]">
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#6b7a99]">Mess</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#6b7a99]">Plan</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#6b7a99]">Status</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#6b7a99]">Members</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#6b7a99]">Start Date</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#6b7a99]">End Date</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#6b7a99]">Days Left</th>
                <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-[#6b7a99]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e6ebf4]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#e6ebf4] border-t-[#2f80ed]" />
                      <p className="text-sm font-semibold text-[#6b7a99]">Loading subscriptions...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <CreditCard size={32} className="text-[#d8e6f8]" />
                      <p className="text-sm font-bold text-[#6b7a99]">No subscriptions found</p>
                      <p className="text-xs font-semibold text-[#8a9bb5]">Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSubscriptions.map((sub) => {
                  const planInfo = planLabels[sub.plan] || planLabels.TRIAL
                  const PlanIcon = planInfo.icon
                  const daysLeft = daysRemaining(sub.end_date)
                  const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft > 0
                  const isExpired = daysLeft !== null && daysLeft <= 0

                  return (
                    <tr key={sub.id} className="transition hover:bg-[#fafcff]">
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-sm font-bold text-[#172554]">{sub.mess.name}</p>
                          <p className="mt-0.5 text-xs font-semibold text-[#8a9bb5]">{sub.mess.address || 'No address'}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold"
                          style={{ backgroundColor: planInfo.bg, color: planInfo.color }}
                        >
                          <PlanIcon size={13} />
                          {planInfo.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold ${statusColors[sub.status] || statusColors.PENDING}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            sub.status === 'ACTIVE' ? 'bg-[#10b981]' :
                            sub.status === 'EXPIRED' ? 'bg-[#ef4444]' :
                            sub.status === 'CANCELLED' ? 'bg-[#6b7a99]' : 'bg-[#f59e0b]'
                          }`} />
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-[#172554]">{sub.mess._count.memberships}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-[#53617d]">{formatDate(sub.start_date)}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-[#53617d]">{formatDate(sub.end_date)}</td>
                      <td className="px-5 py-4">
                        {daysLeft !== null ? (
                          <span className={`text-sm font-bold ${
                            isExpired ? 'text-[#ef4444]' :
                            isExpiringSoon ? 'text-[#f59e0b]' :
                            'text-[#10b981]'
                          }`}>
                            {isExpired ? 'Expired' : `${daysLeft} days`}
                          </span>
                        ) : (
                          <span className="text-sm font-semibold text-[#8a9bb5]">N/A</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(sub.status === 'EXPIRED' || sub.plan === 'TRIAL') && (
                            <Button
                              onClick={() => handleUpdatePlan(sub.id, 'MONTHLY')}
                              className="h-8 rounded-lg bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-3 text-xs font-bold text-white"
                            >
                              Upgrade
                            </Button>
                          )}
                          <select
                            value={sub.plan}
                            onChange={(e) => handleUpdatePlan(sub.id, e.target.value)}
                            className="h-8 rounded-lg border border-[#e6ebf4] bg-white px-2 text-xs font-semibold text-[#53617d]"
                          >
                            <option value="TRIAL">Trial</option>
                            <option value="MONTHLY">Monthly</option>
                            <option value="YEARLY">Yearly</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 text-center">
        <div className="inline-flex items-center gap-2 rounded-xl border border-[#e6ebf4] bg-[#fafcff] px-4 py-3">
          <CreditCard size={15} className="text-[#2f80ed]" />
          <span className="text-xs font-semibold text-[#6b7a99]">
            Pricing: <strong className="text-[#172554]">7 Days Free</strong> → 
            <strong className="text-[#2f80ed]"> ৳499/month</strong> → 
            <strong className="text-[#f59e0b]"> ৳4,999/year</strong> (Save ৳989/year)
          </span>
        </div>
      </div>
    </div>
  )
}