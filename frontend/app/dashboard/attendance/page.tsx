'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle } from 'lucide-react'
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

export default function AttendancePage() {
  const [expandedDate, setExpandedDate] = useState('2024-05-03')

  const overallStats = {
    totalPresent: attendanceData.reduce((sum, d) => sum + d.present, 0),
    totalAbsent: attendanceData.reduce((sum, d) => sum + d.absent, 0),
    avgAttendance: Math.round(
      (attendanceData.reduce((sum, d) => sum + d.present, 0) /
        (attendanceData.reduce((sum, d) => sum + d.total, 0) || 1)) *
        100
    ),
  }

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader
        title="Attendance"
        description="Track and manage member attendance records"
      />

      <div className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-6 border-border bg-gradient-to-br from-green-500/10 to-accent/10">
              <p className="text-sm text-muted-foreground mb-2">Total Present</p>
              <p className="text-3xl font-bold text-green-600">{overallStats.totalPresent}</p>
              <p className="text-xs text-muted-foreground mt-2">Last 3 days</p>
            </Card>

            <Card className="p-6 border-border bg-gradient-to-br from-red-500/10 to-primary/10">
              <p className="text-sm text-muted-foreground mb-2">Total Absent</p>
              <p className="text-3xl font-bold text-red-600">{overallStats.totalAbsent}</p>
              <p className="text-xs text-muted-foreground mt-2">Last 3 days</p>
            </Card>

            <Card className="p-6 border-border bg-gradient-to-br from-blue-500/10 to-secondary/10">
              <p className="text-sm text-muted-foreground mb-2">Avg Attendance</p>
              <p className="text-3xl font-bold text-blue-600">{overallStats.avgAttendance}%</p>
              <p className="text-xs text-muted-foreground mt-2">Overall rate</p>
            </Card>
          </div>

          {/* Daily Records */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Daily Records</h2>

            {attendanceData.map((day) => (
              <Card key={day.date} className="border-border overflow-hidden">
                <button
                  onClick={() =>
                    setExpandedDate(expandedDate === day.date ? '' : day.date)
                  }
                  className="w-full p-6 hover:bg-card/50 transition flex items-center justify-between"
                >
                  <div className="text-left">
                    <p className="font-semibold text-foreground">{day.day}</p>
                    <p className="text-sm text-muted-foreground">{day.date}</p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">{day.present}</p>
                      <p className="text-xs text-green-600">Present</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">{day.absent}</p>
                      <p className="text-xs text-red-600">Absent</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-semibold text-accent">
                        {Math.round((day.present / day.total) * 100)}%
                      </p>
                      <p className="text-xs text-muted-foreground">Rate</p>
                    </div>
                  </div>
                </button>

                {/* Expanded Details */}
                {expandedDate === day.date && (
                  <div className="border-t border-border p-6 bg-card/50 space-y-3">
                    <h4 className="font-semibold text-foreground mb-4">Member Details</h4>
                    {day.users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg"
                      >
                        <p className="text-sm text-foreground">{user.name}</p>
                        <div className="flex items-center gap-2">
                          {user.status === 'present' ? (
                            <>
                              <CheckCircle2 size={20} className="text-green-600" />
                              <span className="text-xs font-semibold text-green-600">
                                Present
                              </span>
                            </>
                          ) : (
                            <>
                              <XCircle size={20} className="text-red-600" />
                              <span className="text-xs font-semibold text-red-600">Absent</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Summary */}
          <Card className="p-6 border-border bg-gradient-to-r from-primary/5 to-accent/5">
            <h3 className="font-semibold text-foreground mb-4">Attendance Insights</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Best Day</p>
                <p className="text-lg font-bold text-foreground">Wednesday - 98%</p>
                <p className="text-xs text-muted-foreground mt-1">Highest attendance rate</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Recurring Absentees</p>
                <p className="text-lg font-bold text-foreground">2 Members</p>
                <p className="text-xs text-muted-foreground mt-1">Need follow-up</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
