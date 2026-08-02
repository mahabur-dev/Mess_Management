'use client'

import { useEffect, useState } from 'react'
import { LoadingIndicator } from '@/components/loading-indicator'
import { MemberDetailsView } from '@/components/mobile/member-details'
import type { MobileMember } from '@/components/mobile/member-card'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { api } from '@/lib/api'
import { useQueryParams } from '@/lib/use-query-params'

export default function MemberDetailsPage() {
  const searchParams = useQueryParams()
  const memberId = searchParams.get('memberId') ?? ''
  const messId = searchParams.get('messId') ?? ''
  const [member, setMember] = useState<MobileMember | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!memberId || !messId) {
      setMessage('Member information is missing.')
      return
    }

    let active = true
    setLoading(true)
    setMessage('')

    api
      .getAllMembers({ limit: 500 })
      .then((response) => {
        if (!active) return
        const members = Array.isArray(response.data) ? response.data : []
        const found =
          members.find(
            (item: MobileMember) =>
              item.user_id === memberId && (item.mess_id === messId || item.mess?.id === messId),
          ) ?? null

        setMember(found)
        if (!found) setMessage('Member not found.')
      })
      .catch((error) => {
        if (!active) return
        setMember(null)
        setMessage(error instanceof Error ? error.message : 'Failed to load member details.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [memberId, messId])

  return (
    <MobileShell>
      <TopScreen title="Member Details" subtitle={member?.user?.name || 'Member overview'} backHref="/members" />
      <div className="screen">
        {loading ? <LoadingIndicator variant="card" label="Loading member details" /> : null}
        {message ? <div className="ui-notice ui-notice--danger">{message}</div> : null}
        {member ? <MemberDetailsView member={member} /> : null}
      </div>
    </MobileShell>
  )
}
