'use client'

import useSWR from 'swr'
import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Building2, CircleDollarSign, Eye, Loader2, ReceiptText, SlidersHorizontal, Trash2, Users, UtensilsCrossed, type LucideIcon } from 'lucide-react'
import { toast } from 'sonner'

import { EnterpriseDetailsDrawer } from '@/components/ui/enterprise-details-drawer'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { EnterpriseSelect } from '@/components/ui/enterprise-select'
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

type AllMessesTableProps = {
  messes: RunningMess[]
  isLoading?: boolean
  onDeleted: (messId: string) => Promise<unknown> | unknown
}

type MessStatusFilter = 'all' | 'active' | 'inactive'

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
      status={details ? (
        <span className={`rounded-md border px-2 py-1 text-[10px] font-semibold ${details.is_active ? 'border-primary/25 bg-primary/10 text-primary' : 'border-border bg-muted text-muted-foreground'}`}>
          {details.is_active ? t('active') : t('inactive')}
        </span>
      ) : undefined}
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
  const t = useTranslations('adminRunningMesses')
  const format = useLocaleFormatters()

  return (
    <Card className="gap-0 overflow-hidden py-0 shadow-none">
      <CardHeader className="gap-0 border-b px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-base">{t('title')}</CardTitle>
          {onViewAll && <Button variant="outline" size="sm" onClick={onViewAll}>{t('viewAll')}</Button>}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{t('description')}</p>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">{t('table.mess')}</TableHead>
              <TableHead>{t('table.members')}</TableHead>
              <TableHead className="pr-5">{t('table.lastActivity')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}><TableCell colSpan={3} className="px-5 py-3"><Skeleton className="h-6 w-full" /></TableCell></TableRow>
            )) : null}
            {!isLoading && messes.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="h-32 text-center text-sm text-muted-foreground">{t('empty')}</TableCell></TableRow>
            ) : null}
            {!isLoading && messes.map((mess) => (
              <TableRow key={mess.id}>
                <TableCell className="pl-5 font-medium">{mess.name}</TableCell>
                <TableCell className="tabular-nums">{format.number(mess.activeMembers)}</TableCell>
                <TableCell className="whitespace-nowrap pr-5 text-xs text-muted-foreground">{format.date(mess.lastActivityAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export function AllMessesTable({ messes, isLoading = false, onDeleted }: AllMessesTableProps) {
  const [statusFilter, setStatusFilter] = useState<MessStatusFilter>('all')
  const [selectedMessId, setSelectedMessId] = useState<string | null>(null)
  const [messToDelete, setMessToDelete] = useState<RunningMess | null>(null)
  const [deleting, setDeleting] = useState(false)
  const t = useTranslations('adminRunningMesses')
  const format = useLocaleFormatters()
  const filteredMesses = messes.filter((mess) => (
    statusFilter === 'all' || (statusFilter === 'active' ? mess.isActive : !mess.isActive)
  ))

  async function handleDelete() {
    if (!messToDelete) return
    setDeleting(true)
    try {
      await apiClient.deleteMess(messToDelete.id)
      await onDeleted(messToDelete.id)
      toast.success(t('delete.success', { name: messToDelete.name }))
      setMessToDelete(null)
    } catch {
      toast.error(t('delete.error'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Card className="gap-0 overflow-hidden py-0 shadow-none">
        <CardHeader className="flex flex-col gap-4 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">{t('all.title')}</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">{t('all.description', { count: format.number(messes.length) })}</p>
          </div>
          <EnterpriseSelect
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as MessStatusFilter)}
            options={[
              { value: 'all', label: t('filter.all') },
              { value: 'active', label: t('filter.active') },
              { value: 'inactive', label: t('filter.inactive') },
            ]}
            ariaLabel={t('filter.label')}
            icon={<SlidersHorizontal className="size-4" />}
            align="end"
            className="w-full sm:w-48"
          />
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">{t('table.messName')}</TableHead>
                <TableHead>{t('table.totalMembers')}</TableHead>
                <TableHead>{t('table.location')}</TableHead>
                <TableHead>{t('table.lastActivity')}</TableHead>
                <TableHead className="pr-5 text-right">{t('table.action')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={index}><TableCell colSpan={5} className="px-5 py-3"><Skeleton className="h-7 w-full" /></TableCell></TableRow>
              )) : null}
              {!isLoading && filteredMesses.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-40 text-center text-sm text-muted-foreground">{statusFilter === 'all' ? t('all.empty') : t('filter.empty')}</TableCell></TableRow>
              ) : null}
              {!isLoading && filteredMesses.map((mess) => (
                <TableRow key={mess.id}>
                  <TableCell className="pl-5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{mess.name}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${mess.isActive ? 'border-primary/25 bg-primary/10 text-primary' : 'border-border bg-muted text-muted-foreground'}`}>
                        {mess.isActive ? t('active') : t('inactive')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums">{format.number(mess.totalMembers)}</TableCell>
                  <TableCell><span className="block max-w-64 truncate text-sm text-muted-foreground">{mess.address || t('noAddress')}</span></TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{format.date(mess.lastActivityAt)}</TableCell>
                  <TableCell className="pr-5">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedMessId(mess.id)}><Eye />{t('view')}</Button>
                      <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setMessToDelete(mess)}><Trash2 />{t('delete.action')}</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <RunningMessDetailsDrawer messId={selectedMessId} onClose={() => setSelectedMessId(null)} />

      <AlertDialog open={Boolean(messToDelete)} onOpenChange={(open) => !open && !deleting && setMessToDelete(null)}>
        <AlertDialogContent className="dashboard-portal-surface rounded-2xl border-[var(--dashboard-line)] bg-[var(--dashboard-surface)]">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete.title')}</AlertDialogTitle>
            <AlertDialogDescription className="leading-6">{t('delete.description', { name: messToDelete?.name ?? '' })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t('delete.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={(event) => { event.preventDefault(); void handleDelete() }}
            >
              {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              {deleting ? t('delete.deleting') : t('delete.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
