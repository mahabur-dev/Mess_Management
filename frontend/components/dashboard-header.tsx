'use client'

import { useAuth } from '@/app/context/auth-context'
import { Bell, CalendarDays, ChevronDown, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'

interface DashboardHeaderProps {
  title: string
  description?: string
}

export function DashboardHeader({ title, description }: DashboardHeaderProps) {
  const { user, logout } = useAuth()
  const router = useRouter()

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-[#f8fbff]/92 backdrop-blur-xl">
      <div className="flex min-h-[76px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="pl-12 md:pl-0">
          <h1 className="text-2xl font-black tracking-tight text-[#0a1433] sm:text-3xl">{title}</h1>
          {description && <p className="mt-1 text-sm font-medium text-muted-foreground">{description}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" className="hidden h-10 rounded-lg border-border bg-white font-bold sm:flex">
            <CalendarDays size={16} className="mr-2 text-[#667085]" />
            May 19, 2026
          </Button>
          <Button className="gradient-button h-10 rounded-lg font-bold">
            <Plus size={16} className="mr-2" />
            Quick Add
          </Button>
          <Button size="icon" variant="outline" className="relative h-10 w-10 rounded-lg bg-white">
            <Bell size={18} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#ff2e55]" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 rounded-lg bg-white px-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#6f3df4] to-[#2f5bf6] text-xs font-black text-white">
                  {user?.name?.charAt(0).toUpperCase() || 'M'}
                </span>
                <span className="hidden max-w-[120px] truncate px-2 text-sm font-bold sm:inline">{user?.name}</span>
                <ChevronDown size={15} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-bold">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>Profile Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
