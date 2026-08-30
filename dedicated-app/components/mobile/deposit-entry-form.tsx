'use client'

import { DesignedSelect, expenseFormIcons } from '@/components/mobile/expense-design'
import { DepositManualNotice } from '@/components/mobile/deposit-design'
import { TextAreaField, TextField } from '@/components/mobile/form-controls'
import type { MemberOption } from '@/hooks/use-mess-member-options'
import { PAYMENT_METHODS, type PaymentMethod } from '@/lib/form-options'
import { paymentMethodLabel, useLocale, useTranslations } from '@/lib/i18n'

export type DepositEntryFormProps = {
  method: PaymentMethod
  onMethodChange: (value: PaymentMethod) => void
  amount: string
  onAmountChange: (value: string) => void
  date: string
  onDateChange: (value: string) => void
  paidBy: string
  onPaidByChange: (value: string) => void
  showPaidBy: boolean
  members: MemberOption[]
  transactionId: string
  onTransactionIdChange: (value: string) => void
  note: string
  onNoteChange: (value: string) => void
}

/** Canonical manual-payment fields shared by Manual Deposit and AI Deposit. */
export function DepositEntryForm({
  method,
  onMethodChange,
  amount,
  onAmountChange,
  date,
  onDateChange,
  paidBy,
  onPaidByChange,
  showPaidBy,
  members,
  transactionId,
  onTransactionIdChange,
  note,
  onNoteChange,
}: DepositEntryFormProps) {
  const { locale } = useLocale()
  const t = useTranslations('payments')
  return (
    <>
      <DesignedSelect
        label={t('depositMethod')}
        icon={expenseFormIcons.payment}
        value={method}
        onChange={(event) => onMethodChange(event.target.value as PaymentMethod)}
      >
        {PAYMENT_METHODS.map((option) => (
          <option key={option} value={option}>{paymentMethodLabel(option, locale)}</option>
        ))}
      </DesignedSelect>
      <div className="grid grid-cols-1 gap-4 min-[390px]:grid-cols-2">
        <TextField label={t('amount')} value={amount} onChange={onAmountChange} placeholder="2500" type="number" />
        <TextField label={t('depositDate')} value={date} onChange={onDateChange} type="date" />
      </div>
      {showPaidBy ? (
        <DesignedSelect
          label={t('depositFor')}
          icon={expenseFormIcons.member}
          value={paidBy}
          onChange={(event) => onPaidByChange(event.target.value)}
        >
          <option value="">{t('self')}</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>{member.name}</option>
          ))}
        </DesignedSelect>
      ) : null}
      <TextField
        label={t('transactionId')}
        hint={t('optional')}
        value={transactionId}
        onChange={onTransactionIdChange}
        placeholder={t('transactionPlaceholder')}
      />
      <TextAreaField
        label={t('note')}
        value={note}
        onChange={onNoteChange}
        placeholder={t('notePlaceholder')}
        rows={3}
      />
      <DepositManualNotice compact />
    </>
  )
}
