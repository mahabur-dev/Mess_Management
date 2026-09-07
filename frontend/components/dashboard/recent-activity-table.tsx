'use client'

import { useState } from 'react'
import { ListFilter } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EnterpriseTableStateRow } from '@/components/ui/enterprise-async-state'
import { EnterpriseSelect } from '@/components/ui/enterprise-select'
import { EnterpriseStatusBadge } from '@/components/ui/enterprise-status-badge'
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
import {
  domainLabel,
  useLocale,
  useLocaleFormatters,
  useTranslations,
  type MessageKey,
} from '@/lib/i18n'

function EmptyRows({
  itemKey,
  loading = false,
}: {
  itemKey: MessageKey<'dashboardShared'>
  loading?: boolean
}) {
  const copy = useTranslations('dashboardShared')
  const shared = useTranslations('shared')

  return (
    <EnterpriseTableStateRow
      colSpan={3}
      status={loading ? 'loading' : 'empty'}
      title={loading ? shared('loadingData') : copy('emptyRecent', { item: copy(itemKey) })}
    />
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
  const copy = useTranslations('dashboardShared')
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const expenses = (activity?.expenses ?? []).slice(0, 3)
  const payments = (activity?.payments ?? []).slice(0, 3)
  const notices = (activity?.notices ?? []).slice(0, 3)
  const bazarDates = [...(activity?.schedule?.dates ?? [])]
    .sort((a, b) => a.duty_date.localeCompare(b.duty_date))
    .slice(0, 3)

  const displayDate = (value: string | null | undefined) => value
    ? format.date(value, { day: '2-digit', month: 'short' })
    : '—'

  return (
    <Card className="h-full gap-0 overflow-hidden py-0 shadow-none">
      <Tabs value={activeView} onValueChange={setActiveView} className="flex h-full min-h-0 flex-col gap-0">
        <CardHeader className="shrink-0 gap-3 border-b px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">{copy('recentActivity')}</CardTitle>
            <div className="flex items-center gap-2">
              <span className="hidden text-xs font-medium text-muted-foreground sm:inline">{copy('show')}</span>
              <EnterpriseSelect
                value={activeView}
                onValueChange={setActiveView}
                ariaLabel={copy('filterActivity')}
                align="end"
                icon={<ListFilter className="size-4" aria-hidden="true" />}
                className="h-9 min-h-9 w-[176px]"
                options={[
                  { value: 'expenses', label: copy('recentExpenses') },
                  { value: 'deposits', label: copy('recentDeposits') },
                  { value: 'notices', label: copy('recentNotices') },
                  { value: 'bazar', label: copy('bazarSchedule') },
                ]}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="min-h-0 flex-1 overflow-hidden p-0">
          <TabsContent value="expenses" className="m-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">{copy('expense')}</TableHead>
                  <TableHead>{copy('date')}</TableHead>
                  <TableHead className="pr-5 text-right">{copy('amount')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? <EmptyRows itemKey="activity" loading /> : null}
                {!isLoading && !expenses.length ? <EmptyRows itemKey="expenses" /> : null}
                {!isLoading && expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="max-w-48 truncate pl-5 font-medium">
                      {expense.item_name || domainLabel(expense.category, locale) || copy('expense')}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {displayDate(expense.expense_date)}
                    </TableCell>
                    <TableCell className="pr-5 text-right font-medium tabular-nums">
                      {format.money(expense.amount)}
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
                  <TableHead className="pl-5">{copy('method')}</TableHead>
                  <TableHead>{copy('status')}</TableHead>
                  <TableHead className="pr-5 text-right">{copy('amount')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!payments.length ? <EmptyRows itemKey="deposits" /> : null}
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="pl-5 font-medium">{domainLabel(payment.method, locale)}</TableCell>
                    <TableCell><EnterpriseStatusBadge status={payment.status} /></TableCell>
                    <TableCell className="pr-5 text-right font-medium tabular-nums">
                      {format.money(payment.amount)}
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
                  <TableHead className="pl-5">{copy('notice')}</TableHead>
                  <TableHead>{copy('type')}</TableHead>
                  <TableHead className="pr-5 text-right">{copy('date')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!notices.length ? <EmptyRows itemKey="notices" /> : null}
                {notices.map((notice) => (
                  <TableRow key={notice.id}>
                    <TableCell className="max-w-52 truncate pl-5 font-medium">
                      {notice.title}
                    </TableCell>
                    <TableCell><EnterpriseStatusBadge status={notice.type} /></TableCell>
                    <TableCell className="pr-5 text-right text-muted-foreground">
                      {displayDate(notice.created_at)}
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
                  <TableHead className="pl-5">{copy('dutyDate')}</TableHead>
                  <TableHead>{copy('assigned')}</TableHead>
                  <TableHead className="pr-5 text-right">{copy('status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!bazarDates.length ? <EmptyRows itemKey="bazarSchedules" /> : null}
                {bazarDates.map((date) => (
                  <TableRow key={date.id}>
                    <TableCell className="pl-5 font-medium">{displayDate(date.duty_date)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format.number(date.slots.filter((slot) => slot.assigned_member).length)} / {format.number(date.required_members)}
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <EnterpriseStatusBadge status={date.effectiveStatus || date.status} />
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
