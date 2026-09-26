'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Download,
  FileCheck2,
  FileText,
  Mail,
  ReceiptText,
  RefreshCw,
  Send,
  Settings2,
  Users,
  UtensilsCrossed,
  WalletCards,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react'
import { LoadingIndicator } from '@/components/loading-indicator'
import { MonthPicker } from '@/components/mobile/date-picker'
import { ToggleField } from '@/components/mobile/form-controls'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { Button } from '@/components/ui'
import { canManageMess, getActiveMessId } from '@/lib/app-permissions'
import { api, type MonthlyReport, type MonthlyReportMemberSnapshot, type MonthlyReportSetting } from '@/lib/api'
import { useLocale, useLocaleFormatters, useLocalizedNotice, useTranslations } from '@/lib/i18n'
import { downloadFile } from '@/lib/native-file-download'
import { useAuth } from '../providers'

type Action = 'generate' | 'finalize' | 'download' | 'retry' | 'settings' | null

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function previousMonthKey() {
  const today = new Date()
  return monthKey(new Date(today.getFullYear(), today.getMonth() - 1, 1))
}

function apiMonth(month: string) {
  return `${month}-01`
}

function deliverySummary(report: MonthlyReport | null) {
  const deliveries = report?.deliveries ?? []
  return {
    total: deliveries.length,
    sent: deliveries.filter((item) => item.status === 'SENT').length,
    failed: deliveries.filter((item) => item.status === 'FAILED').length,
    pending: deliveries.filter((item) => item.status === 'PENDING' || item.status === 'PROCESSING').length,
  }
}

function balanceLabel(member: MonthlyReportMemberSnapshot, t: ReturnType<typeof useTranslations<'reports'>>, format: ReturnType<typeof useLocaleFormatters>) {
  if (member.due > 0) return `${format.money(member.due)} ${t('due')}`
  if (member.credit > 0) return `${format.money(member.credit)} ${t('credit')}`
  return t('settled')
}

function Metric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <article className="report-metric">
      <span className="report-metric__icon" aria-hidden="true"><Icon size={17} strokeWidth={2.25} /></span>
      <span className="report-metric__copy"><small>{label}</small><strong>{value}</strong></span>
    </article>
  )
}

