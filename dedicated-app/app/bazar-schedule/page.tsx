'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarDays,
  Check,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  LoaderCircle,
  Plus,
  Settings2,
  ShieldCheck,
  UserPlus,
  UserRound,
  X,
} from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { DatePicker } from '@/components/mobile/date-picker'
import { SelectField } from '@/components/mobile/form-controls'
import { TopScreen } from '@/components/top-screen'
import { Button } from '@/components/ui/button'
import { Notice } from '@/components/ui/notice'
import { useAutoDismiss } from '@/hooks/use-auto-dismiss'
import { useDialogFocus } from '@/hooks/use-dialog-focus'
import { api, type BazarDutySlot, type BazarFrequency, type BazarSchedule, type BazarScheduleRequest, type BazarScheduleSettings } from '@/lib/api'
import { canManageMess } from '@/lib/app-permissions'
import { useLocale, useLocaleFormatters } from '@/lib/i18n'
import { appHref } from '@/lib/routes'
import { useAuth } from '../providers'

type TabId = 'schedule' | 'mine' | 'requests' | 'distribution'
type SheetId = 'add-date' | 'assign' | null

const weekdayOptions = [
  { value: 6, en: 'Sat', bn: 'শনি' },
  { value: 0, en: 'Sun', bn: 'রবি' },
  { value: 1, en: 'Mon', bn: 'সোম' },
  { value: 2, en: 'Tue', bn: 'মঙ্গল' },
  { value: 3, en: 'Wed', bn: 'বুধ' },
  { value: 4, en: 'Thu', bn: 'বৃহস্পতি' },
  { value: 5, en: 'Fri', bn: 'শুক্র' },
] as const

function currentDhakaMonth() {
  const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Dhaka', year: 'numeric', month: 'numeric' })
  const parts = formatter.formatToParts(new Date())
  const read = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? 0)
  return { year: read('year'), month: read('month') }
}

function isoDay(date: string) {
  return Number(date.slice(8, 10))
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function toggleNumber(values: number[], value: number) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value].sort((a, b) => a - b)
}

