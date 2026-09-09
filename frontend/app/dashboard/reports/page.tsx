'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Download,
  FileCheck2,
  FileText,
  RefreshCw,
  Send,
} from 'lucide-react'
import { DashboardHeader } from '@/components/dashboard-header'
import { MonthlyReportSettings } from '@/components/reports/monthly-report-settings'
import { MonthlyReportView } from '@/components/reports/monthly-report-view'
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
import { EnterpriseButton } from '@/components/ui/enterprise-button'
import { EnterpriseMonthPicker } from '@/components/ui/enterprise-date-picker'
import { useAuth } from '@/app/context/auth-context'
import { toast } from '@/hooks/use-toast'
import {
  apiClient,
  type Mess,
  type MonthlyReport,
  type MonthlyReportSetting,
} from '@/lib/api-client'
import {
  localizedErrorMessage,
  useLocale,
  useLocaleFormatters,
  useTranslations,
} from '@/lib/i18n'

function toMonthKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
  ].join('-')
}

function previousMonthKey() {
  const now = new Date()
  return toMonthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1))
}

function toApiMonth(month: string) {
  return month + '-01'
}

export default function ReportsPage() {
  const { user } = useAuth()
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const t = useTranslations('monthlyReports')
  const localizedCopy = useRef({ locale, t })
  const userId = user?.id
  const userRole = user?.role
  const [mess, setMess] = useState<Mess | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(previousMonthKey)
  const [report, setReport] = useState<MonthlyReport | null>(null)
  const [settings, setSettings] = useState<MonthlyReportSetting | null>(null)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [confirmFinalize, setConfirmFinalize] = useState(false)
  const [action, setAction] = useState<
    'generate' | 'finalize' | 'download' | 'retry' | null
  >(null)

  useEffect(() => {
    localizedCopy.current = { locale, t }
  }, [locale, t])

  const localCanManage = useMemo(() => {
    if (!user || !mess) return false
    if (user.role === 'ADMIN' || mess.created_by === user.id) return true
    return (
      user.memberships?.some(
        (membership) =>
          membership.mess_id === mess.id &&
          membership.is_active &&
          membership.role === 'MANAGER',
      ) ?? false
    )
  }, [mess, user])
  const canManage = report?.can_manage ?? localCanManage

  const delivery = useMemo(() => {
    const items = report?.deliveries ?? []
    return {
      total: items.length,
      sent: items.filter((item) => item.status === 'SENT').length,
      failed: items.filter((item) => item.status === 'FAILED').length,
      pending: items.filter(
        (item) => item.status === 'PENDING' || item.status === 'PROCESSING',
      ).length,
    }
  }, [report])

  useEffect(() => {
    if (!userId || !userRole) return
    let cancelled = false

    async function bootstrap() {
      setLoading(true)
      try {
        const messResponse =
          userRole === 'ADMIN'
            ? await apiClient.getAllMesses({ limit: 100 })
            : await apiClient.getMesses()
        const messes = Array.isArray(messResponse.data)
          ? messResponse.data
          : messResponse.data
            ? [messResponse.data]
            : []
        const linkedReportId =
          typeof window === 'undefined'
            ? null
            : new URLSearchParams(window.location.search).get('report')
        const linkedReport = linkedReportId
          ? (await apiClient.getMonthlyReportById(linkedReportId)).data
          : null

        if (cancelled) return
        const selectedMess =
          (linkedReport
            ? messes.find((item) => item.id === linkedReport.mess_id)
            : null) ??
          messes.find((item) => item.is_active !== false) ??
          messes[0] ??
          null
        setMess(selectedMess)
        if (linkedReport) {
          setReport(linkedReport)
          setSelectedMonth(linkedReport.month.slice(0, 7))
        }
      } catch (error) {
        if (!cancelled) {
          const copy = localizedCopy.current
          toast({
            title: copy.t('error.load'),
            description: localizedErrorMessage(error, copy.locale, copy.t('error.load')),
            variant: 'destructive',
          })
        }
      } finally {
        if (!cancelled) {
          setReady(true)
          setLoading(false)
        }
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [userId, userRole])

  useEffect(() => {
    if (!ready || !mess) return
    let cancelled = false

    async function loadReport() {
      setLoading(true)
      try {
        const response = await apiClient.getMonthlyReport(
          mess!.id,
          toApiMonth(selectedMonth),
        )
        if (!cancelled) setReport(response.data)
      } catch (error) {
        if (!cancelled) {
          const copy = localizedCopy.current
          setReport(null)
          toast({
            title: copy.t('error.load'),
            description: localizedErrorMessage(error, copy.locale, copy.t('error.load')),
            variant: 'destructive',
          })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadReport()
    return () => {
      cancelled = true
    }
  }, [mess, ready, selectedMonth])

  useEffect(() => {
    if (!mess || !localCanManage) return
    let cancelled = false
    apiClient
      .getMonthlyReportSettings(mess.id)
      .then((response) => {
        if (!cancelled) setSettings(response.data)
      })
      .catch(() => {
        if (!cancelled) setSettings(null)
      })
    return () => {
      cancelled = true
    }
  }, [localCanManage, mess])

  const generateReport = async () => {
    if (!mess) return
    setAction('generate')
    try {
      const response = await apiClient.generateMonthlyReport({
        messId: mess.id,
        month: toApiMonth(selectedMonth),
      })
      setReport(response.data)
      toast({ title: t('success.generated') })
    } catch (error) {
      toast({
        title: t('error.generate'),
        description: localizedErrorMessage(error, locale, t('error.generate')),
        variant: 'destructive',
      })
    } finally {
      setAction(null)
    }
  }

  const finalizeReport = async () => {
    if (!report) return
    setAction('finalize')
    try {
      const response = await apiClient.finalizeMonthlyReport(report.id)
      setReport(response.data)
      toast({ title: t('success.finalized') })
    } catch (error) {
      toast({
        title: t('error.finalize'),
        description: localizedErrorMessage(error, locale, t('error.finalize')),
        variant: 'destructive',
      })
    } finally {
      setAction(null)
      setConfirmFinalize(false)
    }
  }

  const downloadPdf = async () => {
    if (!report) return
    setAction('download')
    try {
      const file = await apiClient.downloadMonthlyReportPdf(report.id, locale)
      const url = URL.createObjectURL(file.blob)
      const link = document.createElement('a')
      link.href = url
      link.download = file.filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      toast({ title: t('success.downloaded') })
    } catch (error) {
      toast({
        title: t('error.download'),
        description: localizedErrorMessage(error, locale, t('error.download')),
        variant: 'destructive',
      })
    } finally {
      setAction(null)
    }
  }

  const retryEmails = async () => {
    if (!report) return
    setAction('retry')
    try {
      const response = await apiClient.retryMonthlyReportDeliveries(report.id)
      setReport(response.data)
      toast({ title: t('success.retried') })
    } catch (error) {
      toast({
        title: t('error.retry'),
        description: localizedErrorMessage(error, locale, t('error.retry')),
        variant: 'destructive',
      })
    } finally {
      setAction(null)
    }
  }

  const updateSettings = async (next: MonthlyReportSetting) => {
    if (!mess || savingSettings) return
    const previous = settings
    setSettings(next)
    setSavingSettings(true)
    try {
      const response = await apiClient.updateMonthlyReportSettings(mess.id, {
        autoGenerate: next.auto_generate,
        emailMembers: next.email_members,
      })
      setSettings(response.data)
      toast({ title: t('success.settings') })
    } catch (error) {
      setSettings(previous)
      toast({
        title: t('error.settings'),
        description: localizedErrorMessage(error, locale, t('error.settings')),
        variant: 'destructive',
      })
    } finally {
      setSavingSettings(false)
    }
  }

  return (
    <div className="min-h-screen bg-transparent">
      <DashboardHeader
        title={t('title')}
        description={mess ? mess.name + ' · ' + t('description') : t('description')}
      />

      <main className="space-y-5 p-4 sm:p-6 lg:p-8">
        <section className="rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--brand)]">
                {t('title')}
              </p>
              <h1 className="mt-1 truncate text-lg font-semibold text-[var(--dashboard-ink)]">
                {mess?.name ?? t('title')}
              </h1>
              {report ? (
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  {report.status === 'FINALIZED'
                    ? t('finalizedAt', {
                        date: format.date(report.finalized_at ?? report.generated_at),
                      })
                    : t('generatedAt', { date: format.date(report.generated_at) })}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <EnterpriseMonthPicker
                value={selectedMonth}
                onValueChange={setSelectedMonth}
                max={previousMonthKey()}
                ariaLabel={t('selectMonth')}
                className="w-full sm:w-[190px]"
              />
              {report ? (
                <span className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[var(--brand-border)] bg-[var(--brand-soft)] px-3 text-xs font-bold text-[var(--brand-dark)] dark:text-[var(--brand-bright)]">
                  {report.status === 'FINALIZED' ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <Clock3 className="size-4" />
                  )}
                  {report.status === 'FINALIZED' ? t('finalized') : t('draft')}
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--dashboard-line)] pt-4">
            {canManage && (!report || report.status === 'DRAFT') ? (
              <EnterpriseButton
                onClick={() => void generateReport()}
                disabled={!mess || action !== null}
              >
                <RefreshCw className={action === 'generate' ? 'size-4 animate-spin' : 'size-4'} />
                {report ? t('regenerate') : t('generate')}
              </EnterpriseButton>
            ) : null}
            {canManage && report?.status === 'DRAFT' ? (
              <EnterpriseButton
                onClick={() => setConfirmFinalize(true)}
                disabled={action !== null}
              >
                <FileCheck2 className="size-4" />
                {t('finalize')}
              </EnterpriseButton>
            ) : null}
            {report?.status === 'FINALIZED' ? (
              <EnterpriseButton
                tone="secondary"
                onClick={() => void downloadPdf()}
                disabled={action !== null}
              >
                <Download className="size-4" />
                {t('downloadPdf')}
              </EnterpriseButton>
            ) : null}
            {canManage && delivery.failed > 0 ? (
              <EnterpriseButton
                tone="secondary"
                onClick={() => void retryEmails()}
                disabled={action !== null}
              >
                <Send className="size-4" />
                {t('retryEmails')}
              </EnterpriseButton>
            ) : null}
          </div>
        </section>

        {report ? (
          <div
            className={
              report.status === 'FINALIZED'
                ? 'flex items-start gap-3 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-soft)] p-4 text-[var(--brand-dark)] dark:text-[var(--brand-bright)]'
                : 'flex items-start gap-3 rounded-xl border border-amber-300/70 bg-amber-50 p-4 text-amber-900 dark:border-amber-600/50 dark:bg-amber-950/30 dark:text-amber-200'
            }
          >
            {report.status === 'FINALIZED' ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
            )}
            <p className="text-xs font-semibold leading-5">
              {report.status === 'FINALIZED' ? t('finalNotice') : t('draftNotice')}
            </p>
          </div>
        ) : null}

        {loading ? (
          <div className="grid min-h-64 place-items-center rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)]">
            <div className="text-center">
              <RefreshCw className="mx-auto size-5 animate-spin text-[var(--brand)]" />
              <p className="mt-3 text-sm font-semibold text-muted-foreground">{t('loading')}</p>
            </div>
          </div>
        ) : report ? (
          <MonthlyReportView report={report} />
        ) : (
          <section className="grid min-h-64 place-items-center rounded-xl border border-dashed border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] p-6 text-center">
            <div className="max-w-md">
              <span className="mx-auto grid size-12 place-items-center rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-surface-subtle)] text-[var(--brand)]">
                <FileText className="size-5" />
              </span>
              <h2 className="mt-4 text-base font-semibold text-[var(--dashboard-ink)]">{t('noReportTitle')}</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground">
                {canManage ? t('noReportManager') : t('noReportMember')}
              </p>
            </div>
          </section>
        )}

        {report?.status === 'FINALIZED' && canManage && delivery.total > 0 ? (
          <section className="flex flex-col gap-3 rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[var(--dashboard-ink)]">{t('delivery.title')}</h2>
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                {t('delivery.sent', { sent: delivery.sent, total: delivery.total })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] font-bold">
              {delivery.pending > 0 ? (
                <span className="rounded-md border border-[var(--dashboard-line)] bg-[var(--dashboard-surface-subtle)] px-2.5 py-1 text-muted-foreground">
                  {t('delivery.pending', { count: delivery.pending })}
                </span>
              ) : null}
              {delivery.failed > 0 ? (
                <span className="rounded-md border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-destructive">
                  {t('delivery.failed', { count: delivery.failed })}
                </span>
              ) : null}
            </div>
          </section>
        ) : null}

        {canManage && settings ? (
          <MonthlyReportSettings
            settings={settings}
            saving={savingSettings}
            onChange={(next) => void updateSettings(next)}
          />
        ) : null}
      </main>

      <AlertDialog open={confirmFinalize} onOpenChange={setConfirmFinalize}>
        <AlertDialogContent className="border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] shadow-none">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('confirm.description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={action === 'finalize'}>{t('confirm.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={action === 'finalize'}
              onClick={(event) => {
                event.preventDefault()
                void finalizeReport()
              }}
              className="bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)]"
            >
              {action === 'finalize' ? (
                <RefreshCw className="size-4 animate-spin" />
              ) : (
                <FileCheck2 className="size-4" />
              )}
              {t('confirm.action')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
