'use client'

import useSWR from 'swr'
import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Building2, CircleDollarSign, Eye, ReceiptText, Users, UtensilsCrossed, type LucideIcon } from 'lucide-react'

import { EnterpriseDetailsDrawer } from '@/components/ui/enterprise-details-drawer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { apiClient, type RunningMess, type RunningMessDetails } from '@/lib/api-client'
import { swrFetcher } from '@/lib/swr-fetcher'
import { expenseCategoryLabel, mealNameLabel, useLocale, useLocaleFormatters, useTranslations } from '@/lib/i18n'

type RunningMessesTableProps = {
  messes: RunningMess[]
  onViewAll?: () => void
  isLoading?: boolean
}

function DetailMetric({ label, value, icon: Icon }: { label: string; value: number; icon: LucideIcon }) {
  const format = useLocaleFormatters()
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-3.5" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em]">{label}</span>
      </div>
      <p className="mt-2 text-lg font-semibold tabular-nums">{format.number(value)}</p>
    </div>
  )
}

function RunningMessDetailsDrawer({ messId, onClose }: { messId: string | null; onClose: () => void }) {
  const t = useTranslations('adminRunningMesses')
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const { data, error, isLoading } = useSWR<RunningMessDetails>(
    messId ? ['running-mess-details', messId] : null,
    () => swrFetcher(() => apiClient.getRunningMessDetails(messId!)),
  )
  const details = data?.mess

  return (
    <EnterpriseDetailsDrawer
      open={Boolean(messId)}
      onOpenChange={(open) => !open && onClose()}
      eyebrow={t('drawer.eyebrow')}
      title={details?.name ?? t('drawer.loadingTitle')}
      description={details?.address || t('drawer.noAddress')}
      headerIcon={<Building2 className="size-5" />}
      status={<span className="rounded-md border border-primary/25 bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">{t('running')}</span>}
      footer={<Button className="w-full" variant="outline" onClick={onClose}>{t('drawer.close')}</Button>}
    >
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
        </div>
      ) : error || !data ? (
        <div className="flex min-h-40 items-center justify-center rounded-lg border border-border bg-background p-5 text-center text-sm text-muted-foreground">
          {t('drawer.loadError')}
        </div>
      ) : (
        <div className="space-y-5">
          <section className="grid grid-cols-2 gap-3">
            <DetailMetric label={t('members')} value={data.mess.memberships.length} icon={Users} />
            <DetailMetric label={t('activity')} value={data.activity.activityScore} icon={Building2} />
            <DetailMetric label={t('meals')} value={data.activity.mealsAdded} icon={UtensilsCrossed} />
            <DetailMetric label={t('expenses')} value={data.activity.expensesAdded} icon={ReceiptText} />
            <DetailMetric label={t('deposits')} value={data.activity.depositsAdded} icon={CircleDollarSign} />
            <div className="rounded-lg border border-border bg-background p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{t('drawer.setup')}</p>
              <p className="mt-2 text-sm font-semibold">{data.mess.settings_completed ? t('drawer.complete') : t('drawer.incomplete')}</p>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-background">
            <div className="border-b px-4 py-3">
              <h3 className="text-sm font-semibold">{t('drawer.members')}</h3>
            </div>
            <div className="divide-y">
              {data.mess.memberships.map((membership) => (
                <div key={membership.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{membership.user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{membership.user.email}</p>
                  </div>
                  <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground">{membership.role}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-background">
            <div className="border-b px-4 py-3"><h3 className="text-sm font-semibold">{t('drawer.recentMeals')}</h3></div>
            <div className="divide-y">
              {data.meals.map((meal) => (
                <div key={meal.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div><p className="font-medium">{mealNameLabel(meal.name, locale)}</p><p className="text-xs text-muted-foreground">{format.date(meal.scheduled_date)}</p></div>
                  <span className="text-xs tabular-nums text-muted-foreground">{format.number(meal.activeAttendances)} {t('drawer.attendees')}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-background">
            <div className="border-b px-4 py-3"><h3 className="text-sm font-semibold">{t('drawer.recentExpenses')}</h3></div>
            <div className="divide-y">
              {data.expenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div><p className="font-medium">{expenseCategoryLabel(expense.category, locale)}</p><p className="text-xs text-muted-foreground">{format.date(expense.expense_date)}</p></div>
                  <span className="font-medium tabular-nums">{format.money(expense.amount)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-background">
            <div className="border-b px-4 py-3"><h3 className="text-sm font-semibold">{t('drawer.recentDeposits')}</h3></div>
            <div className="divide-y">
              {data.deposits.map((deposit) => (
                <div key={deposit.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div><p className="font-medium">{deposit.member.name}</p><p className="text-xs text-muted-foreground">{format.date(deposit.deposit_date)} · {deposit.method}</p></div>
                  <span className="font-medium tabular-nums">{format.money(deposit.amount)}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </EnterpriseDetailsDrawer>
  )
}

export function RunningMessesTable({ messes, onViewAll, isLoading = false }: RunningMessesTableProps) {
  const [selectedMessId, setSelectedMessId] = useState<string | null>(null)
  const t = useTranslations('adminRunningMesses')
  const format = useLocaleFormatters()

  return (
    <>
      <Card className="gap-0 overflow-hidden py-0 shadow-none">
        <CardHeader className="flex-row items-center justify-between gap-4 border-b px-5 py-4">
          <div>
            <CardTitle className="text-base">{t('title')}</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">{t('description')}</p>
          </div>
          {onViewAll && <Button variant="outline" size="sm" onClick={onViewAll}>{t('viewAll')}</Button>}
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">{t('table.mess')}</TableHead>
                <TableHead>{t('table.members')}</TableHead>
                <TableHead>{t('table.operations')}</TableHead>
                <TableHead>{t('table.lastActivity')}</TableHead>
                <TableHead className="pr-5 text-right">{t('table.action')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}><TableCell colSpan={5} className="px-5 py-3"><Skeleton className="h-6 w-full" /></TableCell></TableRow>
              )) : null}
              {!isLoading && messes.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-32 text-center text-sm text-muted-foreground">{t('empty')}</TableCell></TableRow>
              ) : null}
              {!isLoading && messes.map((mess) => (
                <TableRow key={mess.id}>
                  <TableCell className="pl-5"><p className="font-medium">{mess.name}</p><p className="max-w-48 truncate text-xs text-muted-foreground">{mess.address || t('noAddress')}</p></TableCell>
                  <TableCell className="tabular-nums">{format.number(mess.activeMembers)}</TableCell>
                  <TableCell><span className="text-xs tabular-nums text-muted-foreground">{format.number(mess.mealsAdded)} / {format.number(mess.expensesAdded)} / {format.number(mess.depositsAdded)}</span></TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{format.date(mess.lastActivityAt)}</TableCell>
                  <TableCell className="pr-5 text-right"><Button variant="outline" size="sm" onClick={() => setSelectedMessId(mess.id)}><Eye />{t('view')}</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <RunningMessDetailsDrawer messId={selectedMessId} onClose={() => setSelectedMessId(null)} />
    </>
  )
}

export function ActiveUsersChart({ data, isLoading = false }: { data: Array<{ month: string; activeUsers: number }>; isLoading?: boolean }) {
  const t = useTranslations('adminRunningMesses')
  const format = useLocaleFormatters()
  const chartConfig = { activeUsers: { label: t('chart.series'), color: 'var(--brand)' } } satisfies ChartConfig

  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardHeader className="border-b px-5 py-4"><CardTitle className="text-base">{t('chart.title')}</CardTitle><p className="mt-0.5 text-xs text-muted-foreground">{t('chart.description')}</p></CardHeader>
      <CardContent className="p-4 sm:p-5">
        {isLoading ? <Skeleton className="h-[280px] w-full" /> : (
          <ChartContainer config={chartConfig} className="h-[280px] w-full aspect-auto">
            <BarChart data={data} margin={{ top: 12, right: 4, left: -14, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="2 4" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tickMargin={10} tickFormatter={(value) => format.date(`${value}-01`, { month: 'short', year: undefined })} />
              <YAxis axisLine={false} tickLine={false} tickMargin={8} allowDecimals={false} width={40} tickFormatter={(value) => format.number(value)} />
              <ChartTooltip cursor={{ fill: 'var(--brand-soft)', opacity: 0.55 }} content={<ChartTooltipContent formatter={(value) => <span className="font-medium tabular-nums">{format.number(Number(value))}</span>} />} />
              <Bar dataKey="activeUsers" fill="var(--color-activeUsers)" radius={[4, 4, 0, 0]} maxBarSize={34} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