function text(locale: 'en' | 'bn') {
  const bn = locale === 'bn'
  return {
    title: bn ? 'বাজারের সময়সূচি' : 'Bazar Schedule',
    subtitle: bn ? 'মাসিক বাজারের দায়িত্ব পরিকল্পনা ও ভারসাম্য করুন' : 'Plan, assign and balance monthly bazar duties',
    workspace: bn ? 'সক্রিয় ওয়ার্কস্পেস' : 'Active workspace',
    addDate: bn ? 'তারিখ যোগ করুন' : 'Add date', settings: bn ? 'সেটিংস' : 'Settings',
    dates: bn ? 'বাজার' : 'Bazar', slots: bn ? 'দায়িত্ব' : 'Duty slots',
    assigned: bn ? 'বরাদ্দ' : 'Assigned', available: bn ? 'খালি' : 'Available',
    calendarMine: bn ? 'আমার' : 'Mine', calendarOpen: bn ? 'খালি' : 'Open', calendarTaken: bn ? 'নেওয়া' : 'Taken', calendarOff: bn ? 'বন্ধ' : 'Off',
    recommended: bn ? 'সুপারিশকৃত' : 'Recommended', pending: bn ? 'অপেক্ষমাণ' : 'Pending requests',
    schedule: bn ? 'সময়সূচি' : 'Schedule', mine: bn ? 'আমার দায়িত্ব' : 'My duties', distribution: bn ? 'বণ্টন' : 'Distribution',
    active: bn ? 'সক্রিয়' : 'Active', version: bn ? 'সংস্করণ' : 'Version',
    noSchedule: bn ? 'এই মাসের কোনো বাজার সময়সূচি নেই' : 'No bazar schedule for this month',
    noScheduleDescription: bn ? 'সেটিংস সংরক্ষণ করে এই মাসের দায়িত্ব তালিকা তৈরি করুন।' : 'Save scheduling rules, then generate this month’s duty list.',
    configure: bn ? 'সেটিংস নির্ধারণ করুন' : 'Configure settings', generate: bn ? 'সময়সূচি তৈরি করুন' : 'Generate schedule', generating: bn ? 'তৈরি হচ্ছে...' : 'Generating...',
    loading: bn ? 'বাজার সময়সূচি লোড হচ্ছে...' : 'Loading bazar schedule...', retry: bn ? 'আবার চেষ্টা করুন' : 'Try again',
    allAssigned: bn ? 'সব দায়িত্ব বরাদ্দ হয়েছে' : 'All duties are assigned',
    tapToAssign: bn ? 'বরাদ্দ দিতে একটি খালি দায়িত্ব বেছে নিন' : 'Select an available duty to assign it',
    claim: bn ? 'দায়িত্ব নিন' : 'Claim duty', assigning: bn ? 'বরাদ্দ হচ্ছে...' : 'Assigning...',
    assignDuty: bn ? 'বাজার দায়িত্ব বরাদ্দ' : 'Assign bazar duty',
    assignDescription: bn ? 'যোগ্য একজন সদস্য বেছে নিন। প্রয়োজনে একটি নোট যোগ করুন।' : 'Select an eligible member and add an optional manager note.',
    chooseMember: bn ? 'সদস্য নির্বাচন করুন' : 'Choose a member', managerNote: bn ? 'ম্যানেজার নোট (ঐচ্ছিক)' : 'Manager note (optional)',
    managerNotePlaceholder: bn ? 'কেন এই দায়িত্ব পরিবর্তন করা হচ্ছে?' : 'Why is this duty being assigned?',
    saveAssignment: bn ? 'দায়িত্ব বরাদ্দ করুন' : 'Assign duty',
    addDateTitle: bn ? 'বাজারের তারিখ যোগ করুন' : 'Add bazar date',
    addDateDescription: bn ? 'পুনরাবৃত্ত নিয়ম পরিবর্তন না করে এই মাসে একটি অতিরিক্ত তারিখ যোগ করুন।' : 'Add an exception to this month without changing repeating rules.',
    date: bn ? 'তারিখ' : 'Date', peopleRequired: bn ? 'প্রয়োজনীয় সদস্য' : 'People required', reason: bn ? 'কারণ' : 'Reason',
    reasonPlaceholder: bn ? 'কেন এই তারিখ যোগ করা হচ্ছে?' : 'Why is this date being added?',
    saveDate: bn ? 'তারিখ যোগ করুন' : 'Add date',
    settingsTitle: bn ? 'বাজার সময়সূচির সেটিংস' : 'Bazar schedule settings',
    settingsDescription: bn ? 'পরবর্তী মাসগুলোর জন্য পুনরাবৃত্ত নিয়ম নির্ধারণ করুন।' : 'Set the repeating rules for future monthly schedules.',
    frequency: bn ? 'ফ্রিকোয়েন্সি' : 'Frequency', frequencyQuestion: bn ? 'কখন বাজার হবে?' : 'When does bazar happen?',
    everyDay: bn ? 'প্রতিদিন' : 'Every day', everyDayHint: bn ? 'প্রতিদিন বাজারের তারিখ তৈরি হবে।' : 'Create a bazar date every day.',
    specificWeekdays: bn ? 'নির্দিষ্ট বার' : 'Specific weekdays', weekdayHint: bn ? 'প্রতি মাসে নির্বাচিত বারগুলো পুনরাবৃত্তি হবে।' : 'Repeat selected weekdays every month.',
    customDates: bn ? 'নির্দিষ্ট তারিখ' : 'Custom dates', customDateHint: bn ? 'প্রতি মাসে নির্বাচিত তারিখগুলো পুনরাবৃত্তি হবে।' : 'Repeat selected day numbers every month.',
    repeatOn: bn ? 'পুনরাবৃত্তি হবে' : 'Repeat on', monthlyDates: bn ? 'মাসের তারিখ' : 'Monthly dates', selected: bn ? 'নির্বাচিত' : 'selected',
    shorterMonth: bn ? 'ছোট মাসে না থাকা তারিখ স্বয়ংক্রিয়ভাবে বাদ যাবে।' : 'Dates that do not exist in a shorter month are skipped automatically.',
    dutyPolicy: bn ? 'দায়িত্ব নীতি' : 'Duty policy', peoplePerBazar: bn ? 'প্রতি বাজারে সদস্য' : 'People per bazar',
    dutyLimit: bn ? 'মাসিক দায়িত্ব সীমা' : 'Monthly duty limit', releaseNotice: bn ? 'ছাড়ার পূর্ব-নোটিশ' : 'Free release notice', days: bn ? 'দিন' : 'days',
    includeManager: bn ? 'ম্যানেজারকে দায়িত্ব তালিকায় রাখুন' : 'Include manager in duty rotation', includeManagerHint: bn ? 'ম্যানেজারও দায়িত্ব বরাদ্দের জন্য যোগ্য থাকবেন।' : 'The manager is eligible for duty assignment.',
    strictFairness: bn ? 'ন্যায্য বণ্টন বাধ্যতামূলক করুন' : 'Enforce fair selection', strictFairnessHint: bn ? 'সবার দায়িত্ব যতটা সম্ভব ভারসাম্যপূর্ণ রাখে।' : 'Keeps member duty counts as balanced as possible.',
    settingsNotice: bn ? 'পরিবর্তন পরের তৈরি হওয়া সময়সূচিতে প্রযোজ্য হবে। বর্তমান মাস অপরিবর্তিত ও audit-ready থাকবে।' : 'Changes apply to the next schedule you generate. The active month remains unchanged and auditable.',
    saveSettings: bn ? 'সেটিংস সংরক্ষণ করুন' : 'Save settings', saving: bn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...',
    cancel: bn ? 'বাতিল' : 'Cancel', close: bn ? 'বন্ধ' : 'Close',
    noDuties: bn ? 'এখনো কোনো দায়িত্ব নেই' : 'No duties yet',
    noDutiesDescription: bn ? 'নতুন দায়িত্ব প্রকাশ হলে এখানে দেখা যাবে।' : 'Your assigned duties will appear here when available.',
    noDistribution: bn ? 'এখনো কোনো বণ্টন তথ্য নেই' : 'No distribution data yet',
    requests: bn ? 'অনুরোধ' : 'Requests', noRequests: bn ? 'কোনো অপেক্ষমাণ অনুরোধ নেই' : 'No pending requests',
    noRequestsDescription: bn ? 'দায়িত্ব বদলানো বা ছাড়ার অনুরোধ এখানে দেখা যাবে।' : 'Duty swap and release requests will appear here.',
    releaseRequest: bn ? 'দায়িত্ব ছাড়ার অনুরোধ' : 'Duty release request', swapRequest: bn ? 'দায়িত্ব বদলের অনুরোধ' : 'Duty swap request',
    requestedBy: bn ? 'অনুরোধ করেছেন' : 'Requested by',
    duties: bn ? 'দায়িত্ব' : 'duties', you: bn ? 'আপনি' : 'You',
    unavailable: bn ? 'বন্ধ' : 'Closed',
    addSuccess: bn ? 'বাজারের তারিখ যোগ করা হয়েছে।' : 'Bazar date added.',
    assignmentSuccess: bn ? 'বাজার দায়িত্ব বরাদ্দ করা হয়েছে।' : 'Bazar duty assigned.',
    settingsSuccess: bn ? 'সময়সূচির সেটিংস সংরক্ষণ করা হয়েছে।' : 'Schedule settings saved.',
    generatedSuccess: bn ? 'মাসিক বাজার সময়সূচি তৈরি হয়েছে।' : 'Monthly bazar schedule generated.',
    actionFailed: bn ? 'কাজটি সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।' : 'The action could not be completed. Please try again.',
  }
}

