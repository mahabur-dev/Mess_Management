'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { apiClient } from '@/lib/api-client'
import { Check, ClipboardList, Loader2, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface MessRequest {
  id: string
  mess_name: string
  address?: string | null
  total_seats?: number | null
  monthly_rent?: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  requester?: { name: string; email: string; phone?: string | null }
}

export default function MessRequestsPage() {
  const [requests, setRequests] = useState<MessRequest[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const response = await apiClient.getMessRequests({ limit: 50 })
      setRequests(Array.isArray(response.data) ? (response.data as MessRequest[]) : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function review(id: string, status: 'APPROVED' | 'REJECTED') {
    await apiClient.reviewMessRequest(id, { status })
    await load()
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader title="Mess Requests" description="Super admin review queue for new mess registrations" />
      <div className="p-4 sm:p-6 lg:p-8">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="animate-spin" size={16} /> Loading requests...</div>
        ) : requests.length === 0 ? (
          <Card className="app-card p-6 text-sm font-semibold text-muted-foreground">No mess registration requests yet.</Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {requests.map((request) => (
              <Card key={request.id} className="app-card p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#efe9ff] text-[#6f3df4]">
                      <ClipboardList size={20} />
                    </span>
                    <div>
                      <p className="text-xs font-black text-[#6f3df4]">{request.status}</p>
                      <h3 className="mt-1 text-lg font-black">{request.mess_name}</h3>
                      <p className="mt-1 text-sm font-semibold text-muted-foreground">{request.address || 'No address provided'}</p>
                      <p className="mt-3 text-sm font-bold">{request.requester?.name} • {request.requester?.email}</p>
                      <p className="text-xs font-semibold text-muted-foreground">
                        Seats: {request.total_seats ?? '-'} • Rent: ৳ {Number(request.monthly_rent ?? 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {request.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => review(request.id, 'APPROVED')} className="bg-[#22b66f] hover:bg-[#1fa463]"><Check size={15} /></Button>
                      <Button size="sm" variant="outline" onClick={() => review(request.id, 'REJECTED')} className="text-destructive"><X size={15} /></Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
