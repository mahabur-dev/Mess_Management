'use client'

import { DesignedSelect, expenseFormIcons } from '@/components/mobile/expense-design'
import { DepositManualNotice, PaymentMethodGrid } from '@/components/mobile/deposit-design'
import { TextAreaField, TextField } from '@/components/mobile/form-controls'
import type { MemberOption } from '@/hooks/use-mess-member-options'
import type { PaymentMethod } from '@/lib/form-options'

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
  return (
    <>
      <PaymentMethodGrid value={method} onChange={onMethodChange} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Amount" value={amount} onChange={onAmountChange} placeholder="2500" type="number" />
        <TextField label="Deposit Date" value={date} onChange={onDateChange} type="date" />
      </div>
      {showPaidBy ? (
        <DesignedSelect
          label="Deposit For"
          icon={expenseFormIcons.member}
          value={paidBy}
          onChange={(event) => onPaidByChange(event.target.value)}
        >
          <option value="">Self</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>{member.name}</option>
          ))}
        </DesignedSelect>
      ) : null}
      <TextField
        label="Transaction ID"
        hint="Optional"
        value={transactionId}
        onChange={onTransactionIdChange}
        placeholder="TXN123456"
      />
      <TextAreaField
        label="Note"
        value={note}
        onChange={onNoteChange}
        placeholder="Deposit for May bill"
        rows={3}
      />
      <DepositManualNotice compact />
    </>
  )
}