export default function BazarSchedulePage() {
  const { user } = useAuth()
  const router = useRouter()
  const { locale } = useLocale()
  const copy = text(locale)
  const canManage = canManageMess(user)
  const membership = user?.memberships?.find((item) => item.is_active !== false && (item.mess_id || item.mess?.id))
  const messId = membership?.mess_id ?? membership?.mess?.id ?? ''
  const { year, month } = useMemo(currentDhakaMonth, [])
  const [schedule, setSchedule] = useState<BazarSchedule | null>(null)
  const [settings, setSettings] = useState<BazarScheduleSettings | null>(null)
  const [members, setMembers] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [requests, setRequests] = useState<BazarScheduleRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('schedule')
  const [sheet, setSheet] = useState<SheetId>(null)
  const [selectedSlot, setSelectedSlot] = useState<BazarDutySlot | null>(null)
  const [newDate, setNewDate] = useState('')
  const [newDateCapacity, setNewDateCapacity] = useState('1')
  const [newDateReason, setNewDateReason] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [assignReason, setAssignReason] = useState('')

  useAutoDismiss(notice?.tone === 'success' ? notice : null, () => setNotice(null))

  const load = useCallback(async () => {
    if (!messId) { setLoading(false); return }
    setLoading(true); setError(false)
    const [settingsResult, scheduleResult, membersResult, releaseRequestsResult, swapRequestsResult] = await Promise.allSettled([
      api.getBazarScheduleSettings(messId),
      api.getBazarSchedule(messId, year, month),
      canManage ? api.getMessMemberOptions(messId) : Promise.resolve({ data: [] as Array<{ id: string; name: string; email: string }> }),
      api.getBazarReleaseRequests(messId, 'PENDING'),
      api.getBazarSwapRequests(messId, 'PENDING'),
    ])
    if (settingsResult.status === 'fulfilled') {
      setSettings(settingsResult.value.data)
    } else {
      setSettings(null)
    }
    if (scheduleResult.status === 'fulfilled') setSchedule(scheduleResult.value.data)
    else setSchedule(null)
    if (membersResult.status === 'fulfilled') setMembers(membersResult.value.data ?? [])
    else setMembers([])
    setRequests([
      ...(releaseRequestsResult.status === 'fulfilled' ? releaseRequestsResult.value.data ?? [] : []),
      ...(swapRequestsResult.status === 'fulfilled' ? swapRequestsResult.value.data ?? [] : []),
    ])
    setError(settingsResult.status === 'rejected' && scheduleResult.status === 'rejected')
    setLoading(false)
  }, [canManage, messId, month, year])

  useEffect(() => { void load() }, [load])

  const withAction = async (key: string, action: () => Promise<unknown>, success: string) => {
    setBusy(key); setNotice(null)
    try { await action(); setNotice({ tone: 'success', text: success }); await load(); return true } catch { setNotice({ tone: 'danger', text: copy.actionFailed }); return false } finally { setBusy(null) }
  }

  const openSettings = () => router.push(appHref('/bazar-schedule/settings'))
  const openAssign = (slot: BazarDutySlot) => { setSelectedSlot(slot); setAssigneeId(''); setAssignReason(''); setSheet('assign') }
  const monthEnd = dateKey(year, month, new Date(year, month, 0).getDate())

  return (
    <MobileShell>
      <TopScreen title={copy.title} subtitle={copy.subtitle} backHref="/" trailing={<button type="button" className="app-header-action" onClick={openSettings} aria-label={copy.settings}><Settings2 size={19} /></button>} />
      <div className="screen bazar-schedule-page">
        {!messId ? <EmptyState title={copy.noSchedule} description={copy.noScheduleDescription} /> : loading ? <div className="bazar-loading"><LoaderCircle className="animate-spin" size={21} /> {copy.loading}</div> : error ? <EmptyState title={copy.actionFailed} description={copy.actionFailed} action={<Button onClick={() => void load()}>{copy.retry}</Button>} /> : (
          <>
            {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

            {schedule ? (
              <>
                <div className="bazar-actions">
                  {canManage ? <Button className="bazar-action-primary" onClick={() => { setNewDate(dateKey(year, month, 1)); setNewDateCapacity(String(schedule.default_members_per_date ?? 1)); setNewDateReason(''); setSheet('add-date') }}><Plus size={16} /> {copy.addDate}</Button> : null}
                  <Button variant="secondary" className="bazar-action-secondary" onClick={openSettings}><Settings2 size={16} /> {copy.settings}</Button>
                </div>
                <SummaryCards schedule={schedule} requestCount={requests.length} copy={copy} />
                <div className="bazar-tabs" role="tablist" aria-label={copy.title}>
                  {([['schedule', copy.schedule], ['mine', copy.mine], ['requests', copy.requests], ['distribution', copy.distribution]] as Array<[TabId, string]>).map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={activeTab === id} data-active={activeTab === id} onClick={() => setActiveTab(id)}>{label}{id === 'requests' && requests.length ? ` (${requests.length})` : ''}</button>)}
                </div>
                {activeTab === 'schedule' ? <ScheduleCalendar schedule={schedule} currentUserId={user?.id} canManage={canManage} copy={copy} onSlot={openAssign} onClaim={(slot) => void withAction(slot.id, () => api.claimBazarDuty(slot.id), copy.assignmentSuccess)} busy={busy} /> : null}
                {activeTab === 'mine' ? <MyDuties schedule={schedule} userId={user?.id} copy={copy} /> : null}
                {activeTab === 'requests' ? <Requests requests={requests} copy={copy} /> : null}
                {activeTab === 'distribution' ? <Distribution schedule={schedule} copy={copy} /> : null}
              </>
            ) : (
              <EmptyState title={copy.noSchedule} description={copy.noScheduleDescription} action={canManage ? <div className="grid gap-2"><Button variant="secondary" onClick={openSettings}><Settings2 size={16} /> {settings ? copy.settings : copy.configure}</Button>{settings ? <Button busy={busy === 'generate'} busyLabel={copy.generating} onClick={() => void withAction('generate', () => api.generateBazarSchedule({ messId, year, month }), copy.generatedSuccess)}><CalendarDays size={16} /> {copy.generate}</Button> : null}</div> : undefined} />
            )}
          </>
        )}
      </div>
      {sheet === 'add-date' && schedule ? <AddDateSheet copy={copy} date={newDate} capacity={newDateCapacity} reason={newDateReason} minDate={dateKey(year, month, 1)} maxDate={monthEnd} busy={busy === 'add-date'} onChangeDate={setNewDate} onChangeCapacity={setNewDateCapacity} onChangeReason={setNewDateReason} onClose={() => setSheet(null)} onSave={() => void withAction('add-date', () => api.addBazarScheduleDate(schedule.id, { date: newDate, requiredMembers: Math.max(1, Number(newDateCapacity) || 1), reason: newDateReason.trim() }), copy.addSuccess).then((ok) => { if (ok) setSheet(null) })} /> : null}
      {sheet === 'assign' && selectedSlot ? <AssignSheet copy={copy} members={members} memberId={assigneeId} reason={assignReason} busy={busy === selectedSlot.id} onChangeMember={setAssigneeId} onChangeReason={setAssignReason} onClose={() => setSheet(null)} onSave={() => void withAction(selectedSlot.id, () => api.assignBazarDuty(selectedSlot.id, { memberId: assigneeId, reason: assignReason.trim() || undefined }), copy.assignmentSuccess).then((ok) => { if (ok) setSheet(null) })} /> : null}
    </MobileShell>
  )
}

