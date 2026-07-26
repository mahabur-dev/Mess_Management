'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export type MemberOption = {
  id: string
  name: string
  email: string
}

type CurrentUserOption = {
  id?: string | null
  name?: string | null
  email?: string | null
}

function getCurrentUserOption(user?: CurrentUserOption | null): MemberOption[] {
  if (!user?.id) return []

  return [
    {
      id: user.id,
      name: user.name || 'Current user',
      email: user.email || '',
    },
  ]
}

function uniqueMembers(members: MemberOption[]) {
  const byId = new Map<string, MemberOption>()
  members.forEach((member) => {
    if (member.id && !byId.has(member.id)) byId.set(member.id, member)
  })
  return Array.from(byId.values())
}

export function useMessMemberOptions(messId: string, currentUser?: CurrentUserOption | null) {
  const [members, setMembers] = useState<MemberOption[]>([])
  const currentUserId = currentUser?.id
  const currentUserName = currentUser?.name
  const currentUserEmail = currentUser?.email

  useEffect(() => {
    const fallbackUser = {
      id: currentUserId,
      name: currentUserName,
      email: currentUserEmail,
    }

    if (!messId) {
      setMembers(getCurrentUserOption(fallbackUser))
      return
    }

    let alive = true
    const fallbackMembers = getCurrentUserOption(fallbackUser)

    api
      .getAllMembers({ limit: 200 })
      .then((res) => {
        if (!alive) return

        const list = Array.isArray(res.data) ? res.data : []
        const messMembers = list
          .filter((item: any) => (item.mess?.id ?? item.mess_id) === messId && item.user?.id)
          .map((item: any) => ({
            id: item.user.id,
            name: item.user.name || 'Unnamed member',
            email: item.user.email || '',
          }))

        setMembers(uniqueMembers(messMembers.length ? messMembers : fallbackMembers))
      })
      .catch(() => {
        if (alive) setMembers(fallbackMembers)
      })

    return () => {
      alive = false
    }
  }, [currentUserEmail, currentUserId, currentUserName, messId])

  return members
}
