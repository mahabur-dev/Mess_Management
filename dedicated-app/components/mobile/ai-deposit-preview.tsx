'use client'

import { Check } from 'lucide-react'
import { DepositEntryForm } from '@/components/mobile/deposit-entry-form'
import {
  ExpenseActionBar,
  ExpensePrimaryAction,
  ExpenseSecondaryAction,
} from '@/components/mobile/expense-ui'
import type { MemberOption } from '@/hooks/use-mess-member-options'
import {
  PAYMENT_METHODS,
  type PaymentMethod,
} from '@/lib/form-options'
import { useTranslations } from '@/lib/i18n'

export type AiDepositPreviewPayload = Record<string, unknown>

function paymentMethodOf(value: unknown): PaymentMethod {
  return typeof value === 'string' && PAYMENT_METHODS.includes(value as PaymentMethod)
    ? value as PaymentMethod
    : 'CASH'
}

export function AiDepositPreview({
  payload,
  members,
  canManage,
  disabled,
  onPatch,
  onCancel,
  onConfirm,
}: {
  payload: AiDepositPreviewPayload
  members: MemberOption[]
  canManage: boolean
  currentUserId?: string
  disabled?: boolean
  onPatch: (patch: Record<string, unknown>) => void
  onCancel: () => void
  onConfirm: () => void
}) {
  const t = useTranslations('payments')
  const common = useTranslations('common')
  const paidBy = String(payload.purchasedBy ?? payload.memberId ?? '')
  const date = String(payload.paymentDate ?? payload.date ?? '')
  const amount = payload.amount == null ? '' : String(payload.amount)
  const transactionId = String(payload.transactionId ?? '')
  const note = String(payload.note ?? '')

  return (
    <div className="space-y-4">
      <DepositEntryForm
        method={paymentMethodOf(payload.method)}
        onMethodChange={(method) => onPatch({ method })}
        amount={amount}
        onAmountChange={(value) => onPatch({ amount: value === '' ? '' : Number(value) })}
        date={date}
        onDateChange={(value) => onPatch({ paymentDate: value, date: value })}
        paidBy={paidBy}
        onPaidByChange={(value) => onPatch({
          purchasedBy: value || undefined,
          memberId: value || undefined,
        })}
        showPaidBy={canManage}
        members={members}
        transactionId={transactionId}
        onTransactionIdChange={(value) => onPatch({ transactionId: value })}
        note={note}
        onNoteChange={(value) => onPatch({ note: value })}
      />

      <ExpenseActionBar>
        <ExpenseSecondaryAction onClick={onCancel} disabled={disabled}>{common('cancel')}</ExpenseSecondaryAction>
        <ExpensePrimaryAction
          onClick={onConfirm}
          disabled={disabled || !amount || !date}
        >
          <Check size={17} /> {disabled ? t('saving') : t('save')}
        </ExpensePrimaryAction>
      </ExpenseActionBar>
    </div>
  )
}