function SummaryCards({ schedule, requestCount, copy }: { schedule: BazarSchedule; requestCount: number; copy: ReturnType<typeof text> }) {
  const items = [
    [copy.dates, schedule.overview.totalBazarDates, CalendarDays],
    [copy.assigned, schedule.overview.assigned, UserPlus],
    [copy.recommended, schedule.overview.recommendedDutyCount, ShieldCheck],
    [copy.pending, requestCount, ClipboardList],
  ] as const
  return <section className="bazar-summary-grid">{items.map(([label, value, Icon]) => <article key={label} className="bazar-summary-card"><span className="bazar-summary-card__heading"><span className="bazar-summary-card__icon"><Icon size={16} /></span><small>{label}</small></span><strong>{value}</strong></article>)}</section>
}

function ScheduleCalendar({ schedule, currentUserId, canManage, copy, onSlot, onClaim, busy }: { schedule: BazarSchedule; currentUserId?: string; canManage: boolean; copy: ReturnType<typeof text>; onSlot: (slot: BazarDutySlot) => void; onClaim: (slot: BazarDutySlot) => void; busy: string | null }) {
  const dates = new Map(schedule.dates.map((date) => [isoDay(date.duty_date), date]))
  const count = new Date(schedule.year, schedule.month, 0).getDate()
  const days = Array.from({ length: count }, (_, index) => index + 1)
  const format = useLocaleFormatters()
  const monthTitle = format.date(new Date(schedule.year, schedule.month - 1, 1), { month: 'long', year: 'numeric' })
  return <section className="bazar-calendar-card"><div className="bazar-calendar-card__heading"><div><h2>{monthTitle}</h2><p>{copy.tapToAssign}</p></div><span>{copy.version} {schedule.version}</span></div><div className="bazar-calendar">{days.map((day) => { const date = dates.get(day); const slots = date?.slots ?? []; const available = slots.find((slot) => (slot.effectiveStatus ?? slot.status) === 'AVAILABLE'); const yours = slots.find((slot) => slot.assigned_member_id === currentUserId); const closed = !date || (date.effectiveStatus ?? date.status) !== 'OPEN'; const status = yours ? { compact: copy.calendarMine, full: copy.you } : available ? { compact: copy.calendarOpen, full: copy.available } : closed ? { compact: copy.calendarOff, full: copy.unavailable } : { compact: copy.calendarTaken, full: copy.assigned }; return <button key={day} type="button" aria-label={`${day}: ${status.full}`} disabled={!available || busy !== null} onClick={() => available && (canManage ? onSlot(available) : onClaim(available))} className="bazar-day" data-state={yours ? 'yours' : available ? 'available' : closed ? 'closed' : 'assigned'}><strong>{day}</strong><small>{status.compact}</small></button> })}</div><div className="bazar-legend"><span data-tone="yours"><i />{copy.you}</span><span data-tone="available"><i />{copy.available}</span><span data-tone="closed"><i />{copy.unavailable}</span></div></section>
}

