'use client'

import { useState } from 'react'
import { ListFilter } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import type { DashboardActivity } from '@/hooks/use-dashboard-data'

function formatMoney(value: string | number | null | undefined) {
  return `৳ ${Number(value ?? 0).toLocaleString()}`
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
  }).format(date)
}

function EmptyRows({ label }: { label: string }) {
  return (
    <TableRow>
      <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
        No recent {label} found.
      </TableCell>
    </TableRow>
  )
}

function StatusBadge({ status }: { status?: string | null }) {
  const destructive = status === 'REJECTED' || status === 'CANCELLED'
  return (
    <Badge
      variant={destructive ? 'destructive' : 'outline'}
      className={
        destructive
          ? 'font-normal'
          : 'border-primary/20 bg-primary/5 font-normal text-primary'
      }
    >
      {status || 'ACTIVE'}
    </Badge>
  )
}

type RecentActivityTableProps = {
  activity?: DashboardActivity
  isLoading?: boolean
}

export function RecentActivityTable({
  activity,
  isLoading = false,
}: RecentActivityTableProps) {
  const [activeView, setActiveView] = useState('expenses')
  const expenses = (activity?.expenses ?? []).slice(0, 3)
  const payments = (activity?.payments ?? []).slice(0, 3)
  const notices = (activity?.notices ?? []).slice(0, 3)
  const bazarDates = [...(activity?.schedule?.dates ?? [])]
    .sort((a, b) => a.duty_date.localeCompare(b.duty_date))
    .slice(0, 3)

  return (
    <Card className="h-full gap-0 overflow-hidden py-0 shadow-none">
      <Tabs value={activeView} onValueChange={setActiveView} className="flex h-full min-h-0 flex-col gap-0">
        <CardHeader className="shrink-0 gap-3 border-b px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">Recent activity</CardTitle>
            <div className="flex items-center gap-2">
              <span className="hidden text-xs font-medium text-muted-foreground sm:inline">Show</span>
              <Select value={activeView} onValueChange={setActiveView}>
                <SelectTrigger
                  size="sm"
                  className="h-9 w-[176px] border-primary/40 bg-primary/5 font-medium hover:bg-primary/10"
                  style={{ minHeight: '2.25rem' }}
                  aria-label="Filter recent activity"
                >
                  <ListFilter className="text-primary" />
                  <SelectValue placeholder="Select activity" />
                </SelectTrigger>
                <SelectContent align="end" className="dashboard-popover">
                  <SelectItem value="expenses">Recent expenses</SelectItem>
                  <SelectItem value="deposits">Recent deposits</SelectItem>
                  <SelectItem value="notices">Recent notices</SelectItem>
                  <SelectItem value="bazar">Bazar schedule</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="min-h-0 flex-1 overflow-hidden p-0">
          <TabsContent value="expenses" className="m-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Expense</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="pr-5 text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? <EmptyRows label="activity" /> : null}
                {!isLoading && !expenses.length ? <EmptyRows label="expenses" /> : null}
                {!isLoading && expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="max-w-48 truncate pl-5 font-medium">
                      {expense.item_name || expense.category || 'Expense'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(expense.expense_date)}
                    </TableCell>
                    <TableCell className="pr-5 text-right font-medium tabular-nums">
                      {formatMoney(expense.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="deposits" className="m-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-5 text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!payments.length ? <EmptyRows label="deposits" /> : null}
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="pl-5 font-medium">{payment.method}</TableCell>
                    <TableCell><StatusBadge status={payment.status} /></TableCell>
                    <TableCell className="pr-5 text-right font-medium tabular-nums">
                      {formatMoney(payment.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="notices" className="m-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Notice</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="pr-5 text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!notices.length ? <EmptyRows label="notices" /> : null}
                {notices.map((notice) => (
                  <TableRow key={notice.id}>
                    <TableCell className="max-w-52 truncate pl-5 font-medium">
                      {notice.title}
                    </TableCell>
                    <TableCell><StatusBadge status={notice.type} /></TableCell>
                    <TableCell className="pr-5 text-right text-muted-foreground">
                      {formatDate(notice.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="bazar" className="m-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Duty date</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead className="pr-5 text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!bazarDates.length ? <EmptyRows label="bazar schedules" /> : null}
                {bazarDates.map((date) => (
                  <TableRow key={date.id}>
                    <TableCell className="pl-5 font-medium">{formatDate(date.duty_date)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {date.slots.filter((slot) => slot.assigned_member).length}/{date.required_members}
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <StatusBadge status={date.effectiveStatus || date.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  )
}
