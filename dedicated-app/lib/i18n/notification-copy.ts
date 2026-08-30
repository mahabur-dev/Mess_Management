import { expensePaymentSourceLabel, paymentMethodLabel } from './domain-labels'
import { getDictionary } from './dictionaries'
import { formatDate, formatMoney, formatMonth, formatNumber, formatTime } from './formatters'
import { translate } from './translate'
import type { Locale } from './types'

type NotificationPresentation = {
  title: string
  body: string
  metadata?: Record<string, unknown> | null
}

function text(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function numeric(value: unknown) {
  const parsed = Number(String(value ?? '').replaceAll(',', ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function dateTimeWithClock(date: string, clock: string) {
  return `${date}T${clock.length === 5 ? `${clock}:00` : clock}+06:00`
}

export function localizedNotificationCopy(item: NotificationPresentation, locale: Locale) {
  const metadata = item.metadata ?? {}
  const source = text(metadata.source)
  const type = text(metadata.type)
  const t = (key: keyof ReturnType<typeof getDictionary>['communication'], values?: Record<string, string | number>) =>
    translate(locale, 'communication', key, values)

  if (source === 'MEMBER_JOIN_APPROVED') {
    return { title: t('memberRequestApprovedTitle'), body: t('memberRequestApprovedBody') }
  }
  if (source === 'MEMBER_JOIN_REJECTED') {
    return { title: t('memberRequestRejectedTitle'), body: t('memberRequestRejectedBody') }
  }
  if (source === 'MEMBER_JOIN_REQUEST') {
    const match = item.body.match(/^(.+) requested to join (.+)\.$/)
    return match
      ? { title: t('newMemberRequestTitle'), body: t('newMemberRequestBody', { name: match[1], mess: match[2] }) }
      : { title: t('newMemberRequestTitle'), body: item.body }
  }
  if (source === 'MESS_CREATED') {
    const match = item.body.match(/^(.+) created (.+)\.$/)
    return match
      ? { title: t('messCreatedTitle'), body: t('messCreatedBody', { name: match[1], mess: match[2] }) }
      : { title: t('messCreatedTitle'), body: item.body }
  }
  if (source === 'COMPLAINT') {
    const complaintTitle = item.title.replace(/^New complaint:\s*/i, '')
    return { title: t('newComplaintTitle', { title: complaintTitle }), body: item.body }
  }
  if (source === 'PAYMENT') {
    const match = item.body.match(/^(.+) submitted ([\d,.]+) via ([A-Z_]+)\.$/i)
    return match
      ? {
          title: t('paymentSubmittedTitle'),
          body: t('paymentSubmittedBody', {
            name: match[1],
            amount: formatMoney(numeric(match[2]), locale),
            method: paymentMethodLabel(match[3], locale),
          }),
        }
      : { title: t('paymentSubmittedTitle'), body: item.body }
  }
  if (source === 'PAYMENT_REVIEW') {
    const amount = item.body.match(/deposit of ([\d,.]+)/i)?.[1]
    const approved = text(metadata.status).toUpperCase() === 'APPROVED'
    return {
      title: t(approved ? 'depositApprovedTitle' : 'depositRejectedTitle'),
      body: amount
        ? t(approved ? 'depositApprovedBody' : 'depositRejectedBody', { amount: formatMoney(numeric(amount), locale) })
        : item.body,
    }
  }
  if (source === 'EXPENSE') {
    const match = item.body.match(/^(.+)\s+-\s+([\d,.]+)\s+\[([A-Z_]+)\]$/i)
    const utility = /^Utility Submitted/i.test(item.title)
    return match
      ? {
          title: t(utility ? 'utilitySubmittedTitle' : 'expenseSubmittedTitle'),
          body: t('expenseSubmittedBody', {
            item: match[1],
            amount: formatMoney(numeric(match[2]), locale),
            source: expensePaymentSourceLabel(match[3], locale),
          }),
        }
      : { title: t(utility ? 'utilitySubmittedTitle' : 'expenseSubmittedTitle'), body: item.body }
  }
  if (type === 'MEAL_WINDOW_OPENED') {
    const targetDate = text(metadata.targetDate)
    const endTime = text(metadata.endTime)
    return {
      title: t('mealWindowOpenedTitle'),
      body: targetDate && endTime
        ? t('mealWindowOpenedBody', {
            date: formatDate(targetDate, locale),
            time: formatTime(dateTimeWithClock(targetDate, endTime), locale),
          })
        : item.body,
    }
  }
  if (type === 'MEAL_DEADLINE_WARNING') {
    const targetDate = text(metadata.targetDate)
    const endTime = text(metadata.endTime)
    return {
      title: t('mealDeadlineTitle'),
      body: targetDate && endTime
        ? t('mealDeadlineBody', {
            date: formatDate(targetDate, locale),
            time: formatTime(dateTimeWithClock(targetDate, endTime), locale),
            minutes: formatNumber(numeric(metadata.leadMinutes), locale),
          })
        : item.body,
    }
  }
  if (metadata.closeRequestId && metadata.status) {
    const approved = text(metadata.status).toUpperCase() === 'APPROVED'
    return {
      title: t(approved ? 'closeCalculationApprovedTitle' : 'closeCalculationRejectedTitle'),
      body: t(approved ? 'closeCalculationApprovedBody' : 'closeCalculationRejectedBody'),
    }
  }
  if (metadata.closeRequestId && metadata.month) {
    const name = item.body.match(/^(.+) requested to close /)?.[1]
    return name
      ? {
          title: t('closeCalculationRequestedTitle'),
          body: t('closeCalculationRequestedBody', {
            name,
            month: formatMonth(text(metadata.month), locale),
            balance: formatMoney(numeric(metadata.balance), locale),
          }),
        }
      : { title: t('closeCalculationRequestedTitle'), body: item.body }
  }

  return { title: item.title, body: item.body }
}