function MyDuties({ schedule, userId, copy }: { schedule: BazarSchedule; userId?: string; copy: ReturnType<typeof text> }) {
  const format = useLocaleFormatters()
  const duties = schedule.dates.flatMap((date) => date.slots.filter((slot) => slot.assigned_member_id === userId).map((slot) => ({ date, slot })))
  if (!duties.length) return <EmptyState title={copy.noDuties} description={copy.noDutiesDescription} />
  return <section className="bazar-list-card">{duties.map(({ date, slot }) => <article key={slot.id}><span className="bazar-list-card__date">{format.date(new Date(date.duty_date), { day: 'numeric' })}</span><div><strong>{format.date(new Date(date.duty_date), { weekday: 'long', month: 'long', day: 'numeric' })}</strong><small>{copy.assigned}</small></div><Check className="text-[#008d8c]" size={18} /></article>)}</section>
}

function Distribution({ schedule, copy }: { schedule: BazarSchedule; copy: ReturnType<typeof text> }) {
  if (!schedule.overview.distribution.length) return <EmptyState title={copy.noDistribution} description={copy.noDutiesDescription} />
  return <section className="bazar-list-card">{schedule.overview.distribution.map(({ member, dutyCount }) => <article key={member.id}><span className="bazar-list-card__avatar">{member.name.slice(0, 1).toUpperCase()}</span><div><strong>{member.name}</strong><small>{member.email}</small></div><b>{dutyCount} {copy.duties}</b></article>)}</section>
}

