'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, DoorOpen, MapPin, Search, Users } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { LoadingIndicator } from '@/components/loading-indicator'
import { FieldCard } from '@/components/mobile/form-controls'
import { TopScreen } from '@/components/top-screen'
import { api } from '@/lib/api'
import { useAuth } from '../providers'

type ActiveMess = {
  id: string
  name: string
  address?: string | null
  mess_category?: string | null
  total_seats?: number | null
  monthly_rent?: number | null
  creator?: {
    name?: string | null
    email?: string | null
  } | null
  _count?: {
    memberships?: number
  } | null
}

type JoinRequest = {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  mess_id?: string
  mess?: {
    id: string
    name?: string
  } | null
}

function formatMeta(mess: ActiveMess) {
  const pieces = [
    mess.mess_category,
    mess.total_seats ? `${mess.total_seats} seats` : null,
    mess._count?.memberships != null ? `${mess._count.memberships} members` : null,
  ].filter(Boolean)

  return pieces.length ? pieces.join(' | ') : 'Active mess'
}

export default function RequestMessPage() {
  const { refresh } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [messes, setMesses] = useState<ActiveMess[]>([])
  const [requests, setRequests] = useState<JoinRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [requestingId, setRequestingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(() => {
      setLoading(true)
      api
        .getActiveMesses({ searchTerm: searchTerm.trim(), limit: 20 })
        .then((res: any) => {
          if (!cancelled) setMesses(Array.isArray(res.data) ? res.data : [])
        })
        .catch((error) => {
          if (!cancelled) {
            setMesses([])
            setMessage(error instanceof Error ? error.message : 'Failed to load messes.')
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 250)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [searchTerm])

  useEffect(() => {
    let cancelled = false
    api
      .getMyMemberJoinRequests({ limit: 50 })
      .then((res: any) => {
        if (!cancelled) setRequests(Array.isArray(res.data) ? res.data : [])
      })
      .catch(() => {
        if (!cancelled) setRequests([])
      })

    return () => {
      cancelled = true
    }
  }, [])

  const requestByMessId = useMemo(() => {
    const map = new Map<string, JoinRequest>()
    requests.forEach((request) => {
      const messId = request.mess_id ?? request.mess?.id
      if (messId) map.set(messId, request)
    })
    return map
  }, [requests])

  async function handleRequest(mess: ActiveMess) {
    setMessage('')
    setRequestingId(mess.id)
    try {
      const res = await api.requestMemberJoin(mess.id)
      const created = (res.data ?? null) as JoinRequest | null
      if (created) setRequests((prev) => [created, ...prev])
      await refresh()
      setMessage(`Request sent to ${mess.name}.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to send request.')
    } finally {
      setRequestingId(null)
    }
  }

  return (
    <MobileShell>
      <TopScreen title="Request Mess" subtitle="Join an existing mess" backHref="/" />
      <div className="screen space-y-4">
        <section className="glass rounded-[24px] p-4">
          <FieldCard label="Search Mess" hint="Name or location">
            <div className="relative">
              <Search className="field-icon field-icon--leading" size={19} strokeWidth={2.4} />
              <input
                className="field field--leading-icon min-h-14"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search active mess"
              />
            </div>
          </FieldCard>
        </section>

        {message ? <div className="rounded-2xl border border-[#bfe7e6] bg-[#edfafa] px-4 py-3 text-label font-semibold text-[#008d8c]">{message}</div> : null}

        <section className="space-y-3">
          {loading ? (
            <LoadingIndicator variant="card" label="Loading messes" />
          ) : null}

          {!loading && !messes.length ? (
            <div className="glass rounded-[22px] px-4 py-5 text-center text-label font-bold text-[#65838b]">No active mess found.</div>
          ) : null}

          {!loading &&
            messes.map((mess) => {
              const existingRequest = requestByMessId.get(mess.id)
              const isPending = existingRequest?.status === 'PENDING'
              const isApproved = existingRequest?.status === 'APPROVED'
              const disabled = Boolean(existingRequest) || requestingId === mess.id

              return (
                <article key={mess.id} className="glass rounded-[22px] p-4">
                  <div className="flex items-start gap-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[16px] bg-[#edfafa] text-[#008d8c]">
                      <DoorOpen size={22} strokeWidth={2.4} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-body font-black text-[#123748]">{mess.name}</div>
                      <div className="mt-1 flex items-center gap-1.5 text-caption font-semibold text-[#65838b]">
                        <MapPin size={14} strokeWidth={2.4} />
                        <span className="min-w-0 truncate">{mess.address ?? 'Location not set'}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 text-caption font-bold text-[#008d8c]">
                        <Users size={14} strokeWidth={2.4} />
                        <span className="min-w-0 truncate">{formatMeta(mess)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => void handleRequest(mess)}
                    className="primary-btn mt-4 flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isApproved ? (
                      <>
                        <CheckCircle2 size={18} strokeWidth={2.4} />
                        Approved
                      </>
                    ) : isPending ? (
                      'Request Pending'
                    ) : requestingId === mess.id ? (
                      'Sending...'
                    ) : (
                      'Request to Join'
                    )}
                  </button>
                </article>
              )
            })}
        </section>
      </div>
    </MobileShell>
  )
}