function MemberStatement({ member, privateView }: { member: MonthlyReportMemberSnapshot; privateView: boolean }) {
  const t = useTranslations('reports')
  const format = useLocaleFormatters()
  const balance = balanceLabel(member, t, format)
  const balanceTone = member.due > 0 ? 'due' : member.credit > 0 ? 'credit' : 'settled'
  const rows = [
    [t('meals'), format.number(member.totalMeals)],
    [t('mealCost'), format.money(member.mealCost)],
    [t('rent'), format.money(member.rentCost)],
    [t('utility'), format.money(member.utilityCost)],
    [t('previousBalance'), format.money(member.previousBalance)],
    [t('paid'), format.money(member.deposit + member.paidAmount)],
  ]

  return (
    <article className="report-member-card">
      <div className="report-member-card__head">
        <div className="min-w-0"><h3>{member.name}</h3>{!privateView ? <p>{member.email}</p> : null}</div>
        <span className="report-balance" data-tone={balanceTone}>{balance}</span>
      </div>
      <dl className="report-member-card__values">
        {rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl>
      <div className="report-member-card__total"><span>{t('totalAmount')}</span><strong>{format.money(member.totalAmount)}</strong></div>
    </article>
  )
}

export default function ReportsPage() {
  const t = useTranslations('reports')
  const format = useLocaleFormatters()
  const { locale } = useLocale()
  const { user } = useAuth()
  const params = useSearchParams()
  const { notice, clearNotice, showError, showMessage } = useLocalizedNotice('reports')
  const messId = useMemo(() => getActiveMessId(user), [user])
  const localCanManage = canManageMess(user)
  const [month, setMonth] = useState(previousMonthKey)
  const [report, setReport] = useState<MonthlyReport | null>(null)
  const [activeMemberIds, setActiveMemberIds] = useState<Set<string> | null>(null)
  const [settings, setSettings] = useState<MonthlyReportSetting | null>(null)
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState<Action>(null)
  const [confirming, setConfirming] = useState(false)
  const canManage = report?.can_manage ?? localCanManage
  const delivery = deliverySummary(report)

  const loadReport = useCallback(async () => {
    if (!messId) {
      setReport(null)
      setActiveMemberIds(new Set())
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [reportResponse, memberResponse] = await Promise.all([
        api.getMonthlyReport(messId, apiMonth(month)),
        api.getMessMemberOptions(messId),
      ])
      setActiveMemberIds(new Set(memberResponse.data.map((member) => member.id)))
      setReport(reportResponse.data)
    } catch (error) {
      setReport(null)
      setActiveMemberIds(null)
      showError(error, 'loadFailed')
    } finally {
      setLoading(false)
    }
  }, [messId, month, showError])

  useEffect(() => { void loadReport() }, [loadReport])

  useEffect(() => {
    if (!messId || !localCanManage) {
      setSettings(null)
      return
    }
    api.getMonthlyReportSettings(messId).then((response) => setSettings(response.data)).catch(() => setSettings(null))
  }, [localCanManage, messId])

  useEffect(() => {
    const reportId = params.get('report')
    if (!reportId) return
    api.getMonthlyReportById(reportId).then((response) => {
      setReport(response.data)
      setMonth(response.data.month.slice(0, 7))
    }).catch((error) => showError(error, 'loadFailed'))
  }, [params, showError])

  async function generate() {
    if (!messId) return
    setAction('generate'); clearNotice()
    try {
      const response = await api.generateMonthlyReport({ messId, month: apiMonth(month) })
      setReport(response.data); showMessage('generatedSuccess', 'success')
    } catch (error) { showError(error, 'generateFailed') } finally { setAction(null) }
  }

  async function finalize() {
    if (!report) return
    setAction('finalize'); clearNotice()
    try {
      const response = await api.finalizeMonthlyReport(report.id)
      setReport(response.data); setConfirming(false); showMessage('finalizedSuccess', 'success')
    } catch (error) { showError(error, 'finalizeFailed') } finally { setAction(null) }
  }

  async function updateSettings(next: MonthlyReportSetting) {
    if (!messId || action === 'settings') return
    const previous = settings
    setSettings(next); setAction('settings')
    try {
      const response = await api.updateMonthlyReportSettings(messId, { autoGenerate: next.auto_generate, emailMembers: next.email_members })
      setSettings(response.data); showMessage('settingsSuccess', 'success')
    } catch (error) { setSettings(previous); showError(error, 'settingsFailed') } finally { setAction(null) }
  }

  async function download() {
    if (!report) return
    setAction('download')
    try {
      const file = await api.downloadMonthlyReportPdf(report.id, locale)
      const target = await downloadFile(file.blob, file.filename, {
        title: t('savePdfTitle'),
        dialogTitle: t('savePdfDialog'),
      })
      showMessage(target === 'native-saved' ? 'pdfSaved' : target === 'native-share' ? 'pdfReady' : 'downloadSuccess', 'success')
    } catch (error) { showError(error, 'downloadFailed') } finally { setAction(null) }
  }

  async function retry() {
    if (!report) return
    setAction('retry')
    try {
      const response = await api.retryMonthlyReportDeliveries(report.id)
      setReport(response.data); showMessage('retrySuccess', 'success')
    } catch (error) { showError(error, 'retryFailed') } finally { setAction(null) }
  }

  const activeMembers = useMemo(
    () => report && activeMemberIds
      ? report.snapshot.members.filter((member) => activeMemberIds.has(member.memberId))
      : [],
    [activeMemberIds, report],
  )
  const visibleSummary = useMemo(() => {
    if (!report) return null
    const totalMeals = activeMembers.reduce((sum, member) => sum + member.totalMeals, 0)
    const totalMealCost = activeMembers.reduce((sum, member) => sum + member.mealCost, 0)
    return {
      ...report.snapshot.summary,
      totalMembers: activeMembers.length,
      totalMeals,
      totalDeposit: activeMembers.reduce((sum, member) => sum + member.deposit, 0),
      mealRate: totalMeals > 0 ? totalMealCost / totalMeals : 0,
      totalDue: activeMembers.reduce((sum, member) => sum + member.due, 0),
      totalCredit: activeMembers.reduce((sum, member) => sum + member.credit, 0),
    }
  }, [activeMembers, report])

  const metrics = visibleSummary ? [
    [Users, t('members'), format.number(visibleSummary.totalMembers)],
    [UtensilsCrossed, t('meals'), format.number(visibleSummary.totalMeals)],
    [ReceiptText, t('expense'), format.money(visibleSummary.totalExpense)],
    [WalletCards, t('deposit'), format.money(visibleSummary.totalDeposit)],
    [Banknote, t('mealRate'), format.money(visibleSummary.mealRate)],
    [FileText, t('messCost'), format.money(visibleSummary.totalMessCost)],
    [ReceiptText, t('totalDue'), format.money(visibleSummary.totalDue)],
    [WalletCards, t('totalCredit'), format.money(visibleSummary.totalCredit)],
  ] as Array<[LucideIcon, string, string]> : []

  return (
    <MobileShell showBottomNavigation>
      <TopScreen title={t('title')} subtitle={report?.snapshot.mess.name ?? t('subtitle')} backHref="/more" />
      <div className="screen space-y-4 report-page">
        <section className="report-toolbar" aria-label={t('selectMonth')}>
          <MonthPicker label={t('selectMonth')} value={month} onChange={(value) => { clearNotice(); setMonth(value) }} max={previousMonthKey()} menuGap={12} renderTrigger={({ open, selectedLabel, buttonProps }) => (
            <button {...buttonProps} className="report-month-trigger"><CalendarDays size={17} aria-hidden="true" /><span>{selectedLabel}</span><ChevronDown size={16} className={open ? 'rotate-180' : ''} aria-hidden="true" /></button>
          )} />
          {report ? <span className="report-status" data-status={report.status.toLowerCase()}>{report.status === 'FINALIZED' ? <CheckCircle2 size={15} /> : <FileText size={15} />}{report.status === 'FINALIZED' ? t('finalized') : t('draft')}</span> : null}
        </section>

        {notice ? <div className={`ui-notice ui-notice--${notice.tone}`} role="alert">{notice.message}</div> : null}
        {!messId ? <div className="app-empty-state">{t('noMess')}</div> : null}
        {loading ? <LoadingIndicator variant="card" label={t('loading')} /> : null}

        {!loading && messId && !report ? <section className="report-empty"><span><FileText size={22} /></span><h2>{t('noReportTitle')}</h2><p>{canManage ? t('noReportManager') : t('noReportMember')}</p>{canManage ? <Button onClick={() => void generate()} busy={action === 'generate'} busyLabel={t('loading')}><RefreshCw size={16} />{t('generate')}</Button> : null}</section> : null}

        {!loading && report ? <>
          <section className="report-identity">
            <div><span>{report.status === 'FINALIZED' ? t('finalizedAt', { date: format.date(report.finalized_at ?? report.generated_at, { day: 'numeric', month: 'short', year: 'numeric' }) }) : t('generated', { date: format.date(report.generated_at, { day: 'numeric', month: 'short', year: 'numeric' }) })}</span><strong>{report.snapshot.mess.name}</strong></div>
            <small>{t('version', { version: format.number(report.version) })}</small>
          </section>
          <div className="report-notice" data-status={report.status.toLowerCase()}>{report.status === 'FINALIZED' ? <CheckCircle2 size={16} /> : <FileText size={16} />}<p>{report.status === 'FINALIZED' ? t('finalNotice') : t('draftNotice')}</p></div>
          <section className="report-actions" aria-label={t('title')}>
            {canManage && report.status === 'DRAFT' ? <Button size="sm" onClick={() => void generate()} busy={action === 'generate'} busyLabel={t('loading')}><RefreshCw size={15} />{t('refresh')}</Button> : null}
            {canManage && report.status === 'DRAFT' ? <Button size="sm" variant="secondary" onClick={() => setConfirming(true)} disabled={action !== null}><FileCheck2 size={15} />{t('finalize')}</Button> : null}
            {report.status === 'FINALIZED' ? <Button size="sm" variant="secondary" onClick={() => void download()} busy={action === 'download'} busyLabel={t('loading')}><Download size={15} />{t('download')}</Button> : null}
            {canManage && delivery.failed > 0 ? <Button size="sm" variant="secondary" onClick={() => void retry()} busy={action === 'retry'} busyLabel={t('loading')}><Send size={15} />{t('retry')}</Button> : null}
          </section>
          {confirming ? <section className="report-confirm" role="alert" aria-label={t('confirmTitle')}><div><FileCheck2 size={18} /><span><strong>{t('confirmTitle')}</strong><p>{t('confirmBody')}</p></span></div><footer><Button size="sm" variant="ghost" onClick={() => setConfirming(false)} disabled={action === 'finalize'}><X size={15} />{t('cancel')}</Button><Button size="sm" onClick={() => void finalize()} busy={action === 'finalize'} busyLabel={t('loading')}><FileCheck2 size={15} />{t('confirm')}</Button></footer></section> : null}
          <section aria-labelledby="report-summary-title"><h2 id="report-summary-title" className="report-section-title">{t('summary')}</h2><div className="report-metrics">{metrics.map(([icon, label, value]) => <Metric key={label} icon={icon} label={label} value={value} />)}</div></section>
          <section className="report-surface" aria-labelledby="report-expense-title"><header><div><span className="report-surface__icon"><Wrench size={16} /></span><h2 id="report-expense-title">{t('expenseSummary')}</h2></div><strong>{format.money(report.snapshot.expenseSummary.totalMessCost)}</strong></header><div className="report-expense-list">{[[t('food'), report.snapshot.expenseSummary.foodBazar], [t('utility'), report.snapshot.expenseSummary.utility], [t('rent'), report.snapshot.expenseSummary.rentHouse], [t('other'), report.snapshot.expenseSummary.otherExpenses]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{format.money(value as number)}</strong></div>)}</div></section>
          <section aria-labelledby="report-members-title"><div className="report-section-heading"><div><h2 id="report-members-title">{canManage ? t('memberSummary') : t('memberPrivate')}</h2><p>{canManage ? t('memberDescription') : t('privateDescription')}</p></div><span>{format.number(activeMembers.length)}</span></div><div className="space-y-3">{activeMembers.map((member) => <MemberStatement key={member.memberId} member={member} privateView={!canManage} />)}</div></section>
          {canManage && report.status === 'FINALIZED' && delivery.total > 0 ? <section className="report-delivery"><div><Mail size={17} /><span><strong>{t('delivery')}</strong><small>{t('deliveryProgress', { sent: format.number(delivery.sent), total: format.number(delivery.total) })}</small></span></div><aside>{delivery.pending > 0 ? <span>{t('deliveryPending', { count: format.number(delivery.pending) })}</span> : null}{delivery.failed > 0 ? <span data-tone="danger">{t('deliveryFailed', { count: format.number(delivery.failed) })}</span> : null}</aside></section> : null}
        </> : null}

        {canManage && settings ? <section className="report-surface report-settings"><header><div><span className="report-surface__icon"><Settings2 size={16} /></span><h2>{t('settings')}</h2></div></header><p>{t('settingsHint')}</p><ToggleField label={t('autoGenerate')} hint={t('autoGenerateHint')} checked={settings.auto_generate} onChange={(autoGenerate) => { if (action !== 'settings') void updateSettings({ ...settings, auto_generate: autoGenerate }) }} /><ToggleField label={t('emailMembers')} hint={t('emailMembersHint')} checked={settings.email_members} onChange={(emailMembers) => { if (action !== 'settings') void updateSettings({ ...settings, email_members: emailMembers }) }} /></section> : null}
      </div>
    </MobileShell>
  )
}