function Requests({ requests, copy }: { requests: BazarScheduleRequest[]; copy: ReturnType<typeof text> }) {
  const format = useLocaleFormatters()
  if (!requests.length) return <EmptyState title={copy.noRequests} description={copy.noRequestsDescription} />
  return <section className="bazar-list-card">{requests.map((request) => {
    const isSwap = Boolean(request.target_member || request.requester_slot)
    const date = request.slot?.bazar_date?.duty_date ?? request.requester_slot?.bazar_date?.duty_date
    return <article key={request.id}><span className="bazar-list-card__avatar">{isSwap ? '↔' : '↗'}</span><div><strong>{isSwap ? copy.swapRequest : copy.releaseRequest}</strong><small>{copy.requestedBy} {request.requester?.name ?? '—'}{date ? ` · ${format.date(date, { month: 'short', day: 'numeric' })}` : ''}</small></div><ChevronRight size={17} className="text-[#65838b]" /></article>
  })}</section>
}

function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <section className="bazar-empty"><span><CircleAlert size={22} /></span><h2>{title}</h2><p>{description}</p>{action ? <div className="mt-5 w-full">{action}</div> : null}</section>
}

function Sheet({ title, description, closeLabel, children, onClose }: { title: string; description: string; closeLabel: string; children: ReactNode; onClose: () => void }) {
  const dialogRef = useRef<HTMLElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  useDialogFocus({ open: true, containerRef: dialogRef, initialFocusRef: closeRef, onClose })
  return <div className="bazar-sheet-backdrop" role="presentation"><section ref={dialogRef} tabIndex={-1} className="bazar-sheet" role="dialog" aria-modal="true" aria-label={title}><div className="bazar-sheet__handle" /><header><div><h2>{title}</h2><p>{description}</p></div><button ref={closeRef} type="button" onClick={onClose} aria-label={closeLabel}><X size={20} /></button></header>{children}</section></div>
}

