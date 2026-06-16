'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Card } from '@/components/ui/card'
import { apiClient, type User } from '@/lib/api-client'
import { Users, Mail, Shield, UserRound, Search, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#10b981', '#3b82f6', '#f43f5e']

const avatarColor = (name: string) => {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const ROLE_BADGES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  ADMIN: { label: 'Admin', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200/50' },
  ORGANIZER: { label: 'Organizer', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200/50' },
  MANAGER: { label: 'Manager', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/50' },
  MEMBER: { label: 'Member', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/50' },
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    apiClient.getUsers({ limit: 100 })
      .then((response) => setUsers(Array.isArray(response.data) ? response.data : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = users.filter((u) => {
    const term = search.toLowerCase()
    return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term) || u.role.toLowerCase().includes(term)
  })

  return (
    <div className="min-h-screen bg-[#fafcff]">
      <DashboardHeader title="Users" description="Super admin user management" />

      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#2f80ed]/15 to-[#8b5cf6]/15 shadow-sm">
              <Users size={24} className="text-[#8b5cf6]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#172554]">All Users</h2>
              <p className="mt-0.5 text-xs font-semibold text-[#6b7a99]">{users.length} user{users.length !== 1 ? 's' : ''} registered</p>
            </div>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7c70a8]" />
            <input
              className="h-[45px] w-full rounded-xl border border-[#d8e6f8] bg-white pl-10 pr-4 text-sm font-semibold text-[#172554] shadow-sm outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
              placeholder="Search by name, email, role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-hidden rounded-xl border border-[#e6ebf4] bg-white shadow-[0_8px_30px_rgba(65,103,153,0.08)]">
          {/* Desktop Table */}
          <div className="hidden sm:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e6ebf4] bg-[#f8faff]">
                  <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">User</th>
                  <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Email</th>
                  <th className="whitespace-nowrap px-5 py-4 text-center text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6ebf4]">
                {loading && (
                  <tr>
                    <td colSpan={3} className="px-5 py-12 text-center">
                      <div className="flex items-center justify-center gap-2 text-sm font-bold text-[#6b7a99]">
                        <Loader2 size={18} className="animate-spin text-[#2f80ed]" />
                        Loading users...
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-5 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Users size={40} className="text-[#d8e6f8]" />
                        <p className="text-sm font-bold text-[#6b7a99]">No users found.</p>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && filtered.map((u) => {
                  const bgColor = avatarColor(u.name)
                  const roleCfg = ROLE_BADGES[u.role] || ROLE_BADGES.MEMBER
                  return (
                    <tr key={u.id} className="transition hover:bg-[#f8faff]">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-black"
                            style={{ backgroundColor: `${bgColor}18`, borderColor: `${bgColor}55`, color: bgColor }}
                          >
                            {getInitials(u.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[#172554]">{u.name}</p>
                            <p className="text-xs font-semibold text-[#6b7a99] sm:hidden">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-5 py-4 sm:table-cell">
                        <div className="flex items-center gap-2 text-sm font-semibold text-[#6b7a99]">
                          <Mail size={14} className="text-[#2f80ed] shrink-0" />
                          <span className="truncate">{u.email}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-center">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold ${roleCfg.bg} ${roleCfg.text} ${roleCfg.border}`}>
                          {u.role === 'ADMIN' ? <Shield size={12} /> : <UserRound size={12} />}
                            {roleCfg.label}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-3 p-4 sm:hidden">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-[#2f80ed]" />
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <Users size={40} className="mb-2 text-[#d8e6f8]" />
                <p className="text-sm font-bold text-[#6b7a99]">No users found.</p>
              </div>
            )}
            {!loading && filtered.map((u) => {
              const bgColor = avatarColor(u.name)
              const roleCfg = ROLE_BADGES[u.role] || ROLE_BADGES.MEMBER
              return (
                <div key={u.id} className="rounded-xl border border-[#e6ebf4] bg-white p-4 shadow-sm transition hover:border-[#a9ccfb]">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-xs font-black"
                      style={{ backgroundColor: `${bgColor}18`, borderColor: `${bgColor}55`, color: bgColor }}
                    >
                      {getInitials(u.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[#172554]">{u.name}</p>
                      <p className="truncate text-xs font-semibold text-[#6b7a99]">{u.email}</p>
                    </div>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${roleCfg.bg} ${roleCfg.text} ${roleCfg.border}`}>
                      {u.role === 'ADMIN' ? <Shield size={11} /> : <UserRound size={11} />}
                      {roleCfg.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          {!loading && filtered.length > 0 && (
            <div className="border-t-2 border-[#d8e6f8] bg-[#f8faff] px-5 py-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[#6b7a99]">
                  Showing <span className="text-[#172554]">{filtered.length}</span> of <span className="text-[#172554]">{users.length}</span> users
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}