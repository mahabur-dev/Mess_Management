'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Users, TrendingUp, CalendarDays, ChevronDown, ChevronUp, UserCheck, UserX } from 'lucide-react'
import { useState } from 'react'

const attendanceData = [
  {
    date: '2024-05-03',
    day: 'Thursday',
    total: 50,
    present: 48,
    absent: 2,
    users: [
      { id: 1, name: 'John Doe', status: 'present' },
      { id: 2, name: 'Sarah Smith', status: 'present' },
      { id: 3, name: 'Mike Johnson', status: 'absent' },
      { id: 4, name: 'Emma Wilson', status: 'present' },
      { id: 5, name: 'David Brown', status: 'absent' },
    ],
  },
  {
    date: '2024-05-02',
    day: 'Wednesday',
    total: 50,
    present: 49,
    absent: 1,
    users: [
      { id: 1, name: 'John Doe', status: 'present' },
      { id: 2, name: 'Sarah Smith', status: 'present' },
      { id: 3, name: 'Mike Johnson', status: 'present' },
      { id: 4, name: 'Emma Wilson', status: 'present' },
      { id: 5, name: 'David Brown', status: 'absent' },
    ],
  },
  {
    date: '2024-05-01',
    day: 'Tuesday',
    total: 50,
    present: 47,
    absent: 3,
    users: [
      { id: 1, name: 'John Doe', status: 'present' },
      { id: 2, name: 'Sarah Smith', status: 'absent' },
      { id: 3, name: 'Mike Johnson', status: 'present' },
      { id: 4, name: 'Emma Wilson', status: 'present' },
      { id: 5, name: 'David Brown', status: 'absent' },
    ],
  },
]

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

const formatDate = (iso: string) => {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function AttendancePage() {
  const [expandedDate, setExpandedDate] = useState('2024-05-03')

  const overallStats = {
    totalPresent: attendanceData.reduce((sum, d) => sum + d.present, 0),
    totalAbsent: attendanceData.reduce((sum, d) => sum + d.absent, 0),
    totalDays: attendanceData.length,
    avgAttendance: Math.round(
      (attendanceData.reduce((sum, d) => sum + d.present, 0) /
        (attendanceData.reduce((sum, d) => sum + d.total, 0) || 1)) *
        100
    ),
  }

  return (
    <div className="min-h-screen bg-[#fafcff]">
      <DashboardHeader
        title="Attendance"
        description="Track and manage member attendance records"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-7">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#2f80ed]/15 to-[#58d68d]/15 shadow-sm">
            <Users size={24} className="text-[#2f80ed]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#172554]">Attendance Records</h2>
            <p className="mt-0.5 text-xs font-semibold text-[#6b7a99]">Last {overallStats.totalDays} days overview</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 p-5 text-white shadow-[0_8px_25px_rgba(0,0,0,0.08)]">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/15 blur-2xl" />
            <div className="relative">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/80">
                <UserCheck size={14} />
                Total Present
              </p>
              <p className="mt-2 text-3xl font-semibold">{overallStats.totalPresent}</p>
              <p className="mt-1 text-xs font-bold text-white/60">Last 3 days</p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-red-500 to-rose-600 p-5 text-white shadow-[0_8px_25px_rgba(0,0,0,0.08)]">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/15 blur-2xl" />
            <div className="relative">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/80">
                <UserX size={14} />
                Total Absent
              </p>
              <p className="mt-2 text-3xl font-semibold">{overallStats.totalAbsent}</p>
              <p className="mt-1 text-xs font-bold text-white/60">Last 3 days</p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-[#2f80ed] to-[#3b8cff] p-5 text-white shadow-[0_8px_25px_rgba(0,0,0,0.08)]">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/15 blur-2xl" />
            <div className="relative">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/80">
                <TrendingUp size={14} />
                Avg Attendance
              </p>
              <p className="mt-2 text-3xl font-semibold">{overallStats.avgAttendance}%</p>
              <p className="mt-1 text-xs font-bold text-white/60">Overall rate</p>
            </div>
          </div>
        </div>

        {/* Daily Records */}
        <div>
          <h2 className="mb-5 text-sm font-semibold text-[#172554]">Daily Records</h2>
          <div className="space-y-4">
            {attendanceData.map((day) => {
              const isExpanded = expandedDate === day.date
              const rate = Math.round((day.present / day.total) * 100)
              
              return (
                <div
                  key={day.date}
                  className="overflow-hidden rounded-xl border border-[#e6ebf4] bg-white shadow-sm transition hover:border-[#a9ccfb]"
                >
                  <button
                    onClick={() => setExpandedDate(isExpanded ? '' : day.date)}
                    className="w-full p-5 transition flex items-center justify-between hover:bg-[#f8faff]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2f80ed]/10 to-[#58d68d]/10 shadow-sm">
                        <CalendarDays size={18} className="text-[#2f80ed]" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-[#172554]">{day.day}</p>
                        <p className="text-xs font-semibold text-[#6b7a99]">{formatDate(day.date)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-5">
                      <div className="text-right hidden sm:block">
                        <p className="text-lg font-semibold text-[#172554]">{day.present}</p>
                        <p className="text-[10px] font-bold text-emerald-600">Present</p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-lg font-semibold text-[#172554]">{day.absent}</p>
                        <p className="text-[10px] font-bold text-red-500">Absent</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#2f80ed]/10 to-[#58d68d]/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-[#2f80ed]">{rate}%</span>
                        </div>
                        {isExpanded ? <ChevronUp size={16} className="text-[#6b7a99]" /> : <ChevronDown size={16} className="text-[#6b7a99]" />}
                      </div>
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-[#e6ebf4] bg-[#f8faff] p-5">
                      <h4 className="mb-4 text-xs font-semibold uppercase tracking-wide text-[#6b7a99]">Member Details</h4>
                      <div className="space-y-2">
                        {day.users.map((u) => {
                          const bgColor = avatarColor(u.name)
                          return (
                            <div
                              key={u.id}
                              className="flex items-center justify-between rounded-xl border border-[#e6ebf4] bg-white p-3 transition hover:border-[#a9ccfb]"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border text-[10px] font-semibold"
                                  style={{ backgroundColor: `${bgColor}18`, borderColor: `${bgColor}55`, color: bgColor }}
                                >
                                  {getInitials(u.name)}
                                </div>
                                <span className="text-sm font-bold text-[#172554]">{u.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {u.status === 'present' ? (
                                  <>
                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                    <span className="text-[11px] font-bold text-emerald-600">Present</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle size={16} className="text-red-500" />
                                    <span className="text-[11px] font-bold text-red-500">Absent</span>
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="overflow-hidden rounded-xl border border-[#e6ebf4] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2f80ed]/10 to-[#58d68d]/10 shadow-sm">
              <TrendingUp size={18} className="text-[#2f80ed]" />
            </div>
            <h3 className="text-sm font-semibold text-[#172554]">Attendance Insights</h3>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="rounded-xl border border-[#e6ebf4] bg-[#fafcff] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6b7a99]">Best Day</p>
              <p className="mt-1 text-base font-semibold text-[#172554]">Wednesday - 98%</p>
              <p className="text-xs font-semibold text-[#6b7a99] mt-0.5">Highest attendance rate</p>
            </div>
            <div className="rounded-xl border border-[#e6ebf4] bg-[#fafcff] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6b7a99]">Recurring Absentees</p>
              <p className="mt-1 text-base font-semibold text-[#172554]">2 Members</p>
              <p className="text-xs font-semibold text-[#6b7a99] mt-0.5">Need follow-up</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}