function SettingsSheet({ copy, draft, busy, onChange, onClose, onSave }: { copy: ReturnType<typeof text>; draft: BazarScheduleSettings; busy: boolean; onChange: (value: BazarScheduleSettings) => void; onClose: () => void; onSave: () => void }) {
  const { locale } = useLocale()
  const update = (patch: Partial<BazarScheduleSettings>) => onChange({ ...draft, ...patch })
  const requiresSelection = (draft.frequency === 'SPECIFIC_WEEKDAYS' && !draft.weekdays.length) || (draft.frequency === 'CUSTOM_DATES' && !draft.custom_days.length)
  const frequencyOptions: Array<{ value: BazarFrequency; title: string; hint: string }> = [
    { value: 'EVERY_DAY', title: copy.everyDay, hint: copy.everyDayHint },
    { value: 'SPECIFIC_WEEKDAYS', title: copy.specificWeekdays, hint: copy.weekdayHint },
    { value: 'CUSTOM_DATES', title: copy.customDates, hint: copy.customDateHint },
  ]
  return <Sheet title={copy.settingsTitle} description={copy.settingsDescription} closeLabel={copy.close} onClose={onClose}><div className="bazar-sheet__body"><p className="bazar-field-label">{copy.frequency}</p><h3 className="bazar-question">{copy.frequencyQuestion}</h3><div className="bazar-frequency-list">{frequencyOptions.map((option) => <button key={option.value} type="button" data-active={draft.frequency === option.value} onClick={() => update({ frequency: option.value })}><span><CalendarDays size={17} /></span><div><strong>{option.title}</strong><small>{option.hint}</small></div>{draft.frequency === option.value ? <Check size={17} /> : <i />}</button>)}</div>{draft.frequency === 'SPECIFIC_WEEKDAYS' ? <><p className="bazar-field-label mt-5">{copy.repeatOn}</p><div className="bazar-choice-grid">{weekdayOptions.map((day) => <button key={day.value} type="button" data-active={draft.weekdays.includes(day.value)} onClick={() => update({ weekdays: toggleNumber(draft.weekdays, day.value) })}>{locale === 'bn' ? day.bn : day.en}</button>)}</div></> : null}{draft.frequency === 'CUSTOM_DATES' ? <><div className="mt-5 flex items-center justify-between"><p className="bazar-field-label">{copy.monthlyDates}</p><span className="text-caption font-semibold text-[#53717a]">{draft.custom_days.length} {copy.selected}</span></div><div className="bazar-date-grid">{Array.from({ length: 31 }, (_, index) => index + 1).map((day) => <button key={day} type="button" data-active={draft.custom_days.includes(day)} onClick={() => update({ custom_days: toggleNumber(draft.custom_days, day) })}>{day}</button>)}</div><p className="bazar-hint">{copy.shorterMonth}</p></> : null}<p className="bazar-field-label mt-6">{copy.dutyPolicy}</p><div className="bazar-input-stack"><NumberField label={copy.peoplePerBazar} value={draft.default_members_per_date} min={1} max={50} onChange={(value) => update({ default_members_per_date: value })} /><NumberField label={copy.dutyLimit} value={draft.duty_limit} min={1} max={100} onChange={(value) => update({ duty_limit: value })} /><NumberField label={copy.releaseNotice} suffix={copy.days} value={draft.release_notice_days} min={0} max={31} onChange={(value) => update({ release_notice_days: value })} /></div><ToggleRow label={copy.includeManager} hint={copy.includeManagerHint} checked={draft.include_manager} onChange={(checked) => update({ include_manager: checked })} /><ToggleRow label={copy.strictFairness} hint={copy.strictFairnessHint} checked={draft.strict_fairness} onChange={(checked) => update({ strict_fairness: checked })} /><div className="bazar-sheet-note"><ShieldCheck size={15} />{copy.settingsNotice}</div></div><footer><Button variant="secondary" onClick={onClose}>{copy.cancel}</Button><Button disabled={requiresSelection} busy={busy} busyLabel={copy.saving} onClick={onSave}>{copy.saveSettings}</Button></footer></Sheet>
}

