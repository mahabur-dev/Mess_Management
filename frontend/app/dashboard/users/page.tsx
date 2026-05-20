'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Card } from '@/components/ui/card'
import { apiClient, type User } from '@/lib/api-client'
import { Users } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    apiClient.getUsers({ limit: 100 }).then((response) => setUsers(Array.isArray(response.data) ? response.data : [])).catch(() => setUsers([]))
  }, [])

  return (
    <div className="min-h-screen">
      <DashboardHeader title="Users" description="Super admin user management" />
      <div className="p-4 sm:p-6 lg:p-8">
        <Card className="app-card overflow-hidden">
          <div className="border-b border-border p-5">
            <h2 className="text-lg font-black">All Users</h2>
          </div>
          <div className="divide-y divide-border">
            {users.length === 0 && <p className="p-5 text-sm font-semibold text-muted-foreground">No users found.</p>}
            {users.map((user) => (
              <div key={user.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#efe9ff] text-[#6f3df4]"><Users size={18} /></span>
                  <div>
                    <p className="font-black">{user.name}</p>
                    <p className="text-xs font-semibold text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <span className="w-fit rounded-full bg-[#f4f7fb] px-3 py-1 text-xs font-black text-[#334155]">{user.role}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
