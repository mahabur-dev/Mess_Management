import { expensePaymentSourceLabel, paymentMethodLabel } from './domain-labels'
import { formatDate, formatMoney, formatMonth, formatNumber, formatTime } from './formatters'
import { translate } from './translate'
import type { Locale, MessageKey, TranslationValues } from './types'

type NotificationPresentation = {
  title: string
  body: string
  metadata?: Record<string, unknown> | null
}

const text = (value: unknown) => typeof value === 'string' ? value : ''
const numeric = (value: unknown) => {
  const parsed = Number(String(value ?? '').replaceAll(',', ''))
  return Number.isFinite(parsed) ? parsed : 0
}
const dateTimeWithClock = (date: string, clock: string) =>
  `${date}T${clock.length === 5 ? `${clock}:00` : clock}+06:00`

export function localizedNotificationCopy(item: NotificationPresentation, locale: Locale) {
  const metadata = item.metadata ?? {}
  const source = text(metadata.source)
  const type = text(metadata.type)
  const t = (key: MessageKey<'notifications'>, values?: TranslationValues) =>
    translate(locale, 'notifications', key, values)

  if (source === 'MEMBER_JOIN_APPROVED') return { title: t('memberRequestApprovedTitle'), body: t('memberRequestApprovedBody') }
  if (source === 'MEMBER_JOIN_REJECTED') return { title: t('memberRequestRejectedTitle'), body: t('memberRequestRejectedBody') }
  if (source === 'MEMBER_JOIN_REQUEST') {
    const match = item.body.match(/^(.+) requested to join (.+)\.$/)
    return match ? { title: t('newMemberRequestTitle'), body: t('newMemberRequestBody', { name: match[1], mess: match[2] }) } : { title: t('newMemberRequestTitle'), body: item.body }
  }
  if (source === 'MESS_CREATED') {
    const match = item.body.match(/^(.+) created (.+)\.$/)
    return match ? { title: t('messCreatedTitle'), body: t('messCreatedBody', { name: match[1], mess: match[2] }) } : { title: t('messCreatedTitle'), body: item.body }
  }
  if (source === 'MESS_REQUEST') {
    const match = item.body.match(/^(.+) requested approval for (.+)\.$/)
    return match ? { title: t('messRequestTitle'), body: t('messRequestBody', { name: match[1], mess: match[2] }) } : { title: t('messRequestTitle'), body: item.body }
  }
  if (source === 'MESS_APPROVAL') {
    const rejected = text(metadata.status).toUpperCase() === 'REJECTED'
    const note = text(metadata.reviewNote)
    if (rejected) return { title: t('messRejectedTitle'), body: note ? t('messRejectedWithNoteBody', { note }) : t('messRejectedBody') }
    return { title: t('messApprovedTitle'), body: t('messApprovedBody', { days: formatNumber(numeric(metadata.trialDays) || 30, locale) }) }
  }
  if (metadata.contactRequestId) {
    const name = item.body.match(/^(.+) submitted /)?.[1]
    const plan = text(metadata.requestedPlan).toUpperCase()
    const subject = t(plan === 'MONTHLY' ? 'monthlyPlanRequest' : plan === 'YEARLY' ? 'yearlyPlanRequest' : 'contactRequest')
    return name ? { title: t('contactRequestTitle'), body: t('contactRequestBody', { name, subject }) } : { title: t('contactRequestTitle'), body: item.body }
  }
  if (source === 'COMPLAINT') {
    const complaintTitle = item.title.replace(/^New complaint:\s*/i, '')
    return { title: t('newComplaintTitle', { title: complaintTitle }), body: item.body }
  }
  if (source === 'PAYMENT') {
    const match = item.body.match(/^(.+) submitted ([\d,.]+) via ([A-Z_]+)\.$/i)
    return match ? {
      title: t('paymentSubmittedTitle'),
      body: t('paymentSubmittedBody', { name: match[1], amount: formatMoney(match[2], locale), method: paymentMethodLabel(match[3], locale) }),
    } : { title: t('paymentSubmittedTitle'), body: item.body }
  }
  if (source === 'PAYMENT_REVIEW') {
    const approved = text(metadata.status).toUpperCase() === 'APPROVED'
    const amount = item.body.match(/deposit of ([\d,.]+)/i)?.[1]
    return {
      title: t(approved ? 'depositApprovedTitle' : 'depositRejectedTitle'),
      body: amount ? t(approved ? 'depositApprovedBody' : 'depositRejectedBody', { amount: formatMoney(amount, locale) }) : item.body,
    }
  }
  if (source === 'EXPENSE') {
    const match = item.body.match(/^(.+)\s+-\s+([\d,.]+)\s+\[([A-Z_]+)\]$/i)
    const utility = /^Utility Submitted/i.test(item.title)
    return match ? {
      title: t(utility ? 'utilitySubmittedTitle' : 'expenseSubmittedTitle'),
      body: t('expenseSubmittedBody', { item: match[1], amount: formatMoney(match[2], locale), source: expensePaymentSourceLabel(match[3], locale) }),
    } : { title: t(utility ? 'utilitySubmittedTitle' : 'expenseSubmittedTitle'), body: item.body }
  }
  if (type === 'MEAL_WINDOW_OPENED') {
    const targetDate = text(metadata.targetDate)
    const endTime = text(metadata.endTime)
    return { title: t('mealWindowTitle'), body: targetDate && endTime ? t('mealWindowBody', { date: formatDate(targetDate, locale), time: formatTime(dateTimeWithClock(targetDate, endTime), locale) }) : item.body }
  }
  if (type === 'MEAL_DEADLINE_WARNING') {
    const targetDate = text(metadata.targetDate)
    const endTime = text(metadata.endTime)
    return { title: t('mealDeadlineTitle'), body: targetDate && endTime ? t('mealDeadlineBody', { date: formatDate(targetDate, locale), time: formatTime(dateTimeWithClock(targetDate, endTime), locale), minutes: formatNumber(numeric(metadata.leadMinutes), locale) }) : item.body }
  }
  if (metadata.closeRequestId && metadata.status) {
    const approved = text(metadata.status).toUpperCase() === 'APPROVED'
    return { title: t(approved ? 'closeApprovedTitle' : 'closeRejectedTitle'), body: t(approved ? 'closeApprovedBody' : 'closeRejectedBody') }
  }
  if (metadata.closeRequestId && metadata.month) {
    const name = item.body.match(/^(.+) requested to close /)?.[1]
    return name ? { title: t('closeRequestedTitle'), body: t('closeRequestedBody', { name, month: formatMonth(text(metadata.month), locale), balance: formatMoney(metadata.balance as string | number, locale) }) } : { title: t('closeRequestedTitle'), body: item.body }
  }
  if (type === 'EXPENSE_REVIEWED') {
    const approved = text(metadata.approvalStatus).toUpperCase() === 'APPROVED'
    const itemName = item.body.match(/^(.+) was (?:approved|rejected)\.$/i)?.[1]
    return { title: t(approved ? 'expenseApprovedTitle' : 'expenseRejectedTitle'), body: itemName ? t(approved ? 'expenseApprovedBody' : 'expenseRejectedBody', { item: itemName }) : item.body }
  }
  if (type === 'EXPENSE_PRICE_REVIEW') {
    const messName = item.title.match(/^Price review requested\s+-\s+(.+)$/i)?.[1]
    return { title: t('priceReviewTitle', { mess: messName ? ` — ${messName}` : '' }), body: item.body }
  }

  const dutyDate = text(metadata.dutyDate)
  if (source === 'BAZAR_SCHEDULE_GENERATED') {
    const mess = text(metadata.messName) || item.body.split(':')[0] || ''
    const year = numeric(metadata.year)
    const month = numeric(metadata.month)
    const monthLabel = year && month ? formatMonth(new Date(Date.UTC(year, month - 1, 1)), locale) : `${month}/${year}`
    return { title: t('bazarScheduleTitle'), body: t('bazarScheduleBody', { mess, month: monthLabel }) }
  }
  if (source === 'BAZAR_DUTY_ASSIGNED') return { title: t('bazarDutyAssignedTitle'), body: dutyDate ? t('bazarDutyAssignedBody', { date: formatDate(dutyDate, locale) }) : item.body }
  if (source === 'BAZAR_DUTY_UNASSIGNED') return { title: t('bazarDutyUnassignedTitle'), body: dutyDate ? t('bazarDutyUnassignedBody', { date: formatDate(dutyDate, locale) }) : item.body }
  if (source === 'BAZAR_DUTY_AUTO_RELEASED') return { title: t('bazarDutyReleasedTitle'), body: dutyDate ? t('bazarDutyReleasedBody', { date: formatDate(dutyDate, locale) }) : item.body }
  if (source === 'BAZAR_RELEASE_REQUESTED') return { title: t('bazarReleaseRequestedTitle'), body: dutyDate ? t('bazarReleaseRequestedBody', { date: formatDate(dutyDate, locale) }) : item.body }
  if (source === 'BAZAR_RELEASE_APPROVED' || source === 'BAZAR_RELEASE_REJECTED') {
    const approved = source === 'BAZAR_RELEASE_APPROVED'
    return { title: t(approved ? 'bazarReleaseApprovedTitle' : 'bazarReleaseRejectedTitle'), body: dutyDate ? t(approved ? 'bazarReleaseApprovedBody' : 'bazarReleaseRejectedBody', { date: formatDate(dutyDate, locale) }) : item.body }
  }
  if (source === 'BAZAR_SWAP_REQUESTED') {
    const fromDate = text(metadata.requesterDate)
    const toDate = text(metadata.targetDate)
    return { title: t('bazarSwapRequestedTitle'), body: fromDate && toDate ? t('bazarSwapRequestedBody', { fromDate: formatDate(fromDate, locale), toDate: formatDate(toDate, locale) }) : item.body }
  }
  if (source === 'BAZAR_SWAP_APPROVED' || source === 'BAZAR_SWAP_REJECTED') {
    const approved = source === 'BAZAR_SWAP_APPROVED'
    return { title: t(approved ? 'bazarSwapApprovedTitle' : 'bazarSwapRejectedTitle'), body: t(approved ? 'bazarSwapApprovedBody' : 'bazarSwapRejectedBody') }
  }
  if (source === 'BAZAR_SWAP_CANCELLED') return { title: t('bazarSwapCancelledTitle'), body: t('bazarSwapCancelledBody') }

  return { title: item.title, body: item.body }
}