function NumberField({ label, value, min, max, suffix, onChange }: { label: string; value: number; min: number; max: number; suffix?: string; onChange: (value: number) => void }) { return <label className="bazar-number-field"><span>{label}</span><input type="number" min={min} max={max} value={value} onChange={(event) => onChange(Math.max(min, Math.min(max, Number(event.target.value) || min)))} />{suffix ? <em>{suffix}</em> : null}</label> }
function ToggleRow({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (checked: boolean) => void }) { return <label className="bazar-toggle-row"><span><strong>{label}</strong><small>{hint}</small></span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><i aria-hidden="true" /></label> }

function AddDateSheet({ copy, date, capacity, reason, minDate, maxDate, busy, onChangeDate, onChangeCapacity, onChangeReason, onClose, onSave }: { copy: ReturnType<typeof text>; date: string; capacity: string; reason: string; minDate: string; maxDate: string; busy: boolean; onChangeDate: (value: string) => void; onChangeCapacity: (value: string) => void; onChangeReason: (value: string) => void; onClose: () => void; onSave: () => void }) {
  return (
    <Sheet title={copy.addDateTitle} description={copy.addDateDescription} closeLabel={copy.close} onClose={onClose}>
      <div className="bazar-sheet__body bazar-form">
        <DatePicker label={copy.date} value={date} min={minDate} max={maxDate} onChange={onChangeDate} />
        <label>
          <span>{copy.peopleRequired}</span>
          <input type="number" min="1" max="50" value={capacity} onChange={(event) => onChangeCapacity(event.target.value)} />
        </label>
        <label>
          <span>{copy.reason}</span>
          <textarea value={reason} onChange={(event) => onChangeReason(event.target.value)} placeholder={copy.reasonPlaceholder} />
        </label>
      </div>
      <footer>
        <Button variant="secondary" onClick={onClose}>{copy.cancel}</Button>
        <Button disabled={!date || !reason.trim()} busy={busy} busyLabel={copy.saving} onClick={onSave}><Plus size={16} /> {copy.saveDate}</Button>
      </footer>
    </Sheet>
  )
}

function AssignSheet({ copy, members, memberId, reason, busy, onChangeMember, onChangeReason, onClose, onSave }: { copy: ReturnType<typeof text>; members: Array<{ id: string; name: string; email: string }>; memberId: string; reason: string; busy: boolean; onChangeMember: (value: string) => void; onChangeReason: (value: string) => void; onClose: () => void; onSave: () => void }) {
  const memberOptions = ['', ...members.map((member) => member.id)]
  const memberLabel = (id: string) => {
    const member = members.find((candidate) => candidate.id === id)
    return member?.name ?? copy.chooseMember
  }

  return (
    <Sheet title={copy.assignDuty} description={copy.assignDescription} closeLabel={copy.close} onClose={onClose}>
      <div className="bazar-sheet__body bazar-form">
        <SelectField
          label={copy.chooseMember}
          value={memberId}
          options={memberOptions}
          getLabel={memberLabel}
          icon={UserRound}
          onChange={onChangeMember}
        />
        <label>
          <span>{copy.managerNote}</span>
          <textarea value={reason} onChange={(event) => onChangeReason(event.target.value)} placeholder={copy.managerNotePlaceholder} />
        </label>
      </div>
      <footer>
        <Button variant="secondary" onClick={onClose}>{copy.cancel}</Button>
        <Button disabled={!memberId} busy={busy} busyLabel={copy.assigning} onClick={onSave}><UserPlus size={16} /> {copy.saveAssignment}</Button>
      </footer>
    </Sheet>
  )
}